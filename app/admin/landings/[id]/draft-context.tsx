"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Draft = {
  business_name: string;
  description: string;
  logo_url: string;
  primary_color: string;
  background_color: string;
  template: string;
  enabledActions: Record<string, boolean>;
};

type DraftContextValue = { draft: Draft; update: (patch: Partial<Draft>) => void; setActionEnabled: (source: string, on: boolean) => void };

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ initial, children }: { initial: Draft; children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const update = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const setActionEnabled = (source: string, on: boolean) => setDraft((prev) => ({ ...prev, enabledActions: { ...prev.enabledActions, [source]: on } }));
  return <DraftContext.Provider value={{ draft, update, setActionEnabled }}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}
