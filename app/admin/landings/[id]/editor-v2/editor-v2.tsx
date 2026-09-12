"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionTypeIcon } from "@/components/action-icons";
import LandingRenderer, { type LandingEditControls } from "@/components/landing-renderer";
import { compressImage } from "@/lib/compress-image";
import { AUTO_COLORS, contrastTextColor, getAllActions, logoBorderRadius, logoFrameStyle, logoInitials, logoLetterSize, TEXT_FONT_OPTIONS, type BackgroundPosition, type ButtonZoneStyle, type LogoStyle, type SubtitleStyle, type TitleStyle } from "@/lib/landing-catalog";
import { DESIGN_PRESETS_V2, buttonCollectionStyle, resolveButtonColors, type DesignPreset } from "@/lib/design-presets";

type ButtonItem = { id: string; type: string; title: string; subtitle: string; url: string; message: string; icon: string; background_color: string; text_color: string; use_auto_color: boolean; position: number };
type LandingDraft = {
  id: string; slug: string; business_name: string; description?: string | null; logo_url?: string | null; primary_color?: string | null;
  background_color?: string | null; background_type?: string | null; background_gradient_to?: string | null; background_image_url?: string | null;
  text_color?: string | null; text_panel?: boolean | null; text_panel_color?: string | null; font_pair?: string | null; button_font?: string | null;
  published?: boolean | null; buttonZone: ButtonZoneStyle; titleStyle: TitleStyle; subtitleStyle: SubtitleStyle; logoStyle: LogoStyle; bgPosition: BackgroundPosition;
};
type Panel = "templates" | "buttons" | "background" | "profile" | "title" | "subtitle" | "logo" | "add" | { buttonId: string } | null;
type DeviceMode = "small" | "standard" | "large";
type SaveAction = (formData: FormData) => void | Promise<void>;

const FONT_LABEL: Record<string, string> = { modern: "Actual", minimal: "Limpia", friendly: "Cercana", classic: "Elegante" };
const SIZES = [
  { label: "Compactos", patch: { height: 44, textSize: 13, iconSize: 25, gap: 6 } },
  { label: "Normales", patch: { height: 52, textSize: 14, iconSize: 29, gap: 9 } },
  { label: "Grandes", patch: { height: 60, textSize: 16, iconSize: 32, gap: 12 } },
];
const DEVICE_OPTIONS: { id: DeviceMode; label: string; size: string }[] = [
  { id: "small", label: "Chico", size: "360 px" },
  { id: "standard", label: "Común", size: "390 px" },
  { id: "large", label: "Grande", size: "430 px" },
];
const LOGO_SHAPE_OPTIONS: { id: LogoStyle["shape"]; label: string }[] = [
  { id: "round", label: "Circular" },
  { id: "square", label: "Cuadrado redondeado" },
];
type LogoTreatment = "template" | "clean" | "badge" | "card" | "highlight";

function logoTreatmentPatch(treatment: LogoTreatment, templateId = "minimal"): Partial<LogoStyle> {
  if (treatment === "template") {
    const recommended: Record<string, Exclude<LogoTreatment, "template">> = { minimal: "clean", brutalism: "card", neobrutal: "highlight", glass: "badge", elegant: "badge", corporate: "card", vibrant: "highlight", natural: "badge", pastel: "badge", neon: "highlight", creator: "card" };
    return { ...logoTreatmentPatch(recommended[templateId] || "badge", templateId), treatment: "template" };
  }
  if (treatment === "clean") return { treatment, borderWidth: 0, shadow: "none", backgroundMode: "auto" };
  if (treatment === "card") return { treatment, shape: "square", borderWidth: 1, borderColor: "#ffffff", shadow: "soft", backgroundMode: "auto" };
  if (treatment === "highlight") return { treatment, shape: "round", borderWidth: 5, borderColor: "#ffffff", shadow: "glow", backgroundMode: "auto" };
  return { treatment, shape: "round", borderWidth: 3, borderColor: "#ffffff", shadow: "soft", backgroundMode: "auto" };
}

