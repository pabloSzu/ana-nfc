"use client";

import Link from "next/link";
import LandingSeparator from "@/components/landing-separator";
import { startTransition, useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type FormEvent, type MouseEvent, type ReactNode, type RefObject, type SetStateAction } from "react";
import { ActionTypeIcon, hasCustomActionIcon } from "@/components/action-icons";
import { FiLink } from "react-icons/fi";
import { IconEye, IconQrCode } from "@/components/icons";
import DeleteLandingButton from "@/app/admin/delete-landing-button";
import LandingRenderer, { LandingPhotoBackground, type LandingEditControls } from "@/components/landing-renderer";
import ContactSaveIcon from "@/components/contact-save-icon";
import ScaledPhoneCanvas from "@/components/scaled-phone-canvas";
import { compressImage } from "@/lib/compress-image";
import { headerCardOn, parseDistribution, recommendedContactCoverPattern, type DistributionStyle, QUICK_SOCIALS, quickSocialHref, type QuickSocial, AUTO_COLORS, contrastTextColor, hexToRgba, getAllActions, parseCoverStyle, parseLogoStyle, logoBackgroundColor, logoBorderRadius, logoFrameStyle, logoInitials, logoLetterSize, resolveTextFont, FONT_OPTIONS, COVER_SIZE_EXTRA, type BackgroundPosition, type ButtonZoneStyle, type CoverStyle, type LogoStyle, type SubtitleStyle, type TitleStyle } from "@/lib/landing-catalog";
import FontPicker from "../font-picker";
import { FontLinks, getFontWeights, LogoInitials, recommendedButtonTypography, resolveFontWeight } from "@/lib/fonts";
import IconPicker from "../icon-picker";
import { DESIGN_PRESETS_V2, buttonCollectionStyle, buttonIconStyle, instagramAssetMode, recommendedIconAppearance, resolveButtonColors, shouldUseBrandMark, youtubeMarkSurfaceColor, type DesignPreset } from "@/lib/design-presets";
import { ThemeSceneLayer, useSharedTheme } from "@/components/theme-scene";
import ImageAdjustDialog, { type ImageKind, type ImagePlacement } from "./image-adjust-dialog";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import PendingSubmitButton from "@/components/pending-submit-button";

type ButtonItem = { id: string; type: string; title: string; subtitle: string; url: string; message: string; icon: string; icon_url: string; icon_fit: "contain" | "cover"; icon_scale: number; icon_background_color: string; background_color: string; background_gradient_to: string; text_color: string; use_auto_color: boolean; position: number };
type LandingDraft = {
  id: string; slug: string; business_name: string; business_type?: string | null; description?: string | null; logo_url?: string | null; primary_color?: string | null;
  background_color?: string | null; background_type?: string | null; background_gradient_to?: string | null; background_image_url?: string | null;
  text_color?: string | null; text_panel?: boolean | null; text_panel_color?: string | null; font_pair?: string | null; button_font?: string | null;
  published?: boolean | null; buttonZone: ButtonZoneStyle; titleStyle: TitleStyle; subtitleStyle: SubtitleStyle; logoStyle: LogoStyle; bgPosition: BackgroundPosition;
  cover_image_url?: string | null; coverStyle: CoverStyle;
};
type Panel = "templates" | "buttons" | "background" | "cover" | "settings" | "contact" | "contact-design" | "contact-name" | "contact-role" | "contact-company" | "socials" | "distribution" | "title" | "subtitle" | "logo" | "add" | { buttonId: string } | null;
type BackgroundTab = "color" | "gradient" | "image";
type DeviceMode = "small" | "standard" | "large";
type SaveAction = (formData: FormData) => void | Promise<void>;
type ImageEditorDraft = { kind: ImageKind; src: string; file?: File; initial: ImagePlacement; coverFrame?: { width: number; height: number } };

const SIZES = [
  { label: "Chico", patch: { height: 44, textSize: 13, iconSize: 25, gap: 6 } },
  { label: "Medio", patch: { height: 52, textSize: 14, iconSize: 29, gap: 9 } },
  { label: "Grande", patch: { height: 60, textSize: 16, iconSize: 32, gap: 12 } },
];
const BRAND_BUTTON_TYPES = new Set(["whatsapp", "instagram", "tiktok", "facebook", "linkedin", "youtube", "spotify", "telegram", "mercadopago", "maps", "review"]);
const PDF_TITLE_OPTIONS = ["Ver CV", "Ver catálogo", "Ver menú", "Ver portfolio"];
const DEVICE_OPTIONS: { id: DeviceMode; label: string; size: string; width: number }[] = [
  { id: "small", label: "Chico", size: "360 px", width: 360 },
  { id: "standard", label: "Común", size: "390 px", width: 390 },
  { id: "large", label: "Grande", size: "430 px", width: 430 },
];
function draftDisplayTitle(draft: LandingDraft): string {
  return draft.business_type === "contact" ? draft.business_name : draft.titleStyle.headline || draft.business_name;
}

function useDismissibleFontPicker(open: boolean, setOpen: Dispatch<SetStateAction<boolean>>, buttonRef: RefObject<HTMLButtonElement | null>) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [buttonRef, open, setOpen]);
  return rootRef;
}
const CONTACT_LOOKS = [
  { id: "essential", name: "Esencial", description: "Cálida y directa; tus datos son protagonistas.", layout: "card", accent: "#343d31", backdrop: "#e9eae2", surface: "#faf7ef", ink: "#243028", secondary: "#47505f", font: "modern", size: 28, weight: 700, avatarSize: 104, shape: "round", initials: "one", actions: "shortcuts" },
  { id: "editorial", name: "Editorial", description: "Tipografía con carácter y retrato integrado.", layout: "card", accent: "#46372f", backdrop: "#e9e3dc", surface: "#f3efea", ink: "#433b35", secondary: "#665f59", font: "domine", size: 38, weight: 500, avatarSize: 104, shape: "square", initials: "one", actions: "shortcuts" },
  { id: "professional", name: "Profesional", description: "Ficha ordenada para trabajo y servicios.", layout: "document", accent: "#163b49", backdrop: "#e8eff0", surface: "#ffffff", ink: "#202637", secondary: "#47505f", font: "manrope", size: 28, weight: 700, avatarSize: 80, shape: "round", initials: "one", actions: "details" },
  { id: "studio", name: "Estudio", description: "Azul intenso, retrato y composición creativa.", layout: "card", accent: "#153bb3", backdrop: "#e8e5df", surface: "#fbf8f2", ink: "#102f94", secondary: "#30416c", font: "manrope", size: 40, weight: 800, avatarSize: 136, shape: "sharp", initials: "two", actions: "shortcuts" },
  { id: "monogram", name: "Monograma", description: "Verde profundo y presencia, incluso sin foto.", layout: "card", accent: "#173c30", backdrop: "#e5dfd0", surface: "#f8f4e9", ink: "#173c30", secondary: "#756345", font: "classic", size: 37, weight: 500, avatarSize: 136, shape: "sharp", initials: "two", actions: "shortcuts" },
  { id: "impact", name: "Impacto", description: "Oscura, moderna y con acentos vibrantes.", layout: "card", accent: "#c8f244", backdrop: "#06111f", surface: "#0d2037", ink: "#f6f8fb", secondary: "#b7c6da", font: "manrope", size: 38, weight: 800, avatarSize: 136, shape: "square", initials: "two", actions: "details" },
] as const;
type ContactLook = (typeof CONTACT_LOOKS)[number];

function contactLookPatch(draft: LandingDraft, look: ContactLook): Partial<LandingDraft> {
  return {
    primary_color: look.accent,
    background_type: "color",
    background_color: look.backdrop,
    button_font: "minimal",
    buttonZone: { ...draft.buttonZone, contactTheme: look.id, contactLayout: look.layout, contactDensity: "balanced", contactActionStyle: look.actions, contactSurfaceColor: undefined, contactResolvedSurface: undefined, contactResolvedInk: undefined, contactCoverColor: undefined, contactCoverPattern: recommendedContactCoverPattern(look.id), contactSaveColor: undefined, contactSaveVariant: "solid" },
    titleStyle: { ...draft.titleStyle, font: look.font, italic: false, size: look.size, color: look.ink, weight: look.weight, letterSpacing: 0, eyebrowFont: look.font, eyebrowItalic: false, eyebrowSize: 14, eyebrowColor: look.secondary, bgMode: "none" },
    subtitleStyle: { ...draft.subtitleStyle, font: "minimal", italic: false, size: 14, color: look.secondary, bgMode: "none" },
    logoStyle: { ...draft.logoStyle, shape: look.shape, initials: look.initials, backgroundMode: "auto", borderWidth: look.id === "impact" ? 4 : 0, borderColor: look.id === "impact" ? look.accent : "#ffffff", shadow: "none", size: look.avatarSize },
    coverStyle: { ...draft.coverStyle, mode: "banner", size: "medium" },
  };
}

function contactLookVisualParts(draft: LandingDraft) {
  const { buttonZone, titleStyle, subtitleStyle, logoStyle, coverStyle } = draft;
  return {
    "Colores y fondo exterior": [draft.primary_color, draft.background_type, draft.background_color, buttonZone.contactSurfaceColor, buttonZone.contactResolvedSurface, buttonZone.contactResolvedInk, buttonZone.contactCoverColor, buttonZone.contactCoverPattern, buttonZone.contactSaveColor, buttonZone.contactSaveVariant],
    "Fuentes y estilos de texto": [draft.button_font, titleStyle.font, titleStyle.italic, titleStyle.size, titleStyle.color, titleStyle.weight, titleStyle.eyebrowFont, titleStyle.eyebrowItalic, titleStyle.eyebrowSize, titleStyle.eyebrowColor, titleStyle.bgMode, subtitleStyle.font, subtitleStyle.italic, subtitleStyle.size, subtitleStyle.color, subtitleStyle.bgMode],
    "Forma y tamaño de la foto de perfil": [logoStyle.shape, logoStyle.initials, logoStyle.borderWidth, logoStyle.borderWidth > 0 ? logoStyle.borderColor : null, logoStyle.shadow, logoStyle.size],
    "Presentación de la tarjeta": [buttonZone.contactLayout, buttonZone.contactDensity, buttonZone.contactActionStyle],
    "Presentación de la portada": [coverStyle.mode, coverStyle.size],
  };
}

function changedContactLookParts(current: LandingDraft, reference: LandingDraft): string[] {
  const currentParts = contactLookVisualParts(current);
  const referenceParts = contactLookVisualParts(reference);
  return Object.keys(currentParts).filter((part) => JSON.stringify(currentParts[part as keyof typeof currentParts]) !== JSON.stringify(referenceParts[part as keyof typeof referenceParts]));
}
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
  { id: "glow", label: "Glow", patch: { borderWidth: 5, borderColor: "#ffffff", shadowColor: "#ffffff", shadow: "glow" } },
  // Brutalista: solid border + a hard, unblurred offset shadow — same recipe the button zone
  // uses for collection: "brutal"/"retro" (lib/design-presets.ts), only down-and-right, never
  // a shadow all around.
  { id: "hard", label: "Brutalista", patch: { borderWidth: 3, borderColor: "#0a0a0a", shadowColor: "#0a0a0a", shadow: "hard" } },
];
type LogoTreatment = "template" | "clean" | "badge" | "card" | "highlight" | "brutal";

// Brutalismo/Neobrutalismo get their own dedicated treatment — a hard, unblurred offset shadow
// with a solid dark border, matching the exact same recipe their buttons already use
// (collection: "brutal"/"retro" in lib/design-presets.ts). Every other template previously
// mapped these to "card" (a soft-shadowed white-bordered tile), which looked visibly out of
// place sitting right above buttons with crisp black sticker-shadows.
function logoTreatmentPatch(treatment: LogoTreatment, templateId = "minimal"): Partial<LogoStyle> {
  if (treatment === "template") {
    // "brutal" (solid offset shadow) moved off Brutalismo/Neobrutalismo — at the user's request,
    // those two now get the plain "clean" look instead — onto Minimalismo and Firma de Marca,
    // which didn't have a distinctive logo treatment of their own before.
    const recommended: Record<string, Exclude<LogoTreatment, "template">> = { minimal: "brutal", brutalism: "clean", neobrutal: "clean", glass: "badge", elegant: "badge", corporate: "card", vibrant: "highlight", natural: "badge", pastel: "badge", neon: "highlight", creator: "card", "brand-signature": "brutal" };
    return { ...logoTreatmentPatch(recommended[templateId] || "badge", templateId), treatment: "template" };
  }
  // Neobrutalismo's own description promises "bordes marcados" — going fully borderless (like
  // Brutalismo now does) undercuts that, so it keeps a plain border here with no shadow.
  if (treatment === "clean") return { treatment, borderWidth: templateId === "neobrutal" ? 3 : 0, borderColor: "#191724", shadow: "none", backgroundMode: "auto" };
  if (treatment === "card") return { treatment, shape: "square", borderWidth: 2, borderColor: "#ffffff", shadow: "soft", backgroundMode: "auto" };
  if (treatment === "highlight") return { treatment, shape: "round", borderWidth: 5, borderColor: "#ffffff", shadowColor: "#ffffff", shadow: "glow", backgroundMode: "auto" };
  // backgroundMode stays "custom" + white here on purpose: both brutalism and neobrutal's
  // accent color is near-black (#0a0a0a / #1a1a1a), same as their border/shadow color — with
  // "auto" background (= primary color) the border and shadow silently blend into the fill,
  // and the only visible cue was the shadow's own offset. A fixed white plate is what the
  // border/shadow are meant to sit on, matching how a "brutal" sticker actually reads.
  if (treatment === "brutal") { const edge = templateId === "neobrutal" ? "#191724" : "#0a0a0a"; return { treatment, shape: templateId === "neobrutal" ? "square" : "sharp", borderWidth: templateId === "neobrutal" ? 2 : 3, borderColor: edge, shadowColor: edge, shadow: "hard", backgroundMode: "custom", fallback: "#ffffff" }; }
  // "badge" is the default look (glass/elegant/natural/pastel). Glassmorfismo's accent is pure
  // white — its buttons/page rely on a frosted-glass effect over a vivid background, not a
  // solid fill — so a white border on an auto (= white) background is the same "border blends
  // into its own fill" bug as brutalism. A soft dark ring instead, only for that template.
  // Brand Stage has the same white accent, but its page is near-black, so a dark ring would vanish
  // into the background instead — a silver ring reads against both the white plate and the page.
  if (templateId === "brand-stage") return { treatment, shape: "round", borderWidth: 4, borderColor: "#a3acbe", shadow: "soft", backgroundMode: "auto" };
  return { treatment, shape: "round", borderWidth: 3, borderColor: templateId === "glass" ? "#2c2c33" : "#ffffff", shadow: "soft", backgroundMode: "auto" };
}

