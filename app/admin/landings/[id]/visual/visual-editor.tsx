"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { useDraft, type Draft } from "../draft-context";
import BackgroundPicker from "../background-picker";
import IconPicker from "../icon-picker";
import { compressImage } from "@/lib/compress-image";
import {
  getAllActions, AUTO_COLORS, displayUsername, contrastTextColor, buttonZoneShadow, buttonFillStyle,
  TEXT_FONT_OPTIONS, hexToRgba,
} from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";
import { IconDroplet, IconX, IconEdit, IconPlus, IconQrCode, IconEye, IconRocket, IconTrash } from "@/components/icons";

const DESIGN_FORM_ID = "visual-design-form";
const NO_SUBMIT = "visual-noop";

type Landing = {
  id: string; slug: string; business_name: string; description?: string | null; logo_url?: string | null;
  primary_color?: string | null; background_color?: string | null; background_type?: string | null;
  background_gradient_to?: string | null; background_image_url?: string | null; text_color?: string | null;
  text_panel?: boolean | null; text_panel_color?: string | null; redirect_url?: string | null; published?: boolean | null;
};

type Action = (formData: FormData) => void | Promise<void>;

type ButtonItem = {
  id: string; type: string; title: string; subtitle: string; url: string; message: string; icon: string;
  background_color: string; text_color: string; use_auto_color: boolean; position: number;
};

type Sheet = "title" | "subtitle" | "background" | "logo" | "buttonZone" | "add" | "settings" | { kind: "button"; button: ButtonItem } | null;

const FORMAT_HINTS: Record<string, string> = {
  phone: "Con código de país, sin espacios ni signos. Ej: 5493511234567.",
  email: "Tiene que ser un email válido (ej: contacto@negocio.com).",
  username: "Solo tu usuario, sin @ — el link se arma solo.",
};

