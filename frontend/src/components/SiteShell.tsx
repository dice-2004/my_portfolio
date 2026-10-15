"use client";

import { useCli } from "@/components/cli/CliContext";

// CLI パネルの開閉状態を data 属性に出すだけのラッパー。
// PC 幅では globals.css の .site-shell[data-cli-open] で本文を左に詰め、パネルと横並びにする。
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const { open } = useCli();
  return (
    <div className="site-shell flex min-h-dvh flex-col" data-cli-open={open}>
      {children}
    </div>
  );
}
