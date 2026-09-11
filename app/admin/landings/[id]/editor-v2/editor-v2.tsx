"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ActionTypeIcon } from "@/components/action-icons";
import { IconEdit } from "@/components/icons";
import { compressImage } from "@/lib/compress-image";
import { AUTO_COLORS, buttonFillStyle, buttonZoneShadow, contrastTextColor, getAllActions, getFontFamily, hexToRgba, resolveBackgroundTint, TEXT_FONT_OPTIONS, type BackgroundPosition, type ButtonZoneStyle, type LogoStyle, type SubtitleStyle, type TitleStyle } from "@/lib/landing-catalog";
import { DESIGN_PRESETS_V2, buttonCollectionStyle, buttonCollectionWidth, resolveButtonColors, type DesignPreset } from "@/lib/design-presets";

type ButtonItem = { id: string; type: string; title: string; subtitle: string; url: string; message: string; icon: string; background_color: string; text_color: string; use_auto_color: boolean; position: number };
type LandingDraft = {
  id: string; slug: string; business_name: string; description?: string | null; logo_url?: string | null; primary_color?: string | null;
  background_color?: string | null; background_type?: string | null; background_gradient_to?: string | null; background_image_url?: string | null;
  text_color?: string | null; text_panel?: boolean | null; text_panel_color?: string | null; font_pair?: string | null; button_font?: string | null;
  published?: boolean | null; buttonZone: ButtonZoneStyle; titleStyle: TitleStyle; subtitleStyle: SubtitleStyle; logoStyle: LogoStyle; bgPosition: BackgroundPosition;
};
type Panel = "templates" | "buttons" | "background" | "profile" | "title" | "subtitle" | "logo" | "add" | { buttonId: string } | null;
type SaveAction = (formData: FormData) => void | Promise<void>;

const FONT_LABEL: Record<string, string> = { modern: "Actual", minimal: "Limpia", friendly: "Cercana", classic: "Elegante" };
const SIZES = [
  { label: "Compactos", patch: { height: 44, textSize: 13, iconSize: 25, gap: 6 } },
  { label: "Normales", patch: { height: 52, textSize: 14, iconSize: 29, gap: 9 } },
  { label: "Grandes", patch: { height: 60, textSize: 16, iconSize: 32, gap: 12 } },
];

