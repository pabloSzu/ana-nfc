"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActionTypeIcon } from "@/components/action-icons";
import { FiLink } from "react-icons/fi";
import { IconEye, IconQrCode } from "@/components/icons";
import DeleteLandingButton from "@/app/admin/delete-landing-button";
import LandingRenderer, { type LandingEditControls } from "@/components/landing-renderer";
import ScaledPhoneCanvas from "@/components/scaled-phone-canvas";
import { compressImage } from "@/lib/compress-image";
import { QUICK_SOCIALS, quickSocialHref, type QuickSocial, AUTO_COLORS, contrastTextColor, getAllActions, parseCoverStyle, logoBorderRadius, logoFrameStyle, logoInitials, logoLetterSize, resolveTextFont, type BackgroundPosition, type ButtonZoneStyle, type CoverStyle, type LogoStyle, type SubtitleStyle, type TitleStyle } from "@/lib/landing-catalog";
import FontPicker from "../font-picker";
import IconPicker from "../icon-picker";
import { DESIGN_PRESETS_V2, buttonCollectionStyle, buttonIconStyle, hasAuthenticLook, recommendedIconAppearance, resolveButtonColors, type DesignPreset } from "@/lib/design-presets";
import { ThemeSceneLayer, useSharedTheme } from "@/components/theme-scene";

type ButtonItem = { id: string; type: string; title: string; subtitle: string; url: string; message: string; icon: string; background_color: string; text_color: string; use_auto_color: boolean; position: number };
type LandingDraft = {
  id: string; slug: string; business_name: string; description?: string | null; logo_url?: string | null; primary_color?: string | null;
  background_color?: string | null; background_type?: string | null; background_gradient_to?: string | null; background_image_url?: string | null;
  text_color?: string | null; text_panel?: boolean | null; text_panel_color?: string | null; font_pair?: string | null; button_font?: string | null;
  published?: boolean | null; buttonZone: ButtonZoneStyle; titleStyle: TitleStyle; subtitleStyle: SubtitleStyle; logoStyle: LogoStyle; bgPosition: BackgroundPosition;
  cover_image_url?: string | null; coverStyle: CoverStyle;
};
type Panel = "templates" | "buttons" | "background" | "cover" | "settings" | "socials" | "title" | "subtitle" | "logo" | "add" | { buttonId: string } | null;
type BackgroundTab = "color" | "gradient" | "image";
type DeviceMode = "small" | "standard" | "large";
type SaveAction = (formData: FormData) => void | Promise<void>;

const SIZES = [
  { label: "Chico", patch: { height: 44, textSize: 13, iconSize: 25, gap: 6 } },
  { label: "Medio", patch: { height: 52, textSize: 14, iconSize: 29, gap: 9 } },
  { label: "Grande", patch: { height: 60, textSize: 16, iconSize: 32, gap: 12 } },
];
// Picked for maximum contrast between the two options they're previewing: WhatsApp/Instagram/
// Spotify have three very different AUTO_COLORS hues (color-rule preview), and Instagram/
// Spotify/YouTube are the three brand marks whose "real" icon differs the most from its
// minimalist one (a full gradient badge, an inverted black badge, a custom play glyph) —
// a network whose two icon versions look the same wouldn't demonstrate the choice at all.
const COLOR_RULE_PREVIEW_TYPES = ["whatsapp", "instagram", "spotify"];
const ICON_APPEARANCE_PREVIEW_TYPES = ["instagram", "spotify", "youtube"];
const DEVICE_OPTIONS: { id: DeviceMode; label: string; size: string; width: number }[] = [
  { id: "small", label: "Chico", size: "360 px", width: 360 },
  { id: "standard", label: "Común", size: "390 px", width: 390 },
  { id: "large", label: "Grande", size: "430 px", width: 430 },
];
const LOGO_SHAPE_OPTIONS: { id: LogoStyle["shape"]; label: string }[] = [
  { id: "round", label: "Circular" },
  { id: "square", label: "Cuadrado redondeado" },
  { id: "sharp", label: "Cuadrado" },
];
// One choice sets border width + shadow together (matched pairs), instead of two separate
// controls someone has to reconcile by hand — a border of 0 with a shadow style picked
// independently used to render a shadow with no edge to anchor it, which read as broken more
// than "no border". Keyed by `shadow` itself since that value already uniquely identifies each
// look; only the border width comes along for the ride (color stays a single shared picker).
const LOGO_EDGE_OPTIONS: { id: LogoStyle["shadow"]; label: string; patch: Partial<LogoStyle> }[] = [
  { id: "none", label: "Ninguno", patch: { borderWidth: 0, shadow: "none" } },
  { id: "soft", label: "Suave", patch: { borderWidth: 3, shadow: "soft" } },
  { id: "glow", label: "Glow", patch: { borderWidth: 5, shadow: "glow" } },
  // Brutalista: solid border + a hard, unblurred offset shadow — same recipe the button zone
  // uses for collection: "brutal"/"retro" (lib/design-presets.ts), only down-and-right, never
  // a shadow all around.
  { id: "hard", label: "Brutalista", patch: { borderWidth: 3, shadow: "hard" } },
];
type LogoTreatment = "template" | "clean" | "badge" | "card" | "highlight" | "brutal";

// Brutalismo/Neobrutalismo get their own dedicated treatment — a hard, unblurred offset shadow
// with a solid dark border, matching the exact same recipe their buttons already use
// (collection: "brutal"/"retro" in lib/design-presets.ts). Every other template previously
// mapped these to "card" (a soft-shadowed white-bordered tile), which looked visibly out of
// place sitting right above buttons with crisp black sticker-shadows.
function logoTreatmentPatch(treatment: LogoTreatment, templateId = "minimal"): Partial<LogoStyle> {
  if (treatment === "template") {
    const recommended: Record<string, Exclude<LogoTreatment, "template">> = { minimal: "clean", brutalism: "brutal", neobrutal: "brutal", glass: "badge", elegant: "badge", corporate: "card", vibrant: "highlight", natural: "badge", pastel: "badge", neon: "highlight", creator: "card" };
    return { ...logoTreatmentPatch(recommended[templateId] || "badge", templateId), treatment: "template" };
  }
  if (treatment === "clean") return { treatment, borderWidth: 0, shadow: "none", backgroundMode: "auto" };
  if (treatment === "card") return { treatment, shape: "square", borderWidth: 2, borderColor: "#ffffff", shadow: "soft", backgroundMode: "auto" };
  if (treatment === "highlight") return { treatment, shape: "round", borderWidth: 5, borderColor: "#ffffff", shadow: "glow", backgroundMode: "auto" };
  // backgroundMode stays "custom" + white here on purpose: both brutalism and neobrutal's
  // accent color is near-black (#0a0a0a / #1a1a1a), same as their border/shadow color — with
  // "auto" background (= primary color) the border and shadow silently blend into the fill,
  // and the only visible cue was the shadow's own offset. A fixed white plate is what the
  // border/shadow are meant to sit on, matching how a "brutal" sticker actually reads.
  if (treatment === "brutal") return { treatment, shape: templateId === "neobrutal" ? "square" : "sharp", borderWidth: templateId === "neobrutal" ? 2 : 3, borderColor: templateId === "neobrutal" ? "#191724" : "#0a0a0a", shadow: "hard", backgroundMode: "custom", fallback: "#ffffff" };
  // "badge" is the default look (glass/elegant/natural/pastel). Glassmorfismo's accent is pure
  // white — its buttons/page rely on a frosted-glass effect over a vivid background, not a
  // solid fill — so a white border on an auto (= white) background is the same "border blends
  // into its own fill" bug as brutalism. A soft dark ring instead, only for that template.
  return { treatment, shape: "round", borderWidth: 3, borderColor: templateId === "glass" ? "#2c2c33" : "#ffffff", shadow: "soft", backgroundMode: "auto" };
}

