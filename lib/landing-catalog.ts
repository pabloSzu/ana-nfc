import type { CSSProperties } from "react";

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

export const FONT_OPTIONS: { id: string; label: string; family: string }[] = [
  { id: "modern", label: "Moderno", family: "'Space Grotesk', sans-serif" },
  { id: "classic", label: "Clásico", family: "'Playfair Display', serif" },
  { id: "friendly", label: "Amigable", family: "'Poppins', sans-serif" },
  { id: "minimal", label: "Minimalista", family: "'Inter', sans-serif" },
];

export function getFontFamily(id: string): string {
  return (FONT_OPTIONS.find((option) => option.id === id) || FONT_OPTIONS[0]).family;
}

export const AUTO_COLORS: Record<string, string> = {
  whatsapp: "#25d366", instagram: "#c13584", tiktok: "#111111", facebook: "#1877f2", maps: "#db4437",
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
