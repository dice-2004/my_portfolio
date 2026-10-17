"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCli } from "./CliContext";
import { profile } from "@/content/profile";
import type { Portfolio } from "@/lib/portfolio";
import { mentionPattern, runCommand, suggest, type Line } from "./commands";
import { updateSession, useSession } from "./session";
import { SPRITES } from "./sprites";

const VERSION = "v0.3.0";

type AiStatus = { enabled: boolean; ready: boolean; model: string; remaining: number; problem?: string };

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

// ページを開いたときに 1 回だけ選ぶ。サーバーでは選ばず（-1）、ブラウザで選んだものを使う。
let pickedSprite = -1;
const pickSprite = () => {
  if (pickedSprite < 0) pickedSprite = Math.floor(Math.random() * SPRITES.length);
  return pickedSprite;
};
const noSubscribe = () => () => {};

/** 左上のドット絵。animate の間はフレームを順に切り替える。 */
function PixelMark({ animate }: { animate: boolean }) {
  const index = useSyncExternalStore(noSubscribe, pickSprite, () => -1);
  const [tick, setTick] = useState(0);
  const sprite = index >= 0 ? SPRITES[index] : null;
  const frameCount = sprite?.frames.length ?? 1;

  useEffect(() => {
    if (!animate || frameCount < 2) return;
    const t = setInterval(() => setTick((n) => n + 1), 140);
    return () => clearInterval(t);
  }, [animate, frameCount]);

  // 横 96px・縦 52px に収まる範囲で、1 ドットをできるだけ大きくする
  const w = sprite?.frames[0][0].length ?? 16;
  const h = sprite?.frames[0].length ?? 11;
  const dot = Math.max(2, Math.floor(Math.min(96 / w, 52 / h)));
  const frame = sprite ? sprite.frames[animate ? tick % frameCount : 0] : [];

  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} width={w * dot} height={h * dot} shapeRendering="crispEdges" className="mt-1 shrink-0">
      {frame.flatMap((row, y) =>
        [...row].map((c, x) =>
          sprite && sprite.palette[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={sprite.palette[c]} /> : null,
        ),
      )}
    </svg>
  );
}

// Claude Code の「✻ 考え中…」に似せた表示。記号を回し、経過秒数を出す。
const SPINNER = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];

function Thinking({ since, writing }: { since: number; writing: boolean }) {
  const [now, setNow] = useState(since);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 120);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, now - since);
  // 動きを減らす設定のときは記号を回さない
  const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <p className="text-dim" role="status">
      <span className="mr-1.5 inline-block w-3 text-accent" aria-hidden>
        {still ? "✻" : SPINNER[Math.floor(elapsed / 120) % SPINNER.length]}
      </span>
      {writing ? "書いています…" : "考え中…"}
      <span className="ml-2">
        （{Math.floor(elapsed / 1000)} 秒 · <span className="text-fg">Ctrl+C</span> で止める）
      </span>
    </p>
  );
}

/** 入力した文の中の「@作品名」を色付きで出す。 */
function WithMentions({ text, pattern }: { text: string; pattern: RegExp | null }) {
  if (!pattern) return <>{text}</>;
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-accent">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Server-Sent Events を 1 件ずつ取り出す。 */
async function* readEvents(res: Response): AsyncGenerator<{ event: string; data: string }> {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buf += value.replace(/\r\n/g, "\n");
    let end;
    while ((end = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, end);
      buf = buf.slice(end + 2);
      let event = "message";
      const data: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      yield { event, data: data.join("\n") };
    }
  }
}

