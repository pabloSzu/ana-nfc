"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useDraft, type Draft } from "../draft-context";
import BackgroundPicker from "../background-picker";
import FontPicker from "../font-picker";
import IconPicker from "../icon-picker";
import { compressImage } from "@/lib/compress-image";
import { getAllActions, AUTO_COLORS, resolveTextColor, panelBackground, getFontFamily, displayUsername, contrastTextColor, buttonShapeRadius, buttonFillStyle, BUTTON_SHAPES, BUTTON_FILLS } from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";
import { IconDroplet, IconX, IconEdit, IconPlus, IconQrCode, IconEye, IconRocket, IconTrash } from "@/components/icons";

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
  button_shape?: string | null;
  button_fill?: string | null;
};

type Action = (formData: FormData) => void | Promise<void>;

type CustomAction = {
  id: string; type: string; title: string; url?: string | null; message?: string | null; icon?: string | null;
  background_color?: string | null; text_color?: string | null; use_auto_color?: boolean | null; position?: number | null;
};

type Sheet =
  | { kind: "background" }
  | { kind: "text" }
  | { kind: "logo" }
  | { kind: "settings" }
  | { kind: "add" }
  | { kind: "add-custom" }
  | { kind: "button-style" }
  | { kind: "template"; sourceField: string }
  | { kind: "custom"; action: CustomAction }
  | null;