export default function EditorV2({ landing, initialButtons, saveAction, publishAction, deleteLandingAction }: { landing: LandingDraft; initialButtons: ButtonItem[]; saveAction: SaveAction; publishAction: SaveAction; deleteLandingAction: SaveAction }) {
  const [draft, setDraft] = useState(landing);
  const [buttons, setButtons] = useState(initialButtons);
  const [panel, setPanel] = useState<Panel>("templates");
  const [bgTab, setBgTab] = useState<BackgroundTab>("color");
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<DeviceMode>("standard");
  const [dirty, setDirty] = useState(false);
  const [deletedButton, setDeletedButton] = useState<{ button: ButtonItem; index: number } | null>(null);
  const restoreButtonRef = useRef<HTMLButtonElement>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  // Purely a personal viewing preference for the app's OWN chrome — nothing to do with the
  // landing being edited — shared with /admin via the same localStorage key (theme-scene.tsx),
  // so switching it in either place keeps both in sync.
  // The picker itself now lives in the global nav (app/admin/layout.tsx) — this just reads the
  // shared theme to paint the stage backdrop below.
  const [editorTheme] = useSharedTheme();
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const activeButton = typeof panel === "object" && panel ? buttons.find((button) => button.id === panel.buttonId) : null;
  const actionDefs = useMemo(() => getAllActions(), []);
  const draggedButton = useRef<string | null>(null);
  const lastDragTargetIndex = useRef<number | null>(null);
  const buttonElements = useRef(new Map<string, HTMLDivElement>());
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const grabOffsetRef = useRef(0);
  const dragOffsetRef = useRef(0);
  // Kept as a ref (not state) since it only needs to be read inside imperative drag math that
  // runs from window-level pointer listeners — a re-render on every resize tick would be wasted.
  const phoneScaleRef = useRef(1);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [panel]);

  // The default `panel` state is "templates" so desktop lands with the template picker already
  // open next to the phone — a nice invitation there, since it's just a side popover that never
  // hides anything. On mobile/tablet that same default now means a full-screen takeover (see
  // .v2-workspace.has-panel in phone-first.css) covering the phone before the person has even
  // seen it once. Runs only on mount (empty deps) — a later window resize shouldn't yank an
  // open panel closed out from under someone mid-edit.
  useEffect(() => {
    if (window.innerWidth <= 840) setPanel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setDeletedButton(null);
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
    setDeletedButton(null);
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

  function deleteButton(id: string) {
    const index = buttons.findIndex((button) => button.id === id);
    if (index < 0) return;
    commitDiscrete();
    setDeletedButton({ button: buttons[index], index });
    patchButtons((current) => current.filter((button) => button.id !== id));
    if (typeof panel === "object" && panel?.buttonId === id) setPanel(null);
    requestAnimationFrame(() => restoreButtonRef.current?.focus());
  }

  function restoreDeletedButton() {
    if (!deletedButton) return;
    commitDiscrete();
    patchButtons((current) => {
      if (current.some((button) => button.id === deletedButton.button.id)) return current;
      const restored = [...current];
      restored.splice(Math.min(deletedButton.index, restored.length), 0, deletedButton.button);
      return restored;
    });
    const restoredId = deletedButton.button.id;
    setDeletedButton(null);
    requestAnimationFrame(() => buttonElements.current.get(restoredId)?.querySelector("a")?.focus());
  }

  function applyPreset(id: string) {
    const preset = DESIGN_PRESETS_V2.find((item) => item.id === id);
    if (!preset) return;
    commitDiscrete();
    patchDraft({
      primary_color: preset.accent, button_font: preset.buttonFont,
      background_type: "gradient", background_color: preset.bg1, background_gradient_to: preset.bg2,
      // Picking any look — full template or just the button look below — always applies its
      // own recommended color rule and icon appearance now. This used to be "sticky" (kept
      // whatever you'd manually set before) whenever only the button look changed, on the
      // theory that a deliberate choice should survive a smaller change. In practice that meant
      // the exact same click (pick a button look) behaved differently depending on invisible
      // state nobody could see — confusing on its own terms. One predictable rule instead:
      // picking a look always gives you that look, in full; Ctrl+Z is the way back if it wasn't
      // what you wanted, same as any other edit here.
      buttonZone: {
        ...draft.buttonZone,
        ...preset.buttonZone,
        contentAlign: draft.buttonZone.contentAlignMode === "manual" ? draft.buttonZone.contentAlign : preset.buttonZone.contentAlign,
        contentAlignMode: draft.buttonZone.contentAlignMode,
        colorMode: preset.buttonZone.colorMode,
        oneColor: preset.oneColor,
        colorModeManual: false,
        iconAppearance: recommendedIconAppearance(preset.buttonZone.collection),
        templateId: id,
      },
      titleStyle: { ...draft.titleStyle, ...preset.title, color: preset.foreground }, subtitleStyle: { ...draft.subtitleStyle, ...preset.subtitle, color: preset.foreground }, logoStyle: { ...draft.logoStyle, ...logoTreatmentPatch("template", id), ...preset.logo },
    });
  }

  function applyButtonLook(id: string) {
    const preset = DESIGN_PRESETS_V2.find((item) => item.id === id);
    if (!preset) return;
    commitDiscrete();
    patchDraft({
      button_font: preset.buttonFont,
      buttonZone: {
        ...draft.buttonZone,
        ...preset.buttonZone,
        contentAlign: draft.buttonZone.contentAlignMode === "manual" ? draft.buttonZone.contentAlign : preset.buttonZone.contentAlign,
        contentAlignMode: draft.buttonZone.contentAlignMode,
        templateId: draft.buttonZone.templateId,
        colorMode: preset.buttonZone.colorMode,
        oneColor: preset.oneColor,
        colorModeManual: false,
        iconAppearance: recommendedIconAppearance(preset.buttonZone.collection),
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
        // deltaY is a real screen-space delta (from getBoundingClientRect, which already
        // reflects any ancestor CSS transform). But `transform` set here is a LOCAL transform
        // on an element that itself lives inside the scaled phone canvas — the browser
        // multiplies it by the ancestor's scale when painting, so without dividing by
        // phoneScaleRef here the animation would visibly undershoot on any shrunk phone.
        const deltaY = (previous.top - current.top) / phoneScaleRef.current;
        if (Math.abs(deltaY) > 1) element.animate([{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }], { duration: 190, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    }));
    setDirty(true);
  }

  function updateDrag(clientX: number, clientY: number, draggedId: string) {
    const element = buttonElements.current.get(draggedId);
    if (element) {
      const rect = element.getBoundingClientRect();
      // naturalTop has to undo the LOCAL translateY from the previous frame (element.style.
      // transform below), not the on-screen one — dragOffsetRef.current is already stored in
      // local (pre-scale) units, so this stays entirely in local space, consistent with how
      // it was set last frame.
      const naturalTop = rect.top - dragOffsetRef.current * phoneScaleRef.current;
      // clientY/grabOffsetRef/naturalTop are all real screen pixels — same reasoning as the
      // animate() call in reorderButton above: dividing by the phone's current scale converts
      // that screen-space delta into the local units this element's own `transform` needs, so
      // the dragged button tracks the pointer 1:1 no matter how small the phone frame is.
      dragOffsetRef.current = (clientY - grabOffsetRef.current - naturalTop) / phoneScaleRef.current;
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
      if (event.cancelable) event.preventDefault();
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

  async function onCoverFile(file?: File) {
    if (!file) return;
    const compressed = await compressImage(file, 1600);
    const input = document.getElementById("v2-cover-file") as HTMLInputElement | null;
    if (input) { const transfer = new DataTransfer(); transfer.items.add(compressed); input.files = transfer.files; }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(compressed)); setCoverRemoved(false);
    change({ coverStyle: parseCoverStyle({ enabled: true }) });
  }

  const backgroundImage = bgPreview || draft.background_image_url || "";
  const logoImage = logoPreview || (!logoRemoved ? draft.logo_url || "" : "");
  const coverImage = coverPreview || (!coverRemoved ? draft.cover_image_url || "" : "");
  const rendererLanding = {
    ...draft,
    logo_url: logoImage,
    background_image_url: backgroundImage,
    cover_image_url: coverImage,
    button_style: draft.buttonZone,
    title_style: draft.titleStyle,
    subtitle_style: draft.subtitleStyle,
    logo_style: draft.logoStyle,
    background_style: draft.bgPosition,
    cover_style: draft.coverStyle,
  };
  // Wires the editor's own state (selection, drag) into LandingRenderer's `edit` prop — the
  // canvas below is the same component the public page uses, not a parallel re-implementation,
  // so "what you see while editing" and "what gets published" can't drift apart anymore.
  const editControls: LandingEditControls = {
    selected: panel,
    draggingId,
    onSelectTemplates: () => setPanel("templates"),
    onSelectSettings: () => setPanel("settings"),
    onSelectSocials: () => setPanel("socials"),
    onSelectLogo: () => setPanel("logo"),
    onSelectTitle: () => setPanel("title"),
    onSelectSubtitle: () => setPanel("subtitle"),
    onSelectBackground: () => { setBgTab(draft.background_type === "image" ? "image" : draft.background_type === "gradient" ? "gradient" : "color"); setPanel("background"); },
    onSelectCover: () => setPanel("cover"),
    onSelectZone: () => setPanel("buttons"),
    onSelectButton: (id) => setPanel({ buttonId: id }),
    onDeleteButton: deleteButton,
    onAddButton: () => setPanel("add"),
    onButtonRef: (id, element) => { if (element) buttonElements.current.set(id, element); else buttonElements.current.delete(id); },
    onDragStart: (clientY, id) => startDrag(clientY, id),
  };

  return (
    <main className="v2-shell">
      <form id="v2-save" action={saveAction} onSubmit={() => { setDirty(false); setDeletedButton(null); }}>
        <input type="hidden" name="landing_id" value={draft.id} />
        <input type="hidden" name="business_name" value={draft.business_name} /><input type="hidden" name="description" value={draft.description || ""} />
        <input type="hidden" name="primary_color" value={draft.primary_color || "#1f2937"} /><input type="hidden" name="background_type" value={draft.background_type || "color"} />
        <input type="hidden" name="background_color" value={draft.background_color || "#f7f5f0"} /><input type="hidden" name="background_gradient_to" value={draft.background_gradient_to || "#a6c1ee"} />
        <input type="hidden" name="text_color" value={draft.text_color || "#ffffff"} /><input type="hidden" name="text_panel_color" value={draft.text_panel_color || "#000000"} />
        <input type="hidden" name="font_pair" value={draft.font_pair || "modern"} /><input type="hidden" name="button_font" value={draft.button_font || "modern"} />
        <input type="hidden" name="button_style" value={JSON.stringify(draft.buttonZone)} /><input type="hidden" name="title_style" value={JSON.stringify(draft.titleStyle)} />
        <input type="hidden" name="subtitle_style" value={JSON.stringify(draft.subtitleStyle)} /><input type="hidden" name="logo_style" value={JSON.stringify(draft.logoStyle)} />
        <input type="hidden" name="background_style" value={JSON.stringify(draft.bgPosition)} /><input type="hidden" name="buttons" value={JSON.stringify(buttons)} />
        <input type="hidden" name="cover_style" value={JSON.stringify(draft.coverStyle)} />
        <input id="v2-background-file" hidden type="file" name="background_image" accept="image/png,image/jpeg,image/webp" />
        <input id="v2-logo-file" hidden type="file" name="logo_image" accept="image/png,image/jpeg,image/webp" />
        <input id="v2-cover-file" hidden type="file" name="cover_image" accept="image/png,image/jpeg,image/webp" />
        <input type="hidden" name="remove_logo_image" value={String(logoRemoved)} />
        <input type="hidden" name="remove_cover_image" value={String(coverRemoved)} />
      </form>

      <header className="v2-topbar">
        <button className="v2-back" type="button" onClick={() => dirty ? setLeaveOpen(true) : location.assign("/admin")}>←</button>
        <div><span>Editor de landing</span><strong>{draft.business_name}</strong></div>
        <div className="v2-status"><i className={dirty ? "is-dirty" : ""} />{dirty ? "Cambios sin guardar" : "Todo guardado"}</div>
        <div className="v2-history" data-tick={historyTick}>
          <button type="button" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" disabled={pastRef.current.length === 0} onClick={undo}>↶</button>
          <button type="button" title="Rehacer (Ctrl+Y)" aria-label="Rehacer" disabled={futureRef.current.length === 0} onClick={redo}>↷</button>
        </div>
        <button className="v2-ghost" type="button" onClick={() => { setPanel(panel === "settings" ? null : "settings"); setPreview(false); }}>Ajustes</button>
        <button className="v2-ghost" type="button" onClick={() => { setPreview(!preview); setPanel(preview ? (window.innerWidth <= 840 ? null : "templates") : null); }}>{preview ? "Seguir editando" : "Vista previa"}</button>
        <button className="v2-save" form="v2-save" type="submit" name="return_to" value={`/admin/landings/${draft.id}/editor-v2`} disabled={!dirty}>Guardar cambios</button>
      </header>

      <div className={`v2-workspace ${preview ? "is-preview" : ""} ${panel ? "has-panel" : ""}`}>
        {!preview && panel && <aside ref={panelRef} className="v2-panel">
          <div className="v2-panel-head">
            <div><span>Paso simple</span><h2>{panelTitle(panel)}</h2></div>
            <button className="v2-panel-close" type="button" onClick={() => setPanel(null)}>×</button>
          </div>
          {panel === "templates" && <Templates selected={draft.buttonZone.templateId} onApply={applyPreset} />}
          {panel === "buttons" && <ButtonDesign draft={draft} buttons={buttons} onZone={changeZone} onFont={(button_font) => change({ button_font })} onApplyButtonLook={applyButtonLook} onResetButtonColors={resetButtonColors} />}
          {panel === "background" && <BackgroundControls draft={draft} tab={bgTab} onTab={setBgTab} onChange={change} onFile={onBackgroundFile} />}
          {panel === "cover" && <CoverControls draft={draft} coverImage={coverImage} onChange={change} onCoverFile={onCoverFile} onRemoveCover={() => {
            const input = document.getElementById("v2-cover-file") as HTMLInputElement | null;
            if (input) input.value = "";
            if (coverPreview) URL.revokeObjectURL(coverPreview);
            setCoverPreview(null); setCoverRemoved(true);
            change({ coverStyle: { ...draft.coverStyle, enabled: false } });
          }} />}
          {panel === "socials" && <SocialControls links={draft.buttonZone.quickSocials || []} onChange={(quickSocials) => changeZone({ quickSocials })} filled={draft.buttonZone.quickSocialsFilled !== false} onFilled={(quickSocialsFilled) => changeZone({ quickSocialsFilled })} />}
          {panel === "settings" && <SettingsControls draft={draft} onBrandingChange={(showBranding) => changeZone({ showBranding })} publishAction={publishAction} deleteLandingAction={deleteLandingAction} />}
          {panel === "title" && <TitleControls draft={draft} onChange={change} />}
          {panel === "subtitle" && <SubtitleControls draft={draft} onChange={change} />}
          {panel === "logo" && <LogoControls draft={draft} logoImage={logoImage} onChange={change} onLogo={onLogoFile} onRemoveLogo={() => { setLogoPreview(null); setLogoRemoved(true); setDirty(true); }} />}
          {panel === "add" && <ActionCatalog onAdd={addButton} />}
          {activeButton && <ButtonControls button={activeButton} draft={draft} onChange={(patch) => changeButton(activeButton.id, patch)} onDelete={() => deleteButton(activeButton.id)} />}
        </aside>}

        <section className={`v2-stage device-${device}`}>
          <ThemeSceneLayer theme={editorTheme} />
          <div className="v2-stage-toolbar"><span>{preview ? "Vista limpia" : "Tamaño de pantalla"}</span><div className="v2-device-switcher">{DEVICE_OPTIONS.map((option) => <button key={option.id} type="button" className={device === option.id ? "active" : ""} title={option.size} onClick={() => setDevice(option.id)}>{option.label}</button>)}</div></div>
          <div className={`v2-phone device-${device}`}>
            <div className="v2-phone-screen" ref={buttonsContainerRef}>
              <ScaledPhoneCanvas className="scaled-phone-canvas" designWidth={DEVICE_OPTIONS.find((option) => option.id === device)?.width} onScaleChange={(next) => { phoneScaleRef.current = next; }}>
                <LandingRenderer landing={rendererLanding} actions={buttons} edit={preview ? undefined : editControls} />
              </ScaledPhoneCanvas>
            </div>
          </div>
        </section>
      </div>

      {deletedButton && <div className="v2-delete-notice"><span role="status">Botón eliminado: <b>{deletedButton.button.title}</b></span><button ref={restoreButtonRef} type="button" onClick={restoreDeletedButton}>Deshacer</button><button type="button" aria-label="Cerrar aviso" onClick={() => setDeletedButton(null)}>×</button></div>}
      {leaveOpen && <div className="v2-modal-backdrop"><div className="v2-modal"><div className="v2-modal-icon">!</div><h2>Tenés cambios sin guardar</h2><p>Si salís ahora, vas a perder los últimos cambios de diseño.</p><button className="v2-save" form="v2-save" name="return_to" value="/admin">Guardar y salir</button><Link href="/admin" className="v2-danger">Salir sin guardar</Link><button className="v2-ghost" onClick={() => { setLeaveOpen(false); setPreview(false); }}>Seguir editando</button></div></div>}
    </main>
  );
}

function panelTitle(panel: Exclude<Panel, null>) { if (typeof panel === "object") return "Editar botón"; return ({ templates: "Elegí una plantilla", buttons: "Editar todos los botones", background: "Fondo de la página", cover: "Portada", settings: "Ajustes de la landing", socials: "Redes rápidas", title: "Editar título", subtitle: "Editar subtítulo", logo: "Editar logo", add: "Agregar un botón" } as const)[panel]; }

function TemplateSwatch({ preset }: { preset: DesignPreset }) {
  const iconAppearance = recommendedIconAppearance(preset.buttonZone.collection);
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
            const isAuthentic = preset.buttonZone.colorMode === "auto";
            const useNetworkAccent = preset.buttonZone.colorMode === "auto";
            return (
              <span
                className={`template-shot-button icon-appearance-${iconAppearance}`}
                key={example.type}
                style={{ ...buttonCollectionStyle(preset.buttonZone.collection, color, text, index, example.type, isAuthentic, useNetworkAccent), borderRadius: Math.max(0, preset.buttonZone.radius * .42), display: "grid", gridTemplateColumns: preset.buttonZone.contentAlign === "center" ? "11px minmax(0,1fr) 11px" : "11px minmax(0,1fr)", alignItems: "center", columnGap: 4, textAlign: preset.buttonZone.contentAlign === "center" ? "center" : "left" }}
              >
                <span className="template-shot-icon" style={buttonIconStyle(preset.buttonZone.collection, color, 11, example.type, iconAppearance, isAuthentic, useNetworkAccent)}><ActionTypeIcon type={example.type} brandMark={iconAppearance === "brand" && !(isAuthentic && hasAuthenticLook(example.type))} /></span>
                <span>{example.label}</span>
                {preset.buttonZone.contentAlign === "center" && <span aria-hidden="true" />}
              </span>
            );
          })}
        </span>
      </span>
    </span>
  );
}