export default function EditorV2({ landing, initialButtons, newlyCreatedContact = false, saveAction, publishAction, deleteLandingAction }: { landing: LandingDraft; initialButtons: ButtonItem[]; newlyCreatedContact?: boolean; saveAction: SaveAction; publishAction: SaveAction; deleteLandingAction: SaveAction }) {
  const [draft, setDraft] = useState(landing);
  const [buttons, setButtons] = useState(initialButtons);
  const [panel, setPanel] = useState<Panel>(landing.business_type === "contact" && !newlyCreatedContact ? null : "templates");
  const [bgTab, setBgTab] = useState<BackgroundTab>("color");
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState<DeviceMode>("standard");
  const [dirty, setDirty] = useState(false);
  const [deletedButton, setDeletedButton] = useState<{ button: ButtonItem; index: number } | null>(null);
  const restoreButtonRef = useRef<HTMLButtonElement>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingContactLook, setPendingContactLook] = useState<{ id: ContactLook["id"]; hidesBackgroundPhoto: boolean } | null>(null);
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
  const [cvFileName, setCvFileName] = useState("");
  const [cvFileError, setCvFileError] = useState("");
  const [cvPreviewUrl, setCvPreviewUrl] = useState("");
  const cvPreviewUrlRef = useRef("");
  const [cvUploading, setCvUploading] = useState(false);
  const [iconUploadingId, setIconUploadingId] = useState("");
  const [iconUploadError, setIconUploadError] = useState<{ buttonId: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageEditor, setImageEditor] = useState<ImageEditorDraft | null>(null);
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

  useEffect(() => () => {
    if (cvPreviewUrlRef.current) URL.revokeObjectURL(cvPreviewUrlRef.current);
  }, []);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [panel]);

  // Clicking the element whose panel is ALREADY open used to do nothing at all: setPanel with
  // the same value bails out of a re-render, so the effect above never re-ran and a panel you'd
  // scrolled down stayed exactly where you left it — it read as a dead click. Scrolling here
  // covers that case for every selector, smoothly so the panel visibly answers the click.
  function selectPanel(next: Panel) {
    const same = typeof next === "object" && next && typeof panel === "object" && panel
      ? next.buttonId === panel.buttonId
      : next === panel;
    if (same) panelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setPanel(next);
  }

  function revealExpandedSection(event: MouseEvent<HTMLElement>) {
    const summary = (event.target as Element).closest("summary");
    const details = summary?.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;
    requestAnimationFrame(() => {
      const container = panelRef.current;
      if (!container || !summary || !details.open || !container.contains(details)) return;
      const headerHeight = container.querySelector(".v2-panel-head")?.getBoundingClientRect().height || 0;
      const top = summary.getBoundingClientRect().top - container.getBoundingClientRect().top;
      if (top > headerHeight + 12) container.scrollTo({ top: container.scrollTop + top - headerHeight - 12, behavior: "smooth" });
    });
  }

  // Existing cards open on the preview. A newly created contact card starts in the template
  // picker, which is a compact dock below the preview on mobile rather than a takeover.
  // General landings keep their previous desktop behavior.
  useEffect(() => {
    if (window.innerWidth <= 840 && !newlyCreatedContact) setPanel(null);
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
  const change = (patch: Partial<LandingDraft>) => {
    const titleColorChanged = patch.titleStyle?.color !== undefined && patch.titleStyle.color !== draft.titleStyle.color;
    let protectedPatch: Partial<LandingDraft> = titleColorChanged && !patch.coverStyle
      ? { ...patch, coverStyle: { ...draft.coverStyle, overlayColor: draft.coverStyle.overlayColor || contrastTextColor(draft.titleStyle.color) } }
      : patch;
    const nextLogoSize = patch.logoStyle?.size;
    const distribution = parseDistribution(draft.buttonZone.distribution, draft.buttonZone.layout);
    if (draft.business_type !== "contact" && draft.coverStyle.enabled && draft.coverStyle.mode === "banner" && distribution.coverHeight !== undefined && nextLogoSize !== undefined && nextLogoSize !== draft.logoStyle.size) {
      protectedPatch = {
        ...protectedPatch,
        buttonZone: { ...draft.buttonZone, ...protectedPatch.buttonZone, distribution: { ...distribution, coverHeight: distribution.coverHeight + (nextLogoSize - draft.logoStyle.size) / 2 } },
      };
    }
    commitContinuous();
    patchDraft(protectedPatch);
  };
  const changeZone = (patch: Partial<ButtonZoneStyle>) => change({ buttonZone: { ...draft.buttonZone, ...patch } });
  const patchButtons = (updater: (current: ButtonItem[]) => ButtonItem[]) => { setButtons(updater); setDirty(true); };
  const changeButton = (id: string, patch: Partial<ButtonItem>) => { commitContinuous(); patchButtons((current) => current.map((button) => button.id === id ? { ...button, ...patch } : button)); };
  const uploadButtonIcon = async (buttonId: string, file: File) => {
    setIconUploadError(null);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setIconUploadError({ buttonId, message: "Elegí una imagen PNG, JPG o WebP." });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setIconUploadError({ buttonId, message: "El ícono no puede superar 3 MB." });
      return;
    }
    setIconUploadingId(buttonId);
    try {
      const optimized = await compressImage(file, 512, .9);
      const supabase = createBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Tu sesión venció. Volvé a ingresar antes de subir el ícono.");
      const extension = optimized.type === "image/jpeg" ? "jpg" : optimized.type === "image/webp" ? "webp" : "png";
      const path = `${authData.user.id}/${draft.id}/button-icon-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, optimized, { contentType: optimized.type, upsert: false });
      if (uploadError) throw new Error("No se pudo subir el ícono. Probá de nuevo.");
      const publicUrl = supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
      commitDiscrete();
      patchButtons((current) => current.map((button) => button.id === buttonId ? { ...button, icon: "", icon_url: publicUrl, icon_fit: "contain", icon_scale: 1 } : button));
    } catch (error) {
      setIconUploadError({ buttonId, message: error instanceof Error ? error.message : "No se pudo subir el ícono." });
    } finally {
      setIconUploadingId("");
    }
  };
  const changeContactAction = (type: "phone" | "email" | "whatsapp", value: string) => {
    commitContinuous();
    const newId = `new-${crypto.randomUUID()}`;
    patchButtons((current) => {
      const existing = current.find((button) => button.type === type);
      if (!value.trim()) return current.filter((button) => button.type !== type);
      if (existing) return current.map((button) => button.id === existing.id ? { ...button, url: value } : button);
      const def = actionDefs.find((action) => action.type === type)!;
      return [...current, { id: newId, type, title: def.label, subtitle: "", url: value, message: type === "whatsapp" ? "Hola, quiero hacer una consulta." : "", icon: "", icon_url: "", icon_fit: "contain", icon_scale: 1, icon_background_color: "", background_color: "#1f2937", background_gradient_to: "", text_color: "#ffffff", use_auto_color: true, position: current.length }];
    });
  };
  const selectCvFile = (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024 || !/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) {
      if (cvPreviewUrlRef.current) URL.revokeObjectURL(cvPreviewUrlRef.current);
      cvPreviewUrlRef.current = "";
      setCvPreviewUrl("");
      setCvFileError("Elegí un PDF de hasta 10 MB.");
      setCvFileName("");
      const input = document.getElementById("v2-cv-file") as HTMLInputElement | null;
      if (input) input.value = "";
      return;
    }
    setCvFileError("");
    setCvFileName(file.name);
    if (cvPreviewUrlRef.current) URL.revokeObjectURL(cvPreviewUrlRef.current);
    cvPreviewUrlRef.current = URL.createObjectURL(file);
    setCvPreviewUrl(cvPreviewUrlRef.current);
    if (buttons.some((button) => button.type === "cv")) { setDirty(true); return; }
    commitDiscrete();
    const id = `new-${crypto.randomUUID()}`;
    patchButtons((current) => [...current, { id, type: "cv", title: "Ver CV / portfolio", subtitle: "Documento PDF", url: "", message: "", icon: "", icon_url: "", icon_fit: "contain", icon_scale: 1, icon_background_color: "", background_color: "#5754ae", background_gradient_to: "", text_color: "#ffffff", use_auto_color: true, position: current.length }]);
  };
  const clearSelectedCvFile = () => {
    const input = document.getElementById("v2-cv-file") as HTMLInputElement | null;
    if (input) input.value = "";
    setCvFileName("");
    setCvFileError("");
    if (cvPreviewUrlRef.current) URL.revokeObjectURL(cvPreviewUrlRef.current);
    cvPreviewUrlRef.current = "";
    setCvPreviewUrl("");
  };
  const removeCv = () => {
    clearSelectedCvFile();
    const cv = buttons.find((button) => button.type === "cv");
    if (cv) deleteButton(cv.id);
  };

  function deleteButton(id: string) {
    const index = buttons.findIndex((button) => button.id === id);
    if (index < 0) return;
    if (buttons[index].type === "cv") clearSelectedCvFile();
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
      background_type: preset.background.startsWith("linear-gradient") ? "gradient" : "color",
      background_color: preset.bg1, background_gradient_to: preset.bg2,
      buttonZone: {
        ...draft.buttonZone,
        ...preset.buttonZone,
        ...recommendedButtonTypography(preset.buttonFont),
        textColor: undefined,
        contentAlign: preset.buttonZone.contentAlign,
        contentAlignMode: "auto",
        colorMode: preset.buttonZone.colorMode,
        oneColor: preset.oneColor,
        colorModeManual: false,
        iconAppearance: recommendedIconAppearance(preset.buttonZone.collection),
        templateId: id,
        distribution: parseDistribution(preset.buttonZone.distribution, preset.buttonZone.layout),
        headerCard: preset.buttonZone.layout === "profile-card",
      },
      titleStyle: { ...draft.titleStyle, ...preset.title, color: preset.foreground, bgMode: "none", letterSpacing: undefined, eyebrowColor: undefined, eyebrowSize: 10, eyebrowWeight: 600 },
      subtitleStyle: { ...draft.subtitleStyle, ...preset.subtitle, color: preset.foreground, bgMode: "none", letterSpacing: undefined },
      logoStyle: parseLogoStyle({ ...logoTreatmentPatch("template", id), ...preset.logo, zoom: draft.logoStyle.zoom, x: draft.logoStyle.x, y: draft.logoStyle.y }),
      coverStyle: draft.business_type === "contact" ? draft.coverStyle : { ...draft.coverStyle, enabled: false },
    });
    // Every template card applies its complete visual design, including its button colors.
    // Content and uploaded images stay intact; one undo restores the previous appearance.
    patchButtons((current) => current.map((button) => ({ ...button, use_auto_color: true, background_gradient_to: "", icon_background_color: "" })));
  }

  function applyContactLook(id: (typeof CONTACT_LOOKS)[number]["id"]) {
    const look = CONTACT_LOOKS.find((item) => item.id === id);
    if (!look) return;
    commitDiscrete();
    patchDraft(contactLookPatch(draft, look));
  }

  function requestContactLook(id: ContactLook["id"]) {
    const look = CONTACT_LOOKS.find((item) => item.id === id);
    if (!look) return;
    const currentLook = CONTACT_LOOKS.find((item) => item.id === draft.buttonZone.contactTheme);
    const untouchedNewCard = newlyCreatedContact && changedContactLookParts(draft, landing).length === 0;
    const reference = currentLook ? { ...draft, ...contactLookPatch(draft, currentLook) } as LandingDraft : { ...draft, ...contactLookPatch(draft, look) } as LandingDraft;
    const affected = changedContactLookParts(draft, reference);
    if (id === draft.buttonZone.contactTheme && affected.length === 0) return;
    if (untouchedNewCard || affected.length === 0) { applyContactLook(id); return; }
    setPendingContactLook({ id, hidesBackgroundPhoto: draft.background_type === "image" && Boolean(backgroundImage) });
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
        ...recommendedButtonTypography(preset.buttonFont),
        textColor: undefined,
        contentAlign: preset.buttonZone.contentAlign,
        contentAlignMode: "auto",
        templateId: draft.buttonZone.templateId,
        distribution: draft.buttonZone.distribution,
        // A button look carries its template's layout along, but the header card is a header
        // choice — switching just the buttons shouldn't add or remove it.
        headerCard: headerCardOn(draft.buttonZone),
        colorMode: preset.buttonZone.colorMode,
        oneColor: preset.oneColor,
        colorModeManual: false,
        iconAppearance: recommendedIconAppearance(preset.buttonZone.collection),
      },
    });
  }

  function resetButtonOverrides() {
    if (!buttons.some((button) => !button.use_auto_color || button.background_gradient_to || button.icon_background_color)) return;
    commitDiscrete();
    patchButtons((current) => current.map((button) => ({ ...button, use_auto_color: true, background_gradient_to: "", icon_background_color: "" })));
  }

  function addButton(type: string) {
    if (type === "cv" || draft.business_type === "contact" && type === "website") {
      const existing = buttons.find((button) => button.type === type);
      if (existing) { setPanel({ buttonId: existing.id }); return; }
    }
    const def = actionDefs.find((item) => item.type === type) || actionDefs[actionDefs.length - 1];
    const id = `new-${crypto.randomUUID()}`;
    const button: ButtonItem = { id, type: def.type, title: type === "cv" ? "Ver archivo PDF" : def.label, subtitle: "", url: "", message: def.message ? "Hola, quiero hacer una consulta." : "", icon: "", icon_url: "", icon_fit: "contain", icon_scale: 1, icon_background_color: "", background_color: "#1f2937", background_gradient_to: "", text_color: "#ffffff", use_auto_color: true, position: buttons.length };
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

  const backgroundImage = bgPreview || draft.background_image_url || "";
  const logoImage = logoPreview || (!logoRemoved ? draft.logo_url || "" : "");
  const coverImage = coverPreview || (!coverRemoved ? draft.cover_image_url || "" : "");

  async function openImageEditor(kind: ImageKind, file?: File) {
    const current = kind === "background" ? backgroundImage : kind === "logo" ? logoImage : coverImage;
    if (!file && !current) return;
    const compressed = file ? await compressImage(file, kind === "logo" ? 900 : kind === "cover" ? 2000 : 1600, kind === "cover" ? .9 : .82) : undefined;
    const src = compressed ? URL.createObjectURL(compressed) : current;
    const style = kind === "background" ? draft.bgPosition : kind === "logo" ? draft.logoStyle : draft.coverStyle;
    const coverElement = kind === "cover"
      ? document.querySelector<HTMLElement>(draft.business_type === "contact" ? ".is-contact-editor .contact-hero-art" : ".v2-phone [data-landing-cover]")
      : null;
    const coverFrame = coverElement ? { width: coverElement.offsetWidth, height: coverElement.offsetHeight } : undefined;
    setImageEditor({ kind, src, file: compressed, coverFrame, initial: compressed ? { zoom: 1, x: 50, y: 50 } : { zoom: style.zoom, x: style.x, y: style.y } });
  }

  function cancelImageEditor() {
    if (imageEditor?.file) URL.revokeObjectURL(imageEditor.src);
    setImageEditor(null);
  }

  function applyImageEditor(placement: ImagePlacement) {
    if (!imageEditor) return;
    const { kind, file, src } = imageEditor;
    if (file) {
      const input = document.getElementById(`v2-${kind === "cover" ? "cover" : kind === "logo" ? "logo" : "background"}-file`) as HTMLInputElement | null;
      if (input) { const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files; }
      if (kind === "background") { if (bgPreview) URL.revokeObjectURL(bgPreview); setBgPreview(src); }
      if (kind === "logo") { if (logoPreview) URL.revokeObjectURL(logoPreview); setLogoPreview(src); }
      if (kind === "cover") { if (coverPreview) URL.revokeObjectURL(coverPreview); setCoverPreview(src); }
    }
    if (kind === "background") change({ background_type: "image", bgPosition: { ...draft.bgPosition, ...placement } });
    if (kind === "logo") { setLogoRemoved(false); change({ logoStyle: { ...draft.logoStyle, ...placement } }); }
    if (kind === "cover") { setCoverRemoved(false); change({ coverStyle: { ...draft.coverStyle, ...placement, enabled: true, ...(draft.business_type === "contact" ? { mode: "banner", overlay: coverImage ? draft.coverStyle.overlay : 0 } : {}) } }); }
    setImageEditor(null);
  }
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
  const imageEditorCoverCanvasHeight = imageEditor?.kind === "cover" && draft.business_type !== "contact" && draft.coverStyle.stableSizing
    ? (imageEditor.coverFrame?.height || parseDistribution(draft.buttonZone.distribution, draft.buttonZone.layout).coverHeight || 0) + COVER_SIZE_EXTRA.large - COVER_SIZE_EXTRA[draft.coverStyle.size]
    : undefined;
  // Wires the editor's own state (selection, drag) into LandingRenderer's `edit` prop — the
  // canvas below is the same component the public page uses, not a parallel re-implementation,
  // so "what you see while editing" and "what gets published" can't drift apart anymore.
  const editControls: LandingEditControls = {
    selected: panel,
    draggingId,
    onSelectTemplates: () => selectPanel("templates"),
    onSelectSettings: () => selectPanel("settings"),
    onSelectContact: () => selectPanel("contact"),
    onSelectContactDesign: () => selectPanel("contact-design"),
    onSelectSocials: () => selectPanel("socials"),
    onSelectDistribution: () => selectPanel("distribution"),
    onSelectLogo: () => selectPanel("logo"),
    onSelectTitle: () => selectPanel(draft.business_type === "contact" ? "contact-name" : "title"),
    onSelectRole: () => selectPanel(draft.business_type === "contact" ? "contact-role" : "title"),
    onSelectSubtitle: () => selectPanel(draft.business_type === "contact" ? "contact-company" : "subtitle"),
    onSelectBackground: () => { setBgTab(draft.background_type === "image" ? "image" : draft.background_type === "gradient" ? "gradient" : "color"); selectPanel("background"); },
    onSelectCover: () => selectPanel("cover"),
    onSelectZone: () => selectPanel(draft.business_type === "contact" ? "add" : "buttons"),
    onSelectButton: (id) => selectPanel({ buttonId: id }),
    onDeleteButton: deleteButton,
    onAddButton: () => selectPanel("add"),
    onButtonRef: (id, element) => { if (element) buttonElements.current.set(id, element); else buttonElements.current.delete(id); },
    onDragStart: (clientY, id) => startDrag(clientY, id),
  };

  async function handleSaveSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const cvInput = form.querySelector<HTMLInputElement>("#v2-cv-file");
    const file = cvInput?.files?.[0];
    if (iconUploadingId) {
      event.preventDefault();
      return;
    }
    if (!file) {
      if (saving) event.preventDefault();
      else setSaving(true);
      return;
    }
    event.preventDefault();
    if (cvUploading || saving) return;
    if (!buttons.some((button) => button.type === "cv")) { setCvFileError("Agregá el botón de CV antes de guardar el archivo."); return; }
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    setCvUploading(true);
    setSaving(true);
    let publicUrl: string;
    try {
      if (file.size > 10 * 1024 * 1024 || !/\.pdf$/i.test(file.name) || (file.type && file.type !== "application/pdf")) throw new Error("Elegí un PDF de hasta 10 MB.");
      if (new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) !== "%PDF-") throw new Error("El archivo no parece ser un PDF válido.");
      const supabase = createBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Tu sesión venció. Volvé a ingresar antes de guardar.");
      const path = `${authData.user.id}/${draft.id}/cv-${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw new Error("No se pudo subir el PDF. Probá de nuevo.");
      publicUrl = supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
    } catch (error) {
      setCvFileError(error instanceof Error ? error.message : "No se pudo subir el PDF.");
      setCvUploading(false);
      setSaving(false);
      return;
    }
    const formData = new FormData(form);
    formData.delete("cv_file");
    formData.set("buttons", JSON.stringify(buttons.map((button) => button.type === "cv" ? { ...button, url: publicUrl } : button)));
    formData.set("return_to", submitter?.name === "return_to" ? submitter.value : `/admin/landings/${draft.id}/editor-v2`);
    startTransition(async () => {
      try { await saveAction(formData); }
      finally { setCvUploading(false); setSaving(false); }
    });
  }

  const contactControlsProps = {
    draft, buttons,
    onChange: change, onActionChange: changeContactAction,
    onEditPhoto: () => selectPanel("logo"), onEditText: (field: "name" | "role" | "company") => selectPanel(`contact-${field}`),
  };
  function removeContactCover() {
    const input = document.getElementById("v2-cover-file") as HTMLInputElement | null;
    if (input) input.value = "";
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setCoverRemoved(true);
    change({ coverStyle: { ...draft.coverStyle, enabled: false } });
  }

  return (
    <main className={`v2-shell${draft.business_type === "contact" ? " is-contact-editor" : ""}`}>
      <form id="v2-save" action={saveAction} onSubmit={handleSaveSubmit}>
        <input type="hidden" name="landing_id" value={draft.id} />
        <input type="hidden" name="business_name" value={draft.business_name} /><input type="hidden" name="description" value={draft.description || ""} />
        <input type="hidden" name="business_type" value={draft.business_type || "custom"} />
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
        <input id="v2-cv-file" hidden type="file" name="cv_file" accept="application/pdf,.pdf" onChange={(event) => selectCvFile(event.target.files?.[0])} />
        <input type="hidden" name="remove_logo_image" value={String(logoRemoved)} />
        <input type="hidden" name="remove_cover_image" value={String(coverRemoved)} />
      </form>

      <header className="v2-topbar">
        <button className="v2-back" type="button" onClick={() => dirty ? setLeaveOpen(true) : location.assign("/admin")}>←</button>
        <div><span>{draft.business_type === "contact" ? "Editor de tarjeta" : "Editor de landing"}</span><strong>{draft.business_name}</strong></div>
        <div className="v2-status"><i className={dirty ? "is-dirty" : ""} />{dirty ? "Cambios sin guardar" : "Todo guardado"}</div>
        <div className="v2-history" data-tick={historyTick}>
          <button type="button" title="Deshacer (Ctrl+Z)" aria-label="Deshacer" disabled={pastRef.current.length === 0} onClick={undo}>↶</button>
          <button type="button" title="Rehacer (Ctrl+Y)" aria-label="Rehacer" disabled={futureRef.current.length === 0} onClick={redo}>↷</button>
        </div>
        <button className="v2-ghost" type="button" onClick={() => { setPanel(draft.business_type === "contact" ? "settings" : panel === "settings" ? null : "settings"); setPreview(false); }}>{draft.business_type === "contact" ? "Publicar" : "Ajustes"}</button>
        <button className="v2-ghost" type="button" onClick={() => { setPreview(!preview); setPanel(preview ? (window.innerWidth <= 840 || draft.business_type === "contact" ? null : "templates") : null); }}>{preview ? "Seguir editando" : "Vista previa"}</button>
        <button className="v2-save" form="v2-save" type="submit" name="return_to" value={`/admin/landings/${draft.id}/editor-v2`} disabled={!dirty || cvUploading || Boolean(iconUploadingId) || saving} aria-busy={saving || Boolean(iconUploadingId)}>{iconUploadingId ? "Subiendo ícono…" : cvUploading ? "Subiendo PDF…" : saving ? "Guardando…" : "Guardar cambios"}</button>
      </header>

      <div className={`v2-workspace ${preview ? "is-preview" : ""} ${panel ? "has-panel" : ""}`}>
        {!preview && panel && <aside ref={panelRef} className="v2-panel" onClickCapture={revealExpandedSection}>
          <div className="v2-panel-head">
            <div><span>{draft.business_type === "contact" ? "Tarjeta personal" : "Paso simple"}</span><h2>{draft.business_type === "contact" && typeof panel === "object" ? "Editar enlace" : draft.business_type === "contact" && panel === "logo" ? "Foto de perfil" : draft.business_type === "contact" && panel === "cover" ? "Portada de la tarjeta" : draft.business_type === "contact" && panel === "add" ? "Agregar un enlace" : draft.business_type === "contact" && panel === "settings" ? "Publicar tarjeta" : draft.business_type === "contact" && panel === "templates" ? "Elegí un diseño" : panelTitle(panel)}</h2></div>
            <button className="v2-panel-close" type="button" onClick={() => setPanel(null)}>×</button>
          </div>
          {draft.business_type === "contact" && panel === "templates" && <button type="button" className="v2-ghost v2-contact-return" onClick={() => setPanel("contact-design")}>← Volver a Diseño</button>}
          {draft.business_type === "contact" && (panel === "contact-name" || panel === "contact-role" || panel === "contact-company") && <button type="button" className="v2-ghost v2-contact-return" onClick={() => setPanel("contact")}>← Volver a Datos</button>}
          {panel === "templates" && (draft.business_type === "contact" ? <ContactLooks selected={draft.buttonZone.contactTheme || "classic"} onApply={requestContactLook} /> : <Templates selected={draft.buttonZone.templateId} onApply={applyPreset} />)}
          {panel === "contact-design" && <ContactDesignControls draft={draft} buttons={buttons} onChange={change} onBackground={() => selectPanel("background")} onTemplates={() => selectPanel("templates")} />}
          {panel === "buttons" && <ButtonDesign draft={draft} buttons={buttons} backgroundImage={backgroundImage} onZone={changeZone} onFont={(button_font) => change({ button_font, buttonZone: { ...draft.buttonZone, fontWeight: resolveFontWeight(button_font, draft.buttonZone.fontWeight ?? recommendedButtonTypography(button_font).fontWeight), letterSpacing: draft.buttonZone.letterSpacing ?? recommendedButtonTypography(button_font).letterSpacing } })} onApplyButtonLook={applyButtonLook} onResetButtonOverrides={resetButtonOverrides} />}
          {panel === "background" && <BackgroundControls draft={draft} tab={bgTab} onTab={setBgTab} onChange={change} onFile={(file) => openImageEditor("background", file)} onAdjust={() => openImageEditor("background")} hasImage={Boolean(backgroundImage)} />}
          {panel === "cover" && <CoverControls draft={draft} coverImage={coverImage} onChange={change} onCoverFile={(file) => openImageEditor("cover", file)} onAdjustCover={() => openImageEditor("cover")} onRemoveCover={removeContactCover} />}
          {panel === "distribution" && (draft.business_type === "contact" ? <ContactDistributionControls draft={draft} onChange={change} /> : <DistributionControls draft={draft} onZone={changeZone} />)}
          {panel === "socials" && <SocialControls links={draft.buttonZone.quickSocials || []} onChange={(quickSocials) => changeZone({ quickSocials })} filled={draft.buttonZone.quickSocialsFilled !== false} onFilled={(quickSocialsFilled) => changeZone({ quickSocialsFilled })} />}
          {panel === "settings" && <SettingsControls draft={draft} buttons={buttons} dirty={dirty} onTypeChange={(business_type) => { if (draft.business_type !== business_type) { commitDiscrete(); patchDraft({ business_type }); } if (business_type === "contact") setPanel("contact"); }} onBrandingChange={(showBranding) => changeZone({ showBranding })} publishAction={publishAction} deleteLandingAction={deleteLandingAction} />}
          {panel === "contact" && <ContactControls {...contactControlsProps} />}
          {(panel === "contact-name" || panel === "contact-role" || panel === "contact-company") && <ContactTextControls field={panel.slice(8) as "name" | "role" | "company"} draft={draft} onChange={change} />}
          {panel === "title" && <TitleControls draft={draft} onChange={change} />}
          {panel === "subtitle" && <SubtitleControls draft={draft} onChange={change} />}
          {panel === "logo" && <LogoControls draft={draft} logoImage={logoImage} onChange={change} onLogo={(file) => openImageEditor("logo", file)} onAdjustLogo={() => openImageEditor("logo")} onRemoveLogo={() => {
            const input = document.getElementById("v2-logo-file") as HTMLInputElement | null;
            if (input) input.value = "";
            if (logoPreview) URL.revokeObjectURL(logoPreview);
            setLogoPreview(null); setLogoRemoved(true); setDirty(true);
          }} />}
          {panel === "add" && <ActionCatalog onAdd={addButton} isContact={draft.business_type === "contact"} />}
          {activeButton && <ButtonControls button={activeButton} draft={draft} cvFileName={cvFileName} cvFileError={cvFileError} iconUploading={iconUploadingId === activeButton.id} iconUploadError={iconUploadError?.buttonId === activeButton.id ? iconUploadError.message : ""} onIconFile={(file) => uploadButtonIcon(activeButton.id, file)} onClearCvFile={clearSelectedCvFile} onChange={(patch) => { setIconUploadError(null); changeButton(activeButton.id, patch); }} onDelete={() => activeButton.type === "cv" ? removeCv() : deleteButton(activeButton.id)} />}
        </aside>}

        <section className={`v2-stage device-${device}`}>
          <ThemeSceneLayer theme={editorTheme} />
          <div className="v2-stage-toolbar"><span>{preview ? "Vista limpia" : "Tamaño de pantalla"}</span><div className="v2-device-switcher">{DEVICE_OPTIONS.map((option) => <button key={option.id} type="button" className={device === option.id ? "active" : ""} title={option.size} onClick={() => setDevice(option.id)}>{option.label}</button>)}</div></div>
          <div className={`v2-phone device-${device}`}>
            <div className="v2-phone-screen" ref={buttonsContainerRef}>
              <ScaledPhoneCanvas className="scaled-phone-canvas" designWidth={DEVICE_OPTIONS.find((option) => option.id === device)?.width} photoBackground={draft.background_type === "image" ? <LandingPhotoBackground landing={rendererLanding} /> : undefined} onScaleChange={(next) => { phoneScaleRef.current = next; }}>
                <LandingRenderer landing={rendererLanding} actions={preview && cvPreviewUrl ? buttons.map((button) => button.type === "cv" ? { ...button, url: cvPreviewUrl } : button) : buttons} edit={preview ? undefined : editControls} editorPreview={preview} externalPhotoBackground={draft.background_type === "image"} />
              </ScaledPhoneCanvas>
            </div>
          </div>
        </section>
      </div>

      {imageEditor && <ImageAdjustDialog key={`${imageEditor.kind}-${imageEditor.src}`} kind={imageEditor.kind} src={imageEditor.src} shape={imageEditor.kind === "logo" ? draft.logoStyle.shape : undefined} contactLogo={imageEditor.kind === "logo" && draft.business_type === "contact"} logoBackground={imageEditor.kind === "logo" ? logoBackgroundColor(draft.logoStyle, draft.primary_color || "#1f2937") : undefined} coverMode={imageEditor.kind === "cover" && draft.business_type === "contact" ? "banner" : draft.coverStyle.mode} contactCoverSize={imageEditor.kind === "cover" && draft.business_type === "contact" ? draft.coverStyle.size : undefined} coverFrameWidth={imageEditor.coverFrame?.width || (draft.buttonZone.contactLayout === "document" ? 384 : 402)} coverFrameHeight={imageEditor.coverFrame?.height} coverCanvasHeight={imageEditorCoverCanvasHeight} coverOverlay={imageEditor.kind === "cover" ? imageEditor.file && !coverImage ? 0 : draft.coverStyle.overlay : undefined} coverOverlayColor={imageEditor.kind === "cover" ? draft.coverStyle.mode === "banner" ? "#000000" : draft.coverStyle.overlayColor || contrastTextColor(draft.titleStyle.color) : undefined} coverFade={imageEditor.kind === "cover" && draft.business_type !== "contact" && draft.coverStyle.mode === "fade" ? draft.coverStyle.fade : undefined} initial={imageEditor.initial} onApply={applyImageEditor} onCancel={cancelImageEditor} />}
      {pendingContactLook && <div className="v2-modal-backdrop"><div className="v2-modal v2-contact-template-confirm" role="dialog" aria-modal="true" aria-labelledby="v2-contact-template-title"><div className="v2-modal-icon">↩</div><h2 id="v2-contact-template-title">¿Aplicar {CONTACT_LOOKS.find((look) => look.id === pendingContactLook.id)?.name}?</h2><p>Se reemplazarán tus ajustes de diseño. Tus datos, enlaces y fotos se conservan.{pendingContactLook.hidesBackgroundPhoto ? " La foto del fondo exterior quedará guardada, pero dejará de mostrarse." : ""} Podés deshacer el cambio.</p><button type="button" className="v2-save" onClick={() => { applyContactLook(pendingContactLook.id); setPendingContactLook(null); }}>Aplicar plantilla</button><button type="button" className="v2-ghost" onClick={() => setPendingContactLook(null)}>Cancelar</button></div></div>}
      {deletedButton && <div className="v2-delete-notice"><span role="status">Botón eliminado: <b>{deletedButton.button.title}</b></span><button ref={restoreButtonRef} type="button" onClick={restoreDeletedButton}>Deshacer</button><button type="button" aria-label="Cerrar aviso" onClick={() => setDeletedButton(null)}>×</button></div>}
      {leaveOpen && <div className="v2-modal-backdrop"><div className="v2-modal"><div className="v2-modal-icon">!</div><h2>Tenés cambios sin guardar</h2><p>Si salís ahora, vas a perder los últimos cambios de diseño.</p><button className="v2-save" form="v2-save" name="return_to" value="/admin">Guardar y salir</button><Link href="/admin" className="v2-danger">Salir sin guardar</Link><button className="v2-ghost" onClick={() => { setLeaveOpen(false); setPreview(false); }}>Seguir editando</button></div></div>}
    </main>
  );
}

function panelTitle(panel: Exclude<Panel, null>) { if (typeof panel === "object") return "Editar botón"; return ({ templates: "Elegí una plantilla", buttons: "Editar todos los botones", background: "Fondo de la página", cover: "Encabezado",settings: "Ajustes de la landing", contact: "Datos de la tarjeta", "contact-design": "Diseño de la tarjeta", "contact-name": "Editar nombre", "contact-role": "Editar cargo", "contact-company": "Editar empresa", socials: "Redes rápidas", distribution: "Distribución", title: "Editar título", subtitle: "Editar subtítulo", logo: "Editar logo", add: "Agregar un botón" } as const)[panel]; }

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
                <span className="template-shot-icon" style={buttonIconStyle(preset.buttonZone.collection, color, 11, example.type, iconAppearance, isAuthentic, useNetworkAccent)}><ActionTypeIcon type={example.type} brandMark={shouldUseBrandMark(preset.buttonZone.collection, example.type, iconAppearance, isAuthentic)} brandBackground={youtubeMarkSurfaceColor(preset.buttonZone.collection, color)} instagramAsset={instagramAssetMode(preset.buttonZone.collection, example.type, iconAppearance)} /></span>
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

function Templates({ selected, onApply }: { selected: string; onApply: (id: string) => void }) {
  return <div className="v2-fields">
    <p className="v2-help">Tocá una plantilla para aplicar su diseño completo. Tus textos, enlaces y fotos subidas se conservan. Podés deshacer el cambio.</p>
    <div className="v2-template-grid">{DESIGN_PRESETS_V2.map((preset) => <button key={preset.id} type="button" className={selected === preset.id ? "selected" : ""} onClick={() => { if (selected !== preset.id) onApply(preset.id); }} aria-pressed={selected === preset.id} aria-label={selected === preset.id ? `Plantilla actual: ${preset.name}` : `Aplicar plantilla ${preset.name}`}><TemplateSwatch preset={preset} /><b>{preset.name}</b><small>{preset.description}</small></button>)}</div>
  </div>;
}

function ContactLooks({ selected, onApply }: { selected: string; onApply: (id: (typeof CONTACT_LOOKS)[number]["id"]) => void }) {
  return <div className="v2-fields">
    <p className="v2-help">Elegí una presentación completa. Tus datos y fotos se conservan; la portada siempre ocupa el mismo espacio, con imagen o sin ella.</p>
    {!CONTACT_LOOKS.some((look) => look.id === selected) && <p className="v2-help">Tu tarjeta usa un diseño anterior. No cambiará hasta que elijas una plantilla.</p>}
    <div className="v2-contact-look-grid">{CONTACT_LOOKS.map((look) => <button type="button" key={look.id} className={`v2-contact-look is-${look.id}${selected === look.id ? " is-selected" : ""}`} aria-pressed={selected === look.id} onClick={() => onApply(look.id)}>
      <span className="v2-contact-look-art" aria-hidden="true"><i className="look-cover"/><i className="look-avatar" data-initials={look.initials}>{look.initials === "two" ? "CM" : "C"}</i><i className="look-name"/><i className="look-line"/><i className="look-action"/></span>
      <strong>{look.name}</strong><small>{look.description}</small>
    </button>)}</div>
  </div>;
}

function CvSourceField({ value, fileName, error, context = "contact", onUrlChange, onClearFile }: { value: string; fileName: string; error: string; context?: "contact" | "landing"; onUrlChange: (value: string) => void; onClearFile: () => void }) {
  const [editingLink, setEditingLink] = useState(false);
  const hasUploadedPdf = /\/storage\/v1\/object\/public\/landing-assets\/[^?#]+\/cv-[^/?#]+\.pdf(?:[?#]|$)/i.test(value);
  return <div className="v2-cv-source">
    <label className="v2-upload" htmlFor="v2-cv-file">{fileName ? "Cambiar PDF seleccionado" : value ? "Reemplazar por un PDF" : "Subir PDF"}</label>
    {fileName ? <div className="v2-cv-selected"><span>PDF listo para guardar: <strong>{fileName}</strong></span><button type="button" onClick={onClearFile}>Elegir un enlace en su lugar</button></div> : hasUploadedPdf && !editingLink ? <div className="v2-cv-selected"><span>Tenés un PDF cargado.</span><a href={value} target="_blank" rel="noopener noreferrer">Ver PDF actual ↗</a><button type="button" onClick={() => setEditingLink(true)}>Usar otro enlace en su lugar</button></div> : <label>{context === "contact" ? "O pegá el enlace a tu CV o portfolio" : "O pegá un enlace al documento"}<input type="url" value={value} placeholder="https://..." onFocus={(event) => { if (hasUploadedPdf) event.target.select(); }} onChange={(event) => onUrlChange(event.target.value)} /></label>}
    {error && <p className="v2-help" role="alert" style={{ margin: 0, color: "#b53232" }}>{error}</p>}
    <p className="v2-help" style={{ margin: 0 }}>El botón abrirá el PDF o enlace para verlo. Si subís un PDF, cualquier persona con el enlace podrá acceder a él.</p>
  </div>;
}

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
        <span className="v2-look-button-icon" style={buttonIconStyle(preset.buttonZone.collection, background, 15, example.type, iconAppearance, isAuthentic, useNetworkAccent)}><ActionTypeIcon type={example.type} brandMark={shouldUseBrandMark(preset.buttonZone.collection, example.type, iconAppearance, isAuthentic)} brandBackground={youtubeMarkSurfaceColor(preset.buttonZone.collection, background)} instagramAsset={instagramAssetMode(preset.buttonZone.collection, example.type, iconAppearance)} /></span>
        <span>{example.label}</span>
        {preset.buttonZone.contentAlign === "center" && <span aria-hidden="true" />}
      </span>;
    })}
  </span>;
}