export default function EditorV2({ landing, initialButtons, saveAction }: { landing: LandingDraft; initialButtons: ButtonItem[]; saveAction: SaveAction }) {
  const [draft, setDraft] = useState(landing);
  const [buttons, setButtons] = useState(initialButtons);
  const [panel, setPanel] = useState<Panel>("templates");
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const activeButton = typeof panel === "object" && panel ? buttons.find((button) => button.id === panel.buttonId) : null;
  const actionDefs = useMemo(() => getAllActions(), []);
  const draggedButton = useRef<string | null>(null);
  const lastDragTargetIndex = useRef<number | null>(null);
  const buttonElements = useRef(new Map<string, HTMLButtonElement>());
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const grabOffsetRef = useRef(0);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

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
  const changeZone = (patch: Partial<ButtonZoneStyle>) => change({ buttonZone: { ...draft.buttonZone, ...patch, preset: patch.preset || "custom" } });
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
      titleStyle: { ...draft.titleStyle, ...preset.title, color: preset.foreground }, subtitleStyle: { ...draft.subtitleStyle, ...preset.subtitle, color: preset.foreground }, logoStyle: { ...draft.logoStyle, ...preset.logo },
    });
  }

  // Applying a button-only template (from the Botones panel) touches just the button
  // look + font — background, title and logo stay whatever they already were, and
  // templateId (which general template the rest of the design matches) is untouched.
  function applyButtonPreset(id: string) {
    const preset = DESIGN_PRESETS_V2.find((item) => item.id === id);
    if (!preset) return;
    commitDiscrete();
    patchDraft({
      button_font: preset.buttonFont,
      buttonZone: { ...draft.buttonZone, ...preset.buttonZone, layout: "center", oneColor: preset.oneColor },
    });
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
  const bgStyle: CSSProperties = draft.background_type === "image" && backgroundImage
    ? { backgroundColor: draft.background_color || "#f5f5f5", backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: `${draft.bgPosition.x}% ${draft.bgPosition.y}%`, transform: `scale(${draft.bgPosition.zoom})`, transformOrigin: `${draft.bgPosition.x}% ${draft.bgPosition.y}%` }
    : draft.background_type === "gradient" ? { background: `linear-gradient(145deg,${draft.background_color},${draft.background_gradient_to})` } : { background: draft.background_color || "#f5f5f5" };

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
        {!preview && panel && <aside className="v2-panel">
          <div className="v2-panel-head"><div><span>Paso simple</span><h2>{panelTitle(panel)}</h2></div><button onClick={() => setPanel(null)}>×</button></div>
          {panel === "templates" && <Templates selected={draft.buttonZone.templateId} onApply={applyPreset} />}
          {panel === "buttons" && <ButtonDesign draft={draft} onZone={changeZone} onFont={(button_font) => change({ button_font })} onApplyButtonPreset={applyButtonPreset} />}
          {panel === "background" && <BackgroundControls draft={draft} onChange={change} onFile={onBackgroundFile} />}
          {panel === "profile" && <ProfileControls draft={draft} onChange={change} />}
          {panel === "title" && <TitleControls draft={draft} onChange={change} />}
          {panel === "subtitle" && <SubtitleControls draft={draft} onChange={change} />}
          {panel === "logo" && <LogoControls draft={draft} logoImage={logoImage} onChange={change} onLogo={onLogoFile} onRemoveLogo={() => { setLogoPreview(null); setLogoRemoved(true); setDirty(true); }} />}
          {panel === "add" && <ActionCatalog onAdd={addButton} />}
          {activeButton && <ButtonControls button={activeButton} draft={draft} onChange={(patch) => changeButton(activeButton.id, patch)} onDelete={() => { commitDiscrete(); patchButtons((current) => current.filter((item) => item.id !== activeButton.id)); setPanel(null); }} />}
        </aside>}

        <section className="v2-stage">
          {preview && <div className="v2-preview-note">Así la verá tu cliente</div>}
          <div className="v2-phone">
            <div className="v2-phone-screen">
              <div className="v2-bg" style={bgStyle} />
              <div className="v2-tint" style={{ background: `rgba(5,8,11,${resolveBackgroundTint(draft.background_type, draft.bgPosition.tint)})` }} />
              {!preview && <div className="v2-phone-tools"><button type="button" className={panel === "templates" ? "active" : ""} onClick={() => setPanel("templates")}>✦ Plantillas</button><button type="button" className={panel === "background" ? "active" : ""} onClick={() => setPanel("background")}>▧ Fondo</button></div>}
              {!preview && <button type="button" className={`v2-background-hit ${panel === "background" ? "is-selected" : ""}`} onClick={() => setPanel("background")} aria-label="Editar fondo"><span>Editar fondo</span></button>}
              <div className={`v2-content layout-${draft.buttonZone.layout}`}>
                <div className="v2-identity-block">
                <button className={`v2-edit-element v2-logo-hit ${panel === "logo" ? "is-selected" : ""}`} type="button" onClick={() => !preview && setPanel("logo")} aria-label="Editar logo">
                  <div className="v2-avatar" style={{ width: draft.logoStyle.size, height: draft.logoStyle.size, borderRadius: draft.logoStyle.shape === "round" ? "50%" : 24, background: draft.logoStyle.fallback }}>
                    {logoImage ? <span style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${draft.logoStyle.zoom * 100}%`, backgroundPosition: `${draft.logoStyle.x}% ${draft.logoStyle.y}%` }} /> : draft.business_name.slice(0, 1)}
                  </div>
                  {!preview && <span className="v2-element-tag">Logo</span>}
                </button>
                <button className={`v2-edit-element v2-title-hit ${panel === "title" ? "is-selected" : ""}`} type="button" onClick={() => !preview && setPanel("title")}>
                  <h1 style={{ fontFamily: draft.titleStyle.font, fontWeight: draft.titleStyle.weight, fontSize: draft.titleStyle.size, color: draft.titleStyle.color, textAlign: draft.titleStyle.align, background: draft.titleStyle.bgMode === "solid" ? hexToRgba(draft.titleStyle.bg,.55) : "transparent" }}>{draft.business_name}</h1>
                  {!preview && <span className="v2-element-tag">Título</span>}
                </button>
                <button className={`v2-edit-element v2-subtitle-hit ${panel === "subtitle" ? "is-selected" : ""}`} type="button" onClick={() => !preview && setPanel("subtitle")}>
                  <p style={{ fontFamily: draft.subtitleStyle.font, fontWeight: draft.subtitleStyle.weight, fontSize: draft.subtitleStyle.size, color: draft.subtitleStyle.color, background: draft.subtitleStyle.bgMode === "solid" ? hexToRgba(draft.subtitleStyle.bg,.55) : "transparent" }}>{draft.description || (!preview ? "Tocá para agregar una descripción" : "")}</p>
                  {!preview && <span className="v2-element-tag">Subtítulo</span>}
                </button>
                </div>
                <div ref={buttonsContainerRef} className={`v2-links ${panel === "buttons" ? "is-selected" : ""}`} style={{ display: "flex", flexDirection: "column", gap: draft.buttonZone.gap }}>
                  {!preview && <button type="button" className="v2-zone-tag" onClick={() => setPanel("buttons")}>✦ Diseño de la botonera</button>}
                  {buttons.map((button, index) => { const colors = resolveButtonColors({ zone: draft.buttonZone, type: button.type, position: index, primary: draft.primary_color || "#1f2937", customColor: button.background_color, useAutoColor: button.use_auto_color }); return (
                    <button ref={(element) => { if (element) buttonElements.current.set(button.id, element); else buttonElements.current.delete(button.id); }} key={button.id} data-button-id={button.id} type="button" className={`v2-link button-collection-${draft.buttonZone.collection} ${panel && typeof panel === "object" && panel.buttonId === button.id ? "is-selected" : ""} ${draggingId === button.id ? "is-dragging" : ""}`} onClick={() => !preview && setPanel({ buttonId: button.id })} style={{ ...buttonFillStyle(draft.buttonZone.finish, colors.background, colors.text), ...buttonCollectionStyle(draft.buttonZone.collection, colors.background, colors.text, index), width: buttonCollectionWidth(draft.buttonZone, index), minHeight: draft.buttonZone.height, margin: "0 auto", borderRadius: draft.buttonZone.radius, boxShadow: buttonCollectionStyle(draft.buttonZone.collection, colors.background, colors.text, index).boxShadow || buttonZoneShadow(draft.buttonZone.shadow), fontFamily: getFontFamily(draft.button_font || "modern"), fontSize: draft.buttonZone.textSize }}>
                      <span className="v2-btn-icon" style={{ width: draft.buttonZone.iconSize, height: draft.buttonZone.iconSize, fontSize: draft.buttonZone.iconSize * 0.52 }}><ActionTypeIcon type={button.type} icon={button.icon} /></span>
                      <span className="v2-btn-label"><b>{button.title}</b>{button.subtitle && <small>{button.subtitle}</small>}</span>
                      {!preview && <span className="v2-pencil" title="Editar botón"><IconEdit /></span>}
                      {!preview && <span className="v2-drag" title="Arrastrar para cambiar el orden" aria-label="Mover botón" onClick={(event)=>event.stopPropagation()} onPointerDown={(event)=>{ event.preventDefault(); startDrag(event.clientY, button.id); }}>⠿</span>}
                    </button> ); })}
                  {!preview && <button className="v2-add-link" type="button" onClick={() => setPanel("add")}>＋ Agregar botón</button>}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {leaveOpen && <div className="v2-modal-backdrop"><div className="v2-modal"><div className="v2-modal-icon">!</div><h2>Tenés cambios sin guardar</h2><p>Si salís ahora, vas a perder los últimos cambios de diseño.</p><button className="v2-save" form="v2-save" name="return_to" value="/admin">Guardar y salir</button><Link href="/admin" className="v2-danger">Salir sin guardar</Link><button className="v2-ghost" onClick={() => { setLeaveOpen(false); setPreview(false); }}>Seguir editando</button></div></div>}
    </main>
  );
}

function panelTitle(panel: Exclude<Panel, null>) { if (typeof panel === "object") return "Editar botón"; return ({ templates: "Elegí una plantilla", buttons: "Diseño de la botonera", background: "Editar fondo", profile: "Contenido del perfil", title: "Editar título", subtitle: "Editar subtítulo", logo: "Editar logo", add: "Agregar un botón" } as const)[panel]; }

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

// Button-only template picker: literally the same catalog as the general "Plantillas" tab,
// applying just the button slice (see applyButtonPreset). Keeping one single catalog of
// looks — instead of a separate raw list of button "collections" — is what stops mismatched,
// ugly combinations from happening in the first place.
function ButtonDesign({ draft, onZone, onFont, onApplyButtonPreset }: { draft: LandingDraft; onZone: (p: Partial<ButtonZoneStyle>) => void; onFont: (font: string) => void; onApplyButtonPreset: (id: string) => void }) {
  const zone = draft.buttonZone;
  const matchesTemplate = zone.templateId !== "custom" && zone.preset === zone.templateId;
  const [pickingTemplate, setPickingTemplate] = useState(!matchesTemplate);
  const activeTemplate = DESIGN_PRESETS_V2.find((item) => item.id === zone.preset);
  return (
    <div className="v2-fields">
      <fieldset>
        <legend>Estilo de los botones</legend>
        <Choice
          active={!pickingTemplate && matchesTemplate}
          title="Usar el estilo de la plantilla actual"
          note={zone.templateId !== "custom" ? `Coordinado con tu plantilla (${DESIGN_PRESETS_V2.find((item) => item.id === zone.templateId)?.name ?? zone.templateId}).` : "Elegí primero una plantilla general en el panel de Plantillas."}
          onClick={() => { setPickingTemplate(false); if (zone.templateId !== "custom") onApplyButtonPreset(zone.templateId); }}
        />
        <Choice
          active={pickingTemplate || (!matchesTemplate && zone.templateId !== "custom")}
          title="Elegir otra plantilla solo para los botones"
          note={activeTemplate && (pickingTemplate || !matchesTemplate) ? `Usando "${activeTemplate.name}" en los botones.` : "Mezclá el estilo de otra plantilla sin cambiar el resto del diseño."}
          onClick={() => setPickingTemplate(true)}
        />
        {pickingTemplate && (
          <div className="v2-template-grid v2-template-grid-compact">
            {DESIGN_PRESETS_V2.map((preset) => (
              <button key={preset.id} type="button" className={zone.preset === preset.id ? "selected" : ""} onClick={() => { onApplyButtonPreset(preset.id); setPickingTemplate(false); }}>
                <TemplateSwatch preset={preset} />
                <b>{preset.name}</b>
              </button>
            ))}
          </div>
        )}
      </fieldset>
      <fieldset>
        <legend>Colores</legend>
        <Choice active={draft.buttonZone.colorMode === "auto"} title="Colores originales" note="WhatsApp verde, Instagram rosa y cada marca con su color." onClick={() => onZone({ colorMode: "auto" })} />
        <Choice active={draft.buttonZone.colorMode === "one"} title="Un color para todos" note="Un look uniforme con el color de tu marca." onClick={() => onZone({ colorMode: "one" })} />
        {draft.buttonZone.colorMode === "one" && <ColorField label="Color de los botones" value={draft.buttonZone.oneColor} onChange={(oneColor) => onZone({ oneColor })} />}
      </fieldset><fieldset><legend>Tamaño</legend><div className="v2-segment">{SIZES.map((item) => <button type="button" className={draft.buttonZone.height === item.patch.height ? "active" : ""} key={item.label} onClick={() => onZone(item.patch)}>{item.label}</button>)}</div></fieldset><label>Tipografía<select value={draft.button_font || "modern"} onChange={(event) => onFont(event.target.value)}>{Object.entries(FONT_LABEL).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <details className="v2-advanced">
        <summary>Opciones avanzadas</summary>
        <div className="v2-fields" style={{ marginTop: 10 }}>
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

function LogoControls({ draft, logoImage, onChange, onLogo, onRemoveLogo }: { draft: LandingDraft; logoImage: string; onChange: (p: Partial<LandingDraft>) => void; onLogo: (file?: File) => void; onRemoveLogo: () => void }) { const preset=suggestedPreset(draft.buttonZone.templateId); return <div className="v2-fields"><p className="v2-help">La plantilla recomienda una forma y tamaño, pero podés cambiar todo.</p><div className="v2-logo-editor"><div style={{borderRadius:draft.logoStyle.shape === "round" ? "50%" : 18,background:draft.logoStyle.fallback}}>{logoImage ? <span style={{backgroundImage:`url(${logoImage})`,backgroundSize:`${draft.logoStyle.zoom*100}%`,backgroundPosition:`${draft.logoStyle.x}% ${draft.logoStyle.y}%`}}/> : draft.business_name.slice(0,1)}</div><span><label className="v2-upload">Elegir imagen<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>onLogo(event.target.files?.[0])}/></label>{logoImage && <button type="button" className="v2-delete" onClick={onRemoveLogo}>Quitar</button>}</span></div><button type="button" className="v2-suggested" onClick={()=>onChange({logoStyle:{...draft.logoStyle,...preset.logo}})}>✦ Usar estilos recomendados ({preset.name})</button><div className="v2-segment"><button className={draft.logoStyle.shape === "round" ? "active" : ""} onClick={()=>onChange({logoStyle:{...draft.logoStyle,shape:"round"}})}>Redondo</button><button className={draft.logoStyle.shape === "square" ? "active" : ""} onClick={()=>onChange({logoStyle:{...draft.logoStyle,shape:"square"}})}>Cuadrado</button></div><Range label="Tamaño" min={72} max={190} value={draft.logoStyle.size} onChange={(size)=>onChange({logoStyle:{...draft.logoStyle,size}})}/><ColorField label="Color si no hay imagen" value={draft.logoStyle.fallback} onChange={(fallback)=>onChange({logoStyle:{...draft.logoStyle,fallback}})}/>{logoImage && <><Range label="Acercar imagen" min={1} max={2.5} step={.01} value={draft.logoStyle.zoom} onChange={(zoom)=>onChange({logoStyle:{...draft.logoStyle,zoom}})}/><Range label="Mover horizontal" min={0} max={100} value={draft.logoStyle.x} onChange={(x)=>onChange({logoStyle:{...draft.logoStyle,x}})}/><Range label="Mover vertical" min={0} max={100} value={draft.logoStyle.y} onChange={(y)=>onChange({logoStyle:{...draft.logoStyle,y}})}/></>}</div>; }

function ActionCatalog({ onAdd }: { onAdd: (type: string) => void }) { return <div><p className="v2-help">Elegí la acción. Ya viene con su nombre, icono y color oficial.</p><div className="v2-action-grid">{getAllActions().map((action)=><button type="button" key={action.type} onClick={()=>onAdd(action.type)}><ActionTypeIcon type={action.type}/><span><b>{action.label}</b><small>{action.input === "phone" ? "Número de teléfono" : action.input === "username" ? "Nombre de usuario" : "Enlace"}</small></span><em>＋</em></button>)}</div></div>; }

function ButtonControls({ button,draft,onChange,onDelete }: { button: ButtonItem; draft: LandingDraft; onChange:(p:Partial<ButtonItem>)=>void; onDelete:()=>void }) {
  const def=getAllActions().find((item)=>item.type===button.type);
  const brandColor = AUTO_COLORS[button.type] || draft.primary_color || "#1f2937";
  const globalColor = resolveButtonColors({ zone: draft.buttonZone, type: button.type, position: 0, primary: draft.primary_color || "#1f2937", customColor: null, useAutoColor: true }).background;
  // "Color de marca" only makes sense as its OWN choice when it would actually differ from
  // "Como el resto" — if the botonera is already set to colores originales (auto), the two
  // are the exact same color, so showing both as separate options was the confusing part.
  const showBrandOption = brandColor !== globalColor;
  const mode: "global" | "brand" | "custom" =
    button.use_auto_color ? "global"
    : showBrandOption && button.background_color === brandColor ? "brand"
    : button.background_color === globalColor ? "global"
    : "custom";
  return <div className="v2-fields">
    <div className="v2-brand"><ActionTypeIcon type={button.type}/><span><b>{def?.label || "Enlace"}</b><small>Icono incluido automáticamente</small></span></div>
    <label>Texto del botón<input value={button.title} onChange={(e)=>onChange({title:e.target.value})}/></label>
    <label>Texto secundario <small>Opcional</small><input value={button.subtitle} onChange={(e)=>onChange({subtitle:e.target.value})}/></label>
    <label>{def?.input === "phone" ? "Número" : def?.input === "email" ? "Email" : def?.input === "username" ? "Usuario" : "Enlace"}<input value={button.url} placeholder={def?.placeholder} onChange={(e)=>onChange({url:e.target.value})}/></label>
    {def?.message && <label>Mensaje de WhatsApp<textarea rows={3} value={button.message} onChange={(e)=>onChange({message:e.target.value})}/></label>}
    <fieldset>
      <legend>Color de este botón</legend>
      <Choice active={mode==="global"} swatch={globalColor} title="Como el resto de los botones" note={showBrandOption ? "Lo que definiste en Diseño de la botonera → Colores." : "El color de marca de esta red, igual que los demás botones."} onClick={()=>onChange({use_auto_color:true})}/>
      {showBrandOption && <Choice active={mode==="brand"} swatch={brandColor} title={`Color de marca${def ? ` (${def.label})` : ""}`} note="El color oficial de esta red, aunque los demás botones tengan otro." onClick={()=>onChange({use_auto_color:false,background_color:brandColor})}/>}
      <Choice active={mode==="custom"} swatch={mode==="custom" ? (button.background_color || undefined) : undefined} title="Color personalizado" note="Elegí cualquier color, solo para este botón." onClick={()=>onChange({use_auto_color:false,background_color: mode==="custom" ? (button.background_color || "#1f2937") : (draft.primary_color || "#1f2937")})}/>
      {mode==="custom" && <ColorField label="Elegí el color" value={button.background_color || "#1f2937"} onChange={(background_color)=>onChange({background_color})}/>}
    </fieldset>
    <button className="v2-delete" onClick={onDelete}>Eliminar botón</button>
  </div>;
}

function Choice({active,title,note,onClick,swatch}:{active:boolean;title:string;note:string;onClick:()=>void;swatch?:string}) { return <button type="button" className={`v2-choice ${active?"active":""}`} onClick={onClick}><i>{active?"✓":""}</i>{swatch && <em className="v2-choice-swatch" style={{background:swatch}} />}<span><b>{title}</b><small>{note}</small></span></button>; }
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="v2-color"><span>{label}</span><input type="color" value={value} onChange={(e)=>onChange(e.target.value)}/><code>{value.toUpperCase()}</code></label>; }
function Range({label,min,max,step=1,value,onChange}:{label:string;min:number;max:number;step?:number;value:number;onChange:(v:number)=>void}) { return <label className="v2-range"><span>{label}<b>{Math.round(value*(max<=2.2?100:1))}{max<=.65?"%":""}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(Number(e.target.value))}/></label>; }
