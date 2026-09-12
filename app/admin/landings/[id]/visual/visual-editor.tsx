"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { useDraft, type Draft } from "../draft-context";
import BackgroundPicker from "../background-picker";
import { compressImage } from "@/lib/compress-image";
import {
  getAllActions, AUTO_COLORS, displayUsername, contrastTextColor, buttonZoneShadow, buttonFillStyle, autoTextColor, logoBackgroundColor, logoBorderRadius, logoFrameStyle, resolveBackgroundTint,
  TEXT_FONT_OPTIONS, hexToRgba,
} from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";
import { resolveButtonColors } from "@/lib/design-presets";
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

type Sheet = "title" | "subtitle" | "background" | "logo" | "design" | "add" | "settings" | { kind: "button"; button: ButtonItem } | null;
type Notice = { kind: "leave"; href: string } | { kind: "saveFirst"; reason: "image" | "publish" | "qr" } | { kind: "deleteLanding" } | null;

const FORMAT_HINTS: Record<string, string> = {
  phone: "Con código de país, sin espacios ni signos. Ej: 5493511234567.",
  email: "Tiene que ser un email válido (ej: contacto@negocio.com).",
  username: "Solo tu usuario, sin @ — el link se arma solo.",
};

type DesignPreset = {
  id: string; name: string; description: string; accent: string;
  buttonFont: string;
  buttonZone: Omit<Draft["buttonZone"], "oneColor" | "preset" | "templateId" | "contentAlign">;
  title: Pick<Draft["titleStyle"], "font" | "weight" | "size" | "align">;
  subtitle: Pick<Draft["subtitleStyle"], "font" | "weight" | "size">;
  logo: Pick<Draft["logoStyle"], "shape" | "size">;
};

const DESIGN_PRESETS: DesignPreset[] = [
  {
    id: "essential", name: "Esencial", description: "Limpio, claro y fácil de leer.", accent: "#5d64e8", buttonFont: "minimal",
    buttonZone: { layout: "center", gap: 9, height: 52, radius: 16, width: 100, shadow: "soft", finish: "solid", collection: "soft", colorMode: "one", textSize: 14, iconSize: 29 },
    title: { font: TEXT_FONT_OPTIONS[0].value, weight: 900, size: 28, align: "center" }, subtitle: { font: TEXT_FONT_OPTIONS[0].value, weight: 500, size: 14 }, logo: { shape: "round", size: 124 },
  },
  {
    id: "modern", name: "Moderno", description: "Más presencia y botones protagonistas.", accent: "#20243b", buttonFont: "modern",
    buttonZone: { layout: "center", gap: 11, height: 56, radius: 22, width: 100, shadow: "strong", finish: "solid", collection: "brand", colorMode: "one", textSize: 15, iconSize: 31 },
    title: { font: "'Arial Black',Arial,sans-serif", weight: 900, size: 30, align: "left" }, subtitle: { font: TEXT_FONT_OPTIONS[0].value, weight: 500, size: 14 }, logo: { shape: "square", size: 128 },
  },
  {
    id: "elegant", name: "Elegante", description: "Refinado, aireado y editorial.", accent: "#705849", buttonFont: "classic",
    buttonZone: { layout: "center", gap: 12, height: 50, radius: 8, width: 94, shadow: "none", finish: "outline", collection: "luxury", colorMode: "one", textSize: 14, iconSize: 27 },
    title: { font: "Georgia,serif", weight: 700, size: 32, align: "center" }, subtitle: { font: "Georgia,serif", weight: 400, size: 14 }, logo: { shape: "round", size: 118 },
  },
  {
    id: "friendly", name: "Cercano", description: "Cálido, amable y con colores reconocibles.", accent: "#e46b50", buttonFont: "friendly",
    buttonZone: { layout: "center", gap: 10, height: 54, radius: 27, width: 100, shadow: "soft", finish: "solid", collection: "soft", colorMode: "auto", textSize: 14, iconSize: 30 },
    title: { font: "'Trebuchet MS',sans-serif", weight: 900, size: 29, align: "center" }, subtitle: { font: "'Trebuchet MS',sans-serif", weight: 500, size: 14 }, logo: { shape: "round", size: 126 },
  },
  {
    id: "compact", name: "Compacto", description: "Ideal cuando hay muchos enlaces.", accent: "#177e70", buttonFont: "minimal",
    buttonZone: { layout: "center", gap: 6, height: 44, radius: 12, width: 100, shadow: "soft", finish: "solid", collection: "minimal", colorMode: "one", textSize: 13, iconSize: 25 },
    title: { font: TEXT_FONT_OPTIONS[0].value, weight: 800, size: 25, align: "center" }, subtitle: { font: TEXT_FONT_OPTIONS[0].value, weight: 400, size: 13 }, logo: { shape: "round", size: 104 },
  },
];

