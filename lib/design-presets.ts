import type { CSSProperties } from "react";
import type { ButtonZoneStyle, LogoStyle, SubtitleStyle, TitleStyle } from "@/lib/landing-catalog";
import { AUTO_COLORS, contrastTextColor } from "@/lib/landing-catalog";

export type DesignPreset = {
  id: string;
  name: string;
  description: string;
  background: string;
  bg1: string;
  bg2: string;
  accent: string;
  oneColor: string;
  foreground: string;
  buttonFont: string;
  buttonZone: Omit<ButtonZoneStyle, "oneColor" | "templateId" | "contentAlignMode" | "iconAppearance">;
  title: Pick<TitleStyle, "font" | "weight" | "size" | "align">;
  subtitle: Pick<SubtitleStyle, "font" | "weight" | "size">;
  logo: Pick<LogoStyle, "shape" | "size">;
};

// Every template bundles a background, a typography pairing AND a button look that were
// designed together on purpose — picking a template should never produce an ugly mismatch.
// The button-only picker (ButtonDesign panel) reuses this exact same list, just applying
// the buttonZone/buttonFont slice of whichever entry the person picks.
export const DESIGN_PRESETS_V2: DesignPreset[] = [
  {
    id: "minimal", name: "Minimalismo", description: "Blanco, limpio y sin distracciones. Sirve para casi cualquier rubro.",
    background: "linear-gradient(160deg,#fbfbfd,#eef0f5)", bg1: "#fbfbfd", bg2: "#eef0f5", accent: "#16181d", oneColor: "#16181d", foreground: "#16181d",
    buttonFont: "minimal",
    buttonZone: { preset: "minimal", layout: "center", gap: 10, height: 52, radius: 12, width: 100, shadow: "none", finish: "solid", collection: "minimal", colorMode: "one", textSize: 14, iconSize: 27, contentAlign: "center" },
    title: { font: "minimal", weight: 800, size: 27, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "round", size: 116 },
  },
  {
    id: "brutalism", name: "Brutalismo", description: "Blanco y negro puro, bordes duros, cero adornos. Estudios, moda y marcas con carácter.",
    background: "#f4f3ee", bg1: "#f4f3ee", bg2: "#e6e4db", accent: "#0a0a0a", oneColor: "#ffffff", foreground: "#0a0a0a",
    buttonFont: "bold",
    buttonZone: { preset: "brutalism", layout: "center", gap: 13, height: 56, radius: 0, width: 100, shadow: "none", finish: "solid", collection: "brutal", colorMode: "one", textSize: 15, iconSize: 28, contentAlign: "left" },
    title: { font: "bold", weight: 900, size: 32, align: "center" }, subtitle: { font: "mono", weight: 700, size: 13 }, logo: { shape: "square", size: 120 },
  },
  {
    id: "neobrutal", name: "Neobrutalismo", description: "Colores fuertes, bordes marcados y sombra dura. Marcas jóvenes, apps y creadores.",
    background: "linear-gradient(150deg,#fff267,#ff8bd0)", bg1: "#fff267", bg2: "#ff8bd0", accent: "#1a1a1a", oneColor: "#7c5cff", foreground: "#171923",
    buttonFont: "friendly",
    buttonZone: { preset: "neobrutal", layout: "center", gap: 13, height: 56, radius: 14, width: 100, shadow: "none", finish: "solid", collection: "retro", colorMode: "auto", textSize: 14, iconSize: 27, contentAlign: "left" },
    title: { font: "bold", weight: 900, size: 30, align: "center" }, subtitle: { font: "friendly", weight: 700, size: 14 }, logo: { shape: "square", size: 122 },
  },
  {
    id: "glass", name: "Glassmorfismo", description: "Vidrio esmerilado sobre un fondo vivo. Fotografía, eventos y vida nocturna.",
    background: "linear-gradient(150deg,#1c0f3d,#ff4fa3)", bg1: "#1c0f3d", bg2: "#ff4fa3", accent: "#ffffff", oneColor: "#ffffff", foreground: "#ffffff",
    buttonFont: "modern",
    buttonZone: { preset: "glass", layout: "profile-card", gap: 11, height: 56, radius: 18, width: 100, shadow: "soft", finish: "glass", collection: "glass", colorMode: "one", textSize: 14, iconSize: 29, contentAlign: "center" },
    title: { font: "modern", weight: 800, size: 29, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "round", size: 124 },
  },
  {
    id: "elegant", name: "Elegante", description: "Marfil, serif refinada y detalles dorados. Hoteles boutique, joyerías y alta gama.",
    background: "linear-gradient(150deg,#fbf7ef,#e7d7c2)", bg1: "#fbf7ef", bg2: "#e7d7c2", accent: "#8c6b3f", oneColor: "#8c6b3f", foreground: "#2c241c",
    buttonFont: "minimal",
    buttonZone: { preset: "elegant", layout: "poster", gap: 12, height: 54, radius: 10, width: 100, shadow: "soft", finish: "solid", collection: "luxury", colorMode: "one", textSize: 14, iconSize: 26, contentAlign: "center" },
    title: { font: "elegant", weight: 700, size: 31, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "round", size: 114 },
  },
  {
    id: "corporate", name: "Corporativo", description: "Confiado y preciso, con un toque técnico. Consultoras, software y servicios profesionales.",
    background: "linear-gradient(165deg,#0f172a,#1e2a44)", bg1: "#0f172a", bg2: "#1e2a44", accent: "#2563eb", oneColor: "#2563eb", foreground: "#f1f5f9",
    buttonFont: "mono",
    buttonZone: { preset: "corporate", layout: "center", gap: 10, height: 54, radius: 10, width: 100, shadow: "soft", finish: "solid", collection: "corporate", colorMode: "one", textSize: 13, iconSize: 26, contentAlign: "left" },
    title: { font: "minimal", weight: 800, size: 27, align: "center" }, subtitle: { font: "mono", weight: 500, size: 13 }, logo: { shape: "square", size: 112 },
  },
  {
    id: "vibrant", name: "Vibrante", description: "Cada red conserva su color oficial. Perfil personal o multi-marca.",
    background: "linear-gradient(150deg,#302061,#c74878)", bg1: "#302061", bg2: "#c74878", accent: "#ff6b8d", oneColor: "#ff6b8d", foreground: "#ffffff",
    buttonFont: "modern",
    buttonZone: { preset: "vibrant", layout: "center", gap: 11, height: 57, radius: 18, width: 100, shadow: "strong", finish: "solid", collection: "brand", colorMode: "auto", textSize: 14, iconSize: 30, contentAlign: "left" },
    title: { font: "modern", weight: 900, size: 29, align: "center" }, subtitle: { font: "minimal", weight: 600, size: 14 }, logo: { shape: "square", size: 122 },
  },
  {
    id: "natural", name: "Natural", description: "Cálida y orgánica. Wellness, gastronomía consciente y turismo rural.",
    background: "linear-gradient(150deg,#f7f3e8,#d7e4cf)", bg1: "#f7f3e8", bg2: "#d7e4cf", accent: "#355b3e", oneColor: "#355b3e", foreground: "#26382a",
    buttonFont: "friendly",
    buttonZone: { preset: "natural", layout: "center", gap: 11, height: 55, radius: 18, width: 100, shadow: "soft", finish: "solid", collection: "soft", colorMode: "one", textSize: 14, iconSize: 27, contentAlign: "left" },
    title: { font: "handwritten", weight: 700, size: 38, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "round", size: 122 },
  },
  {
    id: "pastel", name: "Pastel", description: "Suave, luminosa y delicada. Belleza, salud y cuidado personal.",
    background: "linear-gradient(150deg,#ffe6ef,#e3e6ff)", bg1: "#ffe6ef", bg2: "#e3e6ff", accent: "#cf7fb9", oneColor: "#cf7fb9", foreground: "#3d2a3c",
    buttonFont: "friendly",
    buttonZone: { preset: "pastel", layout: "center", gap: 11, height: 54, radius: 22, width: 100, shadow: "soft", finish: "solid", collection: "pastel", colorMode: "one", textSize: 14, iconSize: 27, contentAlign: "center" },
    title: { font: "friendly", weight: 700, size: 27, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "round", size: 118 },
  },
  {
    id: "neon", name: "Neon Night", description: "Oscura y magnética con brillo ambiental. Bares, boliches y eventos nocturnos.",
    background: "linear-gradient(150deg,#060817,#17113f)", bg1: "#060817", bg2: "#17113f", accent: "#8b72ff", oneColor: "#755cff", foreground: "#f7f5ff",
    buttonFont: "modern",
    buttonZone: { preset: "neon", layout: "center", gap: 12, height: 56, radius: 16, width: 100, shadow: "strong", finish: "solid", collection: "glow", colorMode: "one", textSize: 14, iconSize: 29, contentAlign: "center" },
    title: { font: "modern", weight: 900, size: 29, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "square", size: 118 },
  },
  {
    id: "creator", name: "Pop Studio", description: "Audaz y expresiva, pero siempre ordenada. Creadores y marcas digitales.",
    background: "linear-gradient(150deg,#ff3e88,#ff9a3d)", bg1: "#ff3e88", bg2: "#ff9a3d", accent: "#5b2be0", oneColor: "#5b2be0", foreground: "#ffffff",
    buttonFont: "bold",
    buttonZone: { preset: "creator", layout: "center", gap: 12, height: 58, radius: 22, width: 100, shadow: "strong", finish: "solid", collection: "candy", colorMode: "one", textSize: 14, iconSize: 29, contentAlign: "left" },
    title: { font: "bold", weight: 900, size: 30, align: "center" }, subtitle: { font: "handwritten", weight: 600, size: 18 }, logo: { shape: "square", size: 118 },
  },
  {
    id: "brand-signature", name: "Firma de Marca", description: "Tarjetas claras con insignias oficiales protagonistas. Limpia, reconocible y premium.",
    background: "linear-gradient(155deg,#fffdf7,#ebeef5)", bg1: "#fffdf7", bg2: "#ebeef5", accent: "#17191f", oneColor: "#ffffff", foreground: "#17191f",
    buttonFont: "minimal",
    buttonZone: { preset: "brand-signature", layout: "profile-card", gap: 11, height: 61, radius: 19, width: 100, shadow: "soft", finish: "solid", collection: "brandmark", colorMode: "one", textSize: 14, iconSize: 36, contentAlign: "left" },
    title: { font: "minimal", weight: 850, size: 29, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "round", size: 120 },
  },
  {
    id: "brand-stage", name: "Brand Stage", description: "Botones oscuros de alto impacto con cada marca iluminada en su color real.",
    background: "linear-gradient(145deg,#26304a,#07090e)", bg1: "#26304a", bg2: "#07090e", accent: "#ffffff", oneColor: "#151922", foreground: "#ffffff",
    buttonFont: "minimal",
    buttonZone: { preset: "brand-stage", layout: "poster", gap: 12, height: 63, radius: 20, width: 100, shadow: "strong", finish: "solid", collection: "brandpanel", colorMode: "one", textSize: 14, iconSize: 38, contentAlign: "left" },
    title: { font: "minimal", weight: 900, size: 30, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "square", size: 122 },
  },
];

