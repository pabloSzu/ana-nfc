"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useDraft, type Draft } from "../draft-context";
import BackgroundPicker from "../background-picker";
import FontPicker from "../font-picker";
import { compressImage } from "@/lib/compress-image";
import { getAllActions, AUTO_COLORS, resolveTextColor, panelBackground, getFontFamily } from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";
import { IconDroplet, IconX, IconEdit, IconPlus, IconQrCode, IconEye, IconRocket } from "@/components/icons";

const FORM_ID = "visual-identity-form";
const NO_SUBMIT = "visual-noop";

type Landing = {
  id: string;
  slug: string;
  business_name: string;
  description?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  background_color?: string | null;
  background_type?: string | null;
  background_gradient_to?: string | null;
  background_image_url?: string | null;
  text_color?: string | null;
  text_panel?: boolean | null;
  text_panel_color?: string | null;
  redirect_url?: string | null;
  published?: boolean | null;
};

type Action = (formData: FormData) => void | Promise<void>;

type CustomAction = { id: string; type: string; title: string; url?: string | null; message?: string | null; icon?: string | null; background_color?: string | null; text_color?: string | null; icon_color?: string | null; use_auto_color?: boolean | null };

type Sheet = "background" | "text" | "logo" | "buttons" | "settings" | null;

