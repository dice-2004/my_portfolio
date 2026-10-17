"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCli } from "./CliContext";
import { profile } from "@/content/profile";
import type { Portfolio } from "@/lib/portfolio";
import { runCommand, suggest, type Line } from "./commands";

const VERSION = "v0.2.0";

type AiStatus = { enabled: boolean; ready: boolean; model: string; remaining: number; problem?: string };
type Turn = { role: "user" | "assistant"; text: string };

// パネル幅（PC のみ）。ドラッグで変えた幅はこのブラウザに覚えておく。
const WIDTH_KEY = "cli-panel-width";
const MIN_W = 360;
const MAX_VW = 0.7;

function applyWidth(px: number | null) {
  const root = document.documentElement.style;
  if (px === null) root.removeProperty("--panel-w");
  else root.setProperty("--panel-w", `min(${Math.round(px)}px, ${MAX_VW * 100}vw)`);
}

function clampWidth(px: number) {
  return Math.min(Math.max(px, MIN_W), window.innerWidth * MAX_VW);
}

/** パネル左端のつまみ。ドラッグか ← → キーで幅を変え、ダブルクリックで元に戻す。 */
function ResizeHandle() {
  const width = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(WIDTH_KEY));
      if (saved > 0) {
        applyWidth(saved);
        width.current = saved;
      }
    } catch {}
  }, []);

  const commit = (px: number | null) => {
    applyWidth(px);
    width.current = px;
    try {
      if (px === null) localStorage.removeItem(WIDTH_KEY);
      else localStorage.setItem(WIDTH_KEY, String(Math.round(px)));
    } catch {}
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    document.documentElement.dataset.resizing = "true";
    let last = width.current;
    const move = (ev: PointerEvent) => {
      last = clampWidth(window.innerWidth - ev.clientX);
      applyWidth(last);
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      delete document.documentElement.dataset.resizing;
      if (last !== null) commit(last);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const current = width.current ?? document.getElementById("cli-panel")?.offsetWidth ?? 560;
    commit(clampWidth(current + (e.key === "ArrowLeft" ? 32 : -32)));
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="パネルの幅を変える（← → キー、ダブルクリックで元に戻す）"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onDoubleClick={() => commit(null)}
      className="absolute inset-y-0 -left-1 z-10 hidden w-2 cursor-col-resize touch-none hover:bg-accent/40 focus-visible:bg-accent/40 lg:block"
    />
  );
}

// ファビコンの写真（緑のバイクと dice）を元にしたドット絵。# が 1 ドット。
const BIKE = [
  "......##........",
  ".....####.......",
  "......###.......",
  ".....####....##.",
  "...########.###.",
  ".#############..",
  "..##.......##...",
  ".####.....####..",
  "##..##...##..##.",
  "##..##...##..##.",
  ".####.....####..",
];