export default function VisualEditor({
  landing, siteUrl, uploadLogoAction, removeLogoAction, uploadBackgroundAction, removeBackgroundAction,
  publishAction, deleteLandingAction, saveDesignStyleAction, buttons,
}: {
  landing: Landing; siteUrl: string; uploadLogoAction: Action; removeLogoAction: Action;
  uploadBackgroundAction: Action; removeBackgroundAction: Action; publishAction: Action; deleteLandingAction: Action;
  saveDesignStyleAction: Action; buttons: ButtonItem[];
}) {
  const { draft, update: updateDraft } = useDraft();
  const [logoUploading, setLogoUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [draftButtons, setDraftButtons] = useState(buttons);
  const [dirty, setDirty] = useState(false);
  const [addTab, setAddTab] = useState<"preset" | "custom">("preset");
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const snapshotRef = useRef<Draft | null>(null);
  const buttonSnapshotRef = useRef<ButtonItem[] | null>(null);
  const dirtySnapshotRef = useRef(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoFormRef = useRef<HTMLFormElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgFormRef = useRef<HTMLFormElement>(null);

  const buttonFont = draft.button_font;
  const zone = draft.buttonZone;
  const title = draft.titleStyle;
  const subtitle = draft.subtitleStyle;
  const logo = draft.logoStyle;
  const bgPos = draft.bgPosition;

  const update = (patch: Partial<Draft>) => {
    updateDraft(patch);
    setDirty(true);
  };

  useEffect(() => {
    setDraftButtons(buttons);
    setDirty(false);
  }, [buttons]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Opening a button straight from "quick add" (tap a preset -> it's created for real ->
  // we land back here and auto-open its editor) — no anchor click to hang the popover off,
  // so it opens centered on the phone itself.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openedId = params.get("opened");
    const openSection = params.get("open");
    if (openedId) {
      const match = buttons.find((b) => b.id === openedId);
      if (match && stageRef.current) {
        anchorRef.current = stageRef.current;
        setSheet({ kind: "button", button: match });
      }
    } else if (openSection === "logo" || openSection === "background") {
      if (stageRef.current) {
        anchorRef.current = stageRef.current;
        setSheet(openSection);
      }
    } else {
      return;
    }
    params.delete("opened");
    params.delete("open");
    const rest = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (rest ? `?${rest}` : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buttons]);

  const bgStyle: CSSProperties =
    draft.background_type === "gradient" && draft.background_gradient_to
      ? { background: `linear-gradient(135deg, ${draft.background_color || "#f7f5f0"}, ${draft.background_gradient_to})` }
      : { background: draft.background_color || "#f7f5f0" };

  function openSheet(next: Exclude<Sheet, null>, el: HTMLElement) {
    anchorRef.current = el;
    snapshotRef.current = { ...draft };
    buttonSnapshotRef.current = draftButtons;
    dirtySnapshotRef.current = dirty;
    setSheet(next);
  }

  function closeSheet(keepChanges: boolean) {
    if (!keepChanges && snapshotRef.current) {
      updateDraft(snapshotRef.current);
      if (buttonSnapshotRef.current) setDraftButtons(buttonSnapshotRef.current);
      setDirty(dirtySnapshotRef.current);
    }
    setSheet(null);
    setPos(null);
    snapshotRef.current = null;
    buttonSnapshotRef.current = null;
  }

  useEffect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheet]);

  useLayoutEffect(() => {
    if (!sheet || !anchorRef.current || !stageRef.current || !popoverRef.current) return;
    const anchor = anchorRef.current;
    const stage = stageRef.current;
    const popover = popoverRef.current;
    const place = () => {
      const s = stage.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const p = popover.getBoundingClientRect();
      let left = a.right - s.left + 18;
      const top = Math.max(8, Math.min(a.top - s.top - 18, s.height - p.height - 8));
      if (left + p.width > s.width - 8) left = a.left - s.left - p.width - 18;
      left = Math.max(8, Math.min(left, Math.max(8, s.width - p.width - 8)));
      setPos({ left, top });
    };
    place();
    popover.focus({ preventScroll: true });
    const observer = new ResizeObserver(place);
    observer.observe(popover);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [sheet, addTab]);

  async function handleLogoPick() {
    const file = logoInputRef.current?.files?.[0];
    if (!file) return;
    if (dirty) {
      window.alert("Guardá los cambios pendientes antes de subir una imagen.");
      if (logoInputRef.current) logoInputRef.current.value = "";
      return;
    }
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
    if (dirty) {
      window.alert("Guardá los cambios pendientes antes de subir una imagen.");
      if (bgInputRef.current) bgInputRef.current.value = "";
      return;
    }
    setBgUploading(true);
    const compressed = await compressImage(file, 1200);
    const dt = new DataTransfer();
    dt.items.add(compressed);
    if (bgInputRef.current) bgInputRef.current.files = dt.files;
    bgFormRef.current?.requestSubmit();
  }

  function quickAdd(type: string) {
    const item = getAllActions().find((entry) => entry.type === type) || getAllActions().find((entry) => entry.type === "url")!;
    const background = AUTO_COLORS[type] || "#1f2937";
    const button: ButtonItem = {
      id: `client-${crypto.randomUUID()}`,
      type,
      title: item.label || "Nuevo botón",
      subtitle: "",
      url: "",
      message: type === "whatsapp" ? "Hola, quiero hacer una consulta." : "",
      icon: "",
      background_color: background,
      text_color: contrastTextColor(background),
      use_auto_color: true,
      position: draftButtons.length,
    };
    setDraftButtons((current) => [...current, button]);
    setDirty(true);
    anchorRef.current = stageRef.current;
    setSheet({ kind: "button", button });
  }

  const sheetTitle =
    sheet === "title" ? "Editar título" :
    sheet === "subtitle" ? "Editar subtítulo" :
    sheet === "background" ? "Fondo" :
    sheet === "logo" ? "Logo / foto" :
    sheet === "buttonZone" ? "Ajustar botonera" :
    sheet === "add" ? "Agregar botón" :
    sheet === "settings" ? "Configuración" :
    typeof sheet === "object" && sheet?.kind === "button" ? "Editar botón" : "";

  return (
    <div className="visual-page">
      <section className="visual-left">
        <div className="visual-brand"><span className="visual-brandmark"><i /><i /><i /></span>{landing.business_name || "Tu tarjeta"}</div>
        <div className="visual-kicker">EDITÁ. MIRÁ. PUBLICÁ.</div>
        <h1>Tu tarjeta digital,<br />a tu manera</h1>
        <div className="visual-under" />
        <p className="visual-lead">Tocá lo que querés cambiar y mirá el resultado al instante. Todo se edita sobre la propia tarjeta.</p>
        <div className="visual-note">Sin paneles.<br />Sin complicaciones.<br />Todo en vivo. ↗</div>
        <Link className="visual-back" href="/admin" onClick={(event) => { if (dirty && !window.confirm("Tenés cambios sin guardar. ¿Querés salir igual?")) event.preventDefault(); }}>← Volver al panel</Link>
      </section>

      <section className="visual-center">
        <form id={DESIGN_FORM_ID} action={saveDesignStyleAction} onSubmit={() => closeSheet(true)}>
          <input type="hidden" name="landing_id" value={landing.id} />
          <input type="hidden" name="business_name" value={draft.business_name} />
          <input type="hidden" name="description" value={draft.description} />
          <input type="hidden" name="primary_color" value={draft.primary_color} />
          <input type="hidden" name="background_type" value={draft.background_type} />
          <input type="hidden" name="background_color" value={draft.background_color} />
          <input type="hidden" name="background_gradient_to" value={draft.background_gradient_to} />
          <input type="hidden" name="text_color" value={title.color} />
          <input type="hidden" name="text_panel" value={title.bgMode === "solid" ? "on" : ""} />
          <input type="hidden" name="text_panel_color" value={title.bg} />
          <input type="hidden" name="font_pair" value={draft.font_pair} />
          <input type="hidden" name="button_font" value={draft.button_font} />
          <input type="hidden" name="button_style" value={JSON.stringify(zone)} />
          <input type="hidden" name="buttons" value={JSON.stringify(draftButtons)} />
          <input type="hidden" name="title_style" value={JSON.stringify(title)} />
          <input type="hidden" name="subtitle_style" value={JSON.stringify(subtitle)} />
          <input type="hidden" name="logo_style" value={JSON.stringify(logo)} />
          <input type="hidden" name="background_style" value={JSON.stringify(bgPos)} />
        </form>
        <div className="visual-toolbar">
          <Link className="visual-tb" href="/admin" onClick={(event) => { if (dirty && !window.confirm("Tenés cambios sin guardar. ¿Querés salir igual?")) event.preventDefault(); }}>← Panel</Link>
          <button
            type="button"
            className={previewMode ? "visual-tb visual-tb-preview active" : "visual-tb visual-tb-preview"}
            aria-pressed={previewMode}
            onClick={() => setPreviewMode((active) => !active)}
          >
            {previewMode ? <><IconEdit /> Volver a editar</> : <><IconEye /> Vista previa</>}
          </button>
          <button type="button" className="visual-tb" onClick={(e) => openSheet("settings", e.currentTarget)}><IconQrCode /> QR y publicar</button>
          <button form={DESIGN_FORM_ID} type="submit" className="visual-tb visual-tb-publish" disabled={!dirty}>{dirty ? "Guardar cambios" : "Todo guardado ✓"}</button>
        </div>

        <div className="visual-stage" ref={stageRef}>
          <div className={previewMode ? "visual-phone visual-preview-mode" : "visual-phone"}>
            <div className="visual-screen">
              {draft.background_type === "image" && draft.background_image_url ? (
                <div className="visual-bg-photo" style={{ backgroundImage: `url(${draft.background_image_url})`, backgroundSize: `${bgPos.zoom * 100}%`, backgroundPosition: `${bgPos.x}% ${bgPos.y}%` }} />
              ) : (
                <div className="visual-bg-photo" style={{ ...bgStyle, opacity: 1 }} />
              )}
              <div className="visual-tint" style={{ background: `linear-gradient(180deg, rgba(4,8,10,.06), rgba(5,8,11,${bgPos.tint}))` }} />

              {!previewMode && <button type="button" className="visual-bg-chip" onClick={(e) => openSheet("background", e.currentTarget)}><IconDroplet /> Fondo</button>}
              <div className="visual-statusbar"><span>9:41</span><span>▮▮▮ ● ▰</span></div>

              <div className="visual-scroll">
                <div className={previewMode ? "visual-logo" : "visual-logo editable"} style={{ width: logo.size, height: logo.size, borderRadius: logo.shape === "round" ? "50%" : "28px", background: draft.primary_color || logo.fallback }} onClick={(e) => { if (!previewMode) openSheet("logo", e.currentTarget); }}>
                  {draft.logo_url ? <div style={{ width: "100%", height: "100%", backgroundImage: `url(${draft.logo_url})`, backgroundSize: `${logo.zoom * 100}%`, backgroundPosition: `${logo.x}% ${logo.y}%` }} /> : <span className="visual-initial">{draft.business_name.slice(0, 1) || "?"}</span>}
                  {!previewMode && <span className="visual-edit-bubble"><IconEdit /></span>}
                </div>

                <div className="visual-copy">
                  <h2 className={previewMode ? "visual-title" : "visual-title editable"} style={{ fontFamily: title.font, fontWeight: title.weight, fontSize: title.size, color: title.color, background: title.bgMode === "solid" ? hexToRgba(title.bg, 0.55) : "transparent", textAlign: title.align }} onClick={(e) => { if (!previewMode) openSheet("title", e.currentTarget); }}>
                    {draft.business_name || "Nombre de tu negocio"}{!previewMode && <span className="visual-edit-bubble"><IconEdit /></span>}
                  </h2>
                  <p className={previewMode ? "visual-subtitle" : "visual-subtitle editable"} style={{ fontFamily: subtitle.font, fontWeight: subtitle.weight, fontSize: subtitle.size, color: subtitle.color, background: subtitle.bgMode === "solid" ? hexToRgba(subtitle.bg, 0.55) : "transparent" }} onClick={(e) => { if (!previewMode) openSheet("subtitle", e.currentTarget); }}>
                    {draft.description || "Agregá una descripción corta"}{!previewMode && <span className="visual-edit-bubble"><IconEdit /></span>}
                  </p>
                </div>

                <section className="visual-button-zone">
                  {!previewMode && <div className="visual-zone-head">
                    <button type="button" className="visual-adjust" onClick={(e) => openSheet("buttonZone", e.currentTarget)}>✦ Ajustar botonera</button>
                  </div>}
                  <ButtonList
                    buttons={draftButtons}
                    zone={zone}
                    buttonFontId={buttonFont}
                    primary={draft.primary_color}
                    onOpen={(button, el) => openSheet({ kind: "button", button }, el)}
                    onReorder={(next) => { setDraftButtons(next); setDirty(true); }}
                    previewMode={previewMode}
                  />
                  {!previewMode && <button type="button" className="visual-add-btn" onClick={(e) => { setAddTab("preset"); openSheet("add", e.currentTarget); }}>＋ Agregar botón</button>}
                </section>

              </div>
            </div>
          </div>

          {sheet && (
            <>
            <button type="button" className="visual-popover-backdrop" aria-label="Cerrar sin guardar" onClick={() => closeSheet(false)} />
            <div className="visual-popover open" ref={popoverRef} role="dialog" aria-modal="true" aria-labelledby="visual-dialog-title" tabIndex={-1} style={pos ? { left: pos.left, top: pos.top } : { opacity: 0 }}>
              <div className="visual-pop-head">
                <h3 id="visual-dialog-title">{sheetTitle}</h3>
                <button type="button" className="visual-close" aria-label="Cerrar sin guardar" onClick={() => closeSheet(false)}><IconX /></button>
              </div>

              {sheet === "title" && (
                <>
                  <p className="visual-helper">Los cambios se ven en vivo.</p>
                  <label className="label">Texto<input value={draft.business_name} onChange={(e) => update({ business_name: e.target.value })} /></label>
                  <div className="two-range">
                    <label className="label">Fuente<select value={title.font} onChange={(e) => update({ titleStyle: { ...title, font: e.target.value } })}>{TEXT_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></label>
                    <label className="label">Peso<select value={title.weight} onChange={(e) => update({ titleStyle: { ...title, weight: +e.target.value } })}><option value={500}>Medio</option><option value={700}>Bold</option><option value={900}>Extra bold</option></select></label>
                  </div>
                  <label className="label">Tamaño<input type="range" min={18} max={44} value={title.size} onChange={(e) => update({ titleStyle: { ...title, size: +e.target.value } })} /><small>{title.size}px</small></label>
                  <div className="two-range">
                    <label className="label">Color<input type="color" value={title.color} onChange={(e) => update({ titleStyle: { ...title, color: e.target.value } })} /></label>
                    <label className="label">Fondo<input type="color" value={title.bg} disabled={title.bgMode === "none"} onChange={(e) => update({ titleStyle: { ...title, bg: e.target.value } })} /></label>
                  </div>
                  <label className="label">Fondo<select value={title.bgMode} onChange={(e) => update({ titleStyle: { ...title, bgMode: e.target.value as "none" | "solid" } })}><option value="none">Sin fondo</option><option value="solid">Con fondo</option></select></label>
                  <label className="label">Alineación<div className="segmented">
                    <button type="button" className={title.align === "left" ? "segmented-option active" : "segmented-option"} onClick={() => update({ titleStyle: { ...title, align: "left" } })}>Izq.</button>
                    <button type="button" className={title.align === "center" ? "segmented-option active" : "segmented-option"} onClick={() => update({ titleStyle: { ...title, align: "center" } })}>Centro</button>
                    <button type="button" className={title.align === "right" ? "segmented-option active" : "segmented-option"} onClick={() => update({ titleStyle: { ...title, align: "right" } })}>Der.</button>
                  </div></label>
                  <div className="visual-actions-row"><button type="button" className="cancel" onClick={() => closeSheet(false)}>Cancelar</button><button type="button" className="save" onClick={() => closeSheet(true)}>Aplicar</button></div>
                </>
              )}

              {sheet === "subtitle" && (
                <>
                  <p className="visual-helper">Los cambios se ven en vivo.</p>
                  <label className="label">Texto<textarea rows={3} value={draft.description} onChange={(e) => update({ description: e.target.value })} /></label>
                  <div className="two-range">
                    <label className="label">Fuente<select value={subtitle.font} onChange={(e) => update({ subtitleStyle: { ...subtitle, font: e.target.value } })}>{TEXT_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></label>
                    <label className="label">Peso<select value={subtitle.weight} onChange={(e) => update({ subtitleStyle: { ...subtitle, weight: +e.target.value } })}><option value={400}>Regular</option><option value={500}>Medio</option><option value={700}>Bold</option></select></label>
                  </div>
                  <label className="label">Tamaño<input type="range" min={11} max={24} value={subtitle.size} onChange={(e) => update({ subtitleStyle: { ...subtitle, size: +e.target.value } })} /><small>{subtitle.size}px</small></label>
                  <div className="two-range">
                    <label className="label">Color<input type="color" value={subtitle.color} onChange={(e) => update({ subtitleStyle: { ...subtitle, color: e.target.value } })} /></label>
                    <label className="label">Fondo<input type="color" value={subtitle.bg} disabled={subtitle.bgMode === "none"} onChange={(e) => update({ subtitleStyle: { ...subtitle, bg: e.target.value } })} /></label>
                  </div>
                  <label className="label">Fondo<select value={subtitle.bgMode} onChange={(e) => update({ subtitleStyle: { ...subtitle, bgMode: e.target.value as "none" | "solid" } })}><option value="none">Sin fondo</option><option value="solid">Con fondo</option></select></label>
                  <div className="visual-actions-row"><button type="button" className="cancel" onClick={() => closeSheet(false)}>Cancelar</button><button type="button" className="save" onClick={() => closeSheet(true)}>Aplicar</button></div>
                </>
              )}

              {sheet === "background" && (
                <>
                  <p className="visual-helper">Color, degradé o una imagen propia. Todo se ajusta en vivo.</p>
                  <BackgroundPicker landing={landing} formId={NO_SUBMIT} onDirty={() => setDirty(true)} />
                  {draft.background_type === "image" && (
                    <div className="visual-bg-upload">
                      <form ref={bgFormRef} action={uploadBackgroundAction} className="stack" style={{ gap: 6 }} onSubmit={() => setBgUploading(false)}>
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
                      <DragCropPreview
                        src={draft.background_image_url || null}
                        width={260} height={150} radius={14}
                        zoom={bgPos.zoom} x={bgPos.x} y={bgPos.y} fallback={draft.background_color || "#f7f5f0"}
                        minZoom={1} maxZoom={2.4}
                        onChange={(next) => update({ bgPosition: { ...bgPos, ...next } })}
                      />
                    </div>
                  )}
                  <label className="label">Oscurecer<input type="range" min={0.05} max={0.65} step={0.05} value={bgPos.tint} onChange={(e) => update({ bgPosition: { ...bgPos, tint: +e.target.value } })} /><small>{Math.round(bgPos.tint * 100)}%</small></label>
                  <div className="visual-actions-row"><button type="button" className="cancel" onClick={() => closeSheet(false)}>Cancelar</button><button type="button" className="save" onClick={() => closeSheet(true)}>Aplicar</button></div>
                </>
              )}

              {sheet === "logo" && (
                <>
                  <p className="visual-helper">Subí una imagen y ajustala directamente sobre la tarjeta.</p>
                  <form ref={logoFormRef} action={uploadLogoAction} style={{ textAlign: "center" }} onSubmit={() => setLogoUploading(false)}>
                    <input type="hidden" name="landing_id" value={landing.id} />
                    <label className="upload-button" style={{ margin: "0 auto" }}>
                      {logoUploading ? "Optimizando y subiendo..." : draft.logo_url ? "Cambiar foto" : "Subir foto"}
                      <input ref={logoInputRef} name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoPick} />
                    </label>
                  </form>
                  {draft.logo_url && !logoUploading && (
                    <form action={removeLogoAction} style={{ textAlign: "center" }}>
                      <input type="hidden" name="landing_id" value={landing.id} />
                      <button type="submit" className="text-button">Quitar imagen</button>
                    </form>
                  )}
                  <label className="label">Forma<div className="segmented">
                    <button type="button" className={logo.shape === "round" ? "segmented-option active" : "segmented-option"} onClick={() => update({ logoStyle: { ...logo, shape: "round" } })}>Circular</button>
                    <button type="button" className={logo.shape === "square" ? "segmented-option active" : "segmented-option"} onClick={() => update({ logoStyle: { ...logo, shape: "square" } })}>Cuadrado suave</button>
                  </div></label>
                  <label className="label">Tamaño<input type="range" min={80} max={165} value={logo.size} onChange={(e) => update({ logoStyle: { ...logo, size: +e.target.value } })} /><small>{logo.size}px</small></label>
                  {draft.logo_url && (
                    <DragCropPreview
                      src={draft.logo_url}
                      width={Math.min(logo.size, 140)} height={Math.min(logo.size, 140)}
                      radius={logo.shape === "round" ? "50%" : 20}
                      zoom={logo.zoom} x={logo.x} y={logo.y} fallback={draft.primary_color || logo.fallback}
                      minZoom={1} maxZoom={2.5}
                      onChange={(next) => update({ logoStyle: { ...logo, ...next } })}
                    />
                  )}
                  <label className="label">Color de fondo del logo<input type="color" value={draft.primary_color || logo.fallback} onChange={(e) => update({ primary_color: e.target.value })} /></label>
                  <div className="visual-actions-row"><button type="button" className="cancel" onClick={() => closeSheet(false)}>Cancelar</button><button type="button" className="save" onClick={() => closeSheet(true)}>Aplicar</button></div>
                </>
              )}

              {sheet === "buttonZone" && (
                <ButtonZoneSheet zone={zone} update={update} draft={draft} onDone={() => closeSheet(true)} onCancel={() => closeSheet(false)} />
              )}

              {sheet === "add" && (
                <AddButtonSheet addTab={addTab} setAddTab={setAddTab} onQuickAdd={quickAdd} onCancel={() => closeSheet(false)} />
              )}

              {sheet === "settings" && (
                <>
                  <div className="visual-status-row">
                    <span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span>
                    <p className="muted" style={{ margin: 0 }}>{landing.published ? "Cualquiera con el link o el tag NFC puede verla." : "Todavía no es visible para el público."}</p>
                  </div>
                  {dirty && <p className="visual-unsaved-warning">Guardá los cambios pendientes antes de publicar o salir a otra pantalla.</p>}
                  <form action={publishAction} onSubmit={() => closeSheet(true)}>
                    <input type="hidden" name="id" value={landing.id} />
                    <input type="hidden" name="published" value={String(!landing.published)} />
                    <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/visual`} />
                    <button className="btn full" type="submit" disabled={dirty}><IconRocket /> {landing.published ? "Despublicar" : "Publicar landing"}</button>
                  </form>
                  <Link className="btn secondary full" href={`/admin/landings/${landing.id}/qr`} onClick={(event) => { if (dirty) event.preventDefault(); }} aria-disabled={dirty}><IconQrCode /> Código QR para el tag NFC</Link>
                  {landing.published && <Link className="btn secondary full" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconEye /> Ver landing publicada</Link>}
                  <form action={deleteLandingAction} onSubmit={(e) => { if (!window.confirm("¿Eliminar esta landing?\nTambién se eliminarán sus acciones.\nEsta acción no se puede deshacer.")) { e.preventDefault(); return; } closeSheet(true); }}>
                    <input type="hidden" name="id" value={landing.id} />
                    <button type="submit" className="text-button" style={{ color: "#dc2626", marginTop: 8 }}><IconTrash /> Eliminar landing</button>
                  </form>
                </>
              )}

              {typeof sheet === "object" && sheet?.kind === "button" && (
                <ButtonSheet
                  button={draftButtons.find((item) => item.id === sheet.button.id) || sheet.button}
                  position={draftButtons.findIndex((item) => item.id === sheet.button.id)}
                  buttonCount={draftButtons.length}
                  onSave={(next) => { setDraftButtons((current) => current.map((item) => item.id === next.id ? next : item)); setDirty(true); closeSheet(true); }}
                  onMove={(direction) => {
                    setDraftButtons((current) => moveLocalButton(current, sheet.button.id, direction));
                    setDirty(true);
                    closeSheet(true);
                  }}
                  onDuplicate={() => {
                    setDraftButtons((current) => duplicateLocalButton(current, sheet.button.id));
                    setDirty(true);
                    closeSheet(true);
                  }}
                  onRemove={() => {
                    setDraftButtons((current) => current.filter((item) => item.id !== sheet.button.id).map((item, index) => ({ ...item, position: index })));
                    setDirty(true);
                    closeSheet(true);
                  }}
                  onCancel={() => closeSheet(false)}
                />
              )}
            </div>
            </>
          )}
        </div>
      </section>

      <aside className="visual-right">
        <div className="visual-info-card">
          <h3>Tu tarjeta en vivo</h3>
          <p>Lo que ves en el celular es exactamente lo que ve quien abra tu enlace, QR o tag NFC.</p>
          <img className="visual-qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(siteUrl)}`} alt="QR" />
          <p style={{ textAlign: "center", wordBreak: "break-all", fontSize: 12 }}>{siteUrl.replace(/^https?:\/\//, "")}</p>
        </div>
        <div className="visual-right-note">Tocás.<br />Cambiás.<br />Lo ves.<br />Así de simple.</div>
      </aside>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DragCropPreview({
  src, width, height, radius, zoom, x, y, fallback, minZoom = 1, maxZoom = 2.5, onChange,
}: {
  src: string | null; width: number; height: number; radius: number | string;
  zoom: number; x: number; y: number; fallback: string; minZoom?: number; maxZoom?: number;
  onChange: (next: { zoom: number; x: number; y: number }) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!src) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y };
    setDragging(true);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const nextX = clamp(dragState.current.origX - (dx / rect.width) * 100, 0, 100);
    const nextY = clamp(dragState.current.origY - (dy / rect.height) * 100, 0, 100);
    onChange({ zoom, x: nextX, y: nextY });
  };
  const endDrag = () => { dragState.current = null; setDragging(false); };
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!src) return;
    e.preventDefault();
    const next = clamp(zoom + (e.deltaY < 0 ? 0.05 : -0.05), minZoom, maxZoom);
    onChange({ zoom: next, x, y });
  };

  return (
    <div className="drag-crop-wrap">
      <div
        ref={frameRef}
        className="drag-crop-frame"
        style={{
          width, height, borderRadius: radius,
          background: src ? undefined : fallback,
          backgroundImage: src ? `url(${src})` : undefined,
          backgroundSize: src ? `${zoom * 100}%` : undefined,
          backgroundPosition: src ? `${x}% ${y}%` : undefined,
          cursor: src ? (dragging ? "grabbing" : "grab") : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onWheel={handleWheel}
      >
        {!src && <span className="drag-crop-empty">Sin imagen</span>}
      </div>
      {src && (
        <div className="drag-crop-zoom">
          <span>−</span>
          <input
            type="range" min={minZoom} max={maxZoom} step={0.01} value={zoom}
            onChange={(e) => onChange({ zoom: +e.target.value, x, y })}
          />
          <span>+</span>
        </div>
      )}
      {src && <small className="drag-crop-hint">Arrastrá la imagen para acomodarla</small>}
    </div>
  );
}

function ButtonList({
  buttons, zone, buttonFontId, primary, onOpen, onReorder, previewMode,
}: {
  buttons: ButtonItem[]; zone: Draft["buttonZone"]; buttonFontId: string; primary: string;
  onOpen: (button: ButtonItem, el: HTMLElement) => void; onReorder: (buttons: ButtonItem[]) => void; previewMode: boolean;
}) {
  const dragId = useRef<string | null>(null);
  const buttonFont = FONT_FAMILY_BY_ID[buttonFontId] || FONT_FAMILY_BY_ID.modern;

  function submitOrder(draggedId: string, targetId: string) {
    const next = buttons.map((button) => button.id);
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    const byId = new Map(buttons.map((button) => [button.id, button]));
    onReorder(next.map((id, position) => ({ ...byId.get(id)!, position })));
  }

  return (
    <div className="visual-buttons" style={{ gap: zone.gap, width: `${zone.width}%` }}>
      {buttons.map((button) => {
        const bg = zone.colorMode === "one" ? zone.oneColor : button.use_auto_color ? AUTO_COLORS[button.type] || primary : button.background_color || primary;
        const text = zone.colorMode === "one" ? contrastTextColor(zone.oneColor) : button.text_color || contrastTextColor(bg);
        return (
          <button
            key={button.id}
            type="button"
            className="visual-link-btn"
            draggable={!previewMode}
            style={{
              ...buttonFillStyle(zone.finish, bg, text),
              borderRadius: zone.radius, minHeight: zone.height, boxShadow: buttonZoneShadow(zone.shadow),
              fontFamily: buttonFont, gridTemplateColumns: previewMode ? `${zone.iconSize}px 1fr` : `${zone.iconSize}px 1fr 22px 18px`,
            }}
            onClick={(e) => { if (!previewMode) onOpen(button, e.currentTarget); }}
            onDragStart={() => { dragId.current = button.id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (dragId.current) submitOrder(dragId.current, button.id); }}
          >
            <span className="visual-btn-icon" style={{ width: zone.iconSize, height: zone.iconSize }}><ActionTypeIcon type={button.type} icon={button.icon} /></span>
            <span className="visual-btn-label">
              <strong style={{ fontSize: zone.textSize }}>{button.title}</strong>
              {button.subtitle && <small>{button.subtitle}</small>}
            </span>
            {!previewMode && <span className="visual-pencil"><IconEdit /></span>}
            {!previewMode && <span className="visual-drag" aria-hidden="true">⠿</span>}
          </button>
        );
      })}
    </div>
  );
}

function moveLocalButton(buttons: ButtonItem[], id: string, direction: "up" | "down") {
  const index = buttons.findIndex((button) => button.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= buttons.length) return buttons;
  const next = [...buttons];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((button, position) => ({ ...button, position }));
}

function duplicateLocalButton(buttons: ButtonItem[], id: string) {
  const index = buttons.findIndex((button) => button.id === id);
  if (index < 0) return buttons;
  const original = buttons[index];
  const copy = { ...original, id: `client-${crypto.randomUUID()}`, title: `${original.title} copia` };
  const next = [...buttons];
  next.splice(index + 1, 0, copy);
  return next.map((button, position) => ({ ...button, position }));
}

const FONT_FAMILY_BY_ID: Record<string, string> = {
  modern: "'Space Grotesk', sans-serif", classic: "'Playfair Display', serif", friendly: "'Poppins', sans-serif", minimal: "'Inter', sans-serif",
};

function ButtonZoneSheet({
  zone, update, draft, onDone, onCancel,
}: {
  zone: Draft["buttonZone"]; update: (patch: Partial<Draft>) => void; draft: Draft;
  onDone: () => void; onCancel: () => void;
}) {
  const set = (patch: Partial<Draft["buttonZone"]>) => update({ buttonZone: { ...zone, ...patch } });
  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); onDone(); }}>
      <p className="visual-helper">Un mismo estilo para todos los botones — así se ven como un solo conjunto.</p>
      <label className="label">Colores<div className="segmented"><button type="button" className={zone.colorMode === "auto" ? "segmented-option active" : "segmented-option"} onClick={() => set({ colorMode: "auto" })}>Automáticos</button><button type="button" className={zone.colorMode === "one" ? "segmented-option active" : "segmented-option"} onClick={() => set({ colorMode: "one" })}>Un solo color</button></div></label>
      {zone.colorMode === "one" && <label className="label">Color general<input type="color" value={zone.oneColor} onChange={(e) => set({ oneColor: e.target.value })} /></label>}
      <label className="label">Relleno<div className="segmented"><button type="button" className={zone.finish === "solid" ? "segmented-option active" : "segmented-option"} onClick={() => set({ finish: "solid" })}>Sólido</button><button type="button" className={zone.finish === "glass" ? "segmented-option active" : "segmented-option"} onClick={() => set({ finish: "glass" })}>Glass</button><button type="button" className={zone.finish === "outline" ? "segmented-option active" : "segmented-option"} onClick={() => set({ finish: "outline" })}>Contorno</button></div></label>
      <div className="two-range">
        <label className="label">Separación<input type="range" min={4} max={24} value={zone.gap} onChange={(e) => set({ gap: +e.target.value })} /><small>{zone.gap}px</small></label>
        <label className="label">Alto<input type="range" min={42} max={66} value={zone.height} onChange={(e) => set({ height: +e.target.value })} /><small>{zone.height}px</small></label>
      </div>
      <div className="two-range">
        <label className="label">Bordes<input type="range" min={4} max={30} value={zone.radius} onChange={(e) => set({ radius: +e.target.value })} /><small>{zone.radius}px</small></label>
        <label className="label">Ancho<input type="range" min={72} max={100} value={zone.width} onChange={(e) => set({ width: +e.target.value })} /><small>{zone.width}%</small></label>
      </div>
      <details>
        <summary>▾ Más ajustes</summary>
        <div className="stack" style={{ paddingTop: 8 }}>
          <label className="label">Sombra<select value={zone.shadow} onChange={(e) => set({ shadow: e.target.value as Draft["buttonZone"]["shadow"] })}><option value="none">Ninguna</option><option value="soft">Suave</option><option value="strong">Marcada</option></select></label>
          <div className="two-range">
            <label className="label">Texto<input type="range" min={12} max={18} value={zone.textSize} onChange={(e) => set({ textSize: +e.target.value })} /><small>{zone.textSize}px</small></label>
            <label className="label">Ícono<input type="range" min={22} max={36} value={zone.iconSize} onChange={(e) => set({ iconSize: +e.target.value })} /><small>{zone.iconSize}px</small></label>
          </div>
        </div>
      </details>
      <label className="label">Fuente de los botones<select value={draft.button_font} onChange={(e) => update({ button_font: e.target.value })}><option value="modern">Moderna</option><option value="classic">Clásica</option><option value="friendly">Amigable</option><option value="minimal">Minimalista</option></select></label>
      <div className="visual-actions-row"><button type="button" className="cancel" onClick={onCancel}>Cancelar</button><button className="save" type="submit">Aplicar</button></div>
    </form>
  );
}

function ValueField({ item, defaultValue = "" }: { item: ReturnType<typeof getAllActions>[number]; defaultValue?: string }) {
  const hint = FORMAT_HINTS[item.input];
  const field = item.prefix ? (
    <label className="label">{item.label}<div className="input-prefix-group"><span className="input-prefix">{item.prefix}</span><input name="url" defaultValue={displayUsername(item.type, defaultValue)} placeholder={item.placeholder} required onBlur={(e) => { const clean = displayUsername(item.type, e.target.value); e.target.value = clean ? `https://${item.prefix}${clean}` : ""; }} /></div></label>
  ) : item.input === "email" ? (
    <label className="label">Email<input name="value" type="email" defaultValue={defaultValue} placeholder={item.placeholder} required /></label>
  ) : item.input === "phone" ? (
    <label className="label">Número<input name="value" type="tel" defaultValue={defaultValue} placeholder={item.placeholder} required /></label>
  ) : (
    <label className="label">Link<input name="url" type="text" defaultValue={defaultValue} placeholder={item.placeholder} required /></label>
  );
  return <div className={hint ? "visual-format-box" : undefined}>{field}{hint && <p className="visual-format-hint">Formato fijo: {hint}</p>}</div>;
}

function ButtonSheet({
  button, position, buttonCount, onSave, onMove, onDuplicate, onRemove, onCancel,
}: {
  button: ButtonItem; position: number; buttonCount: number;
  onSave: (button: ButtonItem) => void; onMove: (direction: "up" | "down") => void;
  onDuplicate: () => void; onRemove: () => void; onCancel: () => void;
}) {
  const item = getAllActions().find((entry) => entry.type === button.type) || getAllActions().find((entry) => entry.type === "url")!;
  const isPreset = getAllActions().some((entry) => entry.type === button.type);
  const brandColor = AUTO_COLORS[button.type] || "#1f2937";
  const [icon, setIcon] = useState(button.icon || "");
  const [bg, setBg] = useState(button.background_color || brandColor);
  const formId = `visual-button-form-${button.id}`;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const url = String(data.get("url") || data.get("value") || "").trim();
    onSave({
      ...button,
      title: String(data.get("title") || "").trim(),
      subtitle: String(data.get("subtitle") || "").trim(),
      message: String(data.get("message") || "").trim(),
      url,
      icon,
      background_color: bg,
      text_color: contrastTextColor(bg),
      use_auto_color: bg === brandColor,
    });
  }
  return (
    <>
      <span className={isPreset ? "badge" : "badge custom"}>{isPreset ? `Prediseñado · ${item.label}` : "Personalizado"}</span>
      <form id={formId} className="stack" onSubmit={submit}>
        <label className="label">Nombre<input name="title" defaultValue={button.title} required /></label>
        <label className="label">Texto secundario (opcional)<input name="subtitle" defaultValue={button.subtitle} placeholder="Ej: Hablemos de tu proyecto" /></label>
        {item.message && <label className="label">Mensaje de WhatsApp<input name="message" defaultValue={button.message} /></label>}
        <ValueField item={item} defaultValue={button.url} />
        <IconPicker type={button.type} value={icon} onChange={setIcon} />
        <label className="label">Color de fondo<div style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></div></label>
        <p className="visual-helper" style={{ margin: 0 }}>{bg === brandColor ? "Este botón está usando su color automático." : "Este botón tiene un color propio."} {bg !== brandColor && <button type="button" className="inline-link" onClick={() => setBg(brandColor)}>Usar color automático</button>}</p>
      </form>
      <div className="visual-order-row" aria-label="Orden del botón">
        <span>Orden</span>
        <button type="button" className="visual-order-button" disabled={position <= 0} onClick={() => onMove("up")}>↑ Subir</button>
        <button type="button" className="visual-order-button" disabled={position < 0 || position >= buttonCount - 1} onClick={() => onMove("down")}>↓ Bajar</button>
      </div>
      <div className="two-actions">
        <button type="button" className="btn secondary full" onClick={onDuplicate}>Duplicar</button>
        <button type="button" className="text-button" style={{ color: "#dc2626" }} onClick={onRemove}><IconTrash /> Eliminar</button>
      </div>
      <div className="visual-actions-row"><button type="button" className="cancel" onClick={onCancel}>Cancelar</button><button form={formId} className="save" type="submit">Aplicar</button></div>
    </>
  );
}

function AddButtonSheet({
  addTab, setAddTab, onQuickAdd, onCancel,
}: {
  addTab: "preset" | "custom"; setAddTab: (tab: "preset" | "custom") => void;
  onQuickAdd: (type: string) => void; onCancel: () => void;
}) {
  const allTypes = getAllActions();
  return (
    <div className="stack">
      <p className="visual-helper">Podés agregar el mismo tipo todas las veces que quieras.</p>
      <div className="segmented"><button type="button" className={addTab === "preset" ? "segmented-option active" : "segmented-option"} onClick={() => setAddTab("preset")}>Prediseñados</button><button type="button" className={addTab === "custom" ? "segmented-option active" : "segmented-option"} onClick={() => setAddTab("custom")}>Personalizado</button></div>

      {addTab === "preset" && (
        <div className="visual-preset-grid">
          {allTypes.map((entry) => (
            <button key={entry.type} type="button" className="visual-preset" onClick={() => onQuickAdd(entry.type)}>
              <span className="visual-preset-icon"><ActionTypeIcon type={entry.type} /></span>
              <span className="visual-preset-info"><strong>{entry.label}</strong><small>Agregar otro</small></span>
            </button>
          ))}
        </div>
      )}

      {addTab === "custom" && (
        <div className="visual-custom-box">
          <strong style={{ display: "block", marginBottom: 6 }}>Crear botón personalizado</strong>
          <p className="visual-helper">Para catálogo, menú, promociones, soporte o cualquier enlace.</p>
          <button type="button" className="btn full" onClick={() => onQuickAdd("url")}>+ Crear personalizado</button>
        </div>
      )}
      <div className="visual-actions-row" style={{ gridTemplateColumns: "1fr" }}><button type="button" className="cancel" onClick={onCancel}>Cerrar</button></div>
    </div>
  );
}