export default function VisualEditor({
  landing,
  saveAction,
  uploadLogoAction,
  removeLogoAction,
  uploadBackgroundAction,
  removeBackgroundAction,
  publishAction,
  customActions = [],
  buttonsPanel,
}: {
  landing: Landing;
  saveAction: Action;
  uploadLogoAction: Action;
  removeLogoAction: Action;
  uploadBackgroundAction: Action;
  removeBackgroundAction: Action;
  publishAction: Action;
  customActions?: CustomAction[];
  buttonsPanel?: ReactNode;
}) {
  const { draft, update } = useDraft();
  const [customText, setCustomText] = useState(Boolean(landing.text_color));
  const [customPanel, setCustomPanel] = useState(Boolean(landing.text_panel_color));
  const [logoUploading, setLogoUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const snapshotRef = useRef<{ draft: Draft; customText: boolean; customPanel: boolean } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoFormRef = useRef<HTMLFormElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgFormRef = useRef<HTMLFormElement>(null);

  const textColor = resolveTextColor(draft);
  const headingFont = getFontFamily(draft.font_pair);
  const buttonFont = getFontFamily(draft.button_font);
  const visibleTemplateActions = getAllActions().filter((item) => draft.enabledActions[item.sourceField]);

  const bgStyle: CSSProperties =
    draft.background_type === "image" && draft.background_image_url
      ? { backgroundImage: `url(${draft.background_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
      : draft.background_type === "gradient" && draft.background_gradient_to
        ? { background: `linear-gradient(135deg, ${draft.background_color || "#f7f5f0"}, ${draft.background_gradient_to})` }
        : { background: draft.background_color || "#f7f5f0" };

  function openSheet(next: Exclude<Sheet, null>) {
    snapshotRef.current = { draft: { ...draft }, customText, customPanel };
    setSheet(next);
  }

  function closeSheet(keepChanges: boolean) {
    if (!keepChanges && snapshotRef.current) {
      update(snapshotRef.current.draft);
      setCustomText(snapshotRef.current.customText);
      setCustomPanel(snapshotRef.current.customPanel);
    }
    setSheet(null);
    snapshotRef.current = null;
  }

  async function handleLogoPick() {
    const file = logoInputRef.current?.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    const compressed = await compressImage(file, 320);
    const dt = new DataTransfer();
    dt.items.add(compressed);
    if (logoInputRef.current) logoInputRef.current.files = dt.files;
    logoFormRef.current?.requestSubmit();
  }

  async function handleBgPick() {
    const file = bgInputRef.current?.files?.[0];
    if (!file) return;
    setBgUploading(true);
    const compressed = await compressImage(file, 1200);
    const dt = new DataTransfer();
    dt.items.add(compressed);
    if (bgInputRef.current) bgInputRef.current.files = dt.files;
    bgFormRef.current?.requestSubmit();
  }

  const sheetTitle: Record<Exclude<Sheet, null>, string> = {
    background: "Fondo de la landing",
    text: "Nombre y texto",
    logo: "Logo",
    buttons: "Botones",
    settings: "Configuración",
  };

  return (
    <div className="visual-single">
      {/* Every field save() needs stays mounted here at all times, mirroring the live draft — */}
      {/* modals below only ever edit the draft; this is the one and only submission source. */}
      <form id={FORM_ID} action={saveAction}>
        <input type="hidden" name="id" value={landing.id} />
        <input type="hidden" name="business_name" value={draft.business_name} />
        <input type="hidden" name="description" value={draft.description} />
        <input type="hidden" name="logo_url" value={landing.logo_url || ""} />
        <input type="hidden" name="redirect_url" value={landing.redirect_url || ""} />
        <input type="hidden" name="primary_color" value={draft.primary_color} />
        <input type="hidden" name="background_type" value={draft.background_type} />
        <input type="hidden" name="background_color" value={draft.background_color} />
        <input type="hidden" name="background_gradient_to" value={draft.background_gradient_to} />
        <input type="hidden" name="custom_text_color" value={customText ? "on" : "off"} />
        <input type="hidden" name="custom_panel_color" value={customPanel ? "on" : "off"} />
        <input type="hidden" name="font_pair" value={draft.font_pair} />
        <input type="hidden" name="text_panel" value={draft.text_panel ? "on" : ""} />
        {customText && <input type="hidden" name="text_color" value={draft.text_color || textColor} />}
        {customPanel && <input type="hidden" name="text_panel_color" value={draft.text_panel_color || "#000000"} />}
      </form>

      <div className="visual-phone" style={bgStyle}>
        <div className="visual-notch" />

        <button type="button" className="visual-chip visual-chip-bg" title="Fondo" onClick={() => openSheet("background")}><IconDroplet /> Fondo</button>
        <button type="button" className="visual-chip visual-chip-settings" title="Configuración" onClick={() => openSheet("settings")}>⚙</button>

        <div className="visual-avatar-wrap" onClick={() => openSheet("logo")}>
          <div className="visual-avatar" style={{ background: draft.primary_color || "#1f2937" }}>
            {draft.logo_url ? <img src={draft.logo_url} alt="" /> : <span>{draft.business_name.slice(0, 1) || "?"}</span>}
          </div>
          <span className="visual-chip visual-chip-badge"><IconEdit /></span>
        </div>

        <div className="visual-text-block" onClick={() => openSheet("text")}>
          <span className="visual-chip visual-chip-badge visual-chip-badge-text" title="Editar nombre y texto"><IconEdit /></span>
          {draft.text_panel ? (
            <div className="visual-text-panel" style={{ background: panelBackground(textColor, draft.text_panel_color) }}>
              <h2 style={{ fontFamily: headingFont, color: textColor, margin: 0 }}>{draft.business_name || "Nombre de tu negocio"}</h2>
              {draft.description && <p style={{ color: textColor, opacity: 0.85, fontFamily: headingFont, margin: "6px 0 0" }}>{draft.description}</p>}
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: headingFont, color: textColor }}>{draft.business_name || "Nombre de tu negocio"}</h2>
              {draft.description && <p style={{ color: textColor, opacity: 0.85, fontFamily: headingFont }}>{draft.description}</p>}
            </>
          )}
        </div>

        <div className="visual-actions">
          {visibleTemplateActions.map((item) => {
            const override = draft.actionColors[item.sourceField];
            return (
              <button key={item.sourceField} type="button" className="preview-action visual-action-btn" style={{ background: override?.bg || AUTO_COLORS[item.type] || draft.primary_color, color: override?.text || "#fff", fontFamily: buttonFont }} onClick={() => openSheet("buttons")}>
                <ActionTypeIcon type={item.type} /> {item.label}
                <span className="visual-chip visual-chip-badge visual-chip-badge-action" title="Editar botón"><IconEdit /></span>
              </button>
            );
          })}
          {customActions.map((action) => (
            <button key={action.id} type="button" className="preview-action visual-action-btn" style={{ background: action.use_auto_color ? AUTO_COLORS[action.type] || draft.primary_color : action.background_color || draft.primary_color, color: action.text_color || "#fff", fontFamily: buttonFont }} onClick={() => openSheet("buttons")}>
              <ActionTypeIcon type={action.type} icon={action.icon} /> {action.title}
              <span className="visual-chip visual-chip-badge visual-chip-badge-action" title="Editar botón"><IconEdit /></span>
            </button>
          ))}
          <button type="button" className="visual-add-action" onClick={() => openSheet("buttons")}>
            <IconPlus /> Agregar / editar botones
          </button>
        </div>

        {sheet && (
        <>
          <div className="visual-modal-backdrop" onClick={() => closeSheet(false)} />
          <div className={sheet === "buttons" ? "visual-modal visual-modal-tall" : "visual-modal"} role="dialog" aria-modal="true">
            <div className="visual-modal-head">
              <h4>{sheetTitle[sheet]}</h4>
              <button type="button" className="visual-sheet-close" onClick={() => closeSheet(false)}><IconX /></button>
            </div>
            <div className="visual-modal-body">
              {sheet === "logo" && (
                <>
                  <div className="visual-logo-preview" style={{ background: draft.primary_color || "#1f2937" }}>
                    {draft.logo_url ? <img src={draft.logo_url} alt="" /> : <span>{draft.business_name.slice(0, 1) || "?"}</span>}
                  </div>
                  <form ref={logoFormRef} action={uploadLogoAction} style={{ textAlign: "center" }}>
                    <input type="hidden" name="landing_id" value={landing.id} />
                    <label className="upload-button" style={{ margin: "0 auto" }}>
                      {logoUploading ? "Optimizando y subiendo..." : draft.logo_url ? "Cambiar foto" : "Subir foto"}
                      <input ref={logoInputRef} name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoPick} />
                    </label>
                  </form>
                  {draft.logo_url && !logoUploading && (
                    <form action={removeLogoAction} style={{ textAlign: "center" }}>
                      <input type="hidden" name="landing_id" value={landing.id} />
                      <button type="submit" className="text-button">Quitar foto</button>
                    </form>
                  )}
                  <label className="label">
                    Color de fondo del logo
                    <input type="color" value={draft.primary_color || "#1f2937"} onChange={(event) => update({ primary_color: event.target.value })} />
                  </label>
                </>
              )}

              {sheet === "background" && (
                <>
                  <BackgroundPicker landing={landing} formId={NO_SUBMIT} />
                  {draft.background_type === "image" && (
                    <div className="visual-bg-upload">
                      <form ref={bgFormRef} action={uploadBackgroundAction} className="stack" style={{ gap: 6 }}>
                        <input type="hidden" name="landing_id" value={landing.id} />
                        <label className="upload-button">
                          {bgUploading ? "Optimizando y subiendo..." : draft.background_image_url ? "Cambiar imagen" : "Subir imagen"}
                          <input ref={bgInputRef} name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBgPick} />
                        </label>
                      </form>
                      {draft.background_image_url && (
                        <form action={removeBackgroundAction}>
                          <input type="hidden" name="landing_id" value={landing.id} />
                          <button type="submit" className="text-button">Quitar imagen</button>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}

              {sheet === "text" && (
                <>
                  <label className="label">Nombre del negocio<input value={draft.business_name} placeholder="Nombre de tu negocio" onChange={(event) => update({ business_name: event.target.value })} /></label>
                  <label className="label">Descripción<textarea value={draft.description} placeholder="Una frase corta (opcional)" rows={2} onChange={(event) => update({ description: event.target.value })} /></label>
                  <FontPicker label="Fuente del título" value={draft.font_pair} onChange={(id) => update({ font_pair: id })} />
                  <label className="label">
                    Color del texto
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="color" value={draft.text_color || textColor} title={customText ? "Color personalizado" : "Automático — cambialo para personalizar"} onChange={(event) => { setCustomText(true); update({ text_color: event.target.value }); }} />
                      {customText && <button type="button" className="icon-button" title="Volver a automático" onClick={() => { setCustomText(false); update({ text_color: "" }); }}>↺</button>}
                    </div>
                  </label>
                  <label className="check-label">
                    <input type="checkbox" checked={draft.text_panel} onChange={(event) => update({ text_panel: event.target.checked })} />
                    Ponerle un fondo al texto (ayuda a que se lea sobre fotos)
                  </label>
                  {draft.text_panel && (
                    <div className="profile-action-color" style={{ marginTop: -6 }}>
                      <label className="check-label">
                        <input type="checkbox" checked={customPanel} onChange={(event) => { setCustomPanel(event.target.checked); update({ text_panel_color: event.target.checked ? (textColor === "#ffffff" ? "#000000" : "#ffffff") : "" }); }} />
                        Color de fondo personalizado
                      </label>
                      {customPanel && <input type="color" value={draft.text_panel_color || (textColor === "#ffffff" ? "#000000" : "#ffffff")} onChange={(event) => update({ text_panel_color: event.target.value })} />}
                    </div>
                  )}
                </>
              )}

              {sheet === "settings" && (
                <>
                  <div className="visual-status-row">
                    <span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span>
                    <p className="muted" style={{ margin: 0 }}>{landing.published ? "Cualquiera con el link o el tag NFC puede verla." : "Todavía no es visible para el público."}</p>
                  </div>
                  <form action={publishAction}>
                    <input type="hidden" name="id" value={landing.id} />
                    <input type="hidden" name="published" value={String(!landing.published)} />
                    <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/visual`} />
                    <button className="btn full" type="submit"><IconRocket /> {landing.published ? "Despublicar" : "Publicar landing"}</button>
                  </form>
                  <Link className="btn secondary full" href={`/admin/landings/${landing.id}/qr`}><IconQrCode /> Código QR para el tag NFC</Link>
                  {landing.published && <Link className="btn secondary full" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconEye /> Ver landing publicada</Link>}
                </>
              )}

              {sheet === "buttons" && buttonsPanel}
            </div>
            {sheet !== "settings" && sheet !== "buttons" && (
              <div className="visual-modal-foot">
                <button type="button" className="btn secondary" onClick={() => closeSheet(false)}>Cancelar</button>
                <button type="button" className="btn" onClick={() => closeSheet(true)}>Aceptar</button>
              </div>
            )}
          </div>
          </>
        )}
      </div>

      <button form={FORM_ID} type="submit" className="btn full visual-save-btn">Guardar cambios</button>
    </div>
  );
}
