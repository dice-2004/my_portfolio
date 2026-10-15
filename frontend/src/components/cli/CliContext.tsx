"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface CliState {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const CliContext = createContext<CliState | null>(null);

export function CliProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);
  return <CliContext.Provider value={value}>{children}</CliContext.Provider>;
}

export function useCli(): CliState {
  const ctx = useContext(CliContext);
  if (!ctx) throw new Error("useCli must be used inside <CliProvider>");
  return ctx;
}