export default function VisualEditor({
  landing, siteUrl, uploadLogoAction, removeLogoAction,
  publishAction, deleteLandingAction, saveDesignStyleAction, buttons,
}: {
  landing: Landing; siteUrl: string; uploadLogoAction: Action; removeLogoAction: Action;
  publishAction: Action; deleteLandingAction: Action; saveDesignStyleAction: Action; buttons: ButtonItem[];
}) {
  const { draft, update: updateDraft } = useDraft();
  const [logoUploading, setLogoUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [draftButtons, setDraftButtons] = useState(buttons);
  const [dirty, setDirty] = useState(false);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(null);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [addTab, setAddTab] = useState<"preset" | "custom">("preset");
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const snapshotRef = useRef<Draft | null>(null);
  const buttonSnapshotRef = useRef<ButtonItem[] | null>(null);
  const dirtySnapshotRef = useRef(false);
  const backgroundSnapshotRef = useRef<{ file: File | null; previewUrl: string | null; removed: boolean } | null>(null);
  const backgroundObjectUrlsRef = useRef<string[]>([]);
  const allowLeaveRef = useRef(false);
  const anchorRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoFormRef = useRef<HTMLFormElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const buttonFont = draft.button_font;
  const zone = draft.buttonZone;
  const title = draft.titleStyle;
  const subtitle = draft.subtitleStyle;
  const logo = draft.logoStyle;
  const logoBackground = logoBackgroundColor(logo, draft.primary_color || "#1f2937");
  const bgPos = draft.bgPosition;
  const backgroundTint = resolveBackgroundTint(draft.background_type, bgPos.tint);
  const backgroundImageSrc = backgroundPreviewUrl || (!backgroundRemoved ? draft.background_image_url : "");

  const update = (patch: Partial<Draft>) => {
    updateDraft(patch);
    setDirty(true);
  };

  useEffect(() => {
    setDraftButtons(buttons);
    setDirty(false);
  }, [buttons]);

  useEffect(() => () => {
    backgroundObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!allowLeaveRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
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
    backgroundSnapshotRef.current = {
      file: bgInputRef.current?.files?.[0] || null,
      previewUrl: backgroundPreviewUrl,
      removed: backgroundRemoved,
    };
    setSheet(next);
  }

  function closeSheet(keepChanges: boolean) {
    if (!keepChanges && snapshotRef.current) {
      updateDraft(snapshotRef.current);
      if (buttonSnapshotRef.current) setDraftButtons(buttonSnapshotRef.current);
      setDirty(dirtySnapshotRef.current);
      const backgroundSnapshot = backgroundSnapshotRef.current;
      if (backgroundSnapshot) {
        setBackgroundPreviewUrl(backgroundSnapshot.previewUrl);
        setBackgroundRemoved(backgroundSnapshot.removed);
        if (bgInputRef.current) {
          const files = new DataTransfer();
          if (backgroundSnapshot.file) files.items.add(backgroundSnapshot.file);
          bgInputRef.current.files = files.files;
        }
      }
    }
    setSheet(null);
    setPos(null);
    snapshotRef.current = null;
    buttonSnapshotRef.current = null;
    backgroundSnapshotRef.current = null;
  }

  useEffect(() => {
    if (!sheet && !notice) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (notice) setNotice(null);
      else closeSheet(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheet, notice]);

  useLayoutEffect(() => {
    if (!sheet || !anchorRef.current || !stageRef.current || !popoverRef.current) return;
    if (sheet === "background") return;
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
      setNotice({ kind: "saveFirst", reason: "image" });
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
    setBgUploading(true);
    const compressed = await compressImage(file, 1200);
    const dt = new DataTransfer();
    dt.items.add(compressed);
    if (bgInputRef.current) bgInputRef.current.files = dt.files;
    const previewUrl = URL.createObjectURL(compressed);
    backgroundObjectUrlsRef.current.push(previewUrl);
    setBackgroundPreviewUrl(previewUrl);
    setBackgroundRemoved(false);
    update({
      background_type: "image",
      bgPosition: { ...bgPos, zoom: 1, x: 50, y: 50 },
      titleStyle: { ...title, color: "#ffffff" },
      subtitleStyle: { ...subtitle, color: "#ffffff" },
    });
    setBgUploading(false);
  }

  function removeBackgroundImage() {
    setBackgroundPreviewUrl(null);
    setBackgroundRemoved(true);
    if (bgInputRef.current) bgInputRef.current.value = "";
    const automaticTextColor = contrastTextColor(draft.background_color || "#f7f5f0");
    update({ background_type: "color", titleStyle: { ...title, color: automaticTextColor }, subtitleStyle: { ...subtitle, color: automaticTextColor } });
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

  function requestLeave(event: { preventDefault: () => void }, href: string) {
    if (!dirty) return;
    event.preventDefault();
    setNotice({ kind: "leave", href });
  }

  function leaveWithoutSaving(href: string) {
    allowLeaveRef.current = true;
    window.location.assign(href);
  }

  const sheetTitle =
    sheet === "title" ? "Editar título" :
    sheet === "subtitle" ? "Editar subtítulo" :
    sheet === "background" ? "Fondo" :
    sheet === "logo" ? "Logo / foto" :
    sheet === "design" ? "Elegí un diseño" :
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
        <Link className="visual-back" href="/admin" onClick={(event) => requestLeave(event, "/admin")}>← Volver al panel</Link>
      </section>

      <section className="visual-center">
        <form id={DESIGN_FORM_ID} action={saveDesignStyleAction} onSubmit={() => { allowLeaveRef.current = true; setNotice(null); closeSheet(true); }}>
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
          <input type="hidden" name="remove_background_image" value={String(backgroundRemoved)} />
          <input ref={bgInputRef} name="background_image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBgPick} hidden />
        </form>
        <div className="visual-toolbar">
          <Link className="visual-tb" href="/admin" onClick={(event) => requestLeave(event, "/admin")}>← Panel</Link>
          <button
            type="button"
            className={previewMode ? "visual-tb visual-tb-preview active" : "visual-tb visual-tb-preview"}
            aria-pressed={previewMode}
            onClick={() => setPreviewMode((active) => !active)}
          >
            {previewMode ? <><IconEdit /> Volver a editar</> : <><IconEye /> Vista previa</>}
          </button>
          <button type="button" className="visual-tb visual-tb-design" onClick={(e) => openSheet("design", e.currentTarget)}>✦ Diseño</button>
          <button type="button" className="visual-tb" onClick={(e) => openSheet("settings", e.currentTarget)}><IconQrCode /> QR y publicar</button>
          <button form={DESIGN_FORM_ID} type="submit" className="visual-tb visual-tb-publish" disabled={!dirty}>{dirty ? "Guardar cambios" : "Todo guardado ✓"}</button>
        </div>

        <div className="visual-stage" ref={stageRef}>
          <div className={previewMode ? "visual-phone visual-preview-mode" : "visual-phone"}>
            <div className="visual-screen">
              {draft.background_type === "image" && backgroundImageSrc ? (
                <div className="visual-bg-photo" style={{ backgroundColor: draft.background_color || "#f7f5f0", backgroundImage: `url(${backgroundImageSrc})`, backgroundSize: "cover", backgroundPosition: `${bgPos.x}% ${bgPos.y}%`, transform: `scale(${bgPos.zoom})`, transformOrigin: `${bgPos.x}% ${bgPos.y}%` }} />
              ) : (
                <div className="visual-bg-photo" style={{ ...bgStyle, opacity: 1 }} />
              )}
              <div className="visual-tint" style={{ background: `linear-gradient(180deg, rgba(4,8,10,.03), rgba(5,8,11,${backgroundTint}))` }} />

              {!previewMode && <button type="button" className="visual-bg-chip" onClick={(e) => openSheet("background", e.currentTarget)}><IconDroplet /> Fondo</button>}
              <div className="visual-statusbar"><span>9:41</span><span>▮▮▮ ● ▰</span></div>

              <div className="visual-scroll">
                <div className={previewMode ? "visual-logo" : "visual-logo editable"} style={{ ...logoFrameStyle(logo, draft.primary_color || "#1f2937"), width: logo.size, height: logo.size, borderRadius: logoBorderRadius(logo.shape, logo.size) }} onClick={(e) => { if (!previewMode) openSheet("logo", e.currentTarget); }}>
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
            <button type="button" className={sheet === "background" ? "visual-popover-backdrop visual-background-backdrop" : "visual-popover-backdrop"} aria-label="Cerrar sin guardar" onClick={() => closeSheet(false)} />
            <div className={sheet === "background" ? "visual-popover visual-background-editor open" : sheet === "design" ? "visual-popover visual-design-editor open" : "visual-popover open"} ref={popoverRef} role="dialog" aria-modal="true" aria-labelledby="visual-dialog-title" tabIndex={-1} style={sheet === "background" ? undefined : pos ? { left: pos.left, top: pos.top } : { opacity: 0 }}>
              <div className="visual-pop-head">
                <h3 id="visual-dialog-title">{sheetTitle}</h3>
                <button type="button" className="visual-close" aria-label="Cerrar sin guardar" onClick={() => closeSheet(false)}><IconX /></button>
              </div>

              {sheet === "title" && (
                <>
                  <p className="visual-helper">Cambialo y mirá el resultado directamente en el celular.</p>
                  <label className="label">Texto<input value={draft.business_name} onChange={(e) => update({ business_name: e.target.value })} /></label>
                  <div className="visual-actions-row"><button type="button" className="cancel" onClick={() => closeSheet(false)}>Cancelar</button><button type="button" className="save" onClick={() => closeSheet(true)}>Aplicar</button></div>
                </>
              )}

              {sheet === "subtitle" && (
                <>
                  <p className="visual-helper">Una frase corta alcanza. El diseño se adapta automáticamente.</p>
                  <label className="label">Texto<textarea rows={3} value={draft.description} onChange={(e) => update({ description: e.target.value })} /></label>
                  <div className="visual-actions-row"><button type="button" className="cancel" onClick={() => closeSheet(false)}>Cancelar</button><button type="button" className="save" onClick={() => closeSheet(true)}>Aplicar</button></div>
                </>
              )}

              {sheet === "background" && (
                <>
                  <div className="visual-background-layout">
                    <div className="visual-background-controls">
                      <p className="visual-helper">Elegí el fondo y mirá exactamente cómo va a quedar en el celular.</p>
                      <BackgroundPicker
                        landing={landing}
                        formId={NO_SUBMIT}
                        onDirty={() => setDirty(true)}
                        onBackgroundChange={(type, from, to) => {
                          const automaticTextColor = autoTextColor({ background_type: type, background_color: from, background_gradient_to: to });
                          updateDraft({ titleStyle: { ...title, color: automaticTextColor }, subtitleStyle: { ...subtitle, color: automaticTextColor } });
                        }}
                      />
                      {draft.background_type === "image" && (
                        <>
                          <div className="visual-bg-upload-card">
                            <div><strong>{backgroundImageSrc ? "Tu imagen" : "Agregá una imagen"}</strong><small>JPG, PNG o WEBP · se guarda junto con el resto</small></div>
                            <button type="button" className="upload-button" disabled={bgUploading} onClick={() => bgInputRef.current?.click()}>{bgUploading ? "Preparando..." : backgroundImageSrc ? "Cambiar" : "Elegir imagen"}</button>
                            {backgroundImageSrc && <button type="button" className="text-button" onClick={removeBackgroundImage}>Quitar</button>}
                          </div>
                          {backgroundImageSrc && <label className="label">Oscurecer imagen<input type="range" min={0} max={0.65} step={0.05} value={bgPos.tint} onChange={(event) => update({ bgPosition: { ...bgPos, tint: +event.target.value } })} /><small>{Math.round(bgPos.tint * 100)}%</small></label>}
                        </>
                      )}
                    </div>
                    <BackgroundPhonePreview
                      src={draft.background_type === "image" ? backgroundImageSrc || null : null}
                      backgroundStyle={bgStyle}
                      bgPos={bgPos}
                      businessName={draft.business_name}
                      description={draft.description}
                      logoUrl={draft.logo_url}
                      primaryColor={draft.primary_color}
                      zone={zone}
                      buttons={draftButtons}
                      onChange={(next) => update({ bgPosition: { ...bgPos, ...next } })}
                    />
                  </div>
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
                  {draft.logo_url && (
                    <DragCropPreview
                      src={draft.logo_url}
                      width={Math.min(logo.size, 140)} height={Math.min(logo.size, 140)}
                      radius={logoBorderRadius(logo.shape, Math.min(logo.size, 140))}
                      zoom={logo.zoom} x={logo.x} y={logo.y} fallback={logoBackground}
                      minZoom={1} maxZoom={2.5}
                      onChange={(next) => update({ logoStyle: { ...logo, ...next } })}
                    />
                  )}
                  <div className="visual-actions-row"><button type="button" className="cancel" onClick={() => closeSheet(false)}>Cancelar</button><button type="button" className="save" onClick={() => closeSheet(true)}>Aplicar</button></div>
                </>
              )}

              {sheet === "design" && (
                <DesignSheet draft={draft} update={update} onDone={() => closeSheet(true)} onCancel={() => closeSheet(false)} />
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
                  {dirty && <div className="visual-unsaved-warning">Guardá los cambios pendientes antes de publicar o salir a otra pantalla.<button type="submit" form={DESIGN_FORM_ID}>Guardar ahora</button></div>}
                  <form action={publishAction} onSubmit={() => closeSheet(true)}>
                    <input type="hidden" name="id" value={landing.id} />
                    <input type="hidden" name="published" value={String(!landing.published)} />
                    <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/visual`} />
                    <button className="btn full" type="submit" disabled={dirty}><IconRocket /> {landing.published ? "Despublicar" : "Publicar landing"}</button>
                  </form>
                  <Link className="btn secondary full" href={`/admin/landings/${landing.id}/qr`} onClick={(event) => { if (dirty) { event.preventDefault(); setNotice({ kind: "saveFirst", reason: "qr" }); } }}><IconQrCode /> Código QR para el tag NFC</Link>
                  {landing.published && <Link className="btn secondary full" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconEye /> Ver landing publicada</Link>}
                  <form id="visual-delete-landing-form" action={deleteLandingAction} onSubmit={() => { allowLeaveRef.current = true; closeSheet(true); }}>
                    <input type="hidden" name="id" value={landing.id} />
                    <button type="button" className="text-button" style={{ color: "#dc2626", marginTop: 8 }} onClick={() => setNotice({ kind: "deleteLanding" })}><IconTrash /> Eliminar landing</button>
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

      {notice && (
        <div className="visual-confirm-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNotice(null); }}>
          <section className="visual-confirm" role="alertdialog" aria-modal="true" aria-labelledby="visual-confirm-title" aria-describedby="visual-confirm-copy">
            <div className={notice.kind === "deleteLanding" ? "visual-confirm-icon danger" : "visual-confirm-icon"} aria-hidden="true">!</div>
            <h2 id="visual-confirm-title">{notice.kind === "leave" ? "Cambios sin guardar" : notice.kind === "deleteLanding" ? "¿Eliminar esta landing?" : "Primero guardá tus cambios"}</h2>
            <p id="visual-confirm-copy">
              {notice.kind === "leave"
                ? "Si salís ahora, vas a perder los cambios que hiciste en esta landing."
                : notice.kind === "deleteLanding"
                  ? "También se eliminarán todos sus botones. Esta acción no se puede deshacer."
                  : notice.reason === "image"
                  ? "Guardá el borrador actual y después volvé a subir la imagen. Así no se pierde ningún cambio."
                  : notice.reason === "qr"
                    ? "Guardá el borrador para que el QR abra la última versión de la landing."
                    : "Guardá el borrador para publicar la última versión de la landing."}
            </p>
            <div className="visual-confirm-actions">
              <button type="button" className="visual-confirm-cancel" autoFocus onClick={() => setNotice(null)}>{notice.kind === "leave" ? "Seguir editando" : "Cancelar"}</button>
              {notice.kind === "leave" ? (
                <button type="button" className="visual-confirm-danger" onClick={() => leaveWithoutSaving(notice.href)}>Salir sin guardar</button>
              ) : notice.kind === "deleteLanding" ? (
                <button type="submit" form="visual-delete-landing-form" className="visual-confirm-danger">Eliminar landing</button>
              ) : (
                <button type="submit" form={DESIGN_FORM_ID} className="visual-confirm-save">Guardar ahora</button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function BackgroundPhonePreview({
  src, backgroundStyle, bgPos, businessName, description, logoUrl, primaryColor, zone, buttons, onChange,
}: {
  src: string | null; backgroundStyle: CSSProperties; bgPos: Draft["bgPosition"];
  businessName: string; description: string; logoUrl: string; primaryColor: string; zone: Draft["buttonZone"]; buttons: ButtonItem[];
  onChange: (next: { zoom: number; x: number; y: number }) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!src) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { startX: event.clientX, startY: event.clientY, origX: bgPos.x, origY: bgPos.y };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    onChange({
      zoom: bgPos.zoom,
      x: clamp(dragState.current.origX - ((event.clientX - dragState.current.startX) / rect.width) * 100, 0, 100),
      y: clamp(dragState.current.origY - ((event.clientY - dragState.current.startY) / rect.height) * 100, 0, 100),
    });
  }

  function stopDragging() {
    dragState.current = null;
    setDragging(false);
  }

  return (
    <div className="visual-background-preview-column">
      <div className="visual-background-preview-label"><strong>Vista en el celular</strong><span>{src ? "Arrastrá la imagen para encuadrarla" : "Así se va a ver el fondo"}</span></div>
      <div
        ref={frameRef}
        className={src ? "visual-background-phone is-draggable" : "visual-background-phone"}
        role="group"
        aria-label={src ? "Vista del fondo. Arrastrá para cambiar el encuadre." : "Vista previa del fondo en el celular."}
        style={{ cursor: src ? (dragging ? "grabbing" : "grab") : "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
      >
        <div
          className="visual-background-preview-layer"
          style={src ? {
            backgroundColor: "#f7f5f0",
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
            transform: `scale(${bgPos.zoom})`,
            transformOrigin: `${bgPos.x}% ${bgPos.y}%`,
          } : backgroundStyle}
        />
        <div className="visual-background-preview-tint" style={{ background: `linear-gradient(180deg, rgba(4,8,10,.03), rgba(5,8,11,${resolveBackgroundTint(src ? "image" : "color", bgPos.tint)}))` }} />
        <div className="visual-background-preview-content">
          <div className="visual-background-preview-avatar" style={{ background: primaryColor || "#f5eddf" }}>
            {logoUrl ? <div style={{ width: "100%", height: "100%", background: `url(${logoUrl}) center / cover` }} /> : (businessName.slice(0, 1) || "?")}
          </div>
          <strong className="visual-background-preview-title">{businessName || "Nombre de tu negocio"}</strong>
          <span className="visual-background-preview-description">{description || "Tu descripción se verá acá"}</span>
          <div className="visual-background-preview-buttons">
            {buttons.slice(0, 4).map((button, index) => {
              const { background: buttonColor, text: buttonText } = resolveButtonColors({ zone, type: button.type, position: index, primary: primaryColor, customColor: button.background_color, useAutoColor: button.use_auto_color });
              return <div key={button.id} style={{ ...buttonFillStyle(zone.finish, buttonColor, buttonText), borderRadius: Math.max(7, zone.radius * .58), boxShadow: buttonZoneShadow(zone.shadow) }}><ActionTypeIcon type={button.type} icon={button.icon} /><span>{button.title}</span></div>;
            })}
          </div>
        </div>
      </div>
      {src && (
        <div className="visual-background-zoom">
          <button type="button" aria-label="Alejar imagen" onClick={() => onChange({ ...bgPos, zoom: clamp(bgPos.zoom - 0.1, 1, 2.4) })}>−</button>
          <label><span>Zoom</span><input type="range" min={1} max={2.4} step={0.01} value={bgPos.zoom} onChange={(event) => onChange({ ...bgPos, zoom: +event.target.value })} /></label>
          <button type="button" aria-label="Acercar imagen" onClick={() => onChange({ ...bgPos, zoom: clamp(bgPos.zoom + 0.1, 1, 2.4) })}>+</button>
          <button type="button" className="reset" onClick={() => onChange({ zoom: 1, x: 50, y: 50 })}>Centrar</button>
        </div>
      )}
    </div>
  );
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
      {buttons.map((button, index) => {
        const { background: bg, text } = resolveButtonColors({ zone, type: button.type, position: index, primary, customColor: button.background_color, useAutoColor: button.use_auto_color });
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

function DesignSheet({ draft, update, onDone, onCancel }: { draft: Draft; update: (patch: Partial<Draft>) => void; onDone: () => void; onCancel: () => void }) {
  function applyPreset(preset: DesignPreset) {
    const textColor = autoTextColor(draft);
    update({
      button_font: preset.buttonFont,
      buttonZone: { ...preset.buttonZone, preset: preset.id, templateId: "custom", oneColor: draft.primary_color, contentAlign: draft.buttonZone.contentAlign },
      titleStyle: { ...draft.titleStyle, ...preset.title, color: textColor, bgMode: "none" },
      subtitleStyle: { ...draft.subtitleStyle, ...preset.subtitle, color: textColor, bgMode: "none" },
      logoStyle: { ...draft.logoStyle, ...preset.logo },
    });
  }

  function updatePrimaryColor(color: string) {
    update({
      primary_color: color,
      buttonZone: draft.buttonZone.colorMode === "one" ? { ...draft.buttonZone, oneColor: color } : draft.buttonZone,
    });
  }

  return (
    <form className="stack" onSubmit={(event) => { event.preventDefault(); onDone(); }}>
      <p className="visual-helper">Cada plantilla combina tipografía, logo, botones y espacios. No cambia tus textos, enlaces ni imágenes.</p>
      <div className="visual-design-grid" role="radiogroup" aria-label="Plantillas de diseño">
        {DESIGN_PRESETS.map((preset) => {
          const selected = draft.buttonZone.preset === preset.id;
          return (
            <button key={preset.id} type="button" role="radio" aria-checked={selected} className={selected ? "visual-design-card selected" : "visual-design-card"} onClick={() => applyPreset(preset)}>
              <span className="visual-design-thumb" style={{ "--preset-accent": draft.primary_color || preset.accent, "--preset-radius": `${preset.buttonZone.radius / 2}px` } as CSSProperties}>
                <i className={preset.logo.shape === "round" ? "round" : "square"} />
                <b style={{ fontFamily: preset.title.font, textAlign: preset.title.align }}>{preset.name}</b>
                <em /><em /><em />
              </span>
              <span className="visual-design-copy"><strong>{preset.name}</strong><small>{preset.description}</small></span>
              <span className="visual-design-check" aria-hidden="true">✓</span>
            </button>
          );
        })}
      </div>
      <label className="label visual-primary-color">Color principal
        <span className="visual-color-control"><input type="color" value={draft.primary_color} onChange={(event) => updatePrimaryColor(event.target.value)} /><strong>{draft.primary_color.toUpperCase()}</strong><small>Se aplica automáticamente donde corresponde.</small></span>
      </label>
      <div className="visual-actions-row"><button type="button" className="cancel" onClick={onCancel}>Cancelar</button><button className="save" type="submit">Aplicar diseño</button></div>
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
      icon: button.icon,
      background_color: brandColor,
      text_color: contrastTextColor(brandColor),
      use_auto_color: true,
    });
  }
  return (
    <>
      <span className={isPreset ? "badge" : "badge custom"}>{isPreset ? `Acción · ${item.label}` : "Enlace personalizado"}</span>
      <form id={formId} className="stack" onSubmit={submit}>
        <label className="label">Nombre<input name="title" defaultValue={button.title} required /></label>
        <label className="label">Texto secundario (opcional)<input name="subtitle" defaultValue={button.subtitle} placeholder="Ej: Hablemos de tu proyecto" /></label>
        {item.message && <label className="label">Mensaje de WhatsApp<input name="message" defaultValue={button.message} /></label>}
        <ValueField item={item} defaultValue={button.url} />
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
      <div className="segmented"><button type="button" className={addTab === "preset" ? "segmented-option active" : "segmented-option"} onClick={() => setAddTab("preset")}>Acciones comunes</button><button type="button" className={addTab === "custom" ? "segmented-option active" : "segmented-option"} onClick={() => setAddTab("custom")}>Otro enlace</button></div>

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
