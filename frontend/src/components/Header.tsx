"use client";

import Link from "next/link";
import { useCli } from "@/components/cli/CliContext";

const NAV = [
  { label: "作品", href: "/#works" },
  { label: "経歴", href: "/#about" },
  { label: "スキル", href: "/#skills" },
  { label: "連絡先", href: "/#contact" },
];

export default function Header() {
  const { open, toggle } = useCli();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="font-mono text-base font-bold text-fg">
          dice
        </Link>
        <nav aria-label="ページ内リンク" className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded px-2 py-1 text-dim transition-colors hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={toggle}
          aria-controls="cli-panel"
          aria-expanded={open}
          className="shrink-0 rounded bg-accent px-3 py-1.5 font-mono text-xs font-bold text-panel transition-opacity hover:opacity-90"
        >
          &gt;_ ask
        </button>
      </div>
    </header>
  );
}