export default function EditorV2({ landing, initialButtons, saveAction }: { landing: LandingDraft; initialButtons: ButtonItem[]; saveAction: SaveAction }) {
  const [draft, setDraft] = useState(landing);
  const [buttons, setButtons] = useState(initialButtons);
  const [panel, setPanel] = useState<Panel>("templates");
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<DeviceMode>("standard");
  const [dirty, setDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const activeButton = typeof panel === "object" && panel ? buttons.find((button) => button.id === panel.buttonId) : null;
  const actionDefs = useMemo(() => getAllActions(), []);
  const draggedButton = useRef<string | null>(null);
  const lastDragTargetIndex = useRef<number | null>(null);
  const buttonElements = useRef(new Map<string, HTMLAnchorElement>());
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const grabOffsetRef = useRef(0);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [panel]);

  // Undo/redo history. Everything lives in `draft` + `buttons`, so a snapshot of both is
  // enough to restore any point in time. Continuous edits (typing, dragging a slider or
  // color picker) are coalesced into ONE step per burst — otherwise undoing a typed
  // sentence would take one press per letter — while discrete actions (add/remove a
  // button, apply a template, a whole drag-reorder gesture) each get their own step,
  // pushed immediately. History is in-memory only: it resets on reload, same as most editors.
  type Snapshot = { draft: LandingDraft; buttons: ButtonItem[] };
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const pendingBurstRef = useRef<Snapshot | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [historyTick, setHistoryTick] = useState(0);
  const HISTORY_LIMIT = 60;

  function pushPast(snapshot: Snapshot) {
    pastRef.current.push(snapshot);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
  }

  function flushBurst() {
    if (!pendingBurstRef.current) return;
    pushPast(pendingBurstRef.current);
    pendingBurstRef.current = null;
    setHistoryTick((tick) => tick + 1);
  }

  // Call before a continuous edit (typing, slider, color picker).
  function commitContinuous() {
    if (!pendingBurstRef.current) pendingBurstRef.current = { draft, buttons };
    futureRef.current = [];
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    burstTimerRef.current = setTimeout(flushBurst, 600);
  }

  // Call before a discrete, one-shot action (add/remove button, apply template, start a drag).
  function commitDiscrete() {
    if (burstTimerRef.current) { clearTimeout(burstTimerRef.current); burstTimerRef.current = null; }
    flushBurst();
    pushPast({ draft, buttons });
    futureRef.current = [];
    setHistoryTick((tick) => tick + 1);
  }

  function undo() {
    if (burstTimerRef.current) { clearTimeout(burstTimerRef.current); burstTimerRef.current = null; }
    flushBurst();
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push({ draft, buttons });
    setDraft(previous.draft);
    setButtons(previous.buttons);
    setDirty(true);
    setHistoryTick((tick) => tick + 1);
  }

  function redo() {
    const next = futureRef.current.pop();
    if (!next) return;
    pushPast({ draft, buttons });
    setDraft(next.draft);
    setButtons(next.buttons);
    setDirty(true);
    setHistoryTick((tick) => tick + 1);
  }

  useEffect(() => {
    function isEditableTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      // Let a focused text field handle its own native undo instead of hijacking it.
      if (isEditableTarget(document.activeElement)) return;
      event.preventDefault();
      if (key === "y" || (key === "z" && event.shiftKey)) redo(); else undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, buttons]);

  const patchDraft = (patch: Partial<LandingDraft>) => { setDraft((current) => ({ ...current, ...patch })); setDirty(true); };
  const change = (patch: Partial<LandingDraft>) => { commitContinuous(); patchDraft(patch); };
  const changeZone = (patch: Partial<ButtonZoneStyle>) => change({ buttonZone: { ...draft.buttonZone, ...patch } });
  const patchButtons = (updater: (current: ButtonItem[]) => ButtonItem[]) => { setButtons(updater); setDirty(true); };
  const changeButton = (id: string, patch: Partial<ButtonItem>) => { commitContinuous(); patchButtons((current) => current.map((button) => button.id === id ? { ...button, ...patch } : button)); };

  function applyPreset(id: string) {
    const preset = DESIGN_PRESETS_V2.find((item) => item.id === id);
    if (!preset) return;
    commitDiscrete();
    patchDraft({
      primary_color: preset.accent, button_font: preset.buttonFont,
      background_type: "gradient", background_color: preset.bg1, background_gradient_to: preset.bg2,
      buttonZone: { ...draft.buttonZone, ...preset.buttonZone, layout: "center", oneColor: preset.oneColor, templateId: id },
      titleStyle: { ...draft.titleStyle, ...preset.title, color: preset.foreground }, subtitleStyle: { ...draft.subtitleStyle, ...preset.subtitle, color: preset.foreground }, logoStyle: { ...draft.logoStyle, ...logoTreatmentPatch("template", id), ...preset.logo },
    });
  }

  function applyButtonLook(id: string) {
    const preset = DESIGN_PRESETS_V2.find((item) => item.id === id);
    if (!preset) return;
    commitDiscrete();
    patchDraft({
      buttonZone: {
        ...draft.buttonZone,
        preset: id,
        collection: preset.buttonZone.collection,
        radius: preset.buttonZone.radius,
        shadow: preset.buttonZone.shadow,
        finish: preset.buttonZone.finish,
      },
    });
  }

  function resetButtonColors() {
    if (!buttons.some((button) => !button.use_auto_color)) return;
    commitDiscrete();
    patchButtons((current) => current.map((button) => ({ ...button, use_auto_color: true })));
  }

  function addButton(type: string) {
    const def = actionDefs.find((item) => item.type === type) || actionDefs[actionDefs.length - 1];
    const id = `new-${crypto.randomUUID()}`;
    const button: ButtonItem = { id, type: def.type, title: def.label, subtitle: "", url: "", message: def.message ? "Hola, quiero hacer una consulta." : "", icon: "", background_color: "#1f2937", text_color: "#ffffff", use_auto_color: true, position: buttons.length };
    commitDiscrete();
    patchButtons((current) => [...current, button]); setPanel({ buttonId: id });
  }

  // targetIndex is where the dragged item should land, in the CURRENT array's index space
  // (computed by updateDrag from live midpoints — see below).
  function reorderButton(draggedId: string, targetIndex: number) {
    if (lastDragTargetIndex.current === targetIndex) return;
    const previousRects = new Map(Array.from(buttonElements.current, ([id, element]) => [id, element.getBoundingClientRect()]));
    let moved = false;
    setButtons((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      if (from < 0) return current;
      const clamped = Math.max(0, Math.min(current.length - 1, targetIndex));
      if (from === clamped) return current;
      moved = true;
      const next = [...current];
      const [dragged] = next.splice(from, 1);
      next.splice(clamped, 0, dragged);
      return next.map((item, position) => ({ ...item, position }));
    });
    lastDragTargetIndex.current = targetIndex;
    if (!moved) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      buttonElements.current.forEach((element, id) => {
        // The dragged element is kept pinned under the pointer by updateDrag's own
        // continuous, self-correcting recompute on the next move — animating it here too
        // would race with that (this callback lands one or two frames late) and overshoot.
        if (id === draggedId) return;
        const previous = previousRects.get(id);
        if (!previous) return;
        const current = element.getBoundingClientRect();
        const deltaY = previous.top - current.top;
        if (Math.abs(deltaY) > 1) element.animate([{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }], { duration: 190, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    }));
    setDirty(true);
  }

  function updateDrag(clientX: number, clientY: number, draggedId: string) {
    const element = buttonElements.current.get(draggedId);
    if (element) {
      const rect = element.getBoundingClientRect();
      const naturalTop = rect.top - dragOffsetRef.current;
      dragOffsetRef.current = clientY - grabOffsetRef.current - naturalTop;
      element.style.transform = `translateY(${dragOffsetRef.current}px)`;
    }
    // Target the slot whose vertical MIDPOINT the pointer has crossed, using each button's
    // live (current, in-DOM-order) position — not "whichever element happens to be right
    // under the cursor". That second approach leaves dead zones in the gaps between
    // buttons where nothing responds, which is what made dropping "in between" feel stuck.
    const container = buttonsContainerRef.current;
    if (!container) return;
    const others = Array.from(container.querySelectorAll<HTMLElement>("[data-button-id]")).filter((el) => el.dataset.buttonId !== draggedId);
    let targetIndex = others.length;
    for (let i = 0; i < others.length; i++) {
      const rect = others[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) { targetIndex = i; break; }
    }
    reorderButton(draggedId, targetIndex);
  }

  // Reordering the list moves DOM nodes around (see reorderButton), and moving the node
  // that owns setPointerCapture makes the browser silently drop the capture mid-drag — so
  // pointermove stops arriving after the first crossing. Tracking the drag from window-level
  // listeners instead sidesteps that entirely: they don't depend on any one node surviving.
  function startDrag(clientY: number, draggedId: string) {
    commitDiscrete(); // one undo step for the whole drag gesture, however many crossings it has
    draggedButton.current = draggedId;
    lastDragTargetIndex.current = null;
    setDraggingId(draggedId);
    const element = buttonElements.current.get(draggedId);
    const rect = element?.getBoundingClientRect();
    grabOffsetRef.current = rect ? clientY - rect.top : 0;
    dragOffsetRef.current = 0;

    const handleMove = (event: PointerEvent) => {
      if (draggedButton.current !== draggedId) return;
      updateDrag(event.clientX, event.clientY, draggedId);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      const el = buttonElements.current.get(draggedId);
      if (el) el.style.transform = "";
      draggedButton.current = null;
      lastDragTargetIndex.current = null;
      dragOffsetRef.current = 0;
      setDraggingId(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }

  async function onBackgroundFile(file?: File) {
    if (!file) return;
    const compressed = await compressImage(file, 1600);
    const input = document.getElementById("v2-background-file") as HTMLInputElement | null;
    if (input) { const transfer = new DataTransfer(); transfer.items.add(compressed); input.files = transfer.files; }
    if (bgPreview) URL.revokeObjectURL(bgPreview);
    setBgPreview(URL.createObjectURL(compressed)); change({ background_type: "image", bgPosition: { zoom: 1, x: 50, y: 50, tint: .18 } });
  }

  async function onLogoFile(file?: File) {
    if (!file) return;
    const compressed = await compressImage(file, 900);
    const input = document.getElementById("v2-logo-file") as HTMLInputElement | null;
    if (input) { const transfer = new DataTransfer(); transfer.items.add(compressed); input.files = transfer.files; }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(compressed)); setLogoRemoved(false); setDirty(true);
  }

  const backgroundImage = bgPreview || draft.background_image_url || "";
  const logoImage = logoPreview || (!logoRemoved ? draft.logo_url || "" : "");
  const rendererLanding = {
    ...draft,
    logo_url: logoImage,
    background_image_url: backgroundImage,
    button_style: draft.buttonZone,
    title_style: draft.titleStyle,
    subtitle_style: draft.subtitleStyle,
    logo_style: draft.logoStyle,
    background_style: draft.bgPosition,
  };
  // Wires the editor's own state (selection, drag) into LandingRenderer's `edit` prop — the
  // canvas below is the same component the public page uses, not a parallel re-implementation,
  // so "what you see while editing" and "what gets published" can't drift apart anymore.
  const editControls: LandingEditControls = {
    selected: panel,
    draggingId,
    onSelectTemplates: () => setPanel("templates"),
    onSelectLogo: () => setPanel("logo"),
    onSelectTitle: () => setPanel("title"),
    onSelectSubtitle: () => setPanel("subtitle"),
    onSelectBackground: () => setPanel("background"),
    onSelectZone: () => setPanel("buttons"),
    onSelectButton: (id) => setPanel({ buttonId: id }),
    onAddButton: () => setPanel("add"),
    onButtonRef: (id, element) => { if (element) buttonElements.current.set(id, element); else buttonElements.current.delete(id); },
    onDragStart: (clientY, id) => startDrag(clientY, id),
  };

  return (
    <main className="v2-shell">
      <form id="v2-save" action={saveAction} onSubmit={() => setDirty(false)}>
        <input type="hidden" name="landing_id" value={draft.id} />
        <input type="hidden" name="business_name" value={draft.business_name} /><input type="hidden" name="description" value={draft.description || ""} />
        <input type="hidden" name="primary_color" value={draft.primary_color || "#1f2937"} /><input type="hidden" name="background_type" value={draft.background_type || "color"} />
        <input type="hidden" name="background_color" value={draft.background_color || "#f7f5f0"} /><input type="hidden" name="background_gradient_to" value={draft.background_gradient_to || "#a6c1ee"} />
        <input type="hidden" name="text_color" value={draft.text_color || "#ffffff"} /><input type="hidden" name="text_panel_color" value={draft.text_panel_color || "#000000"} />
        <input type="hidden" name="font_pair" value={draft.font_pair || "modern"} /><input type="hidden" name="button_font" value={draft.button_font || "modern"} />
        <input type="hidden" name="button_style" value={JSON.stringify(draft.buttonZone)} /><input type="hidden" name="title_style" value={JSON.stringify(draft.titleStyle)} />
        <input type="hidden" name="subtitle_style" value={JSON.stringify(draft.subtitleStyle)} /><input type="hidden" name="logo_style" value={JSON.stringify(draft.logoStyle)} />
        <input type="hidden" name="background_style" value={JSON.stringify(draft.bgPosition)} /><input type="hidden" name="buttons" value={JSON.stringify(buttons)} />
        <input id="v2-background-file" hidden type="file" name="background_image" accept="image/png,image/jpeg,image/webp" />
        <input id="v2-logo-file" hidden type="file" name="logo_image" accept="image/png,image/jpeg,image/webp" />
        <input type="hidden" name="remove_logo_image" value={String(logoRemoved)} />
      </form>

      <header className="v2-topbar">
        <button className="v2-back" type="button" onClick={() => dirty ? setLeaveOpen(true) : location.assign("/admin")}>←</button>
        <div><span>Editor de landing</span><strong>{draft.business_name}</strong></div>
        <div className="v2-status"><i className={dirty ? "is-dirty" : ""} />{dirty ? "Cambios sin guardar" : "Todo guardado"}</div>
        <div className="v2-history" data-tick={historyTick}>
          <button type="button" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" disabled={pastRef.current.length === 0} onClick={undo}>↶</button>
          <button type="button" title="Rehacer (Ctrl+Shift+Z)" aria-label="Rehacer" disabled={futureRef.current.length === 0} onClick={redo}>↷</button>
        </div>
        <button className="v2-ghost" type="button" onClick={() => { setPreview(!preview); setPanel(null); }}>{preview ? "Seguir editando" : "Vista previa"}</button>
        <button className="v2-save" form="v2-save" type="submit" name="return_to" value={`/admin/landings/${draft.id}/editor-v2`} disabled={!dirty}>Guardar cambios</button>
      </header>

      <div className={`v2-workspace ${preview ? "is-preview" : ""}`}>
        {!preview && panel && <aside ref={panelRef} className="v2-panel">
          <div className="v2-panel-head"><div><span>Paso simple</span><h2>{panelTitle(panel)}</h2></div><button onClick={() => setPanel(null)}>×</button></div>
          {panel === "templates" && <Templates selected={draft.buttonZone.templateId} onApply={applyPreset} />}
          {panel === "buttons" && <ButtonDesign draft={draft} buttons={buttons} onZone={changeZone} onFont={(button_font) => change({ button_font })} onApplyButtonLook={applyButtonLook} onResetButtonColors={resetButtonColors} />}
          {panel === "background" && <BackgroundControls draft={draft} onChange={change} onFile={onBackgroundFile} />}
          {panel === "profile" && <ProfileControls draft={draft} onChange={change} />}
          {panel === "title" && <TitleControls draft={draft} onChange={change} />}
          {panel === "subtitle" && <SubtitleControls draft={draft} onChange={change} />}
          {panel === "logo" && <LogoControls draft={draft} logoImage={logoImage} onChange={change} onLogo={onLogoFile} onRemoveLogo={() => { setLogoPreview(null); setLogoRemoved(true); setDirty(true); }} />}
          {panel === "add" && <ActionCatalog onAdd={addButton} />}
          {activeButton && <ButtonControls button={activeButton} draft={draft} onChange={(patch) => changeButton(activeButton.id, patch)} onDelete={() => { commitDiscrete(); patchButtons((current) => current.filter((item) => item.id !== activeButton.id)); setPanel(null); }} />}
        </aside>}

        <section className={`v2-stage device-${device}`}>
          <div className="v2-stage-toolbar"><span>{preview ? "Vista limpia" : "Tamaño de pantalla"}</span><div className="v2-device-switcher">{DEVICE_OPTIONS.map((option) => <button key={option.id} type="button" className={device === option.id ? "active" : ""} title={option.size} onClick={() => setDevice(option.id)}>{option.label}</button>)}</div></div>
          <div className={`v2-phone device-${device}`}>
            <div className="v2-phone-screen" ref={buttonsContainerRef}>
              <LandingRenderer landing={rendererLanding} actions={buttons} edit={preview ? undefined : editControls} />
            </div>
          </div>
        </section>
      </div>

      {leaveOpen && <div className="v2-modal-backdrop"><div className="v2-modal"><div className="v2-modal-icon">!</div><h2>Tenés cambios sin guardar</h2><p>Si salís ahora, vas a perder los últimos cambios de diseño.</p><button className="v2-save" form="v2-save" name="return_to" value="/admin">Guardar y salir</button><Link href="/admin" className="v2-danger">Salir sin guardar</Link><button className="v2-ghost" onClick={() => { setLeaveOpen(false); setPreview(false); }}>Seguir editando</button></div></div>}
    </main>
  );
}

function panelTitle(panel: Exclude<Panel, null>) { if (typeof panel === "object") return "Editar botón"; return ({ templates: "Elegí una plantilla", buttons: "Editar todos los botones", background: "Editar fondo", profile: "Contenido del perfil", title: "Editar título", subtitle: "Editar subtítulo", logo: "Editar logo", add: "Agregar un botón" } as const)[panel]; }

function TemplateSwatch({ preset }: { preset: DesignPreset }) {
  const colors = preset.buttonZone.colorMode === "auto"
    ? ["#25d366", "#c13584", "#1877f2"]
    : [preset.oneColor, preset.oneColor, preset.oneColor];
  const examples = [
    { type: "whatsapp", label: "WhatsApp" },
    { type: "instagram", label: "Instagram" },
    { type: "website", label: "Sitio web" },
  ];
  return (
    <span className={`v2-template-shot template-${preset.id}`} style={{ background: preset.background }} aria-hidden="true">
      <span className="template-shot-speaker" />
      <span className="template-shot-content">
        <span
          className="template-shot-logo"
          style={{
            background: preset.accent,
            color: contrastTextColor(preset.accent),
            borderRadius: preset.logo.shape === "round" ? "50%" : 8,
          }}
        >A</span>
        <span className="template-shot-title" style={{ color: preset.foreground, fontFamily: preset.title.font, fontWeight: preset.title.weight }}>Tu negocio</span>
        <span className="template-shot-subtitle" style={{ color: preset.foreground, fontFamily: preset.subtitle.font, fontWeight: preset.subtitle.weight }}>Todo en un solo lugar</span>
        <span className="template-shot-buttons">
          {examples.map((example, index) => {
            const color = colors[index];
            const text = contrastTextColor(color);
            return (
              <span
                className="template-shot-button"
                key={example.type}
                style={{ ...buttonCollectionStyle(preset.buttonZone.collection, color, text, index), borderRadius: Math.max(0, preset.buttonZone.radius * .42) }}
              >
                <span className="template-shot-icon"><ActionTypeIcon type={example.type} /></span>
                <span>{example.label}</span>
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );
}

function Templates({ selected, onApply }: { selected: string; onApply: (id: string) => void }) { return <div><p className="v2-help">Todas mantienen la estructura simple tipo Linktree: logo, título, subtítulo y botones centrados. La miniatura muestra el resultado real de colores, tipografía y botones.</p><div className="v2-template-grid">{DESIGN_PRESETS_V2.map((preset) => <button key={preset.id} type="button" className={selected === preset.id ? "selected" : ""} onClick={() => onApply(preset.id)}><TemplateSwatch preset={preset} /><b>{preset.name}</b><small>{preset.description}</small></button>)}</div></div>; }

function ButtonLookSwatch({ preset, zone }: { preset: DesignPreset; zone: ButtonZoneStyle }) {
  const examples = [
    { type: "whatsapp", label: "WhatsApp" },
    { type: "instagram", label: "Instagram" },
  ];
  const backgrounds = zone.colorMode === "one"
    ? [zone.oneColor, zone.oneColor]
    : [AUTO_COLORS.whatsapp, AUTO_COLORS.instagram];
  return <span className="v2-look-swatch" aria-hidden="true">
    {examples.map((example, index) => {
      const background = backgrounds[index];
      return <span className="v2-look-button" key={example.type} style={{ ...buttonCollectionStyle(preset.buttonZone.collection, background, contrastTextColor(background), index), borderRadius: Math.max(0, preset.buttonZone.radius * .35) }}>
        <span className="v2-look-button-icon"><ActionTypeIcon type={example.type} /></span>
        <span>{example.label}</span>
      </span>;
    })}
  </span>;
}

function ButtonDesign({ draft, buttons, onZone, onFont, onApplyButtonLook, onResetButtonColors }: { draft: LandingDraft; buttons: ButtonItem[]; onZone: (p: Partial<ButtonZoneStyle>) => void; onFont: (font: string) => void; onApplyButtonLook: (id: string) => void; onResetButtonColors: () => void }) {
  const zone = draft.buttonZone;
  const customCount = buttons.filter((button) => !button.use_auto_color).length;
  const inheritedCount = buttons.length - customCount;
  return (
    <div className="v2-fields">
      <fieldset>
        <legend>Plantilla de los botones</legend>
        <p className="v2-help">Son las mismas plantillas del diseño general. Acá solo cambia la apariencia de todos los botones.</p>
        <div className="v2-look-grid">
          {DESIGN_PRESETS_V2.map((preset) => {
            return <button type="button" key={preset.id} className={zone.preset === preset.id ? "active" : ""} onClick={() => onApplyButtonLook(preset.id)} aria-pressed={zone.preset === preset.id}>
              <ButtonLookSwatch preset={preset} zone={zone} />
              <b>{preset.name}</b>
            </button>;
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Regla de color</legend>
        {buttons.length > 0 && (
          <div className={`v2-scope-summary ${customCount > 0 ? "has-custom" : ""} ${inheritedCount === 0 ? "none-inherited" : ""}`} role={customCount > 0 ? "status" : undefined}>
            <b>{inheritedCount === 0 ? "El cambio no afectará ningún botón" : customCount > 0 ? `El cambio se aplicará a ${inheritedCount} de ${buttons.length}` : `El cambio se aplicará a los ${buttons.length} botones`}</b>
            <span>{customCount === 0 ? "Todos usan el color del diseño general." : `${customCount} ${customCount === 1 ? "botón mantiene su color propio" : "botones mantienen su color propio"}.`}</span>
            {customCount > 0 && <button type="button" className="v2-restore-all" onClick={onResetButtonColors}>↩ Restaurar todos al diseño general</button>}
          </div>
        )}
        <Choice active={draft.buttonZone.colorMode === "one"} swatch={draft.buttonZone.oneColor} title="Un color para todos" note="Los botones que usan el diseño general tendrán este color." onClick={() => onZone({ colorMode: "one" })} />
        {draft.buttonZone.colorMode === "one" && <ColorField label="Color de los botones" value={draft.buttonZone.oneColor} onChange={(oneColor) => onZone({ oneColor })} />}
        <Choice active={draft.buttonZone.colorMode === "auto"} title="Cada red con su color" note="WhatsApp verde, Instagram rosa y cada marca con su color oficial." onClick={() => onZone({ colorMode: "auto" })} />
      </fieldset>
      <fieldset><legend>Tamaño</legend><div className="v2-segment">{SIZES.map((item) => <button type="button" className={draft.buttonZone.height === item.patch.height ? "active" : ""} key={item.label} onClick={() => onZone(item.patch)}>{item.label}</button>)}</div></fieldset>
      <details className="v2-advanced">
        <summary>Más opciones</summary>
        <div className="v2-fields" style={{ marginTop: 10 }}>
          <label>Tipografía<select value={draft.button_font || "modern"} onChange={(event) => onFont(event.target.value)}>{Object.entries(FONT_LABEL).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <fieldset><legend>Alineación</legend><div className="v2-segment"><button type="button" className={zone.contentAlign === "center" ? "active" : ""} onClick={() => onZone({ contentAlign: "center" })}>Centrada</button><button type="button" className={zone.contentAlign === "left" ? "active" : ""} onClick={() => onZone({ contentAlign: "left" })}>Izquierda</button></div></fieldset>
          <Range label="Alto del botón" min={40} max={72} value={zone.height} onChange={(height) => onZone({ height })} />
          <Range label="Espaciado entre botones" min={4} max={20} value={zone.gap} onChange={(gap) => onZone({ gap })} />
          <Range label="Tamaño del ícono" min={22} max={38} value={zone.iconSize} onChange={(iconSize) => onZone({ iconSize })} />
          <Range label="Tamaño del texto" min={12} max={18} value={zone.textSize} onChange={(textSize) => onZone({ textSize })} />
        </div>
      </details>
    </div>
  );
}

function BackgroundControls({ draft, onChange, onFile }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void; onFile: (f?: File) => void }) { const updatePos=(p:Partial<BackgroundPosition>)=>onChange({bgPosition:{...draft.bgPosition,...p}}); return <div className="v2-fields"><div className="v2-segment"><button className={draft.background_type === "color" ? "active" : ""} onClick={() => onChange({background_type:"color"})}>Color</button><button className={draft.background_type === "gradient" ? "active" : ""} onClick={() => onChange({background_type:"gradient"})}>Degradado</button><button className={draft.background_type === "image" ? "active" : ""} onClick={() => onChange({background_type:"image"})}>Imagen</button></div>{draft.background_type !== "image" && <><ColorField label="Color principal" value={draft.background_color || "#f7f5f0"} onChange={(background_color)=>onChange({background_color})}/>{draft.background_type === "gradient" && <ColorField label="Segundo color" value={draft.background_gradient_to || "#a6c1ee"} onChange={(background_gradient_to)=>onChange({background_gradient_to})}/>}</>}{draft.background_type === "image" && <><label className="v2-upload">Cambiar imagen<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>onFile(event.target.files?.[0])}/></label><p className="v2-help">Ajustala mirando el celular: nunca se guarda el recorte original.</p><Range label="Oscurecer imagen" min={0} max={.65} step={.01} value={draft.bgPosition.tint} onChange={(tint)=>updatePos({tint})}/><Range label="Acercar" min={1} max={2.2} step={.01} value={draft.bgPosition.zoom} onChange={(zoom)=>updatePos({zoom})}/><Range label="Mover horizontal" min={0} max={100} value={draft.bgPosition.x} onChange={(x)=>updatePos({x})}/><Range label="Mover vertical" min={0} max={100} value={draft.bgPosition.y} onChange={(y)=>updatePos({y})}/></>}</div>; }

function ProfileControls({ draft, onChange }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void }) { return <div className="v2-fields"><p className="v2-help">También podés tocar directamente cada elemento en el celular.</p><label>Nombre del negocio<input value={draft.business_name} onChange={(e)=>onChange({business_name:e.target.value})}/></label><label>Descripción<textarea rows={3} value={draft.description || ""} onChange={(e)=>onChange({description:e.target.value})}/></label></div>; }

// Falls back to the "Minimalismo" template (designed to suit "casi cualquier rubro") when
// no general template is active yet, so "Usar estilos recomendados" always has something sane
// to offer, even on a landing built entirely by hand.
function suggestedPreset(templateId: string): DesignPreset {
  return DESIGN_PRESETS_V2.find((item) => item.id === templateId) || DESIGN_PRESETS_V2[0];
}

function TitleControls({ draft, onChange }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void }) { const style=draft.titleStyle; const update=(patch:Partial<TitleStyle>)=>onChange({titleStyle:{...style,...patch}}); const preset=suggestedPreset(draft.buttonZone.templateId); return <div className="v2-fields"><label>Texto del título<input value={draft.business_name} onChange={(e)=>onChange({business_name:e.target.value})}/></label><button type="button" className="v2-suggested" onClick={()=>update({...preset.title,color:preset.foreground})}>✦ Usar estilos recomendados ({preset.name})</button><label>Tipografía<select value={style.font} onChange={(e)=>update({font:e.target.value})}>{TEXT_FONT_OPTIONS.map((font)=><option key={font.value} value={font.value}>{font.label}</option>)}</select></label><Range label="Tamaño" min={20} max={48} value={style.size} onChange={(size)=>update({size})}/><fieldset><legend>Grosor</legend><div className="v2-segment">{[500,700,900].map((weight)=><button key={weight} className={style.weight===weight?"active":""} onClick={()=>update({weight})}>{weight===500?"Normal":weight===700?"Fuerte":"Extra"}</button>)}</div></fieldset><ColorField label="Color del texto" value={style.color} onChange={(color)=>update({color})}/><Choice active={style.bgMode==="solid"} title="Fondo detrás del título" note="Ayuda a leerlo sobre fotografías." onClick={()=>update({bgMode:style.bgMode==="solid"?"none":"solid"})}/>{style.bgMode==="solid"&&<ColorField label="Color del fondo" value={style.bg} onChange={(bg)=>update({bg})}/>}</div>; }

function SubtitleControls({ draft, onChange }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void }) { const style=draft.subtitleStyle; const update=(patch:Partial<SubtitleStyle>)=>onChange({subtitleStyle:{...style,...patch}}); const preset=suggestedPreset(draft.buttonZone.templateId); return <div className="v2-fields"><label>Texto del subtítulo<textarea rows={3} value={draft.description || ""} onChange={(e)=>onChange({description:e.target.value})}/></label><button type="button" className="v2-suggested" onClick={()=>update({...preset.subtitle,color:preset.foreground})}>✦ Usar estilos recomendados ({preset.name})</button><label>Tipografía<select value={style.font} onChange={(e)=>update({font:e.target.value})}>{TEXT_FONT_OPTIONS.map((font)=><option key={font.value} value={font.value}>{font.label}</option>)}</select></label><Range label="Tamaño" min={11} max={26} value={style.size} onChange={(size)=>update({size})}/><fieldset><legend>Grosor</legend><div className="v2-segment">{[400,600,800].map((weight)=><button key={weight} className={style.weight===weight?"active":""} onClick={()=>update({weight})}>{weight===400?"Normal":weight===600?"Medio":"Fuerte"}</button>)}</div></fieldset><ColorField label="Color del texto" value={style.color} onChange={(color)=>update({color})}/><Choice active={style.bgMode==="solid"} title="Fondo detrás del texto" note="Mejora la lectura cuando hay una imagen." onClick={()=>update({bgMode:style.bgMode==="solid"?"none":"solid"})}/>{style.bgMode==="solid"&&<ColorField label="Color del fondo" value={style.bg} onChange={(bg)=>update({bg})}/>}</div>; }

function LogoControls({ draft, logoImage, onChange, onLogo, onRemoveLogo }: { draft: LandingDraft; logoImage: string; onChange: (p: Partial<LandingDraft>) => void; onLogo: (file?: File) => void; onRemoveLogo: () => void }) {
  const preset = suggestedPreset(draft.buttonZone.templateId);
  const style = draft.logoStyle;
  const primary = draft.primary_color || "#1f2937";
  const update = (patch: Partial<LogoStyle>) => onChange({ logoStyle: { ...style, ...patch } });
  return <div className="v2-fields">
    <div className="v2-logo-editor"><div style={{ ...logoFrameStyle(style, primary), borderRadius: logoBorderRadius(style.shape, 76), fontSize: logoLetterSize(76, style.initials) }}>{logoImage ? <span style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${style.zoom * 100}%`, backgroundPosition: `${style.x}% ${style.y}%` }} /> : logoInitials(draft.business_name, style.initials)}</div><span><label className="v2-upload">{logoImage ? "Cambiar imagen" : "Elegir imagen"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onLogo(event.target.files?.[0])} /></label>{logoImage && <button type="button" className="v2-delete" onClick={onRemoveLogo}>Quitar</button>}</span></div>
    <button type="button" className="v2-suggested v2-logo-recommended-button" onClick={() => onChange({ logoStyle: { ...style, ...logoTreatmentPatch("template", draft.buttonZone.templateId), ...preset.logo, zoom: 1, x: 50, y: 50 } })}>✦ Usar estilos recomendados ({preset.name})</button>
    <fieldset>
      <legend>Forma del logo</legend>
      <div className="v2-logo-shape-grid">
        {LOGO_SHAPE_OPTIONS.map((option) => (
          <button type="button" key={option.id} className={style.shape === option.id ? "active" : ""} aria-pressed={style.shape === option.id} onClick={() => update({ shape: option.id, treatment: "custom" })}>
            <span className="v2-logo-shape-preview" style={{ ...logoFrameStyle({ ...style, shape: option.id }, primary), borderRadius: logoBorderRadius(option.id, 48), fontSize: logoLetterSize(48, style.initials) }}>
              {logoImage ? <i style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${style.zoom * 100}%`, backgroundPosition: `${style.x}% ${style.y}%` }} /> : logoInitials(draft.business_name, style.initials)}
            </span>
            <b>{option.label}</b>
          </button>
        ))}
      </div>
    </fieldset>
    {!logoImage && (
      <fieldset>
        <legend>Iniciales</legend>
        <p className="v2-help" style={{ margin: "0 0 4px" }}>Mientras no subas una imagen, se muestra esto en el círculo.</p>
        <div className="v2-segment">
          <button type="button" className={style.initials === "one" ? "active" : ""} onClick={() => update({ initials: "one" })}>{logoInitials(draft.business_name, "one")}</button>
          <button type="button" className={style.initials === "two" ? "active" : ""} onClick={() => update({ initials: "two" })}>{logoInitials(draft.business_name, "two")}</button>
        </div>
      </fieldset>
    )}
    <Range label="Tamaño" min={72} max={190} value={style.size} onChange={(size) => update({ size })} />
    <div className="v2-inline-row">
      <Range label="Borde" min={0} max={10} value={style.borderWidth} onChange={(borderWidth) => update({ borderWidth, treatment: "custom" })} />
      {style.borderWidth > 0 && <label className="v2-mini-color" title="Color de borde"><span>Color</span><input type="color" value={style.borderColor} onChange={(event) => update({ borderColor: event.target.value, treatment: "custom" })} /></label>}
    </div>
    <fieldset>
      <legend>Color de fondo</legend>
      <p className="v2-help" style={{ margin: "0 0 4px" }}>Se ve detrás del círculo del logo (si no subiste foto, es el color de fondo de la inicial).</p>
      <Choice active={style.backgroundMode === "auto"} swatch={primary} title="Automático" note="El color sugerido por tu plantilla." onClick={() => update({ backgroundMode: "auto" })} />
      <Choice active={style.backgroundMode === "custom"} swatch={style.fallback} title="Personalizado" note="Elegí cualquier color para el fondo del logo." onClick={() => update({ backgroundMode: "custom" })} />
      {style.backgroundMode === "custom" && <ColorField label="Color de fondo" value={style.fallback} onChange={(fallback) => update({ fallback })} />}
    </fieldset>
    {logoImage && <>
      <Range label="Zoom" min={1} max={2.5} step={.01} value={style.zoom} onChange={(zoom) => update({ zoom })} />
      {style.zoom > 1
        ? <><Range label="Horizontal" min={0} max={100} value={style.x} onChange={(x) => update({ x })} /><Range label="Vertical" min={0} max={100} value={style.y} onChange={(y) => update({ y })} /></>
        : <p className="v2-help" style={{ margin: 0 }}>Subí el zoom para poder mover la imagen dentro del marco.</p>}
    </>}
  </div>;
}