function ButtonDesign({ draft, buttons, backgroundImage, onZone, onFont, onApplyButtonLook, onResetButtonOverrides }: { draft: LandingDraft; buttons: ButtonItem[]; backgroundImage: string; onZone: (p: Partial<ButtonZoneStyle>) => void; onFont: (font: string) => void; onApplyButtonLook: (id: string) => void; onResetButtonOverrides: () => void }) {
  const zone = draft.buttonZone;
  const alignmentPreset = DESIGN_PRESETS_V2.find((preset) => preset.id === zone.preset) || DESIGN_PRESETS_V2.find((preset) => preset.id === zone.templateId) || DESIGN_PRESETS_V2[0];
  const recommendedIcons = recommendedIconAppearance(zone.collection);
  const customColorCount = buttons.filter((button) => !button.use_auto_color).length;
  const customIconBackgroundCount = buttons.filter((button) => Boolean(button.icon_background_color)).length;
  const customVisualCount = buttons.filter((button) => !button.use_auto_color || button.background_gradient_to || button.icon_background_color).length;
  const selectedSize = SIZES.find((item) => Object.entries(item.patch).every(([key, value]) => zone[key as keyof typeof item.patch] === value))?.label;
  const currentButtonLook = DESIGN_PRESETS_V2.find((preset) => preset.id === zone.preset)?.name || "Personalizado";
  const recommendedSize = DESIGN_PRESETS_V2.find((preset) => preset.id === zone.preset)?.buttonZone;
  const usesRecommendedSize = Boolean(recommendedSize && zone.height === recommendedSize.height && zone.textSize === recommendedSize.textSize && zone.iconSize === recommendedSize.iconSize && zone.gap === recommendedSize.gap);
  const currentFontWeight = zone.fontWeight ?? (zone.collection === "aura" ? 850 : zone.collection === "gummy" ? 800 : 700);
  const hasBrandButtons = buttons.some((button) => BRAND_BUTTON_TYPES.has(button.type));
  const hasPresetIcons = buttons.some((button) => button.type !== "url" && !button.icon);
  const comparisonButtons = buttons.length > 1 ? [buttons[0], buttons.find((button) => button.id !== buttons[0].id && BRAND_BUTTON_TYPES.has(button.type)) || buttons[1]] : buttons;
  const previewTextColor = buttonCollectionStyle(zone.collection, zone.oneColor, contrastTextColor(zone.oneColor)).color;
  const initialTextColor = zone.collection === "aura" ? "#ffffff" : typeof previewTextColor === "string" && /^#[0-9a-f]{6}$/i.test(previewTextColor) ? previewTextColor : contrastTextColor(zone.oneColor);
  const automaticContentColors = Array.from(new Set(buttons.length ? buttons.map((button, index) => {
    const { background, text, isAuthentic, useNetworkAccent } = resolveButtonColors({ zone, type: button.type, position: index, primary: draft.primary_color || "#1f2937", customColor: button.background_color, useAutoColor: button.use_auto_color });
    const renderedColor = buttonCollectionStyle(zone.collection, background, text, index, button.type, isAuthentic, useNetworkAccent).color;
    return (zone.collection === "aura" ? "#ffffff" : typeof renderedColor === "string" && /^#[0-9a-f]{6}$/i.test(renderedColor) ? renderedColor : text).toUpperCase();
  }) : [initialTextColor.toUpperCase()]));
  const contentColorSwatches = zone.textColor ? [zone.textColor.toUpperCase()] : automaticContentColors;
  const contentColorStatus = zone.textColor ? `Personalizado · ${zone.textColor.toUpperCase()}` : buttons.length === 0 ? `Sugerido · ${automaticContentColors[0]}` : automaticContentColors.length === 1 ? `Automático · ${automaticContentColors[0]}` : "Automático · varía por botón";
  return (
    <div className="v2-fields">
      <p className="v2-help" style={{ margin: 0 }}>Cambiar el diseño de los botones aplica también sus tamaños y alineación. Tus textos, enlaces y estilos propios de cada botón se conservan.</p>
      {(customVisualCount > 0 || zone.contentAlignMode === "manual") && <div className="v2-scope-summary has-custom" role="status">
        <b>Personalizaciones activas</b>
        {zone.contentAlignMode === "manual" && <span>Alineación manual: {zone.contentAlign === "center" ? "Centro" : "Izquierda"}. Se reemplaza si elegís otra plantilla.</span>}
        {customVisualCount > 0 && <span>{customVisualCount} {customVisualCount === 1 ? "botón tiene" : "botones tienen"} estilo propio ({[customColorCount > 0 && `${customColorCount} con color`, customIconBackgroundCount > 0 && `${customIconBackgroundCount} con fondo de ícono`].filter(Boolean).join(" · ")}).</span>}
        {customVisualCount > 0 && <button type="button" className="v2-restore-all" onClick={onResetButtonOverrides}>↩ Quitar colores y fondos de ícono propios</button>}
        {customVisualCount > 0 && <span>No cambia textos, enlaces ni íconos elegidos.</span>}
      </div>}
      <details className="v2-button-look-picker" key={zone.preset}>
        <summary><span><strong>Diseño de botones: {currentButtonLook}</strong><small>Elegí otro estilo para toda la botonera</small></span></summary>
        <div className="v2-button-look-content">
          <p className="v2-help">Aplica forma, color, tipografía, tamaño y alineación. Los colores propios de botones individuales se conservan.</p>
          <div className="v2-look-grid">
            {DESIGN_PRESETS_V2.map((preset) => <button type="button" key={preset.id} className={zone.preset === preset.id ? "active" : ""} onClick={() => onApplyButtonLook(preset.id)} aria-pressed={zone.preset === preset.id}>
              <ButtonLookSwatch preset={preset} />
              <b>{preset.name}</b>
            </button>)}
          </div>
        </div>
      </details>
      <fieldset>
        <legend>Regla de color</legend>
        <p className="v2-help" style={{ margin: 0 }}>{buttons.length === 0 ? "Agregá un botón para ver los cambios en la landing." : customColorCount > 0 ? `${customColorCount} ${customColorCount === 1 ? "botón conserva" : "botones conservan"} su color propio. Mirá el resultado en tu landing.` : "Mirá el resultado en tus botones de la landing."}</p>
        <Choice
          active={draft.buttonZone.colorMode === "one"}
          swatch={draft.buttonZone.oneColor}
          title="Un color para todos"
          note={zone.collection === "glass" ? "Todos los botones tendrán el mismo matiz de vidrio." : "Los botones que usan el diseño general tendrán este color."}
          onClick={() => onZone({ colorMode: "one" })}
          preview={<ButtonChoicePreview draft={draft} buttons={comparisonButtons} backgroundImage={backgroundImage} colorMode="one" iconAppearance={zone.iconAppearance} />}
        />
        {draft.buttonZone.colorMode === "one" && <ColorField label="Color de los botones" value={draft.buttonZone.oneColor} onChange={(oneColor) => onZone({ oneColor })} />}
        <Choice
          active={draft.buttonZone.colorMode === "auto"}
          title={hasBrandButtons ? "Cada marca con su color" : "Automático"}
          note={hasBrandButtons ? zone.collection === "glass" ? "Las marcas aportan un matiz al vidrio, no un relleno sólido." : "Las redes usan sus colores de marca." : "Los enlaces personalizados usan un tono neutro; las redes tomarán sus colores si las agregás."}
          onClick={() => onZone({ colorMode: "auto" })}
          preview={<ButtonChoicePreview draft={draft} buttons={comparisonButtons} backgroundImage={backgroundImage} colorMode="auto" iconAppearance={zone.iconAppearance} />}
        />
        <div className="v2-text-color-control">
          <span className={`v2-content-color-swatches count-${Math.min(contentColorSwatches.length, 3)}`} aria-hidden="true">{contentColorSwatches.slice(0, 3).map((color) => <i key={color} style={{ background: color }} />)}</span>
          <span className="v2-content-color-info"><strong>Color del contenido</strong><b>{contentColorStatus}</b><small>{zone.textColor ? zone.iconAppearance === "minimal" ? "Texto e íconos minimalistas comparten este color; los que tienen fondo propio conservan su contraste." : "Cambia el texto; los íconos reales conservan sus colores de marca." : "El diseño elige colores legibles para texto e íconos."}</small></span>
          <button type="button" onClick={() => onZone({ textColor: zone.textColor ? undefined : automaticContentColors[0] })}>{zone.textColor ? "Usar automático" : "Personalizar"}</button>
          {zone.textColor && <ColorField label="Color del contenido" value={zone.textColor} onChange={(textColor) => onZone({ textColor })} />}
        </div>
        {/* Picking any look (plantilla general o de botonera) always applies its own recommended
            color rule now — no more "sticky" state that made the same click behave differently
            depending on invisible history. One predictable rule, Ctrl+Z as the way back. */}
        <p className="v2-help" style={{ margin: 0 }}>Cada plantilla trae su propia regla de color recomendada — elegir una plantilla nueva siempre la aplica. Si no era lo que buscabas, deshacé con Ctrl+Z.</p>
      </fieldset>
      {hasPresetIcons ? <fieldset>
        <legend>Apariencia de los iconos</legend>
        {!hasBrandButtons && <p className="v2-help" style={{ margin: 0 }}>No hay redes en tu landing; mirá cómo cambian los íconos de tus botones.</p>}
        <Choice
          active={zone.iconAppearance === "minimal"}
          suggested={recommendedIcons === "minimal"}
          title="Icono minimalista"
          note={zone.collection === "glass" ? "Símbolos blancos, sin el color de cada marca." : "Todos usan un tratamiento monocromático coordinado con la botonera."}
          onClick={() => onZone({ iconAppearance: "minimal" })}
          preview={<ButtonChoicePreview draft={draft} buttons={comparisonButtons} backgroundImage={backgroundImage} colorMode={zone.colorMode} iconAppearance="minimal" />}
        />
        <Choice
          active={zone.iconAppearance === "brand"}
          suggested={recommendedIcons === "brand"}
          title="Icono real"
          note={zone.collection === "glass" ? "Cada símbolo muestra su color de marca sobre el vidrio." : "Cada marca conserva su apariencia reconocible: Spotify verde, YouTube rojo, Instagram degradado…"}
          onClick={() => onZone({ iconAppearance: "brand" })}
          preview={<ButtonChoicePreview draft={draft} buttons={comparisonButtons} backgroundImage={backgroundImage} colorMode={zone.colorMode} iconAppearance="brand" />}
        />
      </fieldset> : <p className="v2-help" style={{ margin: 0 }}>Los íconos de botones personalizados se editan dentro de cada botón. Si agregás una red, aparecerán acá las opciones de ícono minimalista o real.</p>}
      <div className="v2-fields-row">
        <fieldset><legend>Tamaño de botones</legend><div className="v2-segment">{SIZES.map((item) => <button type="button" className={selectedSize === item.label ? "active" : ""} aria-pressed={selectedSize === item.label} key={item.label} onClick={() => onZone(item.patch)}>{item.label}</button>)}</div><p className="v2-help" style={{ margin: "8px 0 0", fontSize: 11 }}>{selectedSize ? "Incluye alto, texto, ícono y espacio." : usesRecommendedSize ? `Tamaño recomendado por ${currentButtonLook}.` : "Tamaño personalizado; ajustalo abajo."}</p></fieldset>
        <fieldset>
          <legend>Alineación</legend>
          <div className="v2-segment">
            <button type="button" className={zone.contentAlignMode === "auto" ? "active" : ""} aria-pressed={zone.contentAlignMode === "auto"} onClick={() => onZone({ contentAlignMode: "auto", contentAlign: alignmentPreset.buttonZone.contentAlign })}>Auto</button>
            <button type="button" className={zone.contentAlignMode === "manual" && zone.contentAlign === "center" ? "active" : ""} aria-pressed={zone.contentAlignMode === "manual" && zone.contentAlign === "center"} onClick={() => onZone({ contentAlignMode: "manual", contentAlign: "center" })}>Centro</button>
            <button type="button" className={zone.contentAlignMode === "manual" && zone.contentAlign === "left" ? "active" : ""} aria-pressed={zone.contentAlignMode === "manual" && zone.contentAlign === "left"} onClick={() => onZone({ contentAlignMode: "manual", contentAlign: "left" })}>Izq.</button>
          </div>
          <p className="v2-help" style={{ margin: "8px 0 0", fontSize: 11 }}>{zone.contentAlignMode === "auto" ? `Recomendado por ${alignmentPreset.name}.` : "Es una edición manual; otra plantilla aplicará su propia alineación."}</p>
        </fieldset>
      </div>
      <details className="v2-advanced">
        <summary><span><strong>Personalizar medidas y tipografía</strong><small>Fuente, grosor, separación y títulos largos</small></span></summary>
        <div className="v2-fields" style={{ marginTop: 10 }}>
          <FontPicker label="Tipografía" value={draft.button_font || "modern"} onChange={onFont} usage="buttons" previewText={buttons[0]?.title || "Conocé mi trabajo"} previewWeight={currentFontWeight} previewLetterSpacing={zone.letterSpacing ?? 0} previewLegacy={zone.fontWeight === undefined} recommended={suggestedPreset(zone.templateId).buttonFont} />
          <FontWeightControl font={draft.button_font || "modern"} value={currentFontWeight} onChange={(fontWeight) => onZone({ fontWeight })} />
          {zone.fontWeight === undefined && <p className="v2-help" style={{ margin: 0 }}>Esta landing usa el grosor anterior de la plantilla. Elegí uno para usar un peso real de la fuente.</p>}
          <label className="v2-range"><span>Separación entre letras<b>{zone.letterSpacing ? `${zone.letterSpacing > 0 ? "+" : ""}${Number((zone.letterSpacing * 100).toFixed(1))}%` : "Normal"}</b></span><input type="range" min={-.03} max={.08} step={.005} value={zone.letterSpacing ?? 0} onChange={(event) => onZone({ letterSpacing: Number(event.target.value) })}/></label>
          <button type="button" className="v2-title-wrap" role="switch" aria-checked={zone.titleLines === 2} onClick={() => onZone({ titleLines: zone.titleLines === 2 ? 1 : 2 })}><span className="v2-title-wrap-switch" aria-hidden="true" /><span><strong>Mostrar más texto en nombres largos</strong><small>Si no entra en una línea, puede ocupar dos. Si lo desactivás, se corta con “…”.</small></span></button>
          <div className="v2-fields-row">
            <Range label="Alto del botón" min={40} max={72} value={zone.height} onChange={(height) => onZone({ height })} />
            <Range label="Espaciado entre botones" min={4} max={20} value={zone.gap} onChange={(gap) => onZone({ gap })} />
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

function BackgroundControls({ draft, tab, onTab, onChange, onFile, onAdjust, hasImage }: { draft: LandingDraft; tab: BackgroundTab; onTab: (t: BackgroundTab) => void; onChange: (p: Partial<LandingDraft>) => void; onFile: (f?: File) => void; onAdjust: () => void; hasImage: boolean }) {
  const updatePos = (p: Partial<BackgroundPosition>) => onChange({ bgPosition: { ...draft.bgPosition, ...p } });
  const selectTab = (next: BackgroundTab) => { onTab(next); onChange({ background_type: next }); };
  const filterColor = draft.bgPosition.tintColor || (draft.bgPosition.lighten > 0 ? "#ffffff" : "#000000");
  const filterIntensity = draft.bgPosition.lighten > 0 ? draft.bgPosition.lighten : draft.bgPosition.tint;
  return <div className="v2-fields">
    {draft.business_type === "contact" && <p className="v2-help">Este fondo rodea la tarjeta. El color de la tarjeta y la portada se cambian en Diseño.</p>}
<EditorSection title="Tipo de fondo" tone="blue">    <div className="v2-segment">
      <button className={tab === "color" ? "active" : ""} onClick={() => selectTab("color")}>Color</button>
      <button className={tab === "gradient" ? "active" : ""} onClick={() => selectTab("gradient")}>Degradado</button>
      <button className={tab === "image" ? "active" : ""} onClick={() => selectTab("image")}>Imagen</button>
    </div>

</EditorSection>    {tab !== "image" && <EditorSection title={draft.business_type === "contact" ? "Fondo exterior" : "Paleta de colores"} tone="peach">
      <ColorField label={draft.business_type === "contact" ? "Color del fondo" : "Color principal"} value={draft.background_color || "#f7f5f0"} onChange={(background_color) => onChange({ background_color })} />
      {tab === "gradient" && <ColorField label="Segundo color" value={draft.background_gradient_to || "#a6c1ee"} onChange={(background_gradient_to) => onChange({ background_gradient_to })} />}
    </EditorSection>}

    {tab === "image" && <EditorSection title="Imagen y encuadre" tone="purple">
      <label className="v2-upload">{hasImage ? "Cambiar imagen" : "Elegir imagen"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { onFile(event.target.files?.[0]); event.target.value = ""; }} /></label>
      {hasImage && <button type="button" className="v2-inline-action v2-adjust-image" onClick={onAdjust}>Ajustar encuadre del fondo</button>}
      <p className="v2-help">El recuadro muestra una pantalla de ejemplo. Revisá el resultado en los tamaños del celular.</p>
      <div className="v2-segment" aria-label="Color rápido del filtro">
        <button type="button" className={filterColor === "#000000" ? "active" : ""} aria-pressed={filterColor === "#000000"} onClick={() => updatePos({ tintColor: "#000000", tint: filterIntensity, lighten: 0 })}>Negro</button>
        <button type="button" className={filterColor === "#ffffff" ? "active" : ""} aria-pressed={filterColor === "#ffffff"} onClick={() => updatePos({ tintColor: "#ffffff", tint: filterIntensity, lighten: 0 })}>Blanco</button>
        <button type="button" className={filterColor === (draft.primary_color || "#1f2937") ? "active" : ""} aria-pressed={filterColor === (draft.primary_color || "#1f2937")} onClick={() => updatePos({ tintColor: draft.primary_color || "#1f2937", tint: filterIntensity, lighten: 0 })}>Color principal</button>
      </div>
      <ColorField label="Color del filtro" value={filterColor} onChange={(tintColor) => updatePos({ tintColor, tint: filterIntensity, lighten: 0 })} />
      <Range label="Intensidad del filtro" min={0} max={.85} step={.01} value={filterIntensity} onChange={(tint) => updatePos({ tint, lighten: 0, tintColor: filterColor })} />
      <p className="v2-help" style={{ margin: "-6px 0 0" }}>Negro oscurece, blanco aclara y cualquier otro color le da a la foto el tono de tu marca.</p>
      <Range label="Desenfoque" min={0} max={14} value={draft.bgPosition.blur} onChange={(blur) => updatePos({ blur })} />
      <p className="v2-help" style={{ margin: "-6px 0 0" }}>Suaviza los detalles para que el contenido se lea mejor. El máximo sigue siendo moderado.</p>
      {(filterIntensity > 0 || draft.bgPosition.blur > 0 || draft.bgPosition.tintColor) && <button type="button" className="v2-ghost" onClick={() => updatePos({ tint: 0, lighten: 0, blur: 0, tintColor: undefined })}>Restablecer efectos</button>}
    </EditorSection>}

  </div>;
}

const COVER_SIZES: { id: CoverStyle["size"]; label: string }[] = [
  { id: "small", label: "Chico" },
  { id: "medium", label: "Mediano" },
  { id: "large", label: "Grande" },
];
const CONTACT_COVER_PATTERNS: { id: NonNullable<ButtonZoneStyle["contactCoverPattern"]>; label: string }[] = [
  { id: "reflections", label: "Reflejos" },
  { id: "solid", label: "Liso" },
  { id: "aura", label: "Degradado" },
  { id: "cartoon", label: "Cartoon" },
  { id: "dots", label: "Puntos" },
  { id: "grid", label: "Cuadrícula" },
  { id: "composition", label: "Composición" },
  { id: "frame", label: "Marco" },
];

type HeaderStyle = "none" | "card" | CoverStyle["mode"];
const HEADER_STYLES: { id: HeaderStyle; title: string; note: string }[] = [
  { id: "none", title: "Sin portada", note: "Logo, nombre y descripción directo sobre el fondo." },
  { id: "card", title: "Tarjeta", note: "Un recuadro esmerilado que agrupa logo, nombre y descripción." },
  { id: "fade", title: "Portada difuminada", note: "Una foto detrás del encabezado que se desvanece hacia los botones." },
  { id: "banner", title: "Portada banner", note: "Una foto arriba de todo, con el logo montado sobre su borde." },
];

function CoverControls({ draft, coverImage, onChange, onCoverFile, onAdjustCover, onRemoveCover }: { draft: LandingDraft; coverImage: string; onChange: (p: Partial<LandingDraft>) => void; onCoverFile: (f?: File) => void; onAdjustCover: () => void; onRemoveCover: () => void }) {
  const style = draft.coverStyle;
  const updateCover = (patch: Partial<CoverStyle>) => {
    const distribution = parseDistribution(draft.buttonZone.distribution, draft.buttonZone.layout);
    const renderedCoverHeight = document.querySelector<HTMLElement>(".v2-phone [data-landing-cover]")?.offsetHeight;
    const currentCoverHeight = distribution.coverHeight ?? renderedCoverHeight;
    const sizeDelta = patch.size && patch.size !== style.size && currentCoverHeight !== undefined
      ? COVER_SIZE_EXTRA[patch.size] - COVER_SIZE_EXTRA[style.size]
      : 0;
    const lockLandingCover = draft.business_type !== "contact" && style.enabled && currentCoverHeight !== undefined;
    const nextCoverStyle = { ...style, ...patch, ...(draft.business_type !== "contact" && patch.size ? { stableSizing: true } : {}) };
    onChange({
      coverStyle: nextCoverStyle,
      ...(lockLandingCover ? { buttonZone: { ...draft.buttonZone, distribution: { ...distribution, coverHeight: currentCoverHeight + sizeDelta } } } : {}),
    });
  };
  if (draft.business_type === "contact") {
    const hasPhoto = Boolean(coverImage);
    const photoVisible = hasPhoto && style.enabled;
    const customColor = draft.buttonZone.contactCoverColor;
    const theme = draft.buttonZone.contactTheme || "classic";
    const recommendedPattern = recommendedContactCoverPattern(theme);
    const pattern = draft.buttonZone.contactCoverPattern && draft.buttonZone.contactCoverPattern !== "original" ? draft.buttonZone.contactCoverPattern : recommendedPattern;
    const availablePatterns = recommendedPattern === "original"
      ? [{ id: "original" as const, label: "Clásica" }, ...CONTACT_COVER_PATTERNS]
      : [...CONTACT_COVER_PATTERNS].sort((a, b) => Number(b.id === recommendedPattern) - Number(a.id === recommendedPattern));
    const patternSurface = draft.buttonZone.contactSurfaceColor || draft.buttonZone.contactResolvedSurface || CONTACT_LOOKS.find((look) => look.id === theme)?.surface || (theme === "noir" ? "#242b36" : theme === "paper" ? "#f8f2e6" : theme === "linen" ? "#f3f0e5" : "#ffffff");
    const patternPreviewStyle = { "--contact-cover-color": customColor || draft.primary_color || "#1f2937", "--contact-surface": patternSurface, "--contact-ink": contrastTextColor(patternSurface) } as CSSProperties;
    return <div className="v2-fields">
      <div className="v2-contact-cover-status" role="status"><strong>{photoVisible ? "Foto visible" : hasPhoto ? "Foto cargada, pero oculta" : "Sin foto"}</strong><span>{photoVisible ? "La tarjeta muestra la foto con este tamaño y encuadre." : hasPhoto ? "La foto está guardada, pero ahora se ve el diseño sin foto." : customColor ? "Se muestra tu color personalizado." : "Se muestra el color y detalle del diseño elegido."} Mirá la tarjeta para ver el resultado exacto.</span></div>
      <EditorSection title="Alto de la portada" tone="blue">
        <div className="v2-segment" aria-label="Alto de la portada">{COVER_SIZES.map((option) => <button type="button" key={option.id} className={style.size === option.id ? "active" : ""} aria-pressed={style.size === option.id} onClick={() => updateCover({ size: option.id })}>{option.label}</button>)}</div>
        {photoVisible && <p className="v2-help" style={{ margin: "8px 0 0" }}>Cambia cuánto se ve de la foto, sin estirarla ni cambiar su zoom.</p>}
      </EditorSection>
      {hasPhoto && <div className="v2-segment" aria-label="Visibilidad de la foto de portada"><button type="button" className={style.enabled ? "active" : ""} aria-pressed={style.enabled} onClick={() => updateCover({ enabled: true, mode: "banner" })}>Mostrar foto</button><button type="button" className={!style.enabled ? "active" : ""} aria-pressed={!style.enabled} onClick={() => updateCover({ enabled: false })}>Ocultar foto</button></div>}
      <label className="v2-upload">{hasPhoto ? "Cambiar foto de portada" : "Subir foto de portada"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { onCoverFile(event.target.files?.[0]); event.target.value = ""; }} /></label>
      {hasPhoto && <>
        <button type="button" className="v2-suggested" onClick={onAdjustCover}>Ajustar encuadre de la foto →</button>
        {photoVisible && <details className="v2-contact-more"><summary>Oscurecer la imagen <span>Opcional</span></summary><div className="v2-contact-more-body"><Range label="Oscuridad" min={0} max={.85} step={.01} value={style.overlay} onChange={(overlay) => updateCover({ overlay })} /><p className="v2-help" style={{ margin: 0 }}>Una foto nueva comienza sin oscurecimiento.</p></div></details>}
        <button type="button" className="v2-ghost" onClick={onRemoveCover}>Quitar foto</button>
      </>}
      {!photoVisible && <EditorSection title="Portada sin foto" tone="blue">
        <p className="v2-help" style={{ margin: 0 }}>Elegí la portada que más te guste. La recomendada combina con tu plantilla, pero podés usar cualquiera. La foto cargada no se modifica.</p>
        <div className="v2-contact-cover-pattern-grid" role="group" aria-label="Diseño de la portada sin foto">
          {availablePatterns.map((option) => <button key={option.id} type="button" className={pattern === option.id ? "active" : ""} aria-pressed={pattern === option.id} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactCoverPattern: option.id } })}><span className={`v2-contact-cover-pattern-swatch contact-cover-pattern-${option.id} contact-theme-${theme}`} style={option.id === "dots" && theme === "impact" && customColor ? { ...patternPreviewStyle, "--contact-surface": customColor } as CSSProperties : patternPreviewStyle} aria-hidden="true" /><strong>{option.label}</strong>{option.id === recommendedPattern && <small className="v2-contact-cover-recommended">✦ Recomendada</small>}</button>)}
        </div>
        {customColor ? <><ColorField label="Color de la portada" value={customColor} onChange={(contactCoverColor) => onChange({ buttonZone: { ...draft.buttonZone, contactCoverColor } })} /><button type="button" className="v2-ghost" onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactCoverColor: undefined } })}>Usar color del diseño</button></> : <button type="button" className="v2-suggested" onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactCoverColor: draft.primary_color || "#1f2937" } })}>Elegir color propio</button>}
      </EditorSection>}
    </div>;
  }
  const hasCard = headerCardOn(draft.buttonZone);
  // The four options are mutually exclusive in the picker even though card and photo are stored
  // separately — a photo wins if both happen to be on (older pages could have that).
  const current: HeaderStyle = style.enabled ? style.mode : hasCard ? "card" : "none";
  const templateStyle: HeaderStyle = suggestedPreset(draft.buttonZone.templateId).buttonZone.layout === "profile-card" ? "card" : "none";
  // One change for card + photo together, so a single Ctrl+Z undoes the whole switch.
  const pick = (id: HeaderStyle) => onChange({
    buttonZone: { ...draft.buttonZone, headerCard: id === "card", distribution: { ...parseDistribution(draft.buttonZone.distribution, draft.buttonZone.layout), coverHeight: undefined } },
    // The banner's veil is plain black (the title doesn't sit on the photo), so it starts clear
    // instead of inheriting the fade style's default wash.
    coverStyle: id === "fade" || id === "banner" ? { ...style, enabled: true, mode: id, stableSizing: false, ...(id === "banner" && style.mode !== "banner" ? { overlay: 0 } : {}) } : { ...style, enabled: false, stableSizing: false },
  });
  const isPhoto = current === "fade" || current === "banner";
  return <div className="v2-fields">
    <EditorSection title="Estilo del encabezado" tone="peach">
      {HEADER_STYLES.map(option => <Choice key={option.id} active={current === option.id} title={option.title} note={option.note} suggested={templateStyle === option.id} onClick={() => pick(option.id)} />)}
    </EditorSection>
    {isPhoto && <>
      <label className="v2-upload">{coverImage ? "Cambiar foto" : "Subir foto de portada"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { onCoverFile(event.target.files?.[0]); event.target.value = ""; }} /></label>
      {coverImage && <>
        <button type="button" className="v2-inline-action v2-adjust-image" onClick={onAdjustCover}>Arrastrar y ajustar zoom</button>
        {current === "fade" && <fieldset className="v2-editor-section" data-tone="blue">
          <legend>Tamaño de portada</legend>
          <div className="v2-segment">{COVER_SIZES.map((option) => <button type="button" key={option.id} className={style.size === option.id ? "active" : ""} onClick={() => updateCover({ size: option.id })}>{option.label}</button>)}</div>
          <p className="v2-help" style={{ margin: "8px 0 0" }}>Cambia el alto que ocupa la portada. La foto siempre llena el marco; después podés arrastrarla y ajustar su zoom sobre la medida exacta.</p>
        </fieldset>}
        <details className="v2-cover-adjustments v2-editor-section" data-tone="purple"><summary>Efectos de la portada</summary><div className="v2-fields">
          {current === "fade" && <>
            <Range label="Difuminado" min={10} max={90} value={style.fade} onChange={(fade) => updateCover({ fade })} />
            <p className="v2-help" style={{ margin: "-6px 0 0" }}>Dónde empieza a desvanecerse la foto hacia el fondo, cerca de los botones.</p>
          </>}
          <Range label="Oscurecer la foto" min={0} max={.85} step={.01} value={style.overlay} onChange={(overlay) => updateCover({ overlay })} />
          <p className="v2-help" style={{ margin: "-6px 0 0" }}>{current === "fade" ? "Un velo parejo sobre toda la foto, para que el logo y el título se lean mejor." : "Un velo oscuro parejo sobre toda la foto."}</p>
          <button type="button" className="v2-ghost" onClick={() => onChange({ coverStyle: parseCoverStyle({ enabled: style.enabled, mode: style.mode, size: style.size, stableSizing: style.stableSizing, ...(style.mode === "banner" ? { overlay: 0 } : {}) }) })}>Restablecer ajuste automático</button>
        </div></details>
        <button type="button" className="v2-delete" onClick={onRemoveCover}>Quitar foto</button>
      </>}
    </>}
  </div>;
}