export default function CliPanel({ portfolio }: { portfolio: Portfolio }) {
  const { open, setOpen } = useCli();
  const router = useRouter();
  const { lines, turns, history } = useSession();
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [since, setSince] = useState(0);
  // 届いている途中の回答。終わったら lines に移す
  const [live, setLive] = useState<string | null>(null);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [sel, setSel] = useState(0);
  const [hideSuggest, setHideSuggest] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mentions = useMemo(() => mentionPattern(portfolio), [portfolio]);

  const addLines = (...add: Line[]) => updateSession((s) => ({ lines: [...s.lines, ...add] }));

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

  const stop = () => abortRef.current?.abort();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // 入力欄の外にいても、文字を選んでいなければ Ctrl+C で回答を止める
      if (busy && e.ctrlKey && e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
        e.preventDefault();
        abortRef.current?.abort();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen, busy]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, busy, live, open]);

  const ask = async (question: string) => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setSince(Date.now());
    let text = "";
    let finished = false;
    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: turns }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.headers.get("Content-Type")?.startsWith("text/event-stream")) {
        const data = await res.json().catch(() => ({}));
        addLines({ kind: "err", text: data.error ?? "AI からの回答を取得できませんでした。" });
        return;
      }
      for await (const ev of readEvents(res)) {
        const data = JSON.parse(ev.data);
        if (ev.event === "delta") {
          text += data.text;
          setLive(text.trimStart());
        } else if (ev.event === "done") {
          finished = true;
          addLines({ kind: "ai", text: data.answer, sources: data.sources ?? [] });
          updateSession((s) => ({
            turns: [...s.turns, { role: "user" as const, text: question }, { role: "assistant" as const, text: data.answer }],
          }));
        } else if (ev.event === "error") {
          finished = true;
          if (text.trim()) addLines({ kind: "ai", text: text.trim(), stopped: true });
          addLines({ kind: "err", text: data.error });
        }
      }
      if (!finished) throw new Error("stream ended");
    } catch {
      if (finished) return;
      if (text.trim()) addLines({ kind: "ai", text: text.trim(), stopped: true });
      else if (ctrl.signal.aborted) addLines({ kind: "out", text: "（Ctrl+C で止めました）" });
      if (!ctrl.signal.aborted) addLines({ kind: "err", text: "通信に失敗しました。もう一度試してください。" });
    } finally {
      abortRef.current = null;
      setLive(null);
      setBusy(false);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const suggestions = busy || hideSuggest ? [] : suggest(input, portfolio);
  const selected = suggestions[Math.min(sel, suggestions.length - 1)];

  const changeInput = (v: string) => {
    setInput(v);
    setSel(0);
    setHideSuggest(false);
  };

  // 候補を確定する。run の候補はすぐ実行し、それ以外は入力欄に入れるだけ。
  const pick = (s: (typeof suggestions)[number]) => {
    if (s.run) {
      run(s.insert);
    } else {
      changeInput(s.insert);
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  const submit = () => {
    if (selected && input !== selected.insert) {
      pick(selected);
      return;
    }
    if (selected?.run) run(selected.insert);
    else run(input);
  };

  const run = (text: string) => {
    const raw = text.trim();
    if (!raw || busy) return;
    changeInput("");
    setCursor(null);
    updateSession((s) => ({ history: s.history[s.history.length - 1] === raw ? s.history : [...s.history, raw] }));

    const result = runCommand(raw, portfolio);
    if (result.clear) {
      updateSession(() => ({ lines: [], turns: [] }));
      return;
    }
    addLines({ kind: "cmd", text: raw }, ...result.lines);
    if (result.navigate) router.push(result.navigate);
    if (result.close) setOpen(false);
    if (result.ask) void ask(result.ask);
  };

  const aiLabel = !ai ? "確認中…" : ai.ready ? `Gemini（${ai.model}）` : ai.enabled ? (ai.problem ? `使えません（${ai.problem}）` : "資料を準備中") : "準備中（コマンドは使えます）";

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 日本語入力の変換中の Enter などは触らない
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    const el = e.currentTarget;

    if (e.ctrlKey && !e.metaKey && !e.altKey) {
      const k = e.key.toLowerCase();
      // 文字を選んでいるときの Ctrl+C はコピーのまま
      if (k === "c" && el.selectionStart === el.selectionEnd) {
        e.preventDefault();
        e.stopPropagation();
        if (busy) stop();
        else changeInput("");
        return;
      }
      if (k === "l") {
        // 画面だけ消す。AI との会話は続く（全部消すのは /clear）
        e.preventDefault();
        updateSession(() => ({ lines: [] }));
        return;
      }
    }

    if (suggestions.length > 0) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const n = suggestions.length;
        setSel((i) => (Math.min(i, n - 1) + (e.key === "ArrowUp" ? n - 1 : 1)) % n);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        changeInput(selected.insert);
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

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
      return;
    }

    // 複数行のときは、先頭行で ↑・最終行で ↓ を押したときだけ履歴を呼び出す
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (e.key === "ArrowUp" && input.lastIndexOf("\n", el.selectionStart - 1) >= 0) return;
    if (e.key === "ArrowDown" && input.indexOf("\n", el.selectionEnd) >= 0) return;
    if (history.length === 0) return;
    e.preventDefault();
    const next =
      e.key === "ArrowUp"
        ? Math.max(0, (cursor ?? history.length) - 1)
        : Math.min(history.length, (cursor ?? history.length) + 1);
    setCursor(next);
    changeInput(next === history.length ? "" : history[next]);
  };

  const answer = (key: string | number, text: string, l?: Line) => (
    <div key={key} className="flex flex-col gap-1.5">
      <p className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-fg">
        <span className="mr-1 font-mono text-ok">●</span>
        {text}
        {l?.stopped && <span className="ml-1 text-dim">…（途中で止めました）</span>}
      </p>
      {l?.sources && l.sources.length > 0 && (
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
  );

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
          <PixelMark animate={busy} />
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
          <span className="text-accent">@</span> で作品の名前を入れられます。
        </p>

        {lines.map((l, i) =>
          l.kind === "cmd" ? (
            <p key={i} className="whitespace-pre-wrap break-words text-fg">
              <span className="text-accent">&gt; </span>
              <WithMentions text={l.text} pattern={mentions} />
            </p>
          ) : l.kind === "ai" ? (
            answer(i, l.text, l)
          ) : (
            <pre
              key={i}
              className={`whitespace-pre-wrap break-words font-mono leading-relaxed ${l.kind === "err" ? "text-accent" : "text-fg"}`}
            >
              {l.text}
            </pre>
          ),
        )}
        {live && answer("live", live)}
        {busy && <Thinking since={since} writing={!!live} />}
      </div>

      {suggestions.length > 0 && (
        <ul id="cli-suggest" role="listbox" aria-label="候補" className="mx-3 flex flex-col border-t border-line py-1">
          {suggestions.map((c, i) => {
            const active = c === selected;
            return (
              <li
                key={c.label}
                id={`cli-suggest-${i}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c);
                }}
                className={`flex cursor-pointer gap-4 px-1 py-0.5 ${active ? "text-accent" : "text-dim hover:text-fg"}`}
              >
                <span className="w-32 shrink-0 truncate">{c.label}</span>
                <span className="min-w-0 truncate font-sans">{c.desc}</span>
              </li>
            );
          })}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mx-3 flex items-start gap-2 border-y border-line px-1 py-2.5"
      >
        <label htmlFor="cli-input" className="text-accent">
          &gt;
        </label>
        <textarea
          ref={inputRef}
          id="cli-input"
          value={input}
          rows={Math.min(6, input.split("\n").length)}
          onChange={(e) => changeInput(e.target.value)}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls="cli-suggest"
          aria-autocomplete="list"
          aria-activedescendant={selected ? `cli-suggest-${suggestions.indexOf(selected)}` : undefined}
          onKeyDown={onKeyDown}
          placeholder={busy ? "回答を待っています…（Ctrl+C で止める）" : "質問するか、/ でコマンド、@ で作品"}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 resize-none bg-transparent leading-normal text-fg outline-none placeholder:text-dim"
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
        <span className="text-dim">
          / でコマンド · @ で作品<span className="hidden lg:inline"> · Shift+Enter で改行 · Esc で閉じる</span>
        </span>
      </div>
    </aside>
  );
}
