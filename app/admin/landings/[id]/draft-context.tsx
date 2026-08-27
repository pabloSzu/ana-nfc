"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ActionColorOverride = { bg: string; text: string };

export type Draft = {
  business_name: string;
  description: string;
  logo_url: string;
  primary_color: string;
  background_color: string;
  background_type: string;
  background_gradient_to: string;
  background_image_url: string;
  text_color: string;
  text_panel: boolean;
  text_panel_color: string;
  font_pair: string;
  button_font: string;
  enabledActions: Record<string, boolean>;
  actionColors: Record<string, ActionColorOverride | undefined>;
};

type DraftContextValue = {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  setActionEnabled: (source: string, on: boolean) => void;
  setActionColor: (source: string, override: ActionColorOverride | undefined) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ initial, children }: { initial: Draft; children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(initial);

  // Cada acción del editor (subir/quitar imagen, publicar, etc.) navega de vuelta a esta
  // misma página con datos frescos del servidor; sincronizamos el estado local para que
  // la vista previa no se quede mostrando algo que ya no existe.
  useEffect(() => { setDraft(initial); }, [initial]);

  const update = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const setActionEnabled = (source: string, on: boolean) => setDraft((prev) => ({ ...prev, enabledActions: { ...prev.enabledActions, [source]: on } }));
  const setActionColor = (source: string, override: ActionColorOverride | undefined) => setDraft((prev) => ({ ...prev, actionColors: { ...prev.actionColors, [source]: override } }));
  return <DraftContext.Provider value={{ draft, update, setActionEnabled, setActionColor }}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useDraft must be used within DraftProvider");
  return ctx;
}
