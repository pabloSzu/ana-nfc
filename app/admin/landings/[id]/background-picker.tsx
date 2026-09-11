"use client";

import { GRADIENT_PRESETS } from "@/lib/landing-catalog";
import { useDraft } from "./draft-context";

type Landing = { id: string; background_type?: string | null; background_color?: string | null; background_gradient_to?: string | null; background_image_url?: string | null };

export default function BackgroundPicker({ landing, formId, onDirty, onBackgroundChange }: { landing: Landing; formId: string; onDirty?: () => void; onBackgroundChange?: (type: string, from: string, to: string) => void }) {
  const { draft, update } = useDraft();
  const mode = draft.background_type || landing.background_type || "color";
  const from = draft.background_color || landing.background_color || "#f7f5f0";
  const to = draft.background_gradient_to || landing.background_gradient_to || "#a6c1ee";

  function selectMode(next: string) {
    update({ background_type: next });
    onBackgroundChange?.(next, from, to);
    onDirty?.();
  }

  return (
    <div className="stack">
      <label className="label">
        Fondo de la landing
        <div className="segmented">
          <button type="button" className={mode === "color" ? "segmented-option active" : "segmented-option"} onClick={() => selectMode("color")}>Sólido</button>
          <button type="button" className={mode === "gradient" ? "segmented-option active" : "segmented-option"} onClick={() => selectMode("gradient")}>Degradé</button>
          <button type="button" className={mode === "image" ? "segmented-option active" : "segmented-option"} onClick={() => selectMode("image")}>Imagen</button>
        </div>
      </label>
      <input type="hidden" form={formId} name="background_type" value={mode} />

      {mode === "color" && (
        <label className="label">Color de fondo<input form={formId} name="background_color" type="color" value={from} onChange={(event) => { update({ background_color: event.target.value }); onBackgroundChange?.(mode, event.target.value, to); onDirty?.(); }} /></label>
      )}

      {mode === "gradient" && (
        <>
          <div className="form-split">
            <label className="label">Desde<input form={formId} name="background_color" type="color" value={from} onChange={(event) => { update({ background_color: event.target.value }); onBackgroundChange?.(mode, event.target.value, to); onDirty?.(); }} /></label>
            <label className="label">Hasta<input form={formId} name="background_gradient_to" type="color" value={to} onChange={(event) => { update({ background_gradient_to: event.target.value }); onBackgroundChange?.(mode, from, event.target.value); onDirty?.(); }} /></label>
          </div>
          <div className="gradient-presets">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.label}
                className="gradient-swatch"
                title={preset.label}
                style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                onClick={() => { update({ background_color: preset.from, background_gradient_to: preset.to }); onBackgroundChange?.(mode, preset.from, preset.to); onDirty?.(); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