const SEPARATOR_DESIGNS = [
  ['diamond','Diamante','Un acento elegante'], ['sparkle','Destello','Un detalle luminoso'],
  ['bolt','Rayito','Un toque de energía'], ['leaf','Hoja','Inspirado en lo natural'],
  ['heart','Corazón','Un toque cercano'], ['fade','Difuminado','Extremos que se desvanecen'],
  ['sun','Sol','Cálido y luminoso'], ['solid','Sutil','Una línea limpia'],
  ['dotted','Puntos','Liviano y delicado'], ['double','Doble línea','Un toque editorial'],
  ['circle','Círculo','Simple y equilibrado'], ['star','Estrella','Un pequeño acento'],
  ['flower','Flor','Suave y orgánico'], ['trio','Tres puntos','Una pausa minimalista'],
] as const;

function EditorSection({title,tone,children}: {title:string;tone:"blue"|"purple"|"peach"|"green"|"rose";children:ReactNode}) {
  return <fieldset className="v2-editor-section" data-tone={tone}><legend>{title}</legend><div className="v2-section-content">{children}</div></fieldset>;
}

function SeparatorPicker({style,onChange}: {style:DistributionStyle;onChange:(value:DistributionStyle['separatorStyle'])=>void}) {
  const [expanded,setExpanded] = useState(false);
  const selected = SEPARATOR_DESIGNS.find(([value])=>value===style.separatorStyle);
  const featured = SEPARATOR_DESIGNS.slice(0,6);
  // Exactly six collapsed choices, always including the resolved saved/template value.
  const collapsed = selected && !featured.some(([value])=>value===selected[0])
    ? [selected,...featured.slice(0,5)] : featured;
  const visible = expanded ? SEPARATOR_DESIGNS : collapsed;
  return <fieldset><legend>Diseño del separador</legend>
    <p className="v2-help">Un detalle para darle carácter a tu página. Elegí cómo se ve.</p>
    <p className="v2-separator-current">En uso: <strong>{selected?.[1]}</strong></p>
    <div className="v2-separator-picker">{visible.map(([value,label,note])=><button type="button" key={value} className={style.separatorStyle===value?'active':''} aria-pressed={style.separatorStyle===value} onClick={()=>onChange(value)}>
      <span className="v2-separator-sample"><LandingSeparator variant={value} color={style.separatorColor} weight={style.separatorWeight}/></span><strong>{label}{style.separatorStyle===value && <span className="v2-separator-check" aria-hidden="true">✓</span>}</strong><small>{note}</small>
    </button>)}</div>
    <button type="button" className="v2-separator-more" aria-expanded={expanded} onClick={()=>setExpanded(current=>!current)}>
      <span>{expanded?'Ver menos diseños':'Ver más diseños'}</span><span className="v2-separator-count">{expanded?'−':`${SEPARATOR_DESIGNS.length} estilos · +`}</span>
    </button>
  </fieldset>;
}