export const BUTTON_COLLECTIONS: { id: ButtonZoneStyle["collection"]; name: string; description: string }[] = [
  { id: "soft", name: "Soft Cards", description: "Suaves, cálidos y con profundidad delicada." },
  { id: "brand", name: "Colores de marca", description: "Degradados intensos para redes y acciones." },
  { id: "brandmark", name: "Firma de Marca", description: "Tarjetas claras con insignias oficiales a todo color." },
  { id: "brandpanel", name: "Brand Stage", description: "Paneles oscuros con insignias oficiales luminosas." },
  { id: "glass", name: "Cristal premium", description: "Transparencia, reflejo y fondo desenfocado." },
  { id: "glow", name: "Neon Glow", description: "Brillo ambiental para fondos oscuros." },
  { id: "luxury", name: "Luxury", description: "Oscuro, editorial y con detalles dorados." },
  { id: "minimal", name: "Minimal Line", description: "Blanco, aireado y con borde ultrafino." },
  { id: "split", name: "Icon Bubble", description: "El icono vive en una burbuja protagonista." },
  { id: "bento", name: "Bento", description: "Tarjetas con ritmo y tamaños alternados." },
  { id: "pastel", name: "Pastel Dream", description: "Luminoso, suave y delicadamente colorido." },
  { id: "metallic", name: "Metallic", description: "Reflejos metálicos y volumen sofisticado." },
  { id: "retro", name: "Retro Pop", description: "Bordes marcados, color y mucha personalidad." },
  { id: "editorial", name: "Editorial", description: "Tipográfico, sobrio y con líneas elegantes." },
  { id: "candy", name: "Candy", description: "Brillante, redondo y enérgico." },
  { id: "ocean", name: "Ocean", description: "Azules profundos con reflejos acuáticos." },
  { id: "brutal", name: "Brutalismo", description: "Blanco y negro, bordes duros, cero curvas." },
  { id: "corporate", name: "Corporativo", description: "Plano, prolijo y confiable." },
];

