import type { CSSProperties } from "react";
import { FONT_OPTIONS, getFontFamily, resolveTextFont } from "@/lib/fonts";

export { FONT_OPTIONS, getFontFamily, resolveTextFont };

export type TemplateValue = "professional" | "hotel" | "tourism" | "restaurant" | "business";

export const GRADIENT_PRESETS = [
  { label: "Atardecer", from: "#ff9a76", to: "#6a4c93" },
  { label: "Océano", from: "#2193b0", to: "#6dd5ed" },
  { label: "Bosque", from: "#134e5e", to: "#71b280" },
  { label: "Uva", from: "#8e2de2", to: "#4a00e0" },
  { label: "Durazno", from: "#ffecd2", to: "#fcb69f" },
  { label: "Medianoche", from: "#0f2027", to: "#2c5364" },
];

export type BackgroundLike = {
  background_type?: string | null;
  background_color?: string | null;
  background_gradient_to?: string | null;
  background_image_url?: string | null;
};

export function backgroundStyle(landing: BackgroundLike): CSSProperties {
  if (landing.background_type === "image" && landing.background_image_url) {
    return { backgroundImage: `url(${landing.background_image_url})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  if (landing.background_type === "gradient" && landing.background_gradient_to) {
    return { background: `linear-gradient(135deg, ${landing.background_color || "#f7f5f0"}, ${landing.background_gradient_to})` };
  }
  return { background: landing.background_color || "#f7f5f0" };
}

function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const parts = clean.match(/.{1,2}/g);
  const [r, g, b] = (parts || ["f7", "f5", "f0"]).map((part) => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function autoTextColor(landing: BackgroundLike): string {
  if (landing.background_type === "image") return "#ffffff";
  let lum = luminance(landing.background_color || "#f7f5f0");
  if (landing.background_type === "gradient" && landing.background_gradient_to) {
    lum = (lum + luminance(landing.background_gradient_to)) / 2;
  }
  return lum > 0.5 ? "#161b18" : "#ffffff";
}

export function resolveBackgroundTint(backgroundType?: string | null, tint?: number | null): number {
  if (backgroundType !== "image") return 0;
  const value = typeof tint === "number" && Number.isFinite(tint) ? tint : 0.18;
  return Math.min(0.65, Math.max(0, value));
}

export function resolveTextColor(landing: BackgroundLike & { text_color?: string | null }): string {
  return landing.text_color || autoTextColor(landing);
}

export function contrastTextColor(hex: string): string {
  return luminance(hex) > 0.5 ? "#161b18" : "#ffffff";
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const parts = clean.match(/.{1,2}/g) || ["0", "0", "0"];
  const [r, g, b] = parts.map((part) => parseInt(part, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function panelBackground(textColor: string, overrideHex?: string | null): string {
  if (overrideHex) return hexToRgba(overrideHex, 0.55);
  return textColor === "#ffffff" ? "rgba(0, 0, 0, 0.38)" : "rgba(255, 255, 255, 0.78)";
}

// ---------- Global button style: one shape + fill applied to every button, ----------
// so the whole card reads as one cohesive design instead of a per-button mix.
export const BUTTON_SHAPES: { id: string; label: string }[] = [
  { id: "rounded", label: "Redondeado" },
  { id: "pill", label: "Píldora" },
  { id: "sharp", label: "Cuadrado" },
];

export const BUTTON_FILLS: { id: string; label: string }[] = [
  { id: "solid", label: "Sólido" },
  { id: "outline", label: "Contorno" },
  { id: "glass", label: "Glass" },
];

export function buttonShapeRadius(shape?: string | null): string {
  if (shape === "pill") return "var(--radius-full)";
  if (shape === "sharp") return "6px";
  return "var(--radius-md)";
}

export type ButtonZoneStyle = {
  preset: string;
  layout: "center" | "editorial" | "profile-card" | "compact" | "poster";
  // Which general template (if any) the whole design was last built from — separate from
  // `preset`, which tracks the button look specifically. They diverge once someone picks a
  // different template just for the buttons ("elegir plantilla de botones").
  templateId: string;
  gap: number; height: number; radius: number; width: number;
  shadow: "none" | "soft" | "strong"; finish: "solid" | "glass" | "outline";
  collection: "soft" | "brand" | "brandmark" | "brandpanel" | "glass" | "glow" | "luxury" | "minimal" | "split" | "bento" | "pastel" | "metallic" | "retro" | "editorial" | "candy" | "ocean" | "brutal" | "corporate";
  colorMode: "auto" | "one"; oneColor: string; textSize: number; iconSize: number;
  iconAppearance: "brand" | "minimal";
  contentAlign: "center" | "left";
  contentAlignMode: "auto" | "manual";
};

export const DEFAULT_BUTTON_ZONE: ButtonZoneStyle = {
  preset: "essential",
  layout: "center",
  templateId: "custom",
  gap: 9, height: 52, radius: 16, width: 100,
  shadow: "soft", finish: "solid", collection: "soft", colorMode: "auto", oneColor: "#6d5cff",
  textSize: 14, iconSize: 29, iconAppearance: "minimal", contentAlign: "center", contentAlignMode: "auto",
};

export function parseButtonZone(raw: unknown): ButtonZoneStyle {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BUTTON_ZONE };
  const parsed = raw as Partial<ButtonZoneStyle>;
  const merged = { ...DEFAULT_BUTTON_ZONE, ...parsed };
  const clamp = (value: unknown, min: number, max: number, fallback: number) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  const collections: ButtonZoneStyle["collection"][] = ["soft","brand","brandmark","brandpanel","glass","glow","luxury","minimal","split","bento","pastel","metallic","retro","editorial","candy","ocean","brutal","corporate"];
  const colorModes: ButtonZoneStyle["colorMode"][] = ["auto","one"];
  const finishes: ButtonZoneStyle["finish"][] = ["solid","glass","outline"];
  const shadows: ButtonZoneStyle["shadow"][] = ["none","soft","strong"];
  const layouts: ButtonZoneStyle["layout"][] = ["center","editorial","profile-card","compact","poster"];
  const contentAligns: ButtonZoneStyle["contentAlign"][] = ["center","left"];
  return {
    ...merged,
    preset: typeof parsed.preset === "string" ? parsed.preset : "custom",
    layout: layouts.includes(merged.layout) ? merged.layout : "center",
    templateId: typeof parsed.templateId === "string" ? parsed.templateId : "custom",
    gap: clamp(parsed.gap, 4, 20, DEFAULT_BUTTON_ZONE.gap),
    height: clamp(parsed.height, 40, 72, DEFAULT_BUTTON_ZONE.height),
    radius: clamp(parsed.radius, 0, 36, DEFAULT_BUTTON_ZONE.radius),
    width: clamp(parsed.width, 72, 100, DEFAULT_BUTTON_ZONE.width),
    textSize: clamp(parsed.textSize, 12, 18, DEFAULT_BUTTON_ZONE.textSize),
    iconSize: clamp(parsed.iconSize, 22, 38, DEFAULT_BUTTON_ZONE.iconSize),
    collection: collections.includes(merged.collection) ? merged.collection : "soft",
    colorMode: colorModes.includes(merged.colorMode) ? merged.colorMode : "auto",
    finish: finishes.includes(merged.finish) ? merged.finish : "solid",
    shadow: shadows.includes(merged.shadow) ? merged.shadow : "soft",
    iconAppearance: parsed.iconAppearance === "brand" || parsed.iconAppearance === "minimal"
      ? parsed.iconAppearance
      : merged.collection === "brandmark" || merged.collection === "brandpanel" ? "brand" : "minimal",
    contentAlign: contentAligns.includes(merged.contentAlign) ? merged.contentAlign : "center",
    contentAlignMode: parsed.contentAlignMode === "auto" || parsed.contentAlignMode === "manual"
      ? parsed.contentAlignMode
      : contentAligns.includes(parsed.contentAlign as ButtonZoneStyle["contentAlign"]) ? "manual" : "auto",
  };
}

// ---------- Per-element text/logo/background styling — matches the "linkme" ----------
// reference design exactly: each element has its own font/weight/size/color/background,
// not just the app's older shared font_pair + text_color + one text_panel toggle.
export type TitleStyle = { font: string; weight: number; size: number; color: string; bgMode: "none" | "solid"; bg: string; align: "left" | "center" | "right" };
export type SubtitleStyle = { font: string; weight: number; size: number; color: string; bgMode: "none" | "solid"; bg: string };
export type LogoStyle = {
  treatment: "template" | "clean" | "badge" | "card" | "highlight" | "custom";
  shape: "round" | "square";
  size: number;
  zoom: number;
  x: number;
  y: number;
  backgroundMode: "auto" | "custom";
  fallback: string;
  borderWidth: number;
  borderColor: string;
  shadow: "none" | "soft" | "glow";
  // Only matters while there's no logo image — how many letters of the business name to show,
  // and at what size. The size is never a manual control: it's always computed from the
  // avatar's own size (see logoLetterSize), so a big avatar doesn't end up with a tiny,
  // lost-looking initial the way a fixed font-size would.
  initials: "one" | "two";
};
export type BackgroundPosition = { zoom: number; x: number; y: number; tint: number };

const DEFAULT_TITLE_STYLE: TitleStyle = { font: FONT_OPTIONS[0].id, weight: 900, size: 28, color: "#ffffff", bgMode: "none", bg: "#111111", align: "center" };
const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = { font: FONT_OPTIONS[0].id, weight: 500, size: 14, color: "#ffffff", bgMode: "none", bg: "#111111" };
const DEFAULT_LOGO_STYLE: LogoStyle = { treatment: "template", shape: "round", size: 124, zoom: 1, x: 50, y: 50, backgroundMode: "auto", fallback: "#f5eddf", borderWidth: 0, borderColor: "#ffffff", shadow: "soft", initials: "one" };
const DEFAULT_BG_POSITION: BackgroundPosition = { zoom: 1, x: 50, y: 50, tint: 0.18 };

function hasKeys(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw && typeof raw === "object" && Object.keys(raw as object).length > 0);
}

export function parseTitleStyle(landing: BackgroundLike & { text_color?: string | null; font_pair?: string | null; title_style?: unknown }): TitleStyle {
  const value = hasKeys(landing.title_style)
    ? { ...DEFAULT_TITLE_STYLE, ...(landing.title_style as Partial<TitleStyle>) }
    : { ...DEFAULT_TITLE_STYLE, color: landing.text_color || autoTextColor(landing), font: landing.font_pair || "modern" };
  return { ...value, size: Math.min(48, Math.max(18, Number(value.size) || 28)), weight: [400,500,600,700,800,900].includes(Number(value.weight)) ? Number(value.weight) : 900, align: ["left","center","right"].includes(value.align) ? value.align : "center", bgMode: value.bgMode === "solid" ? "solid" : "none" };
}
export function parseSubtitleStyle(landing: BackgroundLike & { text_color?: string | null; font_pair?: string | null; subtitle_style?: unknown }): SubtitleStyle {
  const value = hasKeys(landing.subtitle_style)
    ? { ...DEFAULT_SUBTITLE_STYLE, ...(landing.subtitle_style as Partial<SubtitleStyle>) }
    : { ...DEFAULT_SUBTITLE_STYLE, color: landing.text_color || autoTextColor(landing), font: landing.font_pair || "modern" };
  return { ...value, size: Math.min(26, Math.max(10, Number(value.size) || 14)), weight: [400,500,600,700,800,900].includes(Number(value.weight)) ? Number(value.weight) : 500, bgMode: value.bgMode === "solid" ? "solid" : "none" };
}
export function parseLogoStyle(raw: unknown): LogoStyle {
  const value = hasKeys(raw) ? { ...DEFAULT_LOGO_STYLE, ...(raw as Partial<LogoStyle>) } : { ...DEFAULT_LOGO_STYLE };
  const finite = (candidate: unknown, fallback: number) => Number.isFinite(Number(candidate)) ? Number(candidate) : fallback;
  const treatments: LogoStyle["treatment"][] = ["template","clean","badge","card","highlight","custom"];
  const shadows: LogoStyle["shadow"][] = ["none","soft","glow"];
  const initialsModes: LogoStyle["initials"][] = ["one","two"];
  return { ...value, treatment: treatments.includes(value.treatment) ? value.treatment : "template", shape: value.shape === "square" ? "square" : "round", backgroundMode: value.backgroundMode === "custom" ? "custom" : "auto", fallback: /^#[0-9a-f]{6}$/i.test(value.fallback) ? value.fallback : DEFAULT_LOGO_STYLE.fallback, borderWidth: (() => { const w = Math.min(10, Math.max(0, finite(value.borderWidth, 0))); return w === 1 ? 2 : w; })(), borderColor: /^#[0-9a-f]{6}$/i.test(value.borderColor) ? value.borderColor : "#ffffff", shadow: shadows.includes(value.shadow) ? value.shadow : "soft", initials: initialsModes.includes(value.initials) ? value.initials : "one", size: Math.min(190, Math.max(72, finite(value.size, 124))), zoom: Math.min(2.5, Math.max(1, finite(value.zoom, 1))), x: Math.min(100, Math.max(0, finite(value.x, 50))), y: Math.min(100, Math.max(0, finite(value.y, 50))) };
}

// Derives the fallback initial(s) shown when there's no logo image yet. "two" tries one
// letter per word (e.g. "Café Sol" -> "CS") since that carries more identity than a single
// letter would for a multi-word name; a one-word name just takes its first two letters instead.
export function logoInitials(businessName: string, mode: LogoStyle["initials"]): string {
  const trimmed = (businessName || "").trim();
  if (!trimmed) return "?";
  if (mode === "one") return trimmed.slice(0, 1).toUpperCase();
  const words = trimmed.split(/\s+/).filter(Boolean);
  return (words.length >= 2 ? words[0][0] + words[1][0] : trimmed.slice(0, 2)).toUpperCase();
}

// Scaled from the avatar's own size instead of being its own manual control — otherwise a
// fixed font-size looks lost inside a large avatar and cramped inside a small one.
export function logoLetterSize(avatarSize: number, mode: LogoStyle["initials"]): number {
  return Math.round(avatarSize * (mode === "two" ? 0.3 : 0.36));
}

export function logoBackgroundColor(style: LogoStyle, primary: string): string {
  return style.backgroundMode === "custom" ? style.fallback : primary;
}

// One rule, always: the circle's background is either "Automático" (the landing's primary
// color) or a custom color the person picked — never a hidden extra case depending on the
// logo's shape/border treatment. That used to make the circle silently go fully transparent
// for one specific treatment, which was surprising and impossible to predict from the UI.
export function logoFrameStyle(style: LogoStyle, primary: string): CSSProperties {
  const background = logoBackgroundColor(style, primary);
  const shadow = style.shadow === "glow"
    ? `0 0 0 3px ${hexToRgba(style.borderColor, .2)}, 0 0 28px ${hexToRgba(style.borderColor, .58)}`
    : style.shadow === "soft" ? "0 10px 28px rgba(18,20,30,.18)" : "none";
  return {
    background,
    color: contrastTextColor(background),
    // `outline` instead of `border`: a real `border` eats into the box under box-sizing:
    // border-box, shrinking the content area the logo image sits in — so every time someone
    // changed the border width, the visible photo would visibly shrink/grow along with it, and
    // a gap of the frame's own background color would appear around the (now smaller) image.
    // `outline` draws on top without ever affecting sizing, so the photo always fills the frame
    // exactly and the ring is purely decorative.
    outline: style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor}` : "none",
    outlineOffset: style.borderWidth ? -style.borderWidth : 0,
    boxShadow: shadow,
  };
}

export function logoBorderRadius(shape: LogoStyle["shape"], size: number): string | number {
  return shape === "round" ? "50%" : Math.max(12, Math.round(size * 0.22));
}

export function parseBackgroundPosition(raw: unknown): BackgroundPosition {
  const parsed = hasKeys(raw) ? raw as Partial<BackgroundPosition> : {};
  const clamp = (value: unknown, min: number, max: number, fallback: number) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  return { zoom: clamp(parsed.zoom, 1, 2.5, 1), x: clamp(parsed.x, 0, 100, 50), y: clamp(parsed.y, 0, 100, 50), tint: clamp(parsed.tint, 0, .65, .18) };
}

export function buttonZoneShadow(shadow: ButtonZoneStyle["shadow"]): string {
  if (shadow === "none") return "none";
  if (shadow === "strong") return "0 12px 24px rgba(0,0,0,.20)";
  return "0 8px 18px rgba(0,0,0,.13)";
}

export function buttonFillStyle(fill: string | null | undefined, bg: string, text: string): CSSProperties {
  if (fill === "outline") return { background: "transparent", border: `2px solid ${bg}`, color: bg };
  if (fill === "glass") return { background: hexToRgba(bg, 0.22), border: "1px solid rgba(255, 255, 255, 0.35)", color: text, backdropFilter: "blur(10px)" };
  return { background: bg, color: text, border: "none" };
}

export function normalizeUrl(value: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isPlausiblePhone(value: string): boolean {
  return (value || "").replace(/\D/g, "").length >= 8;
}

export const AUTO_COLORS: Record<string, string> = {
  whatsapp: "#25d366", instagram: "#e4405f", tiktok: "#111111", facebook: "#1877f2", maps: "#db4437",
  youtube: "#ff0033", spotify: "#1db954", mercadopago: "#009ee3", telegram: "#229ed9", email: "#334155",
  phone: "#475569", calendar: "#e05252", website: "#1f2937", url: "#1f2937",
};

export const templates: { value: TemplateValue; label: string; description: string }[] = [
  { value: "professional", label: "Profesional", description: "Diseño neutro para cualquier rubro." },
  { value: "hotel", label: "Hotelería", description: "Pensada para hoteles, cabañas y alojamientos." },
  { value: "tourism", label: "Turismo", description: "Excursiones, agencias y actividades." },
  { value: "restaurant", label: "Gastronomía", description: "Restaurantes, bares y cafeterías." },
  { value: "business", label: "Negocio", description: "Comercios y servicios profesionales." },
];

export const businessProfiles: {
  value: string;
  label: string;
  description: string;
  icon: string;
  templates: TemplateValue[];
}[] = [
  { value: "custom", label: "Personalizado", description: "Armá tu landing desde cero.", icon: "✨", templates: ["professional", "hotel", "tourism", "restaurant", "business"] },
  { value: "hotel", label: "Hotelería", description: "Hoteles, cabañas y alojamientos.", icon: "🏨", templates: ["hotel", "professional"] },
  { value: "tourism", label: "Turismo", description: "Agencias y excursiones.", icon: "🧭", templates: ["tourism", "professional"] },
  { value: "restaurant", label: "Gastronomía", description: "Restaurantes, bares y cafeterías.", icon: "🍽️", templates: ["restaurant", "professional"] },
  { value: "business", label: "Negocio", description: "Comercios y servicios profesionales.", icon: "💼", templates: ["business", "professional"] },
];

export function getBusinessProfile(value: string) {
  return businessProfiles.find((profile) => profile.value === value) || businessProfiles[0];
}

type ActionType = "whatsapp" | "instagram" | "tiktok" | "facebook" | "website" | "email" | "phone" | "maps" | "youtube" | "spotify" | "mercadopago" | "calendar" | "telegram" | "url";

type ActionDef = {
  type: ActionType;
  label: string;
  icon: string;
  input: "phone" | "email" | "text" | "url" | "username";
  placeholder: string;
  message: boolean;
  prefix?: string;
};

const ACTION_ORDER: ActionType[] = ["whatsapp", "instagram", "tiktok", "facebook", "website", "maps", "email", "phone", "youtube", "spotify", "mercadopago", "calendar", "telegram", "url"];

const ACTION_DEFS: Record<ActionType, ActionDef> = {
  whatsapp: { type: "whatsapp", label: "WhatsApp", icon: "💬", input: "phone", placeholder: "549351XXXXXXXX", message: true },
  instagram: { type: "instagram", label: "Instagram", icon: "📸", input: "username", placeholder: "tuusuario", prefix: "instagram.com/", message: false },
  tiktok: { type: "tiktok", label: "TikTok", icon: "🎵", input: "username", placeholder: "tuusuario", prefix: "tiktok.com/@", message: false },
  facebook: { type: "facebook", label: "Facebook", icon: "📘", input: "url", placeholder: "https://facebook.com/tupagina", message: false },
  website: { type: "website", label: "Sitio web", icon: "🌐", input: "url", placeholder: "https://tusitio.com", message: false },
  email: { type: "email", label: "Email", icon: "✉️", input: "email", placeholder: "contacto@negocio.com", message: false },
  phone: { type: "phone", label: "Teléfono", icon: "📞", input: "phone", placeholder: "549351XXXXXXXX", message: false },
  maps: { type: "maps", label: "Cómo llegar", icon: "📍", input: "url", placeholder: "https://maps.google.com/...", message: false },
  youtube: { type: "youtube", label: "YouTube", icon: "▶️", input: "url", placeholder: "https://youtube.com/@tucanal", message: false },
  spotify: { type: "spotify", label: "Spotify", icon: "🎧", input: "url", placeholder: "https://open.spotify.com/...", message: false },
  mercadopago: { type: "mercadopago", label: "Pagar con Mercado Pago", icon: "💳", input: "url", placeholder: "https://mpago.la/...", message: false },
  calendar: { type: "calendar", label: "Reservar turno", icon: "📅", input: "url", placeholder: "https://calendly.com/...", message: false },
  telegram: { type: "telegram", label: "Telegram", icon: "📨", input: "username", placeholder: "tucanal", prefix: "t.me/", message: false },
  url: { type: "url", label: "Enlace", icon: "🔗", input: "url", placeholder: "https://...", message: false },
};

export function getAllActions() {
  return ACTION_ORDER.map((type) => ({ sourceField: type, ...ACTION_DEFS[type] }));
}

export function displayUsername(type: string, value: string): string {
  const def = ACTION_DEFS[type as ActionType];
  if (!def || def.input !== "username" || !value) return value || "";
  let clean = value.trim();
  if (/^https?:\/\//i.test(clean)) {
    clean = clean.replace(/^https?:\/\//i, "");
    if (def.prefix && clean.toLowerCase().startsWith(def.prefix.toLowerCase())) {
      clean = clean.slice(def.prefix.length);
    } else {
      const parts = clean.split("/").filter(Boolean);
      clean = parts[parts.length - 1] || clean;
    }
  }
  return clean.replace(/^@/, "");
}

export function buildActionLink(type: string, value: string): string {
  const clean = (value || "").trim().replace(/^@/, "");
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  const def = ACTION_DEFS[type as ActionType];
  if (def?.prefix) return `https://${def.prefix}${clean}`;
  return clean;
}