function ContactDistributionControls({ draft, onChange }: { draft: LandingDraft; onChange: (patch: Partial<LandingDraft>) => void }) {
  const density = draft.buttonZone.contactDensity || "balanced";
  const isDocument = draft.buttonZone.contactLayout === "document";
  return <div className="v2-fields">
    <p className="v2-help">Ajustá el espacio y la foto sin cambiar el diseño ni tus datos. Los tamaños se adaptan a pantallas chicas.</p>
    <EditorSection title="Espacios" tone="blue">
      <div className="v2-segment">
        {(["compact", "balanced", "airy"] as const).map((value) => <button type="button" key={value} className={density === value ? "active" : ""} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactDensity: value } })}>{value === "compact" ? "Compacta" : value === "airy" ? "Amplia" : "Equilibrada"}</button>)}
      </div>
    </EditorSection>
    <EditorSection title="Foto de perfil" tone="purple">
      <Range label="Tamaño de foto" min={isDocument ? 64 : 80} max={isDocument ? 112 : 160} step={4} value={isDocument ? Math.min(112, Math.max(64, draft.logoStyle.size)) : draft.logoStyle.size} onChange={(size) => onChange({ logoStyle: { ...draft.logoStyle, size } })} />
    </EditorSection>
  </div>;
}

function DistributionControls({ draft, onZone }: { draft: LandingDraft; onZone: (patch: Partial<ButtonZoneStyle>) => void }) {
  const style = parseDistribution(draft.buttonZone.distribution, draft.buttonZone.layout);
  const isBanner = draft.coverStyle.enabled && draft.coverStyle.mode === "banner";
  const legacyCoverHeight = () => {
    if (!draft.coverStyle.enabled) return undefined;
    const renderedHeight = document.querySelector<HTMLElement>(".v2-phone [data-landing-cover]")?.offsetHeight;
    if (renderedHeight) return renderedHeight;
    if (draft.coverStyle.mode === "banner") return Math.round(style.top + draft.logoStyle.size / 2);
    const showEyebrow = Boolean(draft.titleStyle.eyebrow);
    const descriptionLines = (draft.description || "").split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 48)), 0);
    const descriptionReserve = draft.description ? 58 + Math.max(0, descriptionLines - 2) * 21 : 14;
    const coverReserve = draft.logoStyle.size + style.logoGap + (showEyebrow ? 28 : 0) + 54 + descriptionReserve + COVER_SIZE_EXTRA[draft.coverStyle.size];
    return Math.round(style.top + coverReserve);
  };
  const update = (patch: Partial<DistributionStyle>) => onZone({ distribution: { ...style, coverHeight: style.coverHeight ?? legacyCoverHeight(), ...patch } });
  return <div className="v2-fields">
    <p className="v2-help">Ajustá el aire entre los elementos. El contenido conserva su orden y se adapta al celular.</p>
<EditorSection title="Posición y espacios" tone="blue">    <div className="v2-segment">{[
      {name:"Compacto",top:48,logoGap:10,buttonsGap:4,socialsGap:6},
      {name:"Equilibrado",top:64,logoGap:18,buttonsGap:10,socialsGap:12},
      {name:"Amplio",top:88,logoGap:30,buttonsGap:30,socialsGap:24},
    ].map(({name,...spaces})=><button type="button" key={name} onClick={()=>update({...spaces,...(isBanner?{top:style.top}:{})})}>{name}</button>)}</div>
    {isBanner ? <p className="v2-help" style={{margin:0}}>La portada banner mantiene automáticamente el logo apoyado sobre su borde.</p> : <Range label="Espacio superior" min={48} max={320} value={style.top} onChange={top=>update({top})}/>}
    <Range label={draft.buttonZone.layout === "compact" ? "Separación del logo (horizontal)" : "Espacio debajo del logo"} min={0} max={64} value={style.logoGap} onChange={logoGap=>update({logoGap})}/>
    <Range label="Separación de la botonera" min={0} max={100} value={style.buttonsGap} onChange={buttonsGap=>update({buttonsGap})}/>
    <Range label="Separación de redes rápidas" min={0} max={64} value={style.socialsGap} onChange={socialsGap=>update({socialsGap})}/>
</EditorSection><EditorSection title="Separador" tone="purple">    <Choice active={style.separator} title="Mostrar separador" note="Una línea entre el encabezado y los botones." onClick={()=>update({separator:!style.separator})}/>
    {style.separator && <>
      <SeparatorPicker style={style} onChange={separatorStyle=>update({separatorStyle})}/>
      <ColorField label="Color del separador" value={style.separatorColor} onChange={separatorColor=>update({separatorColor})}/>
      <Range label="Ancho del separador (%)" min={15} max={100} value={style.separatorWidth} onChange={separatorWidth=>update({separatorWidth})}/>
      <Range label="Grosor del separador" min={1} max={5} value={style.separatorWeight} onChange={separatorWeight=>update({separatorWeight})}/>
      <Range label="Espacio alrededor del separador" min={0} max={48} value={style.separatorSpace} onChange={separatorSpace=>update({separatorSpace})}/>
    </>}