export function buttonCollectionStyle(collection: ButtonZoneStyle["collection"], bg: string, text: string, index = 0): CSSProperties {
  // Glass sits on a busy/vivid background, so it needs two things a plain translucent tint
  // doesn't give on its own: a bright diagonal sheen (the actual visual cue for "glass", not
  // just "see-through") and a crisp light rim to separate it from whatever's behind it. Mixing
  // only the button's own color into transparent (the previous version) produced a muddy tint
  // with no highlight — technically translucent, but nothing read as glass.
  if (collection === "glass") return { background: `linear-gradient(135deg, rgba(255,255,255,.46), rgba(255,255,255,.14) 48%, color-mix(in srgb, ${bg} 38%, transparent))`, color: "#ffffff", border: "1px solid rgba(255,255,255,.68)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.75), 0 12px 28px rgba(13,8,35,.2)", backdropFilter: "blur(18px) saturate(1.35)" };
  if (collection === "brand") return { background: `linear-gradient(135deg, color-mix(in srgb, ${bg} 92%, white), color-mix(in srgb, ${bg} 92%, black))`, color: text, border: "1px solid rgba(255,255,255,.26)", boxShadow: `0 8px 20px color-mix(in srgb, ${bg} 22%, transparent), inset 0 1px 0 rgba(255,255,255,.25)` };
  if (collection === "brandmark") return { background: `linear-gradient(145deg,color-mix(in srgb,${bg} 7%,#ffffff),color-mix(in srgb,${bg} 5%,#f5f6f9))`, color: "#17191f", border: "1px solid rgba(24,29,40,.08)", boxShadow: "0 8px 22px rgba(24,30,45,.095)" };
  if (collection === "brandpanel") return { background: `linear-gradient(145deg,color-mix(in srgb,${bg} 16%,#1b202a),color-mix(in srgb,${bg} 10%,#10131a))`, color: "#ffffff", border: "1px solid rgba(255,255,255,.09)", boxShadow: "0 12px 28px rgba(0,0,0,.3)" };
  if (collection === "glow") return { background: `linear-gradient(135deg, color-mix(in srgb, ${bg} 48%, #19152f), color-mix(in srgb, ${bg} 22%, #101224))`, color: "#ffffff", border: `1px solid color-mix(in srgb, ${bg} 76%, white)`, boxShadow: `0 0 0 1px color-mix(in srgb, ${bg} 14%, transparent), 0 10px 30px color-mix(in srgb, ${bg} 34%, transparent), inset 0 1px 0 rgba(255,255,255,.15)` };
  // Luxury and minimal keep a deliberately light surface, while the selected color still
  // drives their border/accent. That keeps custom colors visible without sacrificing the
  // legibility that these two restrained styles depend on.
  if (collection === "luxury") return { background: `linear-gradient(145deg, color-mix(in srgb, ${bg} 7%, #fffdf8), color-mix(in srgb, ${bg} 13%, #f1e5d3))`, color: "#2c241c", border: `1px solid color-mix(in srgb, ${bg} 58%, #d8c29d)`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 8px 22px rgba(77,55,31,.12)" };
  if (collection === "minimal") return { background: `color-mix(in srgb, ${bg} 12%, #ffffff)`, color: "#1b1c22", border: `1.5px solid color-mix(in srgb, ${bg} 46%, #d8d9df)`, boxShadow: "0 5px 18px rgba(21,24,35,.07)" };
  if (collection === "split") return { background: `linear-gradient(135deg, color-mix(in srgb, ${bg} 94%, white), color-mix(in srgb, ${bg} 85%, black))`, color: text, border: "1px solid rgba(255,255,255,.22)", boxShadow: `0 10px 22px color-mix(in srgb, ${bg} 25%, transparent), inset 0 1px 0 rgba(255,255,255,.24)` };
  if (collection === "bento") return { background: index % 3 === 1 ? `linear-gradient(135deg,${bg},color-mix(in srgb, ${bg} 72%, black))` : `color-mix(in srgb, ${bg} 88%, white)`, color: text, border: "1px solid rgba(255,255,255,.3)", boxShadow: "0 9px 22px rgba(20,22,30,.15)" };
  if (collection === "pastel") return { background: `linear-gradient(125deg, color-mix(in srgb, ${bg} 34%, #fff), color-mix(in srgb, ${bg} 58%, #f8efff))`, color: "#343044", border: "1px solid rgba(255,255,255,.72)", boxShadow: "inset 0 1px 0 #fff, 0 8px 20px rgba(83,65,112,.12)" };
  // Text color used to be hardcoded white, which assumed the gradient always trended dark —
  // true for a saturated color mixed with dark/light bands, but a light color like sky blue
  // keeps the whole gradient pale, and white-on-pale is nearly unreadable. Using the real
  // contrast-computed `text` (like every other collection does) fixes that for any base color.
  if (collection === "metallic") return { background: `linear-gradient(115deg, color-mix(in srgb, ${bg} 66%, #252735), color-mix(in srgb, ${bg} 30%, #f2f4fa) 48%, color-mix(in srgb, ${bg} 72%, #171923))`, color: text, border: "1px solid rgba(255,255,255,.4)", boxShadow: "inset 0 1px 1px rgba(255,255,255,.52), inset 0 -1px 1px rgba(0,0,0,.25), 0 8px 20px rgba(16,18,28,.2)" };
  if (collection === "retro") return { background: bg, color: text, border: "2px solid #191724", boxShadow: "3px 3px 0 #191724" };
  if (collection === "editorial") return { background: "rgba(255,255,255,.08)", color: text, border: "0", borderTop: `1px solid color-mix(in srgb, ${bg} 62%, white)`, borderBottom: `1px solid color-mix(in srgb, ${bg} 62%, white)`, boxShadow: "none" };
  if (collection === "candy") return { background: `linear-gradient(120deg, color-mix(in srgb, ${bg} 82%, #ff8bd5), color-mix(in srgb, ${bg} 78%, #8d7bff))`, color: "#fff", border: "2px solid rgba(255,255,255,.65)", boxShadow: `inset 0 2px 0 rgba(255,255,255,.4), 0 8px 18px color-mix(in srgb, ${bg} 24%, transparent)` };
  if (collection === "ocean") return { background: `linear-gradient(125deg, color-mix(in srgb, ${bg} 62%, #083b66), color-mix(in srgb, ${bg} 72%, #16b8ca))`, color: "#fff", border: "1px solid rgba(173,244,255,.48)", boxShadow: "inset 0 1px 0 rgba(220,251,255,.38), 0 9px 22px rgba(5,69,96,.25)" };
  if (collection === "brutal") return { background: bg, color: text, border: "3px solid #0a0a0a", boxShadow: "5px 5px 0 #0a0a0a" };
  if (collection === "corporate") return { background: bg, color: text, border: "1px solid rgba(255,255,255,.22)", boxShadow: "0 6px 16px rgba(15,23,42,.16)" };
  return { background: `linear-gradient(180deg, color-mix(in srgb, ${bg} 92%, white), ${bg})`, color: text, border: "1px solid rgba(255,255,255,.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 8px 18px rgba(20,22,30,.13)" };
}

const BRAND_ICON_COLORS: Record<string, { background: string; color: string }> = {
  spotify: { background: "#1ed760", color: "#0b0b0b" },
  youtube: { background: "#ff0033", color: "#ffffff" },
  instagram: { background: "linear-gradient(135deg,#833ab4 5%,#fd1d1d 52%,#fcb045 100%)", color: "#ffffff" },
  whatsapp: { background: "#25d366", color: "#ffffff" },
  tiktok: { background: "#090909", color: "#ffffff" },
  facebook: { background: "#1877f2", color: "#ffffff" },
  linkedin: { background: "#0a66c2", color: "#ffffff" },
  telegram: { background: "#229ed9", color: "#ffffff" },
  website: { background: "#665cf6", color: "#ffffff" },
  email: { background: "#ffca52", color: "#17191f" },
  phone: { background: "#32b768", color: "#ffffff" },
  maps: { background: "#ea4335", color: "#ffffff" },
  calendar: { background: "#5b6ff5", color: "#ffffff" },
  mercadopago: { background: "#009ee3", color: "#ffffff" },
};

export function isBrandIconCollection(collection: ButtonZoneStyle["collection"]) {
  return collection === "brandmark" || collection === "brandpanel";
}

export function recommendedIconAppearance(collection: ButtonZoneStyle["collection"]): ButtonZoneStyle["iconAppearance"] {
  return isBrandIconCollection(collection) ? "brand" : "minimal";
}

export function buttonIconStyle(collection: ButtonZoneStyle["collection"], bg: string, size: number, type?: string, appearance = recommendedIconAppearance(collection)): CSSProperties {
  const base: CSSProperties = { width: size, height: size, flexGrow: 0, flexShrink: 0, flexBasis: size, display: "inline-grid", placeItems: "center", lineHeight: 0 };
  if (appearance === "brand") {
    const palette = BRAND_ICON_COLORS[type || ""] || { background: "#6c63ff", color: "#ffffff" };
    // No shadow on the badge itself — even a soft spread-only ring rendered visibly diffuse
    // against the button's own pale surface (confirmed by A/B testing with it removed), and the
    // button already carries its own shadow for depth. Simpler and reads clean at any zoom.
    return { ...base, borderRadius: collection === "brandmark" ? "50%" : 13, background: palette.background, color: palette.color, boxShadow: "none" };
  }
  if (collection === "brandmark") return { ...base, width: size - 4, height: size - 4, flexBasis: size - 4, color: "#17191f" };
  if (collection === "brandpanel") return { ...base, width: size - 4, height: size - 4, flexBasis: size - 4, color: "#ffffff" };
  if (collection === "minimal") return { ...base, width: size - 4, height: size - 4, flexBasis: size - 4, color: bg };
  // brutal/retro used to force a fixed dark or fixed white badge behind the icon — looked fine
  // for whatever single color the template shipped with, but colorMode "auto" cycles the
  // button through every network's own color (including near-black ones like TikTok), and a
  // fixed-color badge/glyph combo can't stay legible across all of them. Falling through to no
  // special case here means the icon just inherits the button's own already-correct contrast
  // color (`text`, computed per-button) — plain and safe rather than a shape that can go
  // invisible or clash depending on which color the button ends up being.
  if (collection === "glass") return { ...base, borderRadius: "50%", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.38)" };
  // Luxury advertises "golden details" but used to leave the icon completely bare — a thin
  // gold ring on a warm cream disc actually delivers on that promise at the icon level, not
  // just on the card border.
  if (collection === "luxury") return { ...base, width: size - 2, height: size - 2, flexBasis: size - 2, borderRadius: "50%", color: bg, background: "rgba(255,248,232,.55)", border: `1px solid color-mix(in srgb, ${bg} 62%, #f1dfb0)` };
  if (collection === "corporate") return { ...base, borderRadius: 7, background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)" };
  if (collection === "brand") return { ...base, borderRadius: "50%", background: "rgba(255,255,255,.17)", border: "1px solid rgba(255,255,255,.16)" };
  if (collection === "pastel") return { ...base, borderRadius: "50%", background: "rgba(255,255,255,.68)", border: "1px solid rgba(255,255,255,.85)" };
  // Glow's icon used to have zero frame — just a bare glyph — leaving the "ambient light" idea
  // entirely to the button's own shadow. A soft colored halo around the icon itself sells the
  // neon identity at a glance, even before reading the button label. The halo is kept small
  // (same lesson as the brandmark badge shadow): the button clips its own contents, and a big
  // blur here doesn't have equal room on every side of the badge, so it rendered as a lopsided
  // smear — brighter toward the button's center, visibly cut off toward the near edge.
  if (collection === "glow") return { ...base, width: size - 2, height: size - 2, flexBasis: size - 2, borderRadius: "50%", border: `1px solid color-mix(in srgb, ${bg} 55%, white)`, boxShadow: `0 0 4px color-mix(in srgb, ${bg} 65%, transparent)` };
  if (collection === "candy") return { ...base, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.28)" };
  // Shared fallback for every collection without a bespoke treatment above — currently soft
  // (Natural), brutal (Brutalismo) and retro (Neobrutalismo), plus bento/editorial/ocean which
  // no preset template uses yet. The icon just inherits the button's own contrast color (no
  // background override), so it's always legible no matter what color the button ends up being
  // — a plain full circle reads softer/more organic than a generic rounded-square badge would.
  return { ...base, borderRadius: "50%", background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.26)" };
}

export function buttonCollectionWidth(zone: ButtonZoneStyle, index: number) {
  void index;
  return `${zone.width}%`;
}

export function resolveButtonColors({
  zone, type, position, primary, customColor, useAutoColor,
}: {
  zone: ButtonZoneStyle; type: string; position: number; primary: string; customColor?: string | null; useAutoColor?: boolean | null;
}) {
  const hasCustomColor = useAutoColor === false && /^#[0-9a-f]{6}$/i.test(customColor || "");
  const background = hasCustomColor
    ? customColor!
    : zone.colorMode === "one"
      ? zone.oneColor || primary
      : AUTO_COLORS[type] || primary;
  return { background, text: contrastTextColor(background) };
}