function Templates({ selected, onApply }: { selected: string; onApply: (id: string) => void }) { return <div><p className="v2-help">Todas mantienen la estructura simple tipo Linktree: logo, título, subtítulo y botones centrados. La miniatura muestra el resultado real de colores, tipografía y botones.</p><div className="v2-template-grid">{DESIGN_PRESETS_V2.map((preset) => <button key={preset.id} type="button" className={selected === preset.id ? "selected" : ""} onClick={() => onApply(preset.id)}><TemplateSwatch preset={preset} /><b>{preset.name}</b><small>{preset.description}</small></button>)}</div></div>; }

function ButtonLookSwatch({ preset }: { preset: DesignPreset }) {
  const iconAppearance = recommendedIconAppearance(preset.buttonZone.collection);
  const examples = [
    { type: "whatsapp", label: "WhatsApp" },
    { type: "instagram", label: "Instagram" },
  ];
  const backgrounds = preset.buttonZone.colorMode === "one"
    ? [preset.oneColor, preset.oneColor]
    : [AUTO_COLORS.whatsapp, AUTO_COLORS.instagram];
  return <span className="v2-look-swatch" aria-hidden="true">
    {examples.map((example, index) => {
      const background = backgrounds[index];
      const isAuthentic = preset.buttonZone.colorMode === "auto";
      const useNetworkAccent = preset.buttonZone.colorMode === "auto";
      return <span className={`v2-look-button icon-appearance-${iconAppearance}`} key={example.type} style={{ ...buttonCollectionStyle(preset.buttonZone.collection, background, contrastTextColor(background), index, example.type, isAuthentic, useNetworkAccent), borderRadius: Math.max(0, preset.buttonZone.radius * .35), display: "grid", gridTemplateColumns: preset.buttonZone.contentAlign === "center" ? "15px minmax(0,1fr) 15px" : "15px minmax(0,1fr)", alignItems: "center", columnGap: 5, textAlign: preset.buttonZone.contentAlign === "center" ? "center" : "left" }}>
        <span className="v2-look-button-icon" style={buttonIconStyle(preset.buttonZone.collection, background, 15, example.type, iconAppearance, isAuthentic, useNetworkAccent)}><ActionTypeIcon type={example.type} brandMark={iconAppearance === "brand" && !(isAuthentic && hasAuthenticLook(example.type))} /></span>
        <span>{example.label}</span>
        {preset.buttonZone.contentAlign === "center" && <span aria-hidden="true" />}
      </span>;
    })}
  </span>;
}