</EditorSection>    <p className="v2-help">Guardá los cambios para aplicar esta distribución a tu página.</p>
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
      // Same definition the buttons panel uses, so each network asks for what it actually needs:
      // a username for Instagram/TikTok/Telegram, a phone for WhatsApp, a link for the rest.
      const def = getAllActions().find(action => action.type === option.type);
      const isUser = def?.input === "username";
      const isPhone = def?.input === "phone";
      return <div className="v2-social-field" key={option.type}>
        <label><span><ActionTypeIcon type={option.type} brandMark />{option.label}{isUser ? " · usuario" : isPhone ? " · número" : " · enlace"}</span>
          <input type="text" inputMode={isPhone ? "tel" : isUser ? "text" : "url"} aria-invalid={invalid} aria-describedby={invalid ? `social-error-${option.type}` : undefined} value={current?.url || ""} placeholder={def?.placeholder} maxLength={2048} onChange={event => {
            const url = event.target.value;
            onChange(current ? links.map(link => link.type === option.type ? { ...link, url } : link) : [...links, { type: option.type, url }]);
          }} />
        </label>
        {isUser && <p className="v2-help" style={{ margin: "-4px 0 0", fontSize: 11 }}>Solo el usuario — armamos el enlace solos ({def?.prefix}tuusuario). Si preferís, también podés pegar el link completo.</p>}
        {invalid && <p id={`social-error-${option.type}`} className="v2-social-error">{isPhone ? "Ingresá un número con código de país o un enlace completo." : isUser ? `Ingresá tu usuario (sin espacios) o el enlace completo.` : "Ingresá un enlace completo, por ejemplo https://facebook.com/tumarca."} Este acceso no se mostrará hasta corregirlo.</p>}
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
function SettingsControls({ draft, buttons, dirty, onTypeChange, onBrandingChange, publishAction, deleteLandingAction }: { draft: LandingDraft; buttons: ButtonItem[]; dirty: boolean; onTypeChange: (type: string) => void; onBrandingChange: (show: boolean) => void; publishAction: SaveAction; deleteLandingAction: SaveAction }) {
  const isPublished = Boolean(draft.published);
  const missingContact = draft.business_type === "contact" && !buttons.some((button) => ["phone", "email", "whatsapp"].includes(button.type) && button.url.trim());
  if (draft.business_type === "contact") return <div className="v2-fields">
    <div className="v2-contact-publish-status"><i className={isPublished ? "is-online" : ""} aria-hidden="true" /><div><strong>{isPublished ? "Tu tarjeta está publicada" : "Tu tarjeta está en borrador"}</strong><span>{isPublished ? "Quien tenga el enlace o escanee tu NFC puede verla." : "Solo vos podés verla hasta que la publiques."}</span></div></div>
    <EditorSection title="Publicación" tone="green">
      <form action={publishAction}>
        <input type="hidden" name="id" value={draft.id} />
        <input type="hidden" name="published" value={String(!isPublished)} />
        <input type="hidden" name="return_to" value={`/admin/landings/${draft.id}/editor-v2`} />
        <PendingSubmitButton className="v2-save" style={{ width: "100%" }} pendingText={isPublished ? "Despublicando…" : "Publicando…"} disabled={!isPublished && (dirty || missingContact)}>{isPublished ? "Despublicar tarjeta" : "Publicar tarjeta"}</PendingSubmitButton>
      </form>
      {!isPublished && dirty && <p className="v2-help" role="status">Primero guardá los cambios con el botón de arriba.</p>}
      {!isPublished && missingContact && <p className="v2-help" role="status">Agregá un teléfono, email o WhatsApp en Datos.</p>}
      {isPublished && <a className="v2-suggested" href={`/${draft.slug}`} target="_blank" rel="noreferrer"><IconEye /> Abrir tarjeta publicada</a>}
      <Link className="v2-suggested" href={`/admin/landings/${draft.id}/qr`}><IconQrCode /> Ver código QR y NFC</Link>
    </EditorSection>
    <details className="v2-contact-more"><summary>Más ajustes <span>Firma, tipo de página y eliminación</span></summary><div className="v2-contact-more-body">
      <Choice active={draft.buttonZone.showBranding !== false} title="Mostrar firma de BioNFC" note="Aparece al final de la tarjeta." onClick={() => onBrandingChange(draft.buttonZone.showBranding === false)} />
      <p className="v2-help" style={{ margin: 0 }}>Cambiar a landing modifica la presentación, pero conserva tus datos y enlaces.</p>
      <button type="button" className="v2-ghost" onClick={() => onTypeChange("custom")}>Cambiar a landing de enlaces</button>
      <DeleteLandingButton action={deleteLandingAction} landingId={draft.id} label="Eliminar tarjeta" isContact />
    </div></details>
  </div>;
  return <div className="v2-fields">
    <div className="v2-brand">
      <span><b>{isPublished ? "Tu landing está online" : "Tu landing está en borrador"}</b><small>{isPublished ? "Cualquiera con el link o el tag NFC puede verla." : "Todavía no es visible para el público."}</small></span>
    </div>
    <EditorSection title="Tipo de página" tone="blue">
      <Choice active={draft.business_type === "contact"} title="Tarjeta personal" note="Presentación de perfil, contacto descargable y enlaces en fichas." onClick={() => onTypeChange("contact")} />
      <Choice active={draft.business_type !== "contact"} title="Landing de enlaces" note="Conserva el diseño y los botones, sin el acceso a Guardar contacto." onClick={() => onTypeChange("custom")} />
    </EditorSection>
<EditorSection title="Firma de BioNFC" tone="purple">    <Choice active={draft.buttonZone.showBranding !== false} title="Mostrar firma de BioNFC" note="Agrega el logo y un enlace a BioNFC al final de tu página. Guardá los cambios para aplicar esta opción." onClick={() => onBrandingChange(draft.buttonZone.showBranding === false)} />
</EditorSection><EditorSection title="Publicación y acceso" tone="green">    <form action={publishAction}>
      <input type="hidden" name="id" value={draft.id} />
      <input type="hidden" name="published" value={String(!isPublished)} />
      <input type="hidden" name="return_to" value={`/admin/landings/${draft.id}/editor-v2`} />
      <PendingSubmitButton className="v2-save" style={{ width: "100%" }} pendingText={isPublished ? "Despublicando…" : "Publicando…"} disabled={!isPublished && (dirty || missingContact)}>{isPublished ? "Despublicar" : draft.business_type === "contact" ? "Publicar tarjeta" : "Publicar landing"}</PendingSubmitButton>
    </form>
    {!isPublished && dirty && <p className="v2-help" role="status">Guardá los cambios antes de publicar.</p>}
    {!isPublished && missingContact && <p className="v2-help" role="status">Agregá un teléfono, email o WhatsApp para poder publicar la tarjeta.</p>}
    <a className="v2-suggested" href={`/${draft.slug}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8 }}><IconEye /> Ver {draft.business_type === "contact" ? "tarjeta" : "landing"} publicada</a>
    <Link className="v2-suggested" href={`/admin/landings/${draft.id}/qr`} style={{ display: "flex", alignItems: "center", gap: 8 }}><IconQrCode /> Código QR para el tag NFC</Link>
</EditorSection>    <DeleteLandingButton action={deleteLandingAction} landingId={draft.id} label={draft.business_type === "contact" ? "Eliminar tarjeta" : "Eliminar landing"} isContact={draft.business_type === "contact"} />
  </div>;
}

function ContactDesignControls({ draft, buttons, onChange, onBackground, onTemplates }: { draft: LandingDraft; buttons: ButtonItem[]; onChange: (patch: Partial<LandingDraft>) => void; onBackground: () => void; onTemplates: () => void }) {
  const layout = draft.buttonZone.contactLayout === "document" ? "document" : "card";
  const recommendedActionStyle = layout === "document" ? "details" : "shortcuts";
  const actionStyle = draft.buttonZone.contactActionStyle;
  const selectedActionStyle = actionStyle || recommendedActionStyle;
  const hasContactData = buttons.some((button) => ["phone", "email", "whatsapp"].includes(button.type) && button.url.trim()) || Boolean(draft.buttonZone.contactSecondPhone || draft.buttonZone.contactAddress);
  const theme = draft.buttonZone.contactTheme || "classic";
  const selectedLook = CONTACT_LOOKS.find((look) => look.id === theme);
  const defaultSurface = draft.buttonZone.contactResolvedSurface?.slice(0, 7) || selectedLook?.surface || (theme === "noir" ? "#242b36" : theme === "paper" ? "#f8f2e6" : theme === "linen" ? "#f3f0e5" : layout === "document" || contrastTextColor(draft.titleStyle.color) === "#ffffff" ? "#ffffff" : "#111422");
  return <div className="v2-fields">
    <EditorSection title="Plantillas" tone="blue">
      <button type="button" className="v2-contact-current-look" onClick={onTemplates}><span className={`v2-contact-look is-${theme} v2-contact-current-look-art`} aria-hidden="true"><span className="v2-contact-look-art"><i className="look-cover"/><i className="look-avatar" data-initials={draft.logoStyle.initials}>{draft.logoStyle.initials === "two" ? "CM" : "C"}</i><i className="look-name"/><i className="look-line"/><i className="look-action"/></span></span><span className="v2-contact-current-look-copy"><strong>Elegir plantilla</strong><small>Actual: {selectedLook?.name || "Diseño anterior"} · {layout === "document" ? "Ficha profesional" : "Tarjeta visual"}</small></span><span className="v2-contact-look-change" aria-hidden="true">→</span></button>
    </EditorSection>
    <EditorSection title="Colores" tone="purple">
      <ColorField label="Color principal" value={draft.primary_color || "#1f2937"} onChange={(primary_color) => onChange({ primary_color })} />
      <ColorField label="Tarjeta" value={draft.buttonZone.contactSurfaceColor || defaultSurface} onChange={(contactSurfaceColor) => onChange({ buttonZone: { ...draft.buttonZone, contactSurfaceColor } })} />
      <p className="v2-help" style={{ margin: 0 }}>El color de cada texto se cambia junto al campo Nombre, Cargo o Empresa.</p>
      {draft.buttonZone.contactSurfaceColor && <button type="button" className="v2-ghost" onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactSurfaceColor: undefined } })}>Usar color recomendado de la plantilla</button>}
    </EditorSection>
    <EditorSection title="Cómo mostrar el contacto" tone="blue">
      <div className="v2-contact-mode-choices" role="group" aria-label="Presentación de los datos de contacto">
        {([{ id: "shortcuts", label: "Atajos", note: "Íconos destacados" }, { id: "details", label: "Lista", note: "Datos en filas" }] as const).map((option) => <button type="button" key={option.id} className={selectedActionStyle === option.id ? "active" : ""} aria-pressed={selectedActionStyle === option.id} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactActionStyle: option.id } })}><span className={`v2-contact-mode-preview is-${option.id}`} aria-hidden="true"><i/><i/><i/></span><strong>{option.label}</strong><small>{option.id === recommendedActionStyle ? "Recomendado por la plantilla" : option.note}</small></button>)}
      </div>
      <p className="v2-help" style={{ margin: 0 }}>{hasContactData ? "Atajos destaca teléfono, email y WhatsApp. Lista muestra los datos completos en filas." : "Agregá teléfono, email o WhatsApp en Datos para ver el resultado en tu tarjeta."}</p>
      {actionStyle && <button type="button" className="v2-contact-mode-reset" onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactActionStyle: undefined } })}>Volver al estilo recomendado de la plantilla</button>}
      <div className="v2-contact-heading-controls">
        <span>Título de la sección</span>
        <div className="v2-segment" aria-label="Mostrar título de la sección"><button type="button" className={draft.buttonZone.contactSectionTitleVisible !== false ? "active" : ""} aria-pressed={draft.buttonZone.contactSectionTitleVisible !== false} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactSectionTitleVisible: true } })}>Mostrar</button><button type="button" className={draft.buttonZone.contactSectionTitleVisible === false ? "active" : ""} aria-pressed={draft.buttonZone.contactSectionTitleVisible === false} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactSectionTitleVisible: false } })}>Ocultar</button></div>
        {draft.buttonZone.contactSectionTitleVisible !== false && <label>Texto del título<input value={draft.buttonZone.contactSectionTitle || ""} maxLength={50} placeholder="Contacto" onChange={(event) => onChange({ buttonZone: { ...draft.buttonZone, contactSectionTitle: event.target.value } })} /></label>}
        {draft.buttonZone.contactSectionTitleVisible !== false && <p className="v2-help" style={{ margin: 0 }}>Si el texto queda vacío, se muestra “Contacto”.</p>}
      </div>
    </EditorSection>
    <EditorSection title="Botón Guardar contacto" tone="green">
      <p className="v2-help" style={{ margin: 0 }}>Elegí cómo destaca la acción principal. La forma y la tipografía siguen el diseño de la tarjeta.</p>
      <div className="v2-segment" aria-label="Estilo del botón Guardar contacto">
        {([{ id: "solid", label: "Destacado" }, { id: "outline", label: "Contorno" }, { id: "subtle", label: "Suave" }] as const).map((option) => <button key={option.id} type="button" className={(draft.buttonZone.contactSaveVariant || "solid") === option.id ? "active" : ""} aria-pressed={(draft.buttonZone.contactSaveVariant || "solid") === option.id} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactSaveVariant: option.id } })}>{option.label}</button>)}
      </div>
      <div className="v2-segment" aria-label="Color del botón Guardar contacto"><button type="button" className={!draft.buttonZone.contactSaveColor ? "active" : ""} aria-pressed={!draft.buttonZone.contactSaveColor} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactSaveColor: undefined } })}>Color del diseño</button><button type="button" className={draft.buttonZone.contactSaveColor ? "active" : ""} aria-pressed={Boolean(draft.buttonZone.contactSaveColor)} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactSaveColor: draft.buttonZone.contactSaveColor || draft.primary_color || "#1f2937" } })}>Color propio</button></div>
      {draft.buttonZone.contactSaveColor && <ColorField label="Color del botón" value={draft.buttonZone.contactSaveColor} onChange={(contactSaveColor) => onChange({ buttonZone: { ...draft.buttonZone, contactSaveColor } })} />}
      <div className="v2-contact-icon-field"><span>Ícono</span><div className="v2-contact-icon-options" role="group" aria-label="Ícono del botón Guardar contacto">{([{ id: "add", label: "Persona con más" }, { id: "card", label: "Tarjeta de contacto" }, { id: "download", label: "Descargar" }] as const).map((option) => <button key={option.id} type="button" aria-label={option.label} title={option.label} className={(draft.buttonZone.contactSaveIcon || "add") === option.id ? "active" : ""} aria-pressed={(draft.buttonZone.contactSaveIcon || "add") === option.id} onClick={() => onChange({ buttonZone: { ...draft.buttonZone, contactSaveIcon: option.id } })}><ContactSaveIcon icon={option.id} /></button>)}</div></div>
      <label>Texto del botón<input value={draft.buttonZone.contactSaveLabel || ""} maxLength={36} placeholder="Guardar contacto" onChange={(event) => onChange({ buttonZone: { ...draft.buttonZone, contactSaveLabel: event.target.value } })} /></label>
      <p className="v2-help" style={{ margin: 0 }}>Si dejás el texto vacío, se muestra “Guardar contacto”. El archivo que recibe el visitante no cambia.</p>
    </EditorSection>
    <details className="v2-contact-more"><summary>Fondo exterior <span>Opcional</span></summary><div className="v2-contact-more-body"><p className="v2-help" style={{ margin: 0 }}>Es el espacio alrededor de la tarjeta, no su portada.</p><button type="button" className="v2-suggested" onClick={onBackground}>Cambiar fondo exterior →</button></div></details>
  </div>;
}

function ContactTextControls({ field, draft, onChange }: { field: "name" | "role" | "company"; draft: LandingDraft; onChange: (patch: Partial<LandingDraft>) => void }) {
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const fontButtonRef = useRef<HTMLButtonElement>(null);
  const fontPickerRef = useDismissibleFontPicker(fontPickerOpen, setFontPickerOpen, fontButtonRef);
  const isName = field === "name";
  const isRole = field === "role";
  const label = isName ? "Nombre y apellido" : isRole ? "Cargo o profesión" : "Empresa";
  const value = isName ? draft.business_name : isRole ? draft.titleStyle.eyebrow || "" : draft.description || "";
  const font = isName ? draft.titleStyle.font : isRole ? draft.titleStyle.eyebrowFont || draft.titleStyle.font : draft.subtitleStyle.font;
  const weight = isName ? draft.titleStyle.weight : isRole ? draft.titleStyle.eyebrowWeight : draft.subtitleStyle.weight;
  const italic = isName ? draft.titleStyle.italic === true : isRole ? draft.titleStyle.eyebrowItalic === true : draft.subtitleStyle.italic === true;
  const color = isName ? draft.titleStyle.color : isRole ? draft.titleStyle.eyebrowColor || draft.titleStyle.color : draft.subtitleStyle.color;
  const size = isName ? draft.titleStyle.size : isRole ? draft.titleStyle.eyebrowSize : draft.subtitleStyle.size;
  const selectedFont = FONT_OPTIONS.find((option) => option.id === font || option.family === font)?.id || "modern";
  const selectedFontOption = FONT_OPTIONS.find((option) => option.id === selectedFont)!;
  const sizes = (isName ? [20, 24, 28, 32, 36, 40, 44, 48] : isRole ? [10, 12, 14, 16, 18, 20] : [12, 14, 16, 18, 20, 22, 24, 26]);
  if (!sizes.includes(size)) sizes.push(size);
  sizes.sort((a, b) => a - b);
  function updateValue(next: string) {
    if (isName) onChange({ business_name: next });
    else if (isRole) onChange({ titleStyle: { ...draft.titleStyle, eyebrow: next } });
    else onChange({ description: next });
  }
  function updateFont(next: string) {
    if (isName) onChange({ titleStyle: { ...draft.titleStyle, font: next, weight: resolveFontWeight(next, weight) } });
    else if (isRole) onChange({ titleStyle: { ...draft.titleStyle, eyebrowFont: next, eyebrowWeight: resolveFontWeight(next, weight) } });
    else onChange({ subtitleStyle: { ...draft.subtitleStyle, font: next, weight: resolveFontWeight(next, weight) } });
  }
  function updateWeight(next: number) {
    if (isName) onChange({ titleStyle: { ...draft.titleStyle, weight: next } });
    else if (isRole) onChange({ titleStyle: { ...draft.titleStyle, eyebrowWeight: next } });
    else onChange({ subtitleStyle: { ...draft.subtitleStyle, weight: next } });
  }
  function updateItalic(next: boolean) {
    if (isName) onChange({ titleStyle: { ...draft.titleStyle, italic: next } });
    else if (isRole) onChange({ titleStyle: { ...draft.titleStyle, eyebrowItalic: next } });
    else onChange({ subtitleStyle: { ...draft.subtitleStyle, italic: next } });
  }
  function updateSize(next: number) {
    if (isName) onChange({ titleStyle: { ...draft.titleStyle, size: next } });
    else if (isRole) onChange({ titleStyle: { ...draft.titleStyle, eyebrowSize: next } });
    else onChange({ subtitleStyle: { ...draft.subtitleStyle, size: next } });
  }
  function updateColor(next: string) {
    if (isName) {
      const theme = draft.buttonZone.contactTheme || "classic";
      const look = CONTACT_LOOKS.find((option) => option.id === theme);
      const layout = draft.buttonZone.contactLayout === "document" ? "document" : "card";
      const resolvedSurface = look?.surface || (theme === "noir" ? "#242b36" : theme === "paper" ? "#f8f2e6" : theme === "linen" ? "#f3f0e5" : layout === "document" ? "#ffffff" : contrastTextColor(draft.titleStyle.color) === "#ffffff" ? "#ffffffe8" : "#111422d4");
      const resolvedInk = look?.ink || (theme === "noir" ? "#f6f1e8" : theme === "paper" ? "#31271f" : theme === "linen" ? "#26352b" : layout === "document" ? "#202637" : draft.titleStyle.color);
      onChange({
        titleStyle: { ...draft.titleStyle, color: next, eyebrowColor: draft.titleStyle.eyebrowColor || draft.titleStyle.color },
        buttonZone: { ...draft.buttonZone, contactResolvedSurface: draft.buttonZone.contactResolvedSurface || resolvedSurface, contactResolvedInk: draft.buttonZone.contactResolvedInk || resolvedInk },
      });
    }
    else if (isRole) onChange({ titleStyle: { ...draft.titleStyle, eyebrowColor: next } });
    else onChange({ subtitleStyle: { ...draft.subtitleStyle, color: next } });
  }
  return <div className="v2-fields"><div className="v2-contact-text-editor">
    <label htmlFor={`v2-contact-${field}-input`}>{label}</label>
    <input id={`v2-contact-${field}-input`} value={value} maxLength={isName ? 120 : isRole ? 60 : 100} placeholder={isRole ? "Ej: Diseñadora gráfica" : field === "company" ? "Ej: Estudio Aurora" : "Tu nombre"} onChange={(event) => updateValue(event.target.value)} />
    <div ref={fontPickerRef} className={`v2-contact-font-select${fontPickerOpen ? " is-open" : ""}`}><span>Fuente</span><button ref={fontButtonRef} type="button" aria-expanded={fontPickerOpen} aria-controls={`v2-contact-font-options-${field}`} onClick={() => setFontPickerOpen((open) => !open)} style={{ fontFamily: selectedFontOption.family }}>{selectedFontOption.label} <span aria-hidden="true">⌄</span></button>
      {fontPickerOpen && <div id={`v2-contact-font-options-${field}`} className="v2-contact-font-options" aria-label="Fuentes disponibles"><FontLinks ids={FONT_OPTIONS.map((option) => option.id)} />{FONT_OPTIONS.map((option) => <button key={option.id} type="button" aria-pressed={selectedFont === option.id} onClick={() => { updateFont(option.id); setFontPickerOpen(false); fontButtonRef.current?.focus(); }} style={{ fontFamily: option.family }}>{option.label}{selectedFont === option.id && <span aria-hidden="true">✓</span>}</button>)}</div>}
    </div>
    <div className="v2-contact-text-tools" aria-label={`Formato de ${label.toLowerCase()}`}>
      <label className="v2-contact-size-select"><span>Tamaño</span><select value={size} onChange={(event) => updateSize(Number(event.target.value))}>{sizes.map((option) => <option key={option} value={option}>{option} px</option>)}</select></label>
      <button type="button" className={weight >= 600 ? "active" : ""} aria-label="Negrita" aria-pressed={weight >= 600} onClick={() => updateWeight(weight >= 600 ? 400 : 700)}><strong>B</strong></button>
      <button type="button" className={italic ? "active" : ""} aria-label="Cursiva" aria-pressed={italic} onClick={() => updateItalic(!italic)}><em>I</em></button>
      <label className="v2-contact-color-select"><span>Color</span><input type="color" value={color} aria-label={`Color de ${label.toLowerCase()}`} onChange={(event) => updateColor(event.target.value)} /></label>
    </div>
  </div>
  </div>;
}

function ContactControls({ draft, buttons, onChange, onActionChange, onEditPhoto, onEditText, section = "all" }: { draft: LandingDraft; buttons: ButtonItem[]; onChange: (patch: Partial<LandingDraft>) => void; onActionChange: (type: "phone" | "email" | "whatsapp", value: string) => void; onEditPhoto: () => void; onEditText: (field: "name" | "role" | "company") => void; section?: "all" | "profile" | "channels" }) {
  const actionValue = (type: string) => buttons.find((button) => button.type === type)?.url || "";
  return <div className="v2-fields">
    {section === "all" && <div className="v2-contact-content-intro"><p>Completá tu perfil y tus medios de contacto. El diseño no borra estos datos.</p></div>}
    {section !== "channels" && <>
    <EditorSection title="Perfil" tone="blue">
      <div className="v2-contact-profile-links">
        <button type="button" onClick={() => onEditText("name")}><span><strong>Nombre</strong><small>{draft.business_name || "Agregar nombre"}</small></span><b aria-hidden="true">→</b></button>
        <button type="button" onClick={() => onEditText("role")}><span><strong>Cargo</strong><small>{draft.titleStyle.eyebrow || "Agregar cargo o profesión"}</small></span><b aria-hidden="true">→</b></button>
        <button type="button" onClick={() => onEditText("company")}><span><strong>Empresa</strong><small>{draft.description || "Agregar empresa"}</small></span><b aria-hidden="true">→</b></button>
        <button type="button" onClick={onEditPhoto}><span><strong>Foto de perfil</strong><small>{draft.logo_url ? "Cambiar o ajustar la foto" : "Agregar foto o usar iniciales"}</small></span><b aria-hidden="true">→</b></button>
      </div>
      <label>Sobre mí (opcional)<textarea value={draft.buttonZone.contactBio || ""} maxLength={360} rows={3} placeholder="Contá brevemente qué hacés." onChange={(event) => onChange({ buttonZone: { ...draft.buttonZone, contactBio: event.target.value } })} /></label>
    </EditorSection>
    </>}
    {section !== "profile" && <>
    <EditorSection title="Cómo te contactan" tone="green">
      <label>Teléfono<input type="tel" value={actionValue("phone")} placeholder="Ej: +54 9 351 123 4567" onChange={(event) => onActionChange("phone", event.target.value)} /></label>
      <label>Email<input type="email" value={actionValue("email")} placeholder="hola@tuempresa.com" onChange={(event) => onActionChange("email", event.target.value)} /></label>
      <label>WhatsApp<input type="tel" value={actionValue("whatsapp")} placeholder="Ej: 5493511234567" onChange={(event) => onActionChange("whatsapp", event.target.value)} /></label>
      <p className="v2-help" style={{ margin: 0 }}>Con uno alcanza para empezar. Podés agregar los demás después.</p>
      {!actionValue("phone") && !actionValue("email") && !actionValue("whatsapp") && <p className="v2-help" role="status" style={{ margin: 0, color: "#9b4d23" }}>Agregá al menos un medio de contacto para que la tarjeta sea útil.</p>}
    </EditorSection>
    <details className="v2-contact-more"><summary>Más datos para guardar <span>Opcional</span></summary><div className="v2-contact-more-body">
      <p className="v2-help" style={{ margin: 0 }}>Aparecen en tu tarjeta y en el contacto que descarga el visitante.</p>
      <label>Segundo teléfono<input type="tel" value={draft.buttonZone.contactSecondPhone || ""} maxLength={50} placeholder="Ej: +54 11 4567 8901" onChange={(event) => onChange({ buttonZone: { ...draft.buttonZone, contactSecondPhone: event.target.value } })} /></label>
      <label>Dirección<input type="text" value={draft.buttonZone.contactAddress || ""} maxLength={200} placeholder="Calle, número, ciudad y provincia" onChange={(event) => onChange({ buttonZone: { ...draft.buttonZone, contactAddress: event.target.value } })} /></label>
    </div></details>
    </>}
    {section === "all" && <>
    <details className="v2-contact-more"><summary>¿Qué guarda “Guardar contacto”? <span>Ver datos que recibirá el visitante</span></summary><div className="v2-contact-more-body">
      <p className="v2-help" style={{ margin: 0 }}>En la página publicada, el visitante toca el botón, descarga o abre un archivo de contacto (.vcf) y confirma si quiere guardarlo en su agenda. No se agrega automáticamente.</p>
      <div className="v2-contact-export-preview">
        <b>Datos que llevará</b>
        <span>Nombre: {draft.business_name || "Sin completar"}</span>
        {draft.titleStyle.eyebrow && <span>Cargo: {draft.titleStyle.eyebrow}</span>}
        {draft.description && <span>Empresa: {draft.description}</span>}
        {(actionValue("phone") || actionValue("whatsapp")) && <span>Teléfono: {actionValue("phone") || actionValue("whatsapp")}</span>}
        {draft.buttonZone.contactSecondPhone && <span>Segundo teléfono: {draft.buttonZone.contactSecondPhone}</span>}
        {actionValue("email") && <span>Email: {actionValue("email")}</span>}
        {draft.buttonZone.contactAddress && <span>Dirección: {draft.buttonZone.contactAddress}</span>}
        {actionValue("website") && <span>Web: {actionValue("website")}</span>}
        <span>Enlace permanente a esta tarjeta</span>
      </div>
      <p className="v2-help" style={{ margin: 0 }}>Si cargás teléfono y WhatsApp diferentes, el contacto guarda el teléfono; WhatsApp sigue como acceso rápido. El CV y los demás enlaces se abren desde la tarjeta, no se adjuntan a la agenda.</p>
    </div></details>
    </>}
  </div>;
}

// Falls back to the "Minimalismo" template (designed to suit "casi cualquier rubro") when
// no general template is active yet, so "Usar estilos recomendados" always has something sane
// to offer, even on a landing built entirely by hand.
function suggestedPreset(templateId: string): DesignPreset {
  return DESIGN_PRESETS_V2.find((item) => item.id === templateId) || DESIGN_PRESETS_V2[0];
}

function FontWeightControl({font,value,onChange}:{font:string;value:number;onChange:(weight:number)=>void}) {
  const weights=getFontWeights(font);
  const selected=resolveFontWeight(font,value);
  const labels:Record<number,string>={400:"Normal",500:"Medio",600:"Seminegrita",700:"Fuerte",800:"Extra",900:"Máximo"};
  return <fieldset><legend>Grosor</legend>{weights.length===1?<p className="v2-help" style={{margin:0}}>Esta fuente tiene un único grosor original.</p>:<div className="v2-font-weights">{weights.map(weight=><button type="button" key={weight} aria-pressed={selected===weight} className={selected===weight?"active":""} onClick={()=>onChange(weight)}>{labels[weight] || weight}</button>)}</div>}</fieldset>;
}

function LandingTextEditor({ field, draft, onChange }: { field: "title" | "eyebrow" | "description"; draft: LandingDraft; onChange: (patch: Partial<LandingDraft>) => void }) {
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const fontButtonRef = useRef<HTMLButtonElement>(null);
  const fontPickerRef = useDismissibleFontPicker(fontPickerOpen, setFontPickerOpen, fontButtonRef);
  const isTitle = field === "title";
  const isEyebrow = field === "eyebrow";
  const label = isTitle ? "Título principal" : isEyebrow ? "Rubro o frase breve" : "Descripción";
  const value = isTitle ? draft.titleStyle.headline ?? draft.business_name : isEyebrow ? draft.titleStyle.eyebrow || "" : draft.description || "";
  const font = isTitle ? draft.titleStyle.font : isEyebrow ? draft.titleStyle.eyebrowFont || draft.titleStyle.font : draft.subtitleStyle.font;
  const weight = isTitle ? draft.titleStyle.weight : isEyebrow ? draft.titleStyle.eyebrowWeight : draft.subtitleStyle.weight;
  const italic = isTitle ? draft.titleStyle.italic === true : isEyebrow ? draft.titleStyle.eyebrowItalic === true : draft.subtitleStyle.italic === true;
  const color = isTitle ? draft.titleStyle.color : isEyebrow ? draft.titleStyle.eyebrowColor || draft.titleStyle.color : draft.subtitleStyle.color;
  const size = isTitle ? draft.titleStyle.size : isEyebrow ? draft.titleStyle.eyebrowSize : draft.subtitleStyle.size;
  const selectedFont = FONT_OPTIONS.find((option) => option.id === font || option.family === font)?.id || "modern";
  const selectedFontOption = FONT_OPTIONS.find((option) => option.id === selectedFont)!;
  const sizes = isTitle ? [20, 24, 28, 32, 36, 40, 44, 48] : isEyebrow ? [8, 10, 12, 14, 16, 18, 20] : [11, 12, 14, 16, 18, 20, 22, 24, 26];
  if (!sizes.includes(size)) sizes.push(size);
  sizes.sort((a, b) => a - b);
  const updateTitle = (patch: Partial<TitleStyle>) => onChange({ titleStyle: { ...draft.titleStyle, ...patch, presetId: undefined } });
  const updateSubtitle = (patch: Partial<SubtitleStyle>) => onChange({ subtitleStyle: { ...draft.subtitleStyle, ...patch }, titleStyle: { ...draft.titleStyle, presetId: undefined } });
  function updateValue(next: string) {
    if (isTitle) updateTitle({ headline: next });
    else if (isEyebrow) updateTitle({ eyebrow: next });
    else onChange({ description: next });
  }
  function updateFont(next: string) {
    if (isTitle) updateTitle({ font: next, weight: resolveFontWeight(next, weight) });
    else if (isEyebrow) updateTitle({ eyebrowFont: next, eyebrowWeight: resolveFontWeight(next, weight) });
    else updateSubtitle({ font: next, weight: resolveFontWeight(next, weight) });
  }
  function updateWeight(next: number) {
    if (isTitle) updateTitle({ weight: next });
    else if (isEyebrow) updateTitle({ eyebrowWeight: next });
    else updateSubtitle({ weight: next });
  }
  function updateItalic(next: boolean) {
    if (isTitle) updateTitle({ italic: next });
    else if (isEyebrow) updateTitle({ eyebrowItalic: next });
    else updateSubtitle({ italic: next });
  }
  function updateSize(next: number) {
    if (isTitle) updateTitle({ size: next });
    else if (isEyebrow) updateTitle({ eyebrowSize: next });
    else updateSubtitle({ size: next });
  }
  function updateColor(next: string) {
    if (isTitle) updateTitle({ color: next });
    else if (isEyebrow) updateTitle({ eyebrowColor: next });
    else updateSubtitle({ color: next });
  }
  const input = isEyebrow
    ? <input value={value} maxLength={60} placeholder="Ej. ARQUITECTURA & INTERIORES" onChange={(event) => updateValue(event.target.value)} />
    : <textarea value={value} rows={isTitle ? 2 : 3} maxLength={isTitle ? 100 : 240} placeholder={isTitle ? "El título que verá la gente" : "Una descripción clara de tu propuesta"} onChange={(event) => updateValue(event.target.value)} />;
  return <div className="v2-landing-text-editor">
    <label>{label}{isEyebrow && <small> Opcional</small>}</label>
    {input}
    <div ref={fontPickerRef} className={`v2-contact-font-select${fontPickerOpen ? " is-open" : ""}`}><span>Fuente</span><button ref={fontButtonRef} type="button" aria-expanded={fontPickerOpen} aria-controls={`v2-landing-font-options-${field}`} onClick={() => setFontPickerOpen((open) => !open)} style={{ fontFamily: selectedFontOption.family }}>{selectedFontOption.label}<span aria-hidden="true">⌄</span></button>
      {fontPickerOpen && <div id={`v2-landing-font-options-${field}`} className="v2-contact-font-options" aria-label={`Fuentes para ${label.toLowerCase()}`}><FontLinks ids={FONT_OPTIONS.map((option) => option.id)} />{FONT_OPTIONS.map((option) => <button key={option.id} type="button" aria-pressed={selectedFont === option.id} onClick={() => { updateFont(option.id); setFontPickerOpen(false); fontButtonRef.current?.focus(); }} style={{ fontFamily: option.family }}>{option.label}{selectedFont === option.id && <span aria-hidden="true">✓</span>}</button>)}</div>}
    </div>
    <div className="v2-contact-text-tools" aria-label={`Formato de ${label.toLowerCase()}`}>
      <label className="v2-contact-size-select"><span>Tamaño</span><select value={size} onChange={(event) => updateSize(Number(event.target.value))}>{sizes.map((option) => <option key={option} value={option}>{option} px</option>)}</select></label>
      <button type="button" className={weight >= 600 ? "active" : ""} aria-label="Negrita" aria-pressed={weight >= 600} onClick={() => updateWeight(resolveFontWeight(font, weight >= 600 ? 400 : 700))}><strong>B</strong></button>
      <button type="button" className={italic ? "active" : ""} aria-label="Cursiva" aria-pressed={italic} onClick={() => updateItalic(!italic)}><em>I</em></button>
      <label className="v2-contact-color-select"><span>Color</span><input type="color" value={color} aria-label={`Color de ${label.toLowerCase()}`} onChange={(event) => updateColor(event.target.value)} /></label>
    </div>
  </div>;
}

function TitleControls({ draft, onChange }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void }) {
  const style = draft.titleStyle;
  const update = (patch: Partial<TitleStyle>) => onChange({ titleStyle: { ...style, ...patch, presetId: patch.presetId ?? (Object.keys(patch).some((key) => key !== "headline" && key !== "eyebrow") ? undefined : style.presetId) } });
  const letterSpacing = style.letterSpacing ?? (draft.buttonZone.layout === "poster" ? -.045 : 0);
  const letterSpacingMode = letterSpacing <= -.015 ? "tight" : letterSpacing >= .035 ? "wide" : "normal";
  return <div className="v2-fields">
    <LandingTextEditor field="title" draft={draft} onChange={onChange} />
    <LandingTextEditor field="eyebrow" draft={draft} onChange={onChange} />
    <details className="v2-advanced"><summary><span><strong>Más opciones del título</strong><small>Mayúsculas, letras y fondo.</small></span></summary><div className="v2-fields">
      <EditorSection title="Presentación" tone="purple">
        <div className="v2-segment" role="group" aria-label="Formato del título"><button type="button" className={style.transform !== "uppercase" ? "active" : ""} onClick={() => update({ transform: "none" })}>Normal</button><button type="button" className={style.transform === "uppercase" ? "active" : ""} onClick={() => update({ transform: "uppercase" })}>MAYÚSCULAS</button></div>
        <span className="v2-control-label">Espacio entre letras</span>
        <div className="v2-segment" role="group" aria-label="Espacio entre letras"><button type="button" className={letterSpacingMode === "tight" ? "active" : ""} aria-pressed={letterSpacingMode === "tight"} onClick={() => update({ letterSpacing: -.035 })}>Juntas</button><button type="button" className={letterSpacingMode === "normal" ? "active" : ""} aria-pressed={letterSpacingMode === "normal"} onClick={() => update({ letterSpacing: 0 })}>Normal</button><button type="button" className={letterSpacingMode === "wide" ? "active" : ""} aria-pressed={letterSpacingMode === "wide"} onClick={() => update({ letterSpacing: .08 })}>Separadas</button></div>
      </EditorSection>
      <EditorSection title="Fondo del título" tone="peach"><Choice active={style.bgMode === "solid"} title="Fondo detrás del título" note="Ayuda a leerlo sobre fotografías." onClick={() => update({ bgMode: style.bgMode === "solid" ? "none" : "solid" })} />{style.bgMode === "solid" && <ColorField label="Color del fondo" value={style.bg} onChange={(bg) => update({ bg })} />}</EditorSection>
    </div></details>
  </div>;
}

function SubtitleControls({ draft, onChange }: { draft: LandingDraft; onChange: (p: Partial<LandingDraft>) => void }) {
  return <div className="v2-fields">
    <LandingTextEditor field="description" draft={draft} onChange={onChange} />
    <p className="v2-help" style={{ margin: "-7px 2px 0" }}>Una o dos frases suelen alcanzar. La fuente, el tamaño y el color se cambian arriba.</p>
  </div>;
}

function LogoControls({ draft, logoImage, onChange, onLogo, onAdjustLogo, onRemoveLogo }: { draft: LandingDraft; logoImage: string; onChange: (p: Partial<LandingDraft>) => void; onLogo: (file?: File) => void; onAdjustLogo: () => void; onRemoveLogo: () => void }) {
  const style = draft.logoStyle;
  const isContact = draft.business_type === "contact";
  const primary = draft.primary_color || "#1f2937";
  const update = (patch: Partial<LogoStyle>) => onChange({ logoStyle: { ...style, ...patch } });
  const legacyContactShadow = style.shadow === "glow" || style.shadow === "hard";
  if (isContact) return <div className="v2-fields v2-contact-photo-controls">
    <div className="v2-contact-photo-preview" style={{ ...logoFrameStyle(style, primary), ...(logoImage && style.borderWidth > 0 ? { background: style.borderColor } : {}), borderRadius: logoBorderRadius(style.shape, 88), fontFamily: resolveTextFont(draft.titleStyle.font), fontSize: logoLetterSize(88, style.initials) }}>
      {logoImage ? <span style={{ backgroundImage: `url(${JSON.stringify(logoImage)})`, backgroundSize: "cover", backgroundPosition: `${style.x}% ${style.y}%`, transform: `scale(${style.zoom})`, transformOrigin: `${style.x}% ${style.y}%` }} /> : <LogoInitials font={draft.titleStyle.font}>{logoInitials(draftDisplayTitle(draft), style.initials)}</LogoInitials>}
    </div>
    <label className="v2-upload">{logoImage ? "Cambiar foto de perfil" : "Subir foto de perfil"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { onLogo(event.target.files?.[0]); event.target.value = ""; }} /></label>
    {logoImage && <div className="v2-contact-photo-actions"><button type="button" className="v2-suggested" onClick={onAdjustLogo}>Ajustar encuadre</button><button type="button" className="v2-ghost" onClick={onRemoveLogo}>Quitar foto</button></div>}
    <EditorSection title="Presentación" tone="blue">
      <div className="v2-segment" aria-label="Forma de la foto">{LOGO_SHAPE_OPTIONS.map((option) => <button type="button" key={option.id} className={style.shape === option.id ? "active" : ""} aria-pressed={style.shape === option.id} onClick={() => update({ shape: option.id, treatment: "custom" })}>{option.label}</button>)}</div>
      <Range label="Tamaño" min={draft.buttonZone.contactLayout === "document" ? 64 : 80} max={draft.buttonZone.contactLayout === "document" ? 112 : 160} step={4} value={draft.buttonZone.contactLayout === "document" ? Math.min(112, Math.max(64, style.size)) : style.size} onChange={(size) => update({ size })} />
    </EditorSection>
    {!logoImage && <EditorSection title="Iniciales" tone="green">
      <p className="v2-help" style={{ margin: 0 }}>Se toman de tu nombre y usan su misma tipografía.</p>
      <div className="v2-segment" aria-label="Cantidad de iniciales">
        <button type="button" className={style.initials === "one" ? "active" : ""} aria-pressed={style.initials === "one"} onClick={() => update({ initials: "one" })}>Una · {logoInitials(draftDisplayTitle(draft), "one")}</button>
        <button type="button" className={style.initials === "two" ? "active" : ""} aria-pressed={style.initials === "two"} onClick={() => update({ initials: "two" })}>Dos · {logoInitials(draftDisplayTitle(draft), "two")}</button>
      </div>
      <span className="v2-contact-control-label">Fondo de las iniciales</span>
      <div className="v2-segment" aria-label="Color de fondo de las iniciales">
        <button type="button" className={style.backgroundMode === "auto" ? "active" : ""} aria-pressed={style.backgroundMode === "auto"} onClick={() => update({ backgroundMode: "auto" })}>Color del diseño</button>
        <button type="button" className={style.backgroundMode === "custom" ? "active" : ""} aria-pressed={style.backgroundMode === "custom"} onClick={() => update({ backgroundMode: "custom" })}>Color propio</button>
      </div>
      {style.backgroundMode === "custom" && <ColorField label="Color de fondo" value={style.fallback} onChange={(fallback) => update({ fallback })} />}
    </EditorSection>}
    <EditorSection title="Borde y sombra" tone="purple">
      <span className="v2-contact-control-label">Borde</span>
      <div className="v2-segment" aria-label="Borde de la foto de perfil">
        {([{ width: 0, label: "Sin borde" }, { width: 2, label: "Fino" }, { width: 4, label: "Destacado" }] as const).map(({ width, label }) => {
          const selected = width === 0 ? style.borderWidth === 0 : width === 2 ? style.borderWidth > 0 && style.borderWidth < 4 : style.borderWidth >= 4;
          return <button type="button" key={width} className={selected ? "active" : ""} aria-pressed={selected} onClick={() => update({ borderWidth: width, treatment: "custom" })}>{label}</button>;
        })}
      </div>
      {style.borderWidth > 0 && <ColorField label="Color del borde" value={style.borderColor} onChange={(borderColor) => update({ borderColor, treatment: "custom" })} />}
      <span className="v2-contact-control-label">Sombra</span>
      <div className="v2-segment" aria-label="Sombra de la foto de perfil">
        <button type="button" className={style.shadow === "none" ? "active" : ""} aria-pressed={style.shadow === "none"} onClick={() => update({ shadow: "none", treatment: "custom" })}>Sin sombra</button>
        <button type="button" className={style.shadow === "soft" ? "active" : ""} aria-pressed={style.shadow === "soft"} onClick={() => update({ shadow: "soft", treatment: "custom" })}>Suave</button>
      </div>
      {legacyContactShadow && <p className="v2-help" style={{ margin: 0 }}>Esta tarjeta conserva una sombra anterior. Elegí una opción para reemplazarla.</p>}
    </EditorSection>
  </div>;
  return <div className="v2-fields">
    <div className="v2-logo-editor"><div style={{ ...logoFrameStyle(style, primary), borderRadius: logoBorderRadius(style.shape, 76), fontSize: logoLetterSize(76, style.initials), fontFamily: resolveTextFont(draft.titleStyle.font) }}>{logoImage ? <span style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${style.zoom * 100}%`, backgroundPosition: `${style.x}% ${style.y}%` }} /> : <LogoInitials font={draft.titleStyle.font}>{logoInitials(draftDisplayTitle(draft), style.initials)}</LogoInitials>}</div><span><label className="v2-upload">{logoImage ? "Cambiar imagen" : "Elegir imagen"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { onLogo(event.target.files?.[0]); event.target.value = ""; }} /></label>{logoImage && <><button type="button" className="v2-inline-action v2-adjust-image" onClick={onAdjustLogo}>Ajustar encuadre</button><button type="button" className="v2-delete" onClick={onRemoveLogo}>Quitar</button></>}</span></div>
    <fieldset className="v2-logo-section v2-logo-section-bg">
      <legend>1 · Color de fondo</legend>
      <p className="v2-help" style={{ margin: "0 0 4px" }}>{isContact ? "Se ve detrás de tu foto. Si todavía no subiste una, es el color de fondo de tus iniciales." : "Se ve detrás del círculo del logo (si no subiste foto, es el color de fondo de la inicial). Elegilo primero: la forma y el borde se juzgan mejor contra tu color real."}</p>
      <Choice active={style.backgroundMode === "auto"} swatch={primary} title="Automático" note="El color sugerido por tu plantilla." onClick={() => update({ backgroundMode: "auto" })} />
      <Choice active={style.backgroundMode === "custom"} swatch={style.fallback} title="Personalizado" note="Elegí cualquier color para el fondo del logo." onClick={() => update({ backgroundMode: "custom" })} />
      {style.backgroundMode === "custom" && <ColorField label="Color de fondo" value={style.fallback} onChange={(fallback) => update({ fallback })} />}
    </fieldset>
    <fieldset className="v2-logo-section v2-logo-section-shape">
      <legend>2 · Forma {isContact ? "de la foto" : "del logo"}</legend>
      <div className="v2-logo-shape-grid">
        {LOGO_SHAPE_OPTIONS.map((option) => (
          <button type="button" key={option.id} className={style.shape === option.id ? "active" : ""} aria-pressed={style.shape === option.id} onClick={() => update({ shape: option.id, treatment: "custom" })}>
            {/* Fixed thin border, not tied to the real Borde/Sombra settings below — just enough
                to read the shape's outline clearly. Doesn't move when those settings change. */}
            <span className="v2-logo-shape-preview" style={{ ...logoFrameStyle({ ...style, shape: option.id, borderWidth: 2, borderColor: "#00000026", shadow: "none" }, primary), borderRadius: logoBorderRadius(option.id, 48), fontSize: logoLetterSize(48, style.initials), fontFamily: resolveTextFont(draft.titleStyle.font) }}>
              {logoImage ? <i style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${style.zoom * 100}%`, backgroundPosition: `${style.x}% ${style.y}%` }} /> : <LogoInitials font={draft.titleStyle.font}>{logoInitials(draftDisplayTitle(draft), style.initials)}</LogoInitials>}
            </span>
            <b>{option.label}</b>
          </button>
        ))}
      </div>
    </fieldset>
    <fieldset className="v2-logo-section v2-logo-section-edge">
      <legend>3 · Borde y sombra</legend>
      <p className="v2-help" style={{ margin: "0 0 8px" }}>Cada opción trae un borde y una sombra ya combinados. "Suave" es una sombra gris de profundidad, como cualquier sombra real. "Glow" es un halo de color alrededor, tipo neón.</p>
      <div className="v2-logo-shape-grid">
        {LOGO_EDGE_OPTIONS.map((option) => {
          return (
            <button type="button" key={option.id} className={style.shadow === option.id ? "active" : ""} aria-pressed={style.shadow === option.id} onClick={() => update({ ...option.patch, treatment: "custom" })}>
              {/* Fixed white-plate/black-edge demo instead of the real live colors — on your
                  actual background/border color, a soft or subtle option can wash out to the
                  point the difference between options disappears. Always showing the same clean
                  example keeps every option legible no matter what you've already got set. */}
              <span className="v2-logo-shape-preview" style={{ ...logoFrameStyle({ ...style, ...option.patch, backgroundMode: "custom", fallback: "#ffffff", borderColor: "#0a0a0a", shadowColor: "#0a0a0a" }, primary), borderRadius: logoBorderRadius(style.shape, 48), fontSize: logoLetterSize(48, style.initials), fontFamily: resolveTextFont(draft.titleStyle.font) }}>
                {logoImage ? <i style={{ backgroundImage: `url(${logoImage})`, backgroundSize: `${style.zoom * 100}%`, backgroundPosition: `${style.x}% ${style.y}%` }} /> : <LogoInitials font={draft.titleStyle.font}>{logoInitials(draftDisplayTitle(draft), style.initials)}</LogoInitials>}
              </span>
              <b>{option.label}</b>
            </button>
          );
        })}
      </div>
      {style.shadow !== "none" && (
        <div className="v2-logo-edge-columns" style={{ marginTop: 10 }}>
          <div className="v2-logo-edge-column">
            <label className="v2-mini-color" title="Color del borde"><span>Color de borde</span><input type="color" value={style.borderColor} onChange={(event) => update({ borderColor: event.target.value, treatment: "custom" })} /></label>
            {/* Step 2 instead of 1: a 1px border reads as a broken hairline at logo scale rather
                than an intentional thin border. */}
            <Range label="Borde" min={2} max={10} step={2} value={style.borderWidth} onChange={(borderWidth) => update({ borderWidth, treatment: "custom" })} />
          </div>
          <div className="v2-logo-edge-column">
            {style.shadow === "soft" ? (
              // Matches .v2-mini-color's own height (padding + label + 42px swatch) so "Tamaño
              // de sombra" below still lines up with "Borde" in the other column, instead of
              // starting higher just because this slot has no color swatch to fill it out.
              <p className="v2-help v2-logo-edge-note" style={{ margin: 0 }}>"Suave" mantiene su sombra siempre neutra a propósito, para que se vea bien sobre cualquier fondo.</p>
            ) : (
              <label className="v2-mini-color" title="Color de la sombra"><span>Color de sombra</span><input type="color" value={style.shadowColor} onChange={(event) => update({ shadowColor: event.target.value, treatment: "custom" })} /></label>
            )}
            <Range label="Tamaño de sombra" min={.5} max={2} step={.05} value={style.shadowSize} onChange={(shadowSize) => update({ shadowSize, treatment: "custom" })} />
          </div>
        </div>
      )}
    </fieldset>
    {!logoImage && (
      <fieldset className="v2-logo-section v2-logo-section-initials">
        <legend>4 · Iniciales</legend>
        <p className="v2-help" style={{ margin: "0 0 4px" }}>Mientras no subas una imagen, se muestra esto en el círculo.</p>
        <div className="v2-segment">
          <button type="button" className={style.initials === "one" ? "active" : ""} onClick={() => update({ initials: "one" })}>{logoInitials(draftDisplayTitle(draft), "one")}</button>
          <button type="button" className={style.initials === "two" ? "active" : ""} onClick={() => update({ initials: "two" })}>{logoInitials(draftDisplayTitle(draft), "two")}</button>
        </div>
      </fieldset>
    )}
    <fieldset className="v2-logo-section v2-logo-section-size">
      <legend>{logoImage ? "5" : "4"} · Tamaño</legend>
      <Range label="Tamaño" min={isContact && draft.buttonZone.contactLayout === "document" ? 64 : isContact ? 80 : 72} max={isContact && draft.buttonZone.contactLayout === "document" ? 112 : isContact ? 160 : 190} step={4} value={isContact && draft.buttonZone.contactLayout === "document" ? Math.min(112, Math.max(64, style.size)) : style.size} onChange={(size) => update({ size })} />
    </fieldset>
  </div>;
}

function ActionCatalog({ onAdd, isContact = false }: { onAdd: (type: string) => void; isContact?: boolean }) {
  const networkActions = getAllActions().filter((action) => action.type !== "url" && (!isContact || !["phone", "email", "whatsapp"].includes(action.type)));
  if (isContact) networkActions.sort((a, b) => (a.type === "website" ? -2 : a.type === "cv" ? -1 : 0) - (b.type === "website" ? -2 : b.type === "cv" ? -1 : 0));
  return <div>
    <p className="v2-help">{isContact ? "Elegí un sitio, red o documento PDF. Después podés ajustar su texto y destino." : "Elegí la red o acción. Ya viene con su nombre, ícono y color oficial."}</p>
    <div className="v2-action-grid">{networkActions.map((action)=><button type="button" key={action.type} className={action.type === "cv" ? "is-pdf" : undefined} onClick={()=>onAdd(action.type)}><ActionTypeIcon type={action.type}/><span><b>{action.label}</b><small>{action.type === "cv" ? "Subí un CV, catálogo, menú o dossier" : action.input === "phone" ? "Número de teléfono" : action.input === "username" ? "Nombre de usuario" : "Enlace"}</small></span>{action.type === "cv" && <strong className="v2-action-pdf-badge">PDF</strong>}<em>＋</em></button>)}</div>
    <button type="button" className="v2-custom-action" onClick={()=>onAdd("url")}>
      <span className="v2-custom-action-icon"><FiLink /></span>
      <span><b>{isContact ? "Agregar otro enlace" : "Agregar botón personalizado"}</b><small>{isContact ? "Portfolio, proyecto, formulario u otra página." : "Cualquier enlace: tu menú, un formulario, otra red, lo que necesites."}</small></span>
      <em>＋</em>
    </button>
  </div>;
}

function ButtonControls({ button,draft,cvFileName,cvFileError,iconUploading,iconUploadError,onIconFile,onClearCvFile,onChange,onDelete }: { button: ButtonItem; draft: LandingDraft; cvFileName: string; cvFileError: string; iconUploading: boolean; iconUploadError: string; onIconFile: (file: File) => void | Promise<void>; onClearCvFile: () => void; onChange:(p:Partial<ButtonItem>)=>void; onDelete:()=>void }) {
  const def=getAllActions().find((item)=>item.type===button.type);
  const previewPrimary = draft.primary_color || "#1f2937";
  const previewColors = resolveButtonColors({ zone: draft.buttonZone, type: button.type, position: button.position, primary: previewPrimary, customColor: button.background_color, useAutoColor: button.use_auto_color });
  const customIconBackground = /^#[0-9a-f]{6}$/i.test(button.icon_background_color) ? button.icon_background_color : "";
  const iconPreviewStyle: CSSProperties = draft.business_type === "contact"
    ? { width: 64, height: 64, flex: "0 0 64px", display: "grid", placeItems: "center", borderRadius: 20, background: previewPrimary, color: contrastTextColor(previewPrimary) }
    : {
        ...buttonIconStyle(draft.buttonZone.collection, previewColors.background, 64, button.type, draft.buttonZone.iconAppearance, previewColors.isAuthentic, previewColors.useNetworkAccent, true),
        ...(customIconBackground ? { background: customIconBackground, color: contrastTextColor(customIconBackground) } : {}),
      };
  if (draft.business_type === "contact") return <div className="v2-fields">
    <p className="v2-help">Este enlace se muestra como una ficha de la tarjeta. Su color principal se cambia en Diseño.</p>
    <EditorSection title="Contenido y destino" tone="blue">
      <label>Título<input value={button.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
      <label>Detalle <small>Opcional</small><input value={button.subtitle} onChange={(event) => onChange({ subtitle: event.target.value })} /></label>
      {button.type === "cv" ? <CvSourceField value={button.url} fileName={cvFileName} error={cvFileError} onUrlChange={(url) => onChange({ url })} onClearFile={onClearCvFile} /> : <label>{def?.input === "username" ? "Usuario" : "Enlace"}<input type={def?.input === "username" ? "text" : "url"} value={button.url} placeholder={def?.placeholder || "https://..."} onChange={(event) => onChange({ url: event.target.value })} /></label>}
    </EditorSection>
    <EditorSection title="Ícono" tone="purple"><IconPicker type={button.type} value={button.icon} customImageUrl={button.icon_url} customImageFit={button.icon_fit} customImageScale={button.icon_scale} previewStyle={iconPreviewStyle} uploading={iconUploading} error={iconUploadError} onUpload={onIconFile} onChange={(icon) => onChange({ icon, icon_url: "", icon_fit: "contain", icon_scale: 1 })} onRemoveCustom={() => onChange({ icon_url: "", icon_fit: "contain", icon_scale: 1 })} onImageFitChange={(icon_fit) => onChange({ icon_fit })} onImageScaleChange={(icon_scale) => onChange({ icon_scale })} /></EditorSection>
    <button type="button" className="v2-delete" onClick={onDelete}>Quitar enlace</button>
  </div>;
  const brandColor = AUTO_COLORS[button.type] || draft.primary_color || "#1f2937";
  const globalColor = resolveButtonColors({ zone: draft.buttonZone, type: button.type, position: 0, primary: draft.primary_color || "#1f2937", customColor: null, useAutoColor: true }).background;
  const globalDescription = draft.buttonZone.colorMode === "one"
    ? `Usa el color general ${globalColor.toUpperCase()}.`
    : `Usa el color oficial de ${def?.label || "esta acción"}.`;
  const ownColor = button.background_color || brandColor;
  const suggestedGradient = ownColor.toLowerCase() === (draft.primary_color || "#6657e8").toLowerCase() ? "#a855f7" : draft.primary_color || "#6657e8";
  return <div className="v2-fields">
    {button.type === "cv" ? <div className="v2-document-heading"><ActionTypeIcon type="cv" customImageUrl={button.icon_url} customImageFit={button.icon_fit} customImageScale={button.icon_scale}/><span><strong>Documento PDF</strong><small>CV, catálogo, menú, portfolio o cualquier archivo en PDF.</small></span><em>PDF</em></div> : <div className="v2-brand"><ActionTypeIcon type={button.type} icon={button.icon} customImageUrl={button.icon_url} customImageFit={button.icon_fit} customImageScale={button.icon_scale}/><span><b>{def?.label || "Enlace"}</b><small>{button.icon_url ? "Imagen propia" : button.icon ? "Ícono de la galería" : "Ícono incluido automáticamente"}</small></span></div>}
<EditorSection title="Contenido y destino" tone="blue">    <label>{button.type === "cv" ? "Texto que verá la gente" : "Texto del botón"}<input value={button.title} placeholder={button.type === "cv" ? "Ej: Ver catálogo" : undefined} onChange={(e)=>onChange({title:e.target.value})}/></label>
    {button.type === "cv" && <div className="v2-document-examples" aria-label="Ejemplos de texto para el botón">{PDF_TITLE_OPTIONS.map((title) => <button key={title} type="button" aria-pressed={button.title === title} onClick={() => onChange({ title })}>{title}</button>)}</div>}
    <label>Texto secundario <small>Opcional</small><input value={button.subtitle} onChange={(e)=>onChange({subtitle:e.target.value})}/></label>
    {button.type === "cv" ? <CvSourceField context="landing" value={button.url} fileName={cvFileName} error={cvFileError} onUrlChange={(url) => onChange({ url })} onClearFile={onClearCvFile} /> : <label>{def?.input === "phone" ? "Número" : def?.input === "email" ? "Email" : def?.input === "username" ? "Usuario" : "Enlace"}<input value={button.url} placeholder={def?.placeholder} onChange={(e)=>onChange({url:e.target.value})}/></label>}
    {def?.message && <label>Mensaje de WhatsApp<textarea rows={3} value={button.message} onChange={(e)=>onChange({message:e.target.value})}/></label>}
</EditorSection><EditorSection title="Ícono" tone="purple">    <IconPicker type={button.type} value={button.icon} customImageUrl={button.icon_url} customImageFit={button.icon_fit} customImageScale={button.icon_scale} previewStyle={iconPreviewStyle} uploading={iconUploading} error={iconUploadError} onUpload={onIconFile} onChange={(icon)=>onChange({icon,icon_url:"",icon_fit:"contain",icon_scale:1})} onRemoveCustom={() => onChange({icon_url:"",icon_fit:"contain",icon_scale:1})} onImageFitChange={(icon_fit)=>onChange({icon_fit})} onImageScaleChange={(icon_scale)=>onChange({icon_scale})}/>
    <fieldset>
      <legend>Fondo del ícono</legend>
      <Choice active={!button.icon_background_color} title="Diseño de la plantilla" note="Mantiene el estilo original del ícono." onClick={()=>onChange({icon_background_color:""})}/>
      <Choice active={Boolean(button.icon_background_color)} swatch={button.icon_background_color || "#1f2937"} title="Color propio" note="Cambia solo el fondo de este ícono; el símbolo ajusta su contraste." onClick={()=>onChange({icon_background_color:button.icon_background_color || "#1f2937"})}/>
      {button.icon_background_color && <ColorField label="Color del fondo" value={button.icon_background_color} onChange={(icon_background_color)=>onChange({icon_background_color})}/>}
    </fieldset>
</EditorSection>    <fieldset>
      <legend>Apariencia de este botón</legend>
      <Choice active={button.use_auto_color} swatch={globalColor} title="Usar el diseño general" note={globalDescription} onClick={()=>onChange({use_auto_color:true})}/>
      <Choice active={!button.use_auto_color} swatch={ownColor} title="Usar un color propio" note="Solo este botón queda separado de la regla general." onClick={()=>onChange({use_auto_color:false,background_color:ownColor})}/>
      {!button.use_auto_color && <div className="v2-own-color">
        <div className="v2-button-finish"><span>Fondo</span><div className="v2-segment" role="group" aria-label="Terminación del fondo"><button type="button" className={!button.background_gradient_to ? "active" : ""} aria-pressed={!button.background_gradient_to} onClick={() => onChange({background_gradient_to:""})}>Color sólido</button><button type="button" className={button.background_gradient_to ? "active" : ""} aria-pressed={Boolean(button.background_gradient_to)} onClick={() => onChange({background_gradient_to:button.background_gradient_to || suggestedGradient})}>Degradado</button></div></div>
        {button.background_gradient_to ? <div className="v2-gradient-colors">
          <ColorField label="Color 1" value={ownColor} onChange={(background_color)=>onChange({background_color})}/>
          <ColorField label="Color 2" value={button.background_gradient_to} onChange={(background_gradient_to)=>onChange({background_gradient_to})}/>
        </div> : <ColorField label="Color" value={ownColor} onChange={(background_color)=>onChange({background_color})}/>}
        {ownColor.toLowerCase() !== brandColor.toLowerCase() && <button type="button" className="v2-inline-action" onClick={()=>onChange({background_color:brandColor})}><i style={{background:brandColor}} /> Usar color oficial de {def?.label || "la marca"}</button>}
        <button type="button" className="v2-reset-action" onClick={()=>onChange({use_auto_color:true,background_gradient_to:""})}>↩ Volver al diseño general</button>
      </div>}
    </fieldset>
    <button type="button" className="v2-delete" onClick={onDelete}>Eliminar botón</button>
  </div>;
}

function Choice({active,title,note,onClick,swatch,suggested=false,preview}:{active:boolean;title:string;note:string;onClick:()=>void;swatch?:string;suggested?:boolean;preview?:ReactNode}) { return <button type="button" className={`v2-choice ${active?"active":""}`} aria-pressed={active} onClick={onClick}><i aria-hidden="true">{active?"✓":""}</i>{swatch && <em className="v2-choice-swatch" style={{background:swatch}} />}<span><b>{title}{suggested && <em className="v2-choice-suggested">(Sugerido para la plantilla)</em>}</b><small>{note}</small></span>{preview}</button>; }

function ButtonChoicePreview({ draft, buttons, backgroundImage, colorMode, iconAppearance }: { draft: LandingDraft; buttons: ButtonItem[]; backgroundImage: string; colorMode: ButtonZoneStyle["colorMode"]; iconAppearance: ButtonZoneStyle["iconAppearance"] }) {
  const zone = { ...draft.buttonZone, colorMode, iconAppearance };
  const sampleButtons = buttons.length ? buttons : [{ id: "example", type: "url", title: "Tu botón", subtitle: "", url: "", message: "", icon: "", icon_url: "", icon_fit: "contain" as const, icon_scale: 1, icon_background_color: "", background_color: "", background_gradient_to: "", text_color: "", use_auto_color: true, position: 0 }];
  const baseColor = draft.background_color || "#f7f5f0";
  const backgroundStyle: CSSProperties = { backgroundColor: baseColor };
  if (draft.background_type === "image" && backgroundImage) {
    const tintColor = draft.bgPosition.tintColor || (draft.bgPosition.lighten > 0 ? "#ffffff" : "#000000");
    const tint = draft.bgPosition.lighten > 0 ? draft.bgPosition.lighten : draft.bgPosition.tint;
    backgroundStyle.backgroundImage = `linear-gradient(${hexToRgba(tintColor, tint * .52)},${hexToRgba(tintColor, tint * .82)}),url(${JSON.stringify(backgroundImage)})`;
    backgroundStyle.backgroundSize = "cover";
    backgroundStyle.backgroundPosition = `${draft.bgPosition.x}% ${draft.bgPosition.y}%`;
  } else if (draft.background_type === "gradient" && draft.background_gradient_to) {
    backgroundStyle.backgroundImage = `linear-gradient(145deg,${baseColor},${draft.background_gradient_to})`;
  }
  return <span className="v2-choice-preview" style={backgroundStyle} aria-hidden="true" title={buttons.length ? "Vista con tus botones" : "Ejemplo sin botones"}>
    {sampleButtons.map((button) => {
      const { background: bg, text, isAuthentic, useNetworkAccent } = resolveButtonColors({ zone, type: button.type, position: button.position, primary: draft.primary_color || "#1f2937", customColor: button.background_color, useAutoColor: button.use_auto_color });
      const hasCustomIcon = Boolean(button.icon_url) || hasCustomActionIcon(button.icon);
      const customIconBackground = /^#[0-9a-f]{6}$/i.test(button.icon_background_color) ? button.icon_background_color : undefined;
      const customGradientTo = !button.use_auto_color && /^#[0-9a-f]{6}$/i.test(button.background_gradient_to) ? button.background_gradient_to : undefined;
      const instagramAsset = instagramAssetMode(zone.collection, button.type, iconAppearance, hasCustomIcon);
      return <span key={button.id} className="v2-choice-preview-chip" style={{ ...buttonCollectionStyle(zone.collection, bg, text, button.position, button.type, isAuthentic, useNetworkAccent), ...(customGradientTo ? { background: `linear-gradient(135deg,${bg},${customGradientTo})` } : {}), borderRadius: Math.max(6, zone.radius * .32) }}>
        <span style={{ ...buttonIconStyle(zone.collection, bg, 18, button.type, iconAppearance, isAuthentic, useNetworkAccent, hasCustomIcon), ...(button.icon_url ? { overflow: "hidden" } : {}), ...(zone.textColor && iconAppearance === "minimal" && !hasCustomIcon ? { color: zone.textColor } : {}), ...(customIconBackground ? { background: customIconBackground, color: contrastTextColor(customIconBackground) } : {}) }}><ActionTypeIcon type={button.type} icon={button.icon} customImageUrl={button.icon_url} customImageFit={button.icon_fit} customImageScale={button.icon_scale} brandMark={shouldUseBrandMark(zone.collection, button.type, iconAppearance, isAuthentic)} brandBackground={youtubeMarkSurfaceColor(zone.collection, bg, button.icon_background_color)} instagramAsset={customIconBackground && instagramAsset === "color" ? "mono" : instagramAsset} /></span>
      </span>;
    })}
  </span>;
}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="v2-color"><span>{label}</span><input type="color" value={value} onChange={(e)=>onChange(e.target.value)}/><code>{value.toUpperCase()}</code></label>; }
function Range({label,min,max,step=1,value,onChange}:{label:string;min:number;max:number;step?:number;value:number;onChange:(v:number)=>void}) { const scaledPercent=max<=3; const percent=scaledPercent||label==="Horizontal"||label==="Vertical"; const pixels=!percent&&(label==="Tamaño"||label==="Borde"||label.includes("Alto")||label.includes("Espaciado")||label.includes("ícono")||label.includes("texto")||label==="Desenfoque"||label==="Espacio superior"); const shown=Math.round(value*(scaledPercent?100:1)); return <label className="v2-range"><span>{label}<b>{label==="Luminosidad"&&shown>0?"+":""}{shown}{percent?"%":pixels?" px":""}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(Number(e.target.value))}/></label>; }