function ActionCatalog({ onAdd }: { onAdd: (type: string) => void }) { return <div><p className="v2-help">Elegí la acción. Ya viene con su nombre, icono y color oficial.</p><div className="v2-action-grid">{getAllActions().map((action)=><button type="button" key={action.type} onClick={()=>onAdd(action.type)}><ActionTypeIcon type={action.type}/><span><b>{action.label}</b><small>{action.input === "phone" ? "Número de teléfono" : action.input === "username" ? "Nombre de usuario" : "Enlace"}</small></span><em>＋</em></button>)}</div></div>; }

function ButtonControls({ button,draft,onChange,onDelete }: { button: ButtonItem; draft: LandingDraft; onChange:(p:Partial<ButtonItem>)=>void; onDelete:()=>void }) {
  const def=getAllActions().find((item)=>item.type===button.type);
  const brandColor = AUTO_COLORS[button.type] || draft.primary_color || "#1f2937";
  const globalColor = resolveButtonColors({ zone: draft.buttonZone, type: button.type, position: 0, primary: draft.primary_color || "#1f2937", customColor: null, useAutoColor: true }).background;
  const globalDescription = draft.buttonZone.colorMode === "one"
    ? `Usa el color general ${globalColor.toUpperCase()}.`
    : `Usa el color oficial de ${def?.label || "esta acción"}.`;
  const ownColor = button.background_color || brandColor;
  return <div className="v2-fields">
    <div className="v2-brand"><ActionTypeIcon type={button.type}/><span><b>{def?.label || "Enlace"}</b><small>Icono incluido automáticamente</small></span></div>
    <label>Texto del botón<input value={button.title} onChange={(e)=>onChange({title:e.target.value})}/></label>
    <label>Texto secundario <small>Opcional</small><input value={button.subtitle} onChange={(e)=>onChange({subtitle:e.target.value})}/></label>
    <label>{def?.input === "phone" ? "Número" : def?.input === "email" ? "Email" : def?.input === "username" ? "Usuario" : "Enlace"}<input value={button.url} placeholder={def?.placeholder} onChange={(e)=>onChange({url:e.target.value})}/></label>
    {def?.message && <label>Mensaje de WhatsApp<textarea rows={3} value={button.message} onChange={(e)=>onChange({message:e.target.value})}/></label>}
    <fieldset>
      <legend>Apariencia de este botón</legend>
      <Choice active={button.use_auto_color} swatch={globalColor} title="Usar el diseño general" note={globalDescription} onClick={()=>onChange({use_auto_color:true})}/>
      <Choice active={!button.use_auto_color} swatch={ownColor} title="Usar un color propio" note="Solo este botón queda separado de la regla general." onClick={()=>onChange({use_auto_color:false,background_color:ownColor})}/>
      {!button.use_auto_color && <div className="v2-own-color">
        <ColorField label="Color propio" value={ownColor} onChange={(background_color)=>onChange({background_color})}/>
        {ownColor.toLowerCase() !== brandColor.toLowerCase() && <button type="button" className="v2-inline-action" onClick={()=>onChange({background_color:brandColor})}><i style={{background:brandColor}} /> Usar color oficial de {def?.label || "la marca"}</button>}
        <button type="button" className="v2-reset-action" onClick={()=>onChange({use_auto_color:true})}>↩ Volver al diseño general</button>
      </div>}
    </fieldset>
    <button type="button" className="v2-delete" onClick={onDelete}>Eliminar botón</button>
  </div>;
}

function Choice({active,title,note,onClick,swatch}:{active:boolean;title:string;note:string;onClick:()=>void;swatch?:string}) { return <button type="button" className={`v2-choice ${active?"active":""}`} onClick={onClick}><i>{active?"✓":""}</i>{swatch && <em className="v2-choice-swatch" style={{background:swatch}} />}<span><b>{title}</b><small>{note}</small></span></button>; }
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="v2-color"><span>{label}</span><input type="color" value={value} onChange={(e)=>onChange(e.target.value)}/><code>{value.toUpperCase()}</code></label>; }
function Range({label,min,max,step=1,value,onChange}:{label:string;min:number;max:number;step?:number;value:number;onChange:(v:number)=>void}) { const scaledPercent=max<=3; const percent=scaledPercent||label==="Horizontal"||label==="Vertical"; const pixels=!percent&&(label==="Tamaño"||label==="Borde"||label.includes("Alto")||label.includes("Espaciado")||label.includes("ícono")||label.includes("texto")); return <label className="v2-range"><span>{label}<b>{Math.round(value*(scaledPercent?100:1))}{percent?"%":pixels?" px":""}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(Number(e.target.value))}/></label>; }
