"use client";

import { useCli } from "./CliContext";

// トップの自己紹介の下に置く、CLI パネルを開くボタン。
export default function AskButton() {
  const { setOpen } = useCli();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-controls="cli-panel"
      className="rounded bg-accent px-4 py-2 font-mono text-sm font-bold text-panel hover:opacity-90"
    >
      &gt;_ dice に質問する
    </button>
  );
}