function ButtonDesign({ draft, buttons, onZone, onFont, onApplyButtonLook, onResetButtonColors }: { draft: LandingDraft; buttons: ButtonItem[]; onZone: (p: Partial<ButtonZoneStyle>) => void; onFont: (font: string) => void; onApplyButtonLook: (id: string) => void; onResetButtonColors: () => void }) {
  const zone = draft.buttonZone;
  const alignmentPreset = DESIGN_PRESETS_V2.find((preset) => preset.id === zone.preset) || DESIGN_PRESETS_V2.find((preset) => preset.id === zone.templateId) || DESIGN_PRESETS_V2[0];
  const recommendedIcons = recommendedIconAppearance(zone.collection);
  const customCount = buttons.filter((button) => !button.use_auto_color).length;
  const inheritedCount = buttons.length - customCount;
  return (
    <div className="v2-fields">
      <fieldset>
        <legend>Plantilla de los botones</legend>
        <p className="v2-help">Son las mismas plantillas del diseño general. Aplican forma, color, tipografía y efectos a la botonera. Los botones con color propio conservan su elección.</p>
        <div className="v2-look-grid">
          {DESIGN_PRESETS_V2.map((preset) => {
            return <button type="button" key={preset.id} className={zone.preset === preset.id ? "active" : ""} onClick={() => onApplyButtonLook(preset.id)} aria-pressed={zone.preset === preset.id}>
              <ButtonLookSwatch preset={preset} />
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
        <Choice
          active={draft.buttonZone.colorMode === "one"}
          swatch={draft.buttonZone.oneColor}
          title="Un color para todos"
          note="Los botones que usan el diseño general tendrán este color."
          onClick={() => onZone({ colorMode: "one" })}
          preview={<ChoicePreviewChips zone={zone} types={COLOR_RULE_PREVIEW_TYPES} background={() => draft.buttonZone.oneColor} iconAppearance={zone.iconAppearance} isAuthentic={false} useNetworkAccent={false} />}
        />
        {draft.buttonZone.colorMode === "one" && <ColorField label="Color de los botones" value={draft.buttonZone.oneColor} onChange={(oneColor) => onZone({ oneColor })} />}
        <Choice
          active={draft.buttonZone.colorMode === "auto"}
          title="Cada red con su color"
          note="WhatsApp verde, Instagram rosa y cada marca con su color oficial."
          onClick={() => onZone({ colorMode: "auto" })}
          preview={<ChoicePreviewChips zone={zone} types={COLOR_RULE_PREVIEW_TYPES} background={(type) => AUTO_COLORS[type] || draft.buttonZone.oneColor} iconAppearance={zone.iconAppearance} isAuthentic={true} useNetworkAccent={true} />}
        />
        {/* Picking any look (plantilla general o de botonera) always applies its own recommended
            color rule now — no more "sticky" state that made the same click behave differently
            depending on invisible history. One predictable rule, Ctrl+Z as the way back. */}
        <p className="v2-help" style={{ margin: 0 }}>Cada plantilla trae su propia regla de color recomendada — elegir una plantilla nueva siempre la aplica. Si no era lo que buscabas, deshacé con Ctrl+Z.</p>
      </fieldset>
      <fieldset>
        <legend>Apariencia de los iconos</legend>
        <Choice
          active={zone.iconAppearance === "minimal"}
          suggested={recommendedIcons === "minimal"}
          title="Icono minimalista"
          note="Todos usan un tratamiento monocromático coordinado con la botonera."
          onClick={() => onZone({ iconAppearance: "minimal" })}
          preview={<ChoicePreviewChips zone={zone} types={ICON_APPEARANCE_PREVIEW_TYPES} background={(type) => zone.colorMode === "one" ? zone.oneColor : (AUTO_COLORS[type] || zone.oneColor)} iconAppearance="minimal" isAuthentic={zone.colorMode === "auto"} useNetworkAccent={zone.colorMode === "auto"} />}
        />
        <Choice
          active={zone.iconAppearance === "brand"}
          suggested={recommendedIcons === "brand"}
          title="Icono real"
          note="Cada marca conserva su apariencia reconocible: Spotify verde, YouTube rojo, Instagram degradado…"
          onClick={() => onZone({ iconAppearance: "brand" })}
          preview={<ChoicePreviewChips zone={zone} types={ICON_APPEARANCE_PREVIEW_TYPES} background={(type) => zone.colorMode === "one" ? zone.oneColor : (AUTO_COLORS[type] || zone.oneColor)} iconAppearance="brand" isAuthentic={zone.colorMode === "auto"} useNetworkAccent={zone.colorMode === "auto"} />}
        />
      </fieldset>
      <div className="v2-fields-row">
        <fieldset><legend>Tamaño</legend><div className="v2-segment">{SIZES.map((item) => <button type="button" className={draft.buttonZone.height === item.patch.height ? "active" : ""} key={item.label} onClick={() => onZone(item.patch)}>{item.label}</button>)}</div></fieldset>
        <fieldset>
          <legend>Alineación</legend>
          <div className="v2-segment">
            <button type="button" className={zone.contentAlignMode === "auto" ? "active" : ""} aria-pressed={zone.contentAlignMode === "auto"} onClick={() => onZone({ contentAlignMode: "auto", contentAlign: alignmentPreset.buttonZone.contentAlign })}>Auto</button>
            <button type="button" className={zone.contentAlignMode === "manual" && zone.contentAlign === "center" ? "active" : ""} aria-pressed={zone.contentAlignMode === "manual" && zone.contentAlign === "center"} onClick={() => onZone({ contentAlignMode: "manual", contentAlign: "center" })}>Centro</button>
            <button type="button" className={zone.contentAlignMode === "manual" && zone.contentAlign === "left" ? "active" : ""} aria-pressed={zone.contentAlignMode === "manual" && zone.contentAlign === "left"} onClick={() => onZone({ contentAlignMode: "manual", contentAlign: "left" })}>Izq.</button>
          </div>
          <p className="v2-help" style={{ margin: "8px 0 0", fontSize: 11 }}>{zone.contentAlignMode === "auto" ? `Recomendado por ${alignmentPreset.name}.` : "Se mantiene aunque cambies de plantilla."}</p>
        </fieldset>
      </div>
      <details className="v2-advanced">
        <summary>Más opciones</summary>
        <div className="v2-fields" style={{ marginTop: 10 }}>
          <FontPicker label="Tipografía" value={draft.button_font || "modern"} onChange={onFont} />
          <div className="v2-fields-row">
            <Range label="Alto del botón" min={40} max={72} value={zone.height} onChange={(height) => onZone({ height })} />
            <Range label="Espaciado" min={4} max={20} value={zone.gap} onChange={(gap) => onZone({ gap })} />
          </div>
          <div className="v2-fields-row">
            <Range label="Tamaño del ícono" min={22} max={38} value={zone.iconSize} onChange={(iconSize) => onZone({ iconSize })} />
            <Range label="Tamaño del texto" min={12} max={18} value={zone.textSize} onChange={(textSize) => onZone({ textSize })} />
          </div>
        </div>
      </details>
    </div>
  );
}

function BackgroundControls({ draft, tab, onTab, onChange, onFile }: { draft: LandingDraft; tab: BackgroundTab; onTab: (t: BackgroundTab) => void; onChange: (p: Partial<LandingDraft>) => void; onFile: (f?: File) => void }) {
  const updatePos = (p: Partial<BackgroundPosition>) => onChange({ bgPosition: { ...draft.bgPosition, ...p } });
  const selectTab = (next: BackgroundTab) => { onTab(next); onChange({ background_type: next }); };
  return <div className="v2-fields">
    <div className="v2-segment">
      <button className={tab === "color" ? "active" : ""} onClick={() => selectTab("color")}>Color</button>
      <button className={tab === "gradient" ? "active" : ""} onClick={() => selectTab("gradient")}>Degradado</button>
      <button className={tab === "image" ? "active" : ""} onClick={() => selectTab("image")}>Imagen</button>
    </div>

    {tab !== "image" && <>
      <ColorField label="Color principal" value={draft.background_color || "#f7f5f0"} onChange={(background_color) => onChange({ background_color })} />
      {tab === "gradient" && <ColorField label="Segundo color" value={draft.background_gradient_to || "#a6c1ee"} onChange={(background_gradient_to) => onChange({ background_gradient_to })} />}
    </>}

    {tab === "image" && <>
      <label className="v2-upload">Cambiar imagen<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onFile(event.target.files?.[0])} /></label>
      <p className="v2-help">Ajustala mirando el celular: nunca se guarda el recorte original.</p>
      <Range label="Oscurecer imagen" min={0} max={.85} step={.01} value={draft.bgPosition.tint} onChange={(tint) => updatePos({ tint })} />
      <Range label="Acercar" min={1} max={2.2} step={.01} value={draft.bgPosition.zoom} onChange={(zoom) => updatePos({ zoom })} />
      <Range label="Mover horizontal" min={0} max={100} value={draft.bgPosition.x} onChange={(x) => updatePos({ x })} />
      <Range label="Mover vertical" min={0} max={100} value={draft.bgPosition.y} onChange={(y) => updatePos({ y })} />
    </>}

  </div>;
}

const COVER_SIZES: { id: CoverStyle["size"]; label: string }[] = [
  { id: "small", label: "Chico" },
  { id: "medium", label: "Mediano" },
  { id: "large", label: "Grande" },
];

function CoverControls({ draft, coverImage, onChange, onCoverFile, onRemoveCover }: { draft: LandingDraft; coverImage: string; onChange: (p: Partial<LandingDraft>) => void; onCoverFile: (f?: File) => void; onRemoveCover: () => void }) {
  const style = draft.coverStyle;
  const updateCover = (patch: Partial<CoverStyle>) => onChange({ coverStyle: { ...style, ...patch } });
  const canPan = style.zoom > 1;
  return <div className="v2-fields">
    <p className="v2-help">Una imagen detrás de tu logo, nombre y descripción, hasta el comienzo de los botones. Se adapta sola sin mover tu contenido.</p>
    <label className="v2-upload">{coverImage ? "Cambiar portada" : "Subir portada"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { onCoverFile(event.target.files?.[0]); event.target.value = ""; }} /></label>
    {coverImage && <>
      <Choice active={style.enabled} title="Mostrar portada" note="Podés ocultarla sin borrar la imagen." onClick={() => updateCover({ enabled: !style.enabled })} />
      <fieldset>
        <legend>Tamaño</legend>
        <div className="v2-segment">{COVER_SIZES.map((option) => <button type="button" key={option.id} className={style.size === option.id ? "active" : ""} onClick={() => updateCover({ size: option.id })}>{option.label}</button>)}</div>
        <p className="v2-help" style={{ margin: "8px 0 0" }}>"Mediano" es el ajuste por defecto. "Grande" llega hasta más abajo, cerca del segundo botón.</p>
      </fieldset>
      <details className="v2-cover-adjustments"><summary>Ajustar encuadre y difuminado</summary><div className="v2-fields">
        <Range label="Acercar" min={1} max={2.5} step={.01} value={style.zoom} onChange={(zoom) => updateCover({ zoom })} />
        {canPan ? <>
          <Range label="Mover horizontal" min={0} max={100} value={style.x} onChange={(x) => updateCover({ x })} />
          <Range label="Mover vertical" min={0} max={100} value={style.y} onChange={(y) => updateCover({ y })} />
        </> : <p className="v2-help" style={{ margin: 0 }}>Subí el acercamiento para poder mover la foto dentro del marco.</p>}
        <Range label="Difuminado" min={10} max={90} value={style.fade} onChange={(fade) => updateCover({ fade })} />
        <p className="v2-help" style={{ margin: "-6px 0 0" }}>Dónde empieza a desvanecerse la foto hacia el fondo, cerca de los botones.</p>
        <Range label="Oscurecer la foto" min={0} max={.85} step={.01} value={style.overlay} onChange={(overlay) => updateCover({ overlay })} />
        <p className="v2-help" style={{ margin: "-6px 0 0" }}>Un velo parejo sobre toda la foto, para que el logo y el título se lean mejor.</p>
        <button type="button" className="v2-ghost" onClick={() => onChange({ coverStyle: parseCoverStyle({ enabled: style.enabled, size: style.size }) })}>Restablecer ajuste automático</button>
      </div></details>
      <button type="button" className="v2-delete" onClick={onRemoveCover}>Quitar portada</button>
    </>}
  </div>;
}

function SocialControls({ links, onChange, filled, onFilled }: { links: QuickSocial[]; onChange: (links: QuickSocial[]) => void; filled: boolean; onFilled: (filled: boolean) => void }) {
  return <div className="v2-fields">
    <p className="v2-help">Accesos secundarios debajo de tus botones. Agregá solo las redes que quieras mostrar; no copiamos tus botones automáticamente.</p>
    <fieldset>
      <legend>Estilo de los íconos</legend>
      <div className="v2-segment">
        <button type="button" className={filled ? "active" : ""} onClick={() => onFilled(true)}>Con fondo</button>
        <button type="button" className={!filled ? "active" : ""} onClick={() => onFilled(false)}>Sin fondo</button>
      </div>
    </fieldset>
    {QUICK_SOCIALS.map(option => {
      const current = links.find(link => link.type === option.type);
      const invalid = Boolean(current?.url.trim() && !quickSocialHref(current));
      return <div className="v2-social-field" key={option.type}>
        <label><span><ActionTypeIcon type={option.type} brandMark />{option.label}</span>
          <input type="text" inputMode={option.type === "whatsapp" ? "tel" : "url"} aria-invalid={invalid} aria-describedby={invalid ? `social-error-${option.type}` : undefined} value={current?.url || ""} placeholder={option.placeholder} maxLength={2048} onChange={event => {
            const url = event.target.value;
            onChange(current ? links.map(link => link.type === option.type ? { ...link, url } : link) : [...links, { type: option.type, url }]);
          }} />
        </label>
        {invalid && <p id={`social-error-${option.type}`} className="v2-social-error">{option.type === "whatsapp" ? "Ingresá un número con código de país o un enlace completo." : "Ingresá un enlace completo, por ejemplo https://instagram.com/tumarca."} Este acceso no se mostrará hasta corregirlo.</p>}
        {current && <button type="button" className="v2-ghost" onClick={() => onChange(links.filter(link => link.type !== option.type))}>Quitar {option.label}</button>}
      </div>;
    })}
    <p className="v2-help">Las redes aparecen en el orden en que las agregás. Guardá los cambios para aplicarlas a tu página.</p>
  </div>;
}

// The one panel that isn't a design control: publishing, sharing and deleting the landing
// itself. Everything here posts straight to the same server actions the admin list uses
// (`publishAction`/`deleteLandingAction`, both passed down from the page), so there's exactly
// one place in the whole app that actually flips `published` or deletes a landing row.
function SettingsControls({ draft, onBrandingChange, publishAction, deleteLandingAction }: { draft: LandingDraft; onBrandingChange: (show: boolean) => void; publishAction: SaveAction; deleteLandingAction: SaveAction }) {
  const isPublished = Boolean(draft.published);
  return <div className="v2-fields">
    <div className="v2-brand">
      <span><b>{isPublished ? "Tu landing está online" : "Tu landing está en borrador"}</b><small>{isPublished ? "Cualquiera con el link o el tag NFC puede verla." : "Todavía no es visible para el público."}</small></span>
    </div>
    <Choice active={draft.buttonZone.showBranding !== false} title="Mostrar firma de BioNFC" note="Agrega el logo y un enlace a BioNFC al final de tu página. Guardá los cambios para aplicar esta opción." onClick={() => onBrandingChange(draft.buttonZone.showBranding === false)} />
    <form action={publishAction}>
      <input type="hidden" name="id" value={draft.id} />
      <input type="hidden" name="published" value={String(!isPublished)} />
      <input type="hidden" name="return_to" value={`/admin/landings/${draft.id}/editor-v2`} />
      <button className="v2-save" style={{ width: "100%" }} type="submit">{isPublished ? "Despublicar" : "Publicar landing"}</button>
    </form>
    <a className="v2-suggested" href={`/${draft.slug}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8 }}><IconEye /> Ver landing publicada</a>
    <Link className="v2-suggested" href={`/admin/landings/${draft.id}/qr`} style={{ display: "flex", alignItems: "center", gap: 8 }}><IconQrCode /> Código QR para el tag NFC</Link>
    <DeleteLandingButton action={deleteLandingAction} landingId={draft.id} label="Eliminar landing" />
  </div>;
}

// Falls back to the "Minimalismo" template (designed to suit "casi cualquier rubro") when
// no general template is active yet, so "Usar estilos recomendados" always has something sane
// to offer, even on a landing built entirely by hand.
function suggestedPreset(templateId: string): DesignPreset {
  return DESIGN_PRESETS_V2.find((item) => item.id === templateId) || DESIGN_PRESETS_V2[0];
}

function TitleControls({ draft, onChange }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void }) { const style=draft.titleStyle; const update=(patch:Partial<TitleStyle>)=>onChange({titleStyle:{...style,...patch}}); const preset=suggestedPreset(draft.buttonZone.templateId); return <div className="v2-fields"><label>Rubro o frase breve (opcional)<input maxLength={60} value={style.eyebrow || ""} placeholder="Ej: ARQUITECTURA & INTERIORES" onChange={(e)=>update({eyebrow:e.target.value})}/></label><p className="v2-help">Una línea pequeña encima del nombre. Dejalo vacío para ocultarla.</p><label>Texto del título<input value={draft.business_name} onChange={(e)=>onChange({business_name:e.target.value})}/></label><button type="button" className="v2-suggested" onClick={()=>update({...preset.title,color:preset.foreground})}>✦ Usar estilos recomendados ({preset.name})</button><FontPicker label="Tipografía" value={style.font} onChange={(font)=>update({font})}/><Range label="Tamaño" min={20} max={48} value={style.size} onChange={(size)=>update({size})}/><fieldset><legend>Grosor</legend><div className="v2-segment">{[500,700,900].map((weight)=><button key={weight} className={style.weight===weight?"active":""} onClick={()=>update({weight})}>{weight===500?"Normal":weight===700?"Fuerte":"Extra"}</button>)}</div></fieldset><ColorField label="Color del texto" value={style.color} onChange={(color)=>update({color})}/><Choice active={style.bgMode==="solid"} title="Fondo detrás del título" note="Ayuda a leerlo sobre fotografías." onClick={()=>update({bgMode:style.bgMode==="solid"?"none":"solid"})}/>{style.bgMode==="solid"&&<ColorField label="Color del fondo" value={style.bg} onChange={(bg)=>update({bg})}/>}</div>; }

function SubtitleControls({ draft, onChange }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void }) { const style=draft.subtitleStyle; const update=(patch:Partial<SubtitleStyle>)=>onChange({subtitleStyle:{...style,...patch}}); const preset=suggestedPreset(draft.buttonZone.templateId); return <div className="v2-fields"><label>Texto del subtítulo<textarea rows={3} value={draft.description || ""} onKeyDown={(e)=>{ if (e.key==="Enter" && (draft.description||"").includes("\n")) e.preventDefault(); }} onChange={(e)=>onChange({description:e.target.value})}/></label><p className="v2-help" style={{margin:"-4px 0 0"}}>Podés usar Enter para un salto de línea (máximo dos líneas).</p><button type="button" className="v2-suggested" onClick={()=>update({...preset.subtitle,color:preset.foreground})}>✦ Usar estilos recomendados ({preset.name})</button><FontPicker label="Tipografía" value={style.font} onChange={(font)=>update({font})}/><Range label="Tamaño" min={11} max={26} value={style.size} onChange={(size)=>update({size})}/><fieldset><legend>Grosor</legend><div className="v2-segment">{[400,600,800].map((weight)=><button key={weight} className={style.weight===weight?"active":""} onClick={()=>update({weight})}>{weight===400?"Normal":weight===600?"Medio":"Fuerte"}</button>)}</div></fieldset><ColorField label="Color del texto" value={style.color} onChange={(color)=>update({color})}/><Choice active={style.bgMode==="solid"} title="Fondo detrás del texto" note="Mejora la lectura cuando hay una imagen." onClick={()=>update({bgMode:style.bgMode==="solid"?"none":"solid"})}/>{style.bgMode==="solid"&&<ColorField label="Color del fondo" value={style.bg} onChange={(bg)=>update({bg})}/>}</div>; }

function LogoControls({ draft, logoImage, onChange, onLogo, onRemoveLogo }: { draft: LandingDraft; logoImage: string; onChange: (p: Partial<LandingDraft>) => void; onLogo: (file?: File) => void; onRemoveLogo: () => void }) {
  const preset = suggestedPreset(draft.buttonZone.templateId);
  const style = draft.logoStyle;
  const primary = draft.primary_color || "#1f2937";
  const update = (patch: Partial<LogoStyle>) => onChange({ logoStyle: { ...style, ...patch } });
  return <div className="v2-fields">
    <div className="v2-logo-editor"><div style={{ ...logoFrameStyle(style, primary), borderRadius: logoBorderRadius(style.shape, 76), fontSize: logoLetterSize(76, style.initials), fontFamily: resolveTextFont(draft.titleStyle.font) }}>{logoImage ? <span style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${style.zoom * 100}%`, backgroundPosition: `${style.x}% ${style.y}%` }} /> : logoInitials(draft.business_name, style.initials)}</div><span><label className="v2-upload">{logoImage ? "Cambiar imagen" : "Elegir imagen"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onLogo(event.target.files?.[0])} /></label>{logoImage && <button type="button" className="v2-delete" onClick={onRemoveLogo}>Quitar</button>}</span></div>
    <button type="button" className="v2-suggested v2-logo-recommended-button" onClick={() => onChange({ logoStyle: { ...style, ...logoTreatmentPatch("template", draft.buttonZone.templateId), ...preset.logo, zoom: 1, x: 50, y: 50 } })}>✦ Usar estilos recomendados ({preset.name})</button>
    <fieldset>
      <legend>Forma del logo</legend>
      <div className="v2-logo-shape-grid">
        {LOGO_SHAPE_OPTIONS.map((option) => (
          <button type="button" key={option.id} className={style.shape === option.id ? "active" : ""} aria-pressed={style.shape === option.id} onClick={() => update({ shape: option.id, treatment: "custom" })}>
            {/* Fixed thin border, not tied to the real Borde/Sombra settings — just enough to
                read the shape's outline clearly (a plain fill with no edge can be hard to tell
                apart from the page background). Doesn't move when those settings change. */}
            <span className="v2-logo-shape-preview" style={{ ...logoFrameStyle({ ...style, shape: option.id, borderWidth: 2, borderColor: "#00000026", shadow: "none" }, primary), borderRadius: logoBorderRadius(option.id, 48), fontSize: logoLetterSize(48, style.initials), fontFamily: resolveTextFont(draft.titleStyle.font) }}>
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
    <fieldset>
      <legend>Borde y sombra</legend>
      <p className="v2-help" style={{ margin: "0 0 8px" }}>Un solo estilo: cada opción trae su borde y su sombra ya combinados.</p>
      <div className="v2-logo-shape-grid">
        {LOGO_EDGE_OPTIONS.map((option) => (
          <button type="button" key={option.id} className={style.shadow === option.id ? "active" : ""} aria-pressed={style.shadow === option.id} onClick={() => update({ ...option.patch, treatment: "custom" })}>
            <span className="v2-logo-shape-preview" style={{ ...logoFrameStyle({ ...style, ...option.patch }, primary), borderRadius: logoBorderRadius(style.shape, 48), fontSize: logoLetterSize(48, style.initials), fontFamily: resolveTextFont(draft.titleStyle.font) }}>
              {logoImage ? <i style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${style.zoom * 100}%`, backgroundPosition: `${style.x}% ${style.y}%` }} /> : logoInitials(draft.business_name, style.initials)}
            </span>
            <b>{option.label}</b>
          </button>
        ))}
      </div>
      {style.shadow !== "none" && <>
        <label className="v2-mini-color" title="Color del borde" style={{ marginTop: 10 }}><span>Color del borde{style.shadow !== "soft" ? " y la sombra" : ""}</span><input type="color" value={style.borderColor} onChange={(event) => update({ borderColor: event.target.value, treatment: "custom" })} /></label>
        {style.shadow === "soft" && <p className="v2-help" style={{ margin: "-4px 0 0" }}>"Suave" mantiene su sombra siempre neutra a propósito, para que se vea bien sobre cualquier fondo.</p>}
        {/* Step 2 instead of 1: a 1px border reads as a broken hairline at logo scale rather
            than an intentional thin border (same reasoning as the old standalone "Borde" range). */}
        <Range label="Borde" min={2} max={10} step={2} value={style.borderWidth} onChange={(borderWidth) => update({ borderWidth, treatment: "custom" })} />
        <Range label="Tamaño de sombra" min={.5} max={2} step={.05} value={style.shadowSize} onChange={(shadowSize) => update({ shadowSize, treatment: "custom" })} />
      </>}
    </fieldset>
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

function ActionCatalog({ onAdd }: { onAdd: (type: string) => void }) {
  const networkActions = getAllActions().filter((action) => action.type !== "url");
  return <div>
    <p className="v2-help">Elegí la red o acción. Ya viene con su nombre, ícono y color oficial.</p>
    <div className="v2-action-grid">{networkActions.map((action)=><button type="button" key={action.type} onClick={()=>onAdd(action.type)}><ActionTypeIcon type={action.type}/><span><b>{action.label}</b><small>{action.input === "phone" ? "Número de teléfono" : action.input === "username" ? "Nombre de usuario" : "Enlace"}</small></span><em>＋</em></button>)}</div>
    <button type="button" className="v2-custom-action" onClick={()=>onAdd("url")}>
      <span className="v2-custom-action-icon"><FiLink /></span>
      <span><b>Agregar botón personalizado</b><small>Cualquier enlace: tu menú, un formulario, otra red, lo que necesites.</small></span>
      <em>＋</em>
    </button>
  </div>;
}

function ButtonControls({ button,draft,onChange,onDelete }: { button: ButtonItem; draft: LandingDraft; onChange:(p:Partial<ButtonItem>)=>void; onDelete:()=>void }) {
  const def=getAllActions().find((item)=>item.type===button.type);
  const brandColor = AUTO_COLORS[button.type] || draft.primary_color || "#1f2937";
  const globalColor = resolveButtonColors({ zone: draft.buttonZone, type: button.type, position: 0, primary: draft.primary_color || "#1f2937", customColor: null, useAutoColor: true }).background;
  const globalDescription = draft.buttonZone.colorMode === "one"
    ? `Usa el color general ${globalColor.toUpperCase()}.`
    : `Usa el color oficial de ${def?.label || "esta acción"}.`;
  const ownColor = button.background_color || brandColor;
  return <div className="v2-fields">
    <div className="v2-brand"><ActionTypeIcon type={button.type} icon={button.icon}/><span><b>{def?.label || "Enlace"}</b><small>{button.icon ? "Ícono personalizado" : "Ícono incluido automáticamente"}</small></span></div>
    <label>Texto del botón<input value={button.title} onChange={(e)=>onChange({title:e.target.value})}/></label>
    <label>Texto secundario <small>Opcional</small><input value={button.subtitle} onChange={(e)=>onChange({subtitle:e.target.value})}/></label>
    <label>{def?.input === "phone" ? "Número" : def?.input === "email" ? "Email" : def?.input === "username" ? "Usuario" : "Enlace"}<input value={button.url} placeholder={def?.placeholder} onChange={(e)=>onChange({url:e.target.value})}/></label>
    {def?.message && <label>Mensaje de WhatsApp<textarea rows={3} value={button.message} onChange={(e)=>onChange({message:e.target.value})}/></label>}
    <IconPicker type={button.type} value={button.icon} onChange={(icon)=>onChange({icon})}/>
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

function Choice({active,title,note,onClick,swatch,suggested=false,preview}:{active:boolean;title:string;note:string;onClick:()=>void;swatch?:string;suggested?:boolean;preview?: ReactNode}) { return <button type="button" className={`v2-choice ${active?"active":""}`} onClick={onClick}><i>{active?"✓":""}</i>{swatch && <em className="v2-choice-swatch" style={{background:swatch}} />}<span><b>{title}{suggested && <em className="v2-choice-suggested">(Sugerido para la plantilla)</em>}</b><small>{note}</small></span>{preview}</button>; }

// Small real-rendered swatches shown inline on a Choice row, so "Un color para todos" vs "Cada
// red con su color" (or "Ícono minimalista" vs "Ícono real") show their actual result instead of
// asking the person to imagine it from a text label — especially needed for icon appearance,
// where a custom-icon button has no "brand" variant at all and the two options can otherwise
// look identical. Reuses the same style functions (and the same mini-swatch shape) as the
// button-look picker's own preview cards above, just as standalone chips instead of a labeled
// pill, so a colored badge that's only meant to sit on a matching button (e.g. "brand"
// collection's translucent-white badge) still has that backdrop here instead of going invisible
// on the panel's plain white row.
function ChoicePreviewChips({ zone, types, background, iconAppearance, isAuthentic, useNetworkAccent }: { zone: ButtonZoneStyle; types: string[]; background: (type: string) => string; iconAppearance: "brand" | "minimal"; isAuthentic: boolean; useNetworkAccent: boolean }) {
  return (
    <span className="v2-choice-preview" aria-hidden="true">
      {types.map((type, index) => {
        const bg = background(type);
        const text = contrastTextColor(bg);
        return (
          <span key={type} className="v2-choice-preview-chip" style={{ ...buttonCollectionStyle(zone.collection, bg, text, index, type, isAuthentic, useNetworkAccent), width: 30, height: 30, borderRadius: Math.max(6, zone.radius * .32) }}>
            <span style={buttonIconStyle(zone.collection, bg, 16, type, iconAppearance, isAuthentic, useNetworkAccent)}>
              <ActionTypeIcon type={type} brandMark={iconAppearance === "brand" && !(isAuthentic && hasAuthenticLook(type))} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="v2-color"><span>{label}</span><input type="color" value={value} onChange={(e)=>onChange(e.target.value)}/><code>{value.toUpperCase()}</code></label>; }
function Range({label,min,max,step=1,value,onChange}:{label:string;min:number;max:number;step?:number;value:number;onChange:(v:number)=>void}) { const scaledPercent=max<=3; const percent=scaledPercent||label==="Horizontal"||label==="Vertical"; const pixels=!percent&&(label==="Tamaño"||label==="Borde"||label.includes("Alto")||label.includes("Espaciado")||label.includes("ícono")||label.includes("texto")); return <label className="v2-range"><span>{label}<b>{Math.round(value*(scaledPercent?100:1))}{percent?"%":pixels?" px":""}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(Number(e.target.value))}/></label>; }