function DiceMark() {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${BIKE[0].length} ${BIKE.length}`}
      width={BIKE[0].length * 4}
      height={BIKE.length * 4}
      shapeRendering="crispEdges"
      fill="var(--bike)"
      className="mt-1 shrink-0"
    >
      {BIKE.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
    </svg>
  );
}

export default function CliPanel({ portfolio }: { portfolio: Portfolio }) {
  const { open, setOpen } = useCli();
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sel, setSel] = useState(0);
  const [hideSuggest, setHideSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // 初めて開いたときに AI が使えるかを確かめる
  useEffect(() => {
    if (!open || ai) return;
    fetch("/api/chat/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: AiStatus | null) => setAi(s ?? { enabled: false, ready: false, model: "", remaining: 0 }))
      .catch(() => setAi({ enabled: false, ready: false, model: "", remaining: 0 }));
  }, [open, ai]);

  // 開いたら入力欄へ。閉じている間はフォーカスが入らないよう inert にする。
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 150);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, busy]);

  const ask = async (question: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: turns }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.answer !== "string") {
        setLines((prev) => [...prev, { kind: "err", text: data.error ?? "AI からの回答を取得できませんでした。" }]);
        return;
      }
      setLines((prev) => [...prev, { kind: "ai", text: data.answer, sources: data.sources ?? [] }]);
      setTurns((t) => [...t, { role: "user" as const, text: question }, { role: "assistant" as const, text: data.answer }].slice(-6));
    } catch {
      setLines((prev) => [...prev, { kind: "err", text: "通信に失敗しました。もう一度試してください。" }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const suggestions = busy || hideSuggest ? [] : suggest(input);
  const selected = suggestions[Math.min(sel, suggestions.length - 1)];

  const changeInput = (v: string) => {
    setInput(v);
    setSel(0);
    setHideSuggest(false);
  };

  // 候補を確定する。引数が要るコマンドは入力欄に入れるだけ、それ以外はすぐ実行する。
  const pick = (name: string, usage?: string) => {
    if (usage) {
      changeInput(`${name} `);
      inputRef.current?.focus({ preventScroll: true });
    } else {
      run(name);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected && input.trim() !== selected.name + (selected.usage ? " " : "")) {
      pick(selected.name, selected.usage);
      return;
    }
    run(input);
  };

  const run = (text: string) => {
    const raw = text.trim();
    if (!raw || busy) return;
    changeInput("");
    setCursor(null);
    setHistory((h) => [...h, raw]);

    const result = runCommand(raw, portfolio);
    if (result.clear) {
      setLines([]);
      setTurns([]);
      return;
    }
    setLines((prev) => [...prev, { kind: "cmd", text: raw }, ...result.lines]);
    if (result.navigate) router.push(result.navigate);
    if (result.close) setOpen(false);
    if (result.ask) void ask(result.ask);
  };

  const aiLabel = !ai ? "確認中…" : ai.ready ? `Gemini（${ai.model}）` : ai.enabled ? (ai.problem ? `使えません（${ai.problem}）` : "資料を準備中") : "準備中（コマンドは使えます）";

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const n = suggestions.length;
        setSel((i) => (Math.min(i, n - 1) + (e.key === "ArrowUp" ? n - 1 : 1)) % n);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        changeInput(selected.name + (selected.usage ? " " : ""));
        return;
      }
      if (e.key === "Escape") {
        // 候補だけ閉じて、パネルは閉じない
        e.preventDefault();
        e.stopPropagation();
        setHideSuggest(true);
        return;
      }
    }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (history.length === 0) return;
    e.preventDefault();
    const next =
      e.key === "ArrowUp"
        ? Math.max(0, (cursor ?? history.length) - 1)
        : Math.min(history.length, (cursor ?? history.length) + 1);
    setCursor(next);
    changeInput(next === history.length ? "" : history[next]);
  };

  return (
    <aside
      id="cli-panel"
      aria-label="dice-cli"
      aria-hidden={!open}
      inert={!open}
      data-open={open}
      className="cli-panel fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-panel font-mono text-[13px] text-fg lg:w-[var(--panel-w)]"
    >
      <ResizeHandle />
      <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs text-dim">
        <span>
          ターミナル　<span className="text-fg">dice-cli</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="パネルを閉じる"
          className="px-1 text-lg leading-none text-dim hover:text-fg"
        >
          ×
        </button>
      </div>

      <div ref={logRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
        <div className="flex items-start gap-3 leading-relaxed">
          <DiceMark />
          <p>
            <span className="font-bold">dice-cli</span> <span className="text-dim">{VERSION}</span>
            <br />
            <span className="text-dim">AI 回答: {aiLabel}</span>
            <br />
            <span className="text-dim">~/portfolio</span>
          </p>
        </div>
        <p className="font-sans text-sm text-fg">
          {profile.name} について答えるターミナルです。質問を日本語でそのまま入力するか、<span className="text-accent">/</span> を打ってコマンドを選びます。
        </p>

        {lines.map((l, i) =>
          l.kind === "cmd" ? (
            <p key={i} className="text-fg">
              <span className="text-accent">&gt; </span>
              {l.text}
            </p>
          ) : l.kind === "ai" ? (
            <div key={i} className="flex flex-col gap-1.5">
              <p className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-fg">
                <span className="mr-1 font-mono text-ok">●</span>
                {l.text}
              </p>
              {l.sources && l.sources.length > 0 && (
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-dim">
                  参照:
                  {l.sources.map((s) =>
                    s.url ? (
                      <Link key={s.url} href={s.url} className="underline decoration-line underline-offset-2 hover:text-fg">
                        {s.title}
                      </Link>
                    ) : (
                      <span key={s.title}>{s.title}</span>
                    ),
                  )}
                </p>
              )}
            </div>
          ) : (
            <pre
              key={i}
              className={`whitespace-pre-wrap break-words font-mono leading-relaxed ${l.kind === "err" ? "text-accent" : "text-fg"}`}
            >
              {l.text}
            </pre>
          ),
        )}
        {busy && (
          <p className="text-dim">
            考え中 <span className="caret" aria-hidden>▍</span>
          </p>
        )}
      </div>

      {suggestions.length > 0 && (
        <ul id="cli-suggest" role="listbox" aria-label="コマンドの候補" className="mx-3 flex flex-col border-t border-line py-1">
          {suggestions.map((c) => {
            const active = c === selected;
            return (
              <li
                key={c.name}
                id={`cli-suggest-${c.name.slice(1)}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c.name, c.usage);
                }}
                className={`flex cursor-pointer gap-4 px-1 py-0.5 ${active ? "text-accent" : "text-dim hover:text-fg"}`}
              >
                <span className="w-32 shrink-0">{c.usage ?? c.name}</span>
                <span className="min-w-0 truncate font-sans">{c.desc}</span>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={submit} className="mx-3 flex items-center gap-2 border-y border-line px-1 py-2.5">
        <label htmlFor="cli-input" className="text-accent">
          &gt;
        </label>
        <input
          ref={inputRef}
          id="cli-input"
          value={input}
          onChange={(e) => changeInput(e.target.value)}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls="cli-suggest"
          aria-autocomplete="list"
          aria-activedescendant={selected ? `cli-suggest-${selected.name.slice(1)}` : undefined}
          onKeyDown={onKeyDown}
          placeholder={busy ? "回答を待っています…" : "質問するか、/ でコマンド"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-dim"
        />
      </form>
      <div className="flex flex-wrap justify-between gap-2 px-4 pb-3 pt-2 text-xs">
        <span>
          {ai?.ready ? (
            <span className="text-dim">
              <span className="text-accent">▸▸</span> AI に質問できます
            </span>
          ) : (
            <span className="text-dim">
              <span className="text-accent">▸▸</span> コマンドのみ（AI は準備中）
            </span>
          )}
        </span>
        <span className="text-dim">/ でコマンド · Esc で閉じる</span>
      </div>
    </aside>
  );
}
