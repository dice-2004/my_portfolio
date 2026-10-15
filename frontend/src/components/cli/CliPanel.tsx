"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCli } from "./CliContext";
import { profile } from "@/content/profile";
import type { Portfolio } from "@/lib/portfolio";
import { runCommand, type Line } from "./commands";

const VERSION = "v0.1.0";

function DiceMark() {
  // サイコロの「3」の目。ロゴ代わり。
  return (
    <div aria-hidden className="grid shrink-0 grid-cols-3 gap-[3px] rounded-[3px] bg-accent p-1">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={`block h-2 w-2 ${i === 0 || i === 4 || i === 8 ? "bg-panel" : ""}`} />
      ))}
    </div>
  );
}

export default function CliPanel({ portfolio }: { portfolio: Portfolio }) {
  const { open, setOpen } = useCli();
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

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
  }, [lines]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.trim();
    setInput("");
    setCursor(null);
    if (!raw) return;
    setHistory((h) => [...h, raw]);

    const result = runCommand(raw, portfolio);
    if (result.clear) {
      setLines([]);
      return;
    }
    setLines((prev) => [...prev, { kind: "cmd", text: raw }, ...result.lines]);
    if (result.navigate) router.push(result.navigate);
    if (result.close) setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (history.length === 0) return;
    e.preventDefault();
    const next =
      e.key === "ArrowUp"
        ? Math.max(0, (cursor ?? history.length) - 1)
        : Math.min(history.length, (cursor ?? history.length) + 1);
    setCursor(next);
    setInput(next === history.length ? "" : history[next]);
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
            <span className="text-dim">AI 回答: 準備中（コマンドは使えます）</span>
            <br />
            <span className="text-dim">~/portfolio</span>
          </p>
        </div>
        <p className="font-sans text-sm text-fg">
          {profile.name} について答えるターミナルです。<span className="text-accent">help</span> でコマンド一覧を表示します。
        </p>

        {lines.map((l, i) =>
          l.kind === "cmd" ? (
            <p key={i} className="text-fg">
              <span className="text-accent">&gt; </span>
              {l.text}
            </p>
          ) : (
            <pre
              key={i}
              className={`whitespace-pre-wrap break-words font-mono leading-relaxed ${l.kind === "err" ? "text-accent" : "text-fg"}`}
            >
              {l.text}
            </pre>
          ),
        )}
      </div>

      <form onSubmit={submit} className="mx-3 flex items-center gap-2 border-y border-line px-1 py-2.5">
        <label htmlFor="cli-input" className="text-accent">
          &gt;
        </label>
        <input
          ref={inputRef}
          id="cli-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Try "ls works"'
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-dim"
        />
      </form>
      <div className="flex flex-wrap justify-between gap-2 px-4 pb-3 pt-2 text-xs">
        <span>
          <span className="text-accent">▸▸ commands only</span> <span className="text-dim">(AI は準備中)</span>
        </span>
        <span className="text-dim">Esc で閉じる</span>
      </div>
    </aside>
  );
}