export default function VisualEditor({
  landing,
  saveAction,
  uploadLogoAction,
  removeLogoAction,
  uploadBackgroundAction,
  removeBackgroundAction,
  publishAction,
  saveTemplateAction,
  removeTemplateAction,
  saveButtonStyle,
  addCustomAction,
  updateCustomAction,
  removeCustomAction,
  moveAction,
  customActions = [],
  templateValues = {},
}: {
  landing: Landing;
  saveAction: Action;
  uploadLogoAction: Action;
  removeLogoAction: Action;
  uploadBackgroundAction: Action;
  removeBackgroundAction: Action;
  publishAction: Action;
  saveTemplateAction: Action;
  removeTemplateAction: Action;
  saveButtonStyle: Action;
  addCustomAction: Action;
  updateCustomAction: Action;
  removeCustomAction: Action;
  moveAction: Action;
  customActions?: CustomAction[];
  templateValues?: Record<string, { id: string; title: string; url: string; message: string; useAutoColor: boolean; backgroundColor: string; textColor: string }>;
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
  const availableTemplateActions = getAllActions().filter((item) => !draft.enabledActions[item.sourceField]);

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

  function sheetTitle(s: Exclude<Sheet, null>): string {
    if (s.kind === "background") return "Fondo de la landing";
    if (s.kind === "text") return "Nombre y texto";
    if (s.kind === "logo") return "Logo";
    if (s.kind === "settings") return "Configuración";
    if (s.kind === "add") return "Agregar botón";
    if (s.kind === "add-custom") return "Botón personalizado";
    if (s.kind === "button-style") return "Estilo de los botones";
    if (s.kind === "template") return templateValues[s.sourceField]?.title || getAllActions().find((item) => item.sourceField === s.sourceField)?.label || "Botón";
    return s.action.title || "Botón";
  }

  const isTall = sheet?.kind === "add" || sheet?.kind === "add-custom";

  return (
    <div className="visual-single">
      {/* Every identity field save() needs stays mounted here at all times, mirroring the live draft — */}
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

        <button type="button" className="visual-chip visual-chip-bg" title="Fondo" onClick={() => openSheet({ kind: "background" })}><IconDroplet /> Fondo</button>
        <button type="button" className="visual-chip visual-chip-settings" title="Configuración" onClick={() => openSheet({ kind: "settings" })}>⚙</button>

        <div className="visual-avatar-wrap" onClick={() => openSheet({ kind: "logo" })}>
          <div className="visual-avatar" style={{ background: draft.primary_color || "#1f2937" }}>
            {draft.logo_url ? <img src={draft.logo_url} alt="" /> : <span>{draft.business_name.slice(0, 1) || "?"}</span>}
          </div>
          <span className="visual-chip visual-chip-badge"><IconEdit /></span>
        </div>

        <div className="visual-text-block" onClick={() => openSheet({ kind: "text" })}>
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
            const bg = override?.bg || AUTO_COLORS[item.type] || draft.primary_color;
            const text = override?.text || contrastTextColor(bg);
            return (
              <button key={item.sourceField} type="button" className="preview-action visual-action-btn" style={{ ...buttonFillStyle(draft.button_fill, bg, text), borderRadius: buttonShapeRadius(draft.button_shape), fontFamily: buttonFont }} onClick={() => openSheet({ kind: "template", sourceField: item.sourceField })}>
                <ActionTypeIcon type={item.type} /> {templateValues[item.sourceField]?.title || item.label}
                <span className="visual-chip visual-chip-badge visual-chip-badge-action" title="Editar botón"><IconEdit /></span>
              </button>
            );
          })}
          {customActions.map((action) => {
            const bg = action.use_auto_color ? AUTO_COLORS[action.type] || draft.primary_color : action.background_color || draft.primary_color;
            const text = action.text_color || contrastTextColor(bg);
            return (
              <button key={action.id} type="button" className="preview-action visual-action-btn" style={{ ...buttonFillStyle(draft.button_fill, bg, text), borderRadius: buttonShapeRadius(draft.button_shape), fontFamily: buttonFont }} onClick={() => openSheet({ kind: "custom", action })}>
                <ActionTypeIcon type={action.type} icon={action.icon} /> {action.title}
                <span className="visual-chip visual-chip-badge visual-chip-badge-action" title="Editar botón"><IconEdit /></span>
              </button>
            );
          })}
          <button type="button" className="visual-add-action" onClick={() => openSheet({ kind: "add" })}>
            <IconPlus /> Agregar botón
          </button>
          {(visibleTemplateActions.length > 0 || customActions.length > 0) && (
            <button type="button" className="visual-font-link" style={{ fontFamily: buttonFont }} onClick={() => openSheet({ kind: "button-style" })}>
              Aa Cambiar la fuente de los botones
            </button>
          )}
        </div>

        {sheet && (
          <>
            <div className="visual-modal-backdrop" onClick={() => closeSheet(false)} />
            <div className={isTall ? "visual-modal visual-modal-tall" : "visual-modal"} role="dialog" aria-modal="true">
              <div className="visual-modal-head">
                <h4>{sheetTitle(sheet)}</h4>
                <button type="button" className="visual-sheet-close" onClick={() => closeSheet(false)}><IconX /></button>
              </div>
              <div className="visual-modal-body">
                {sheet.kind === "logo" && (
                  <>
                    <div className="visual-logo-preview" style={{ background: draft.primary_color || "#1f2937" }}>
                      {draft.logo_url ? <img src={draft.logo_url} alt="" /> : <span>{draft.business_name.slice(0, 1) || "?"}</span>}
                    </div>
                    <form ref={logoFormRef} action={uploadLogoAction} style={{ textAlign: "center" }} onSubmit={() => setSheet(null)}>
                      <input type="hidden" name="landing_id" value={landing.id} />
                      <label className="upload-button" style={{ margin: "0 auto" }}>
                        {logoUploading ? "Optimizando y subiendo..." : draft.logo_url ? "Cambiar foto" : "Subir foto"}
                        <input ref={logoInputRef} name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoPick} />
                      </label>
                    </form>
                    {draft.logo_url && !logoUploading && (
                      <form action={removeLogoAction} style={{ textAlign: "center" }} onSubmit={() => setSheet(null)}>
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

                {sheet.kind === "background" && (
                  <>
                    <BackgroundPicker landing={landing} formId={NO_SUBMIT} />
                    {draft.background_type === "image" && (
                      <div className="visual-bg-upload">
                        <form ref={bgFormRef} action={uploadBackgroundAction} className="stack" style={{ gap: 6 }} onSubmit={() => setSheet(null)}>
                          <input type="hidden" name="landing_id" value={landing.id} />
                          <label className="upload-button">
                            {bgUploading ? "Optimizando y subiendo..." : draft.background_image_url ? "Cambiar imagen" : "Subir imagen"}
                            <input ref={bgInputRef} name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBgPick} />
                          </label>
                        </form>
                        {draft.background_image_url && (
                          <form action={removeBackgroundAction} onSubmit={() => setSheet(null)}>
                            <input type="hidden" name="landing_id" value={landing.id} />
                            <button type="submit" className="text-button">Quitar imagen</button>
                          </form>
                        )}
                      </div>
                    )}
                  </>
                )}

                {sheet.kind === "text" && (
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

                {sheet.kind === "settings" && (
                  <>
                    <div className="visual-status-row">
                      <span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span>
                      <p className="muted" style={{ margin: 0 }}>{landing.published ? "Cualquiera con el link o el tag NFC puede verla." : "Todavía no es visible para el público."}</p>
                    </div>
                    <form action={publishAction} onSubmit={() => setSheet(null)}>
                      <input type="hidden" name="id" value={landing.id} />
                      <input type="hidden" name="published" value={String(!landing.published)} />
                      <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/visual`} />
                      <button className="btn full" type="submit"><IconRocket /> {landing.published ? "Despublicar" : "Publicar landing"}</button>
                    </form>
                    <Link className="btn secondary full" href={`/admin/landings/${landing.id}/qr`}><IconQrCode /> Código QR para el tag NFC</Link>
                    {landing.published && <Link className="btn secondary full" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconEye /> Ver landing publicada</Link>}
                  </>
                )}

                {sheet.kind === "template" && (
                  <TemplateButtonForm
                    landingId={landing.id}
                    sourceField={sheet.sourceField}
                    isNew={!draft.enabledActions[sheet.sourceField]}
                    initialValue={templateValues[sheet.sourceField]}
                    saveTemplateAction={saveTemplateAction}
                    removeTemplateAction={removeTemplateAction}
                    moveAction={moveAction}
                    onDone={() => setSheet(null)}
                  />
                )}

                {sheet.kind === "custom" && (
                  <CustomButtonForm
                    action={sheet.action}
                    landingId={landing.id}
                    updateCustomAction={updateCustomAction}
                    removeCustomAction={removeCustomAction}
                    moveAction={moveAction}
                    onDone={() => setSheet(null)}
                  />
                )}

                {sheet.kind === "add" && (
                  <>
                    <p className="visual-add-section-label">Principales</p>
                    <p className="muted" style={{ marginTop: 0 }}>Tu WhatsApp, Instagram, etc. — uno de cada, con su marca y su color.</p>
                    {availableTemplateActions.length > 0 ? (
                      <div className="simple-add-grid">
                        {availableTemplateActions.map((item) => (
                          <button key={item.sourceField} type="button" className="simple-add-icon" onClick={() => setSheet({ kind: "template", sourceField: item.sourceField })}>
                            <ActionTypeIcon type={item.type} />
                            <small>{item.label}</small>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="muted" style={{ fontSize: "0.8125rem" }}>Ya usaste todos los principales — para otro más, usá el botón personalizado de abajo.</p>
                    )}

                    <div className="visual-add-divider" />

                    <p className="visual-add-section-label">Personalizado</p>
                    <p className="muted" style={{ marginTop: 0 }}>Para un segundo WhatsApp, un link con el nombre que quieras, o cualquier otra cosa — ícono, color y nombre a tu gusto, sin límite.</p>
                    <button type="button" className="visual-add-custom-cta" onClick={() => setSheet({ kind: "add-custom" })}>
                      <IconPlus /> Crear botón personalizado
                    </button>
                  </>
                )}

                {sheet.kind === "add-custom" && (
                  <NewCustomButtonForm landingId={landing.id} addCustomAction={addCustomAction} onDone={() => setSheet(null)} />
                )}

                {sheet.kind === "button-style" && (
                  <form action={saveButtonStyle} className="stack" onSubmit={() => setSheet(null)}>
                    <input type="hidden" name="landing_id" value={landing.id} />
                    <input type="hidden" name="button_font" value={draft.button_font} />
                    <input type="hidden" name="button_shape" value={draft.button_shape} />
                    <input type="hidden" name="button_fill" value={draft.button_fill} />
                    <p className="muted" style={{ marginTop: 0 }}>Un mismo estilo para todos los botones — así se ven como un solo conjunto, no una mezcla.</p>
                    <label className="label">
                      Forma
                      <div className="segmented">
                        {BUTTON_SHAPES.map((option) => (
                          <button key={option.id} type="button" className={draft.button_shape === option.id ? "segmented-option active" : "segmented-option"} onClick={() => update({ button_shape: option.id })}>{option.label}</button>
                        ))}
                      </div>
                    </label>
                    <label className="label">
                      Relleno
                      <div className="segmented">
                        {BUTTON_FILLS.map((option) => (
                          <button key={option.id} type="button" className={draft.button_fill === option.id ? "segmented-option active" : "segmented-option"} onClick={() => update({ button_fill: option.id })}>{option.label}</button>
                        ))}
                      </div>
                    </label>
                    <FontPicker label="Fuente de los botones" value={draft.button_font} onChange={(id) => update({ button_font: id })} />
                    <button className="btn full" type="submit">Guardar</button>
                  </form>
                )}
              </div>
              {(sheet.kind === "background" || sheet.kind === "text" || sheet.kind === "logo") && (
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

const FORMAT_HINTS: Record<string, string> = {
  phone: "Con código de país, sin espacios ni signos. Ej: 5493511234567.",
  email: "Tiene que ser un email válido (ej: contacto@negocio.com).",
  username: "Solo tu usuario, sin @ — el link se arma solo.",
};

function TemplateButtonForm({
  landingId, sourceField, isNew, initialValue, saveTemplateAction, removeTemplateAction, moveAction, onDone,
}: {
  landingId: string; sourceField: string; isNew: boolean;
  initialValue?: { id: string; title: string; url: string; message: string; useAutoColor: boolean; backgroundColor: string; textColor: string };
  saveTemplateAction: Action; removeTemplateAction: Action; moveAction: Action; onDone: () => void;
}) {
  const item = getAllActions().find((entry) => entry.sourceField === sourceField)!;
  const brandColor = AUTO_COLORS[item.type] || "#1f2937";
  const [bg, setBg] = useState(initialValue?.backgroundColor || brandColor);
  const hint = FORMAT_HINTS[item.input];

  return (
    <>
      <form action={saveTemplateAction} className="stack" onSubmit={onDone}>
        <input type="hidden" name="landing_id" value={landingId} />
        <input type="hidden" name="source_field" value={sourceField} />
        <input type="hidden" name="custom_color" value="on" />
        <input type="hidden" name="color" value={bg} />
        <input type="hidden" name="text_color" value={contrastTextColor(bg)} />
        <label className="label">Nombre del botón<input name="title" defaultValue={initialValue?.title || item.label} placeholder={item.label} required /></label>
        <div className={hint ? "visual-format-box" : undefined}>
          {item.prefix ? (
            <label className="label">
              {item.label}
              <div className="input-prefix-group">
                <span className="input-prefix">{item.prefix}</span>
                <input
                  name="value"
                  defaultValue={displayUsername(item.type, initialValue?.url || "")}
                  placeholder={item.placeholder}
                  required
                  onBlur={(event) => { event.target.value = displayUsername(item.type, event.target.value); }}
                />
              </div>
            </label>
          ) : (
            <label className="label">
              {item.input === "phone" ? "Número" : item.input === "email" ? "Email" : "Link"}
              <input name="value" type={item.input === "email" ? "email" : item.input === "phone" ? "tel" : "text"} defaultValue={initialValue?.url || ""} placeholder={item.placeholder} required />
            </label>
          )}
          {hint && <p className="visual-format-hint">Este dato tiene un formato fijo: {hint}</p>}
        </div>
        {item.message && <label className="label">Mensaje de WhatsApp<input name="message" defaultValue={initialValue?.message || "Hola, quiero hacer una consulta."} /></label>}

        <label className="label">
          Color del botón
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="color" value={bg} onChange={(event) => setBg(event.target.value)} />
            {bg !== brandColor && <button type="button" className="icon-button" title="Volver al color de la marca" onClick={() => setBg(brandColor)}>↺</button>}
          </div>
        </label>

        <button className="btn full" type="submit">Guardar</button>
      </form>
      {!isNew && initialValue && (
        <div className="visual-modal-foot" style={{ padding: 0 }}>
          <form action={moveAction} onSubmit={onDone}>
            <input type="hidden" name="id" value={initialValue.id} />
            <input type="hidden" name="landing_id" value={landingId} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className="btn secondary">↑ Subir</button>
          </form>
          <form action={moveAction} onSubmit={onDone}>
            <input type="hidden" name="id" value={initialValue.id} />
            <input type="hidden" name="landing_id" value={landingId} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className="btn secondary">↓ Bajar</button>
          </form>
        </div>
      )}
      {!isNew && (
        <form action={removeTemplateAction} onSubmit={onDone}>
          <input type="hidden" name="landing_id" value={landingId} />
          <input type="hidden" name="source_field" value={sourceField} />
          <button type="submit" className="text-button" style={{ color: "#dc2626" }}><IconTrash /> Quitar este botón</button>
        </form>
      )}
    </>
  );
}

function CustomButtonForm({
  action, landingId, updateCustomAction, removeCustomAction, moveAction, onDone,
}: {
  action: CustomAction; landingId: string; updateCustomAction: Action; removeCustomAction: Action; moveAction: Action; onDone: () => void;
}) {
  const item = getAllActions().find((entry) => entry.type === action.type) || getAllActions().find((entry) => entry.type === "url")!;
  const brandColor = AUTO_COLORS[action.type] || "#1f2937";
  const [icon, setIcon] = useState(action.icon || "");
  const [bg, setBg] = useState(action.background_color || brandColor);
  return (
    <>
      <form action={updateCustomAction} className="stack" onSubmit={onDone}>
        <input type="hidden" name="id" value={action.id} />
        <input type="hidden" name="landing_id" value={landingId} />
        <input type="hidden" name="type" value={action.type} />
        <input type="hidden" name="icon" value={icon} />
        <input type="hidden" name="background_color" value={bg} />
        <input type="hidden" name="text_color" value={contrastTextColor(bg)} />
        <input type="hidden" name="use_auto_color" value="" />
        <input type="hidden" name="enabled" value="on" />
        <input type="hidden" name="position" value={action.position ?? 0} />
        <label className="label">Título<input name="title" defaultValue={action.title} required /></label>
        {item.message && <label className="label">Mensaje de WhatsApp<input name="message" defaultValue={action.message || ""} /></label>}
        <ValueField item={item} defaultValue={action.url || ""} />
        <IconPicker type={action.type} value={icon} onChange={setIcon} />

        <label className="label">
          Color del botón
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="color" value={bg} onChange={(event) => setBg(event.target.value)} />
            {bg !== brandColor && <button type="button" className="icon-button" title="Volver al color de la marca" onClick={() => setBg(brandColor)}>↺</button>}
          </div>
        </label>

        <button className="btn full" type="submit">Guardar</button>
      </form>
      <div className="visual-modal-foot" style={{ padding: 0 }}>
        <form action={moveAction} onSubmit={onDone}>
          <input type="hidden" name="id" value={action.id} />
          <input type="hidden" name="landing_id" value={landingId} />
          <input type="hidden" name="direction" value="up" />
          <button type="submit" className="btn secondary">↑ Subir</button>
        </form>
        <form action={moveAction} onSubmit={onDone}>
          <input type="hidden" name="id" value={action.id} />
          <input type="hidden" name="landing_id" value={landingId} />
          <input type="hidden" name="direction" value="down" />
          <button type="submit" className="btn secondary">↓ Bajar</button>
        </form>
      </div>
      <form action={removeCustomAction} onSubmit={onDone}>
        <input type="hidden" name="id" value={action.id} />
        <input type="hidden" name="landing_id" value={landingId} />
        <button type="submit" className="text-button" style={{ color: "#dc2626" }}><IconTrash /> Eliminar botón</button>
      </form>
    </>
  );
}

function buildPrefixedUrl(item: { type: string; prefix?: string }, raw: string) {
  const clean = displayUsername(item.type, raw);
  return clean && item.prefix ? `https://${item.prefix}${clean}` : "";
}

function ValueField({ item, defaultValue = "" }: { item: ReturnType<typeof getAllActions>[number]; defaultValue?: string }) {
  const hint = FORMAT_HINTS[item.input];
  const field = item.prefix ? (
    <label className="label">
      {item.label}
      <div className="input-prefix-group">
        <span className="input-prefix">{item.prefix}</span>
        <input name="url" defaultValue={displayUsername(item.type, defaultValue)} placeholder={item.placeholder} required onBlur={(event) => { event.target.value = buildPrefixedUrl(item, event.target.value); }} />
      </div>
    </label>
  ) : item.input === "email" ? (
    <label className="label">Email<input name="value" type="email" defaultValue={defaultValue} placeholder={item.placeholder} required /></label>
  ) : item.input === "phone" ? (
    <label className="label">Número<input name="value" type="tel" defaultValue={defaultValue} placeholder={item.placeholder} required /></label>
  ) : (
    <label className="label">Link<input name="url" type="text" defaultValue={defaultValue} placeholder={item.placeholder} required /></label>
  );
  return (
    <div className={hint ? "visual-format-box" : undefined}>
      {field}
      {hint && <p className="visual-format-hint">Este dato tiene un formato fijo: {hint}</p>}
    </div>
  );
}

function NewCustomButtonForm({ landingId, addCustomAction, onDone }: { landingId: string; addCustomAction: Action; onDone: () => void }) {
  const allTypes = getAllActions();
  const [type, setType] = useState("url");
  const [icon, setIcon] = useState("");
  const item = allTypes.find((entry) => entry.type === type)!;
  const brandColor = AUTO_COLORS[type] || "#1f2937";
  const [bg, setBg] = useState(brandColor);
  return (
    <form action={addCustomAction} className="stack" onSubmit={onDone}>
      <input type="hidden" name="landing_id" value={landingId} />
      <input type="hidden" name="use_auto_color" value="" />
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="background_color" value={bg} />
      <input type="hidden" name="text_color" value={contrastTextColor(bg)} />
      <label className="label">
        Tipo de link
        <select name="type" value={type} onChange={(event) => { setType(event.target.value); setBg(AUTO_COLORS[event.target.value] || "#1f2937"); }}>
          {allTypes.map((entry) => <option key={entry.type} value={entry.type}>{entry.label}</option>)}
        </select>
      </label>
      <p className="muted" style={{ marginTop: -6, fontSize: "0.75rem" }}>Elegí el tipo para que el enlace y la validación funcionen bien — el nombre y el ícono los elegís vos abajo.</p>
      <label className="label">Título del botón<input name="title" placeholder={item.label} required /></label>
      {item.message && <label className="label">Mensaje de WhatsApp<input name="message" defaultValue="Hola, quiero hacer una consulta." /></label>}
      <ValueField item={item} />
      <IconPicker type={type} value={icon} onChange={setIcon} />
      <label className="label">Color del botón<input type="color" value={bg} onChange={(event) => setBg(event.target.value)} /></label>
      <button className="btn full" type="submit">Agregar</button>
    </form>
  );
}
