// CLI パネルの画面・AI との会話・入力履歴。ページを再読み込みしても続きから使えるよう、このブラウザに保存する。
// サーバーでの描画では空として扱い、ブラウザで読み込んだ内容に useSyncExternalStore で切り替える。
import { useSyncExternalStore } from "react";
import type { Line } from "./commands";

export type Turn = { role: "user" | "assistant"; text: string };

export interface Session {
  lines: Line[];
  /** AI に渡す直近の会話。/clear で消える */
  turns: Turn[];
  /** ↑↓ で呼び出す入力履歴 */
  history: string[];
}

const KEY = "cli-session-v1";
const MAX_LINES = 200;
const MAX_TURNS = 6;
const MAX_HISTORY = 100;

const EMPTY: Session = { lines: [], turns: [], history: [] };
let state: Session | null = null;
const listeners = new Set<() => void>();

function load(): Session {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (s && Array.isArray(s.lines) && Array.isArray(s.turns) && Array.isArray(s.history)) return s;
  } catch {}
  return EMPTY;
}

function snapshot(): Session {
  if (state === null) state = load();
  return state;
}

export function updateSession(fn: (s: Session) => Partial<Session>) {
  const next = { ...snapshot(), ...fn(snapshot()) };
  state = {
    lines: next.lines.slice(-MAX_LINES),
    turns: next.turns.slice(-MAX_TURNS),
    history: next.history.slice(-MAX_HISTORY),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSession(): Session {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
