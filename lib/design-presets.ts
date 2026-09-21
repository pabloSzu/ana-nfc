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
  buttonZone: Omit<ButtonZoneStyle, "oneColor" | "templateId" | "contentAlignMode" | "iconAppearance" | "colorModeManual">;
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
    title: { font: "minimal", weight: 800, size: 27, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "sharp", size: 116 },
  },
  {
    id: "brutalism", name: "Brutalismo", description: "Blanco y negro puro, bordes duros, cero adornos. Estudios, moda y marcas con carácter.",
    background: "#f4f3ee", bg1: "#f4f3ee", bg2: "#e6e4db", accent: "#0a0a0a", oneColor: "#ffffff", foreground: "#0a0a0a",
    buttonFont: "bold",
    buttonZone: { preset: "brutalism", layout: "center", gap: 13, height: 56, radius: 0, width: 100, shadow: "none", finish: "solid", collection: "brutal", colorMode: "one", textSize: 15, iconSize: 28, contentAlign: "left" },
    title: { font: "minimal", weight: 900, size: 32, align: "center" }, subtitle: { font: "mono", weight: 700, size: 13 }, logo: { shape: "round", size: 120 },
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
    // Space Grotesk for the title pairs more deliberately with JetBrains Mono on the subtitle
    // and buttons than the previous Inter — both are geometric/technical faces (the pairing
    // startup and dev-tool product pages already reach for), where Inter read as generically
    // safe rather than actually "técnico" the way the description promises.
    title: { font: "modern", weight: 800, size: 27, align: "center" }, subtitle: { font: "mono", weight: 500, size: 13 }, logo: { shape: "square", size: 112 },
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
    title: { font: "minimal", weight: 850, size: 29, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "sharp", size: 120 },
  },
  {
    id: "brand-stage", name: "Brand Stage", description: "Botones oscuros de alto impacto con cada marca iluminada en su color real.",
    background: "linear-gradient(145deg,#26304a,#07090e)", bg1: "#26304a", bg2: "#07090e", accent: "#ffffff", oneColor: "#151922", foreground: "#ffffff",
    buttonFont: "minimal",
    buttonZone: { preset: "brand-stage", layout: "poster", gap: 12, height: 63, radius: 20, width: 100, shadow: "strong", finish: "solid", collection: "brandpanel", colorMode: "one", textSize: 14, iconSize: 38, contentAlign: "left" },
    title: { font: "minimal", weight: 900, size: 30, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "square", size: 122 },
  },
  {
    id: "arcade", name: "Arcade", description: "Controles digitales premium con profundidad precisa. Apps, gaming, gimnasios y marcas jóvenes.",
    background: "linear-gradient(155deg,#20162c,#09070d)", bg1: "#20162c", bg2: "#09070d", accent: "#ff4f72", oneColor: "#ff4f72", foreground: "#fff8fc",
    buttonFont: "modern",
    buttonZone: { preset: "arcade", layout: "center", gap: 14, height: 58, radius: 14, width: 100, shadow: "strong", finish: "solid", collection: "gummy", colorMode: "auto", textSize: 14, iconSize: 30, contentAlign: "center" },
    title: { font: "bold", weight: 900, size: 31, align: "center" }, subtitle: { font: "minimal", weight: 600, size: 14 }, logo: { shape: "square", size: 120 },
  },
  {
    id: "halo", name: "Halo", description: "Anillos de luz por marca sobre una superficie nocturna. Tecnología, música y eventos.",
    background: "linear-gradient(155deg,#111827,#020407)", bg1: "#111827", bg2: "#020407", accent: "#55eaff", oneColor: "#55eaff", foreground: "#f7fcff",
    buttonFont: "modern",
    buttonZone: { preset: "halo", layout: "center", gap: 16, height: 60, radius: 30, width: 100, shadow: "none", finish: "outline", collection: "aura", colorMode: "auto", textSize: 15, iconSize: 31, contentAlign: "center" },
    title: { font: "modern", weight: 900, size: 31, align: "center" }, subtitle: { font: "minimal", weight: 500, size: 14 }, logo: { shape: "round", size: 122 },
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
  { id: "gummy", name: "3D Táctil", description: "Botón sólido y extruido, como si se pudiera apretar." },
  { id: "aura", name: "Halo", description: "Contorno luminoso sobre fondo oscuro, sin relleno." },
];

// Arcade and Halo both put a network's color front-and-center on a dark page — that only works
// if the color used is genuinely vivid. AUTO_COLORS was tuned for SOLID FILLS with white text on
// top (so it includes deliberately dark/muted entries like website/tiktok, and Spotify's and
// Instagram's real brand hex — #1db954, #e4405f — read as noticeably duller than neighbors like
// WhatsApp once every color goes through the same treatment). This is a single curated "how this
// network should look as a glowing accent on black" palette shared by both collections, so a
// fix here (or a new network) only has to happen in one place.
const BRAND_VIVID: Record<string, string> = {
  spotify: "#1ed760", whatsapp: "#21e778", instagram: "#ff4f91", facebook: "#3b91ff",
  linkedin: "#18a8ff", youtube: "#ff3158", telegram: "#35c8ff", maps: "#ff655c",
  mercadopago: "#1bc4ff", calendar: "#ff6685", website: "#39d0ff", url: "#39d0ff",
  tiktok: "#ff3b9d", email: "#ffc83d", phone: "#35e6a1",
};
// `useNetworkAccent` gates this: true only means "nobody asked for one specific color here —
// go ahead and substitute this network's own curated vivid accent." Called with it false (one
// uniform color picked for every button, or this one button has its own custom color), it must
// return `bg` untouched — that resolved color is exactly what the person asked for, and BRAND_VIVID
// used to override it unconditionally whenever `type` matched a known network (nearly always),
// which is why "Un color para todos" visibly did nothing on Halo/Arcade: every button's color
// kept getting silently replaced by its network's fixed accent regardless of the chosen color.
function brandVivid(bg: string, type: string | undefined, useNetworkAccent: boolean): string {
  if (!useNetworkAccent) return bg;
  return (type && BRAND_VIVID[type]) || bg;
}

// The single source of truth for "what does this network's icon actually look like" — used
// wherever "Ícono real" is selected: the generic per-collection brand badge below, AND
// Instagram/Spotify's extra-authentic badge on Vibrante. Those two used to be two separate maps
// (BRAND_ICON_COLORS here, plus badgeBackground/badgeColor duplicated inside BRAND_AUTHENTIC)
// carrying near-identical values that had already drifted apart in small ways — e.g. Spotify's
// black landed on two slightly different hex codes in the two places, Instagram's gradient had
// two different stop positions — exactly the kind of duplicate-data bug that's easy to introduce
// once and never notice, because each copy still looks "right" on its own. One map per network,
// read by both call sites, means a color only ever has one value to get right.
const BRAND_ICON: Record<string, { background: string; color: string }> = {
  spotify: { background: "#1ed760", color: "#0a0a0a" },
  youtube: { background: "#ff0033", color: "#ffffff" },
  instagram: { background: "linear-gradient(135deg, #833ab4 0%, #c13584 30%, #fd1d1d 62%, #fcb045 100%)", color: "#ffffff" },
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

// "Cada red con su color" (colorMode auto) means the person explicitly asked for each
// network's own real identity — but every collection above still routes that color through
// its own signature treatment (a diagonal fade to black, a translucent card, whatever the
// template's "look" is), which can leave a network reading as an oddly-tinted version of
// itself instead of just... itself. For these two — the ones actually flagged as looking off —
// this replaces the collection's formula outright with each network's real, unmixed look:
// Instagram's actual gradient mark (not a flat stand-in color), and Spotify's real app icon — a
// green circle with the black wave mark (BRAND_ICON above, same values the generic badge path
// uses). Applies regardless of which collection/template is active, since the whole point is
// "this is what Instagram/Spotify actually look like," not a per-template variant. This is the
// BUTTON's own background/text only now — the badge itself reads BRAND_ICON directly, see below.
const BRAND_AUTHENTIC: Record<string, { background: string; color: string }> = {
  instagram: {
    background: "linear-gradient(115deg, #833ab4 0%, #c13584 28%, #e1306c 50%, #fd1d1d 73%, #fcb045 100%)",
    color: "#ffffff",
  },
  spotify: {
    background: "#1ed760",
    color: "#0a0a0a",
  },
};

export function hasAuthenticLook(type?: string): boolean {
  return Boolean(type && BRAND_AUTHENTIC[type]);
}

// Collections the authentic override skips entirely — never gets to touch their button OR
// their icon badge. Three different reasons:
// - aura/gummy already give every network its own well-tuned, vivid identity in their own idiom
//   (neon outline / tactile 3D) via brandVivid; forcing Instagram/Spotify's real color on top
//   would fight that visual language instead of complementing it.
// - minimal/pastel/luxury/glass are all deliberately soft/pale/translucent surfaces (every other
//   button in these gets a light tint or see-through fill). Instagram's real gradient and
//   Spotify's real green are full-strength, opaque colors — swapped in, they don't just clash in
//   tone, they read as a completely different, much louder template dropped into two buttons out
//   of the row (and for Glassmorfismo specifically, an opaque fill defeats the glass effect
//   outright — there's nothing left to see through). Confirmed on screen across all four before
//   adding this list, not a guess.
// - brandmark/brandpanel (Firma de Marca, Brand Stage) are built entirely around "every button
//   looks the same neutral card, the badge is what carries each network's identity" — that's
//   the whole premise of the template. Excluding them from the button-level override doesn't
//   lose anything: their icon badge already reads BRAND_ICON directly (appearance is "brand" by
//   default on these two), so Instagram/Spotify still get their real badge look — only the
//   button card itself stays the same neutral surface as every other network's button, per
//   "deberían verse como los demás, solo el ícono de color".
const AUTHENTIC_LOOK_EXCLUDED_COLLECTIONS: ButtonZoneStyle["collection"][] = ["aura", "gummy", "minimal", "pastel", "luxury", "glass", "brandmark", "brandpanel"];

export function buttonCollectionStyle(collection: ButtonZoneStyle["collection"], bg: string, text: string, index = 0, type?: string, isAuthentic = false, useNetworkAccent = true): CSSProperties {
  const style = collectionBaseStyle(collection, bg, text, index, type, useNetworkAccent);
  // Merging just background/color onto the collection's own computed style — instead of
  // replacing the whole object, like this used to — keeps every other collection's own shape
  // intact: Brutalismo's hard black border and offset shadow, Corporativo's accent stripe,
  // Retro's border, all still apply, just filled with Instagram's gradient or Spotify's real
  // color instead of the flat per-network stand-in. Replacing the object outright is exactly
  // what stripped that shape out from under a template the first time this went out to more than
  // Vibrante — reported as templates "losing their border" — so this only ever touches these two
  // fields, never the collection's own border/shadow/radius accents.
  if (isAuthentic && type && BRAND_AUTHENTIC[type] && !AUTHENTIC_LOOK_EXCLUDED_COLLECTIONS.includes(collection)) {
    const a = BRAND_AUTHENTIC[type];
    // Most collections' own border is a thin, low-opacity translucent white rim — tuned to sit
    // quietly on a gradient mixed from ONE hue (light-to-dark of the same color). Instagram's
    // real gradient swings through five very different hues in one pass, so that same flat
    // white rim reads inconsistently along its length — barely visible over the dark purple
    // end, noticeably paler/"washed out" over the light orange end (reported: the sides look
    // "desprolijos... sin rellenar"). Brutalismo/Neobrutalismo are the exception: their border
    // is a thick, fully-opaque dark line that IS the collection's shape, not a soft accent, and
    // reads fine over any background — confirmed on screen — so only those two keep it.
    const keepsOwnBorder = collection === "brutal" || collection === "retro";
    return { ...style, background: a.background, color: a.color, ...(keepsOwnBorder ? {} : { border: "none" }) };
  }
  return style;
}

function collectionBaseStyle(collection: ButtonZoneStyle["collection"], bg: string, text: string, index: number, type: string | undefined, useNetworkAccent: boolean): CSSProperties {
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
  // Two horizontal rules (top + bottom, no sides) used to come from borderTop/borderBottom
  // sitting alongside a `border: "0"` shorthand on the same object — mixing a shorthand and its
  // own longhands like that is exactly the pattern React warns is unsafe across rerenders (see
  // the corporate comment below): switch collections back and forth and the browser has to
  // remove a longhand while a shorthand for the same property is present, which can leave stale
  // styling behind. Two inset box-shadow layers draw the identical two rules without ever
  // touching a border longhand, so `border` here can stay a single, uniform "none" like every
  // other collection that has no border at all.
  if (collection === "editorial") return { background: "rgba(255,255,255,.08)", color: text, border: "none", boxShadow: `inset 0 1px 0 color-mix(in srgb, ${bg} 62%, white), inset 0 -1px 0 color-mix(in srgb, ${bg} 62%, white)` };
  if (collection === "candy") return { background: `linear-gradient(120deg, color-mix(in srgb, ${bg} 82%, #ff8bd5), color-mix(in srgb, ${bg} 78%, #8d7bff))`, color: "#fff", border: "2px solid rgba(255,255,255,.65)", boxShadow: `inset 0 2px 0 rgba(255,255,255,.4), 0 8px 18px color-mix(in srgb, ${bg} 24%, transparent)` };
  if (collection === "ocean") return { background: `linear-gradient(125deg, color-mix(in srgb, ${bg} 62%, #083b66), color-mix(in srgb, ${bg} 72%, #16b8ca))`, color: "#fff", border: "1px solid rgba(173,244,255,.48)", boxShadow: "inset 0 1px 0 rgba(220,251,255,.38), 0 9px 22px rgba(5,69,96,.25)" };
  if (collection === "brutal") return { background: bg, color: text, border: "3px solid #0a0a0a", boxShadow: "5px 5px 0 #0a0a0a" };
  // Corporativo was a plain flat-fill pill — technically fine, but the flattest-looking
  // collection in the whole catalog, with nothing to signal "precise/technical" beyond the
  // color itself. A left accent stripe borrows the visual language of a status marker on an
  // enterprise dashboard or report line (the one place this template's audience already reads
  // that pattern as "confident and exact"), and a whisper of gradient plus a crisper shadow
  // give it real depth without turning decorative. The stripe itself is drawn as an inset
  // box-shadow, not a `borderLeft` alongside the plain `border` above — mixing a border
  // shorthand and a border longhand on the same element is exactly what React flags as unsafe
  // across rerenders ("removing a style property... when a conflicting property is set"): these
  // button styles get reused across collection switches (this same preview chip, or the same
  // live button, re-renders with a different collection's style object), and going from
  // Corporativo (had borderLeft) to any other collection (doesn't) forces the browser to remove
  // a longhand while a shorthand for the same property is still set. box-shadow has no
  // shorthand/longhand split to worry about, so it sidesteps the hazard entirely.
  if (collection === "corporate") return { background: `linear-gradient(155deg, color-mix(in srgb, ${bg} 94%, white), color-mix(in srgb, ${bg} 86%, #060b18))`, color: text, border: "1px solid rgba(255,255,255,.14)", boxShadow: `0 10px 24px rgba(4,8,20,.28), inset 0 1px 0 rgba(255,255,255,.08), inset 3px 0 0 0 color-mix(in srgb, ${bg} 22%, white)` };
  // "3D Táctil": a tactile, slightly raised card — real color through the middle, a soft sheen
  // top and a gentle inner shade at the bottom sell the depth. This used to be a much louder
  // gumdrop-button skeuomorphism (a stark white 30%-opacity border, a hard 5px flat color
  // "shelf" directly under the button with zero blur, and a top gloss bright enough to read as
  // a second border of its own) that clashed badly against Arcade's near-black backdrop —
  // reported as "ugly, dreadful borders" and confirmed on screen: the hard shelf edge and the
  // stark white rim both read as competing outlines instead of one coherent shape. Softening
  // every one of those edges (shorter/blurred shelf, dimmer gloss, color-tinted border instead
  // of flat white) keeps the tactile 3D read without any single edge fighting for attention.
  // The mix targets stay WHITE and BLACK (never a fixed navy base) so the actual brand color
  // remains the dominant thing on screen at every stop, instead of being diluted into a
  // same-ish dark-slate tone regardless of which network it is.
  if (collection === "gummy") {
    const c = brandVivid(bg, type, useNetworkAccent);
    const vars = { "--button-accent": c, "--button-on-accent": contrastTextColor(c) } as CSSProperties;
    return { ...vars, background: `linear-gradient(180deg, color-mix(in srgb, ${c} 42%, white) 0%, ${c} 58%, color-mix(in srgb, ${c} 80%, black) 100%)`, color: contrastTextColor(c), border: `1px solid color-mix(in srgb, ${c} 45%, white)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,.32), inset 0 -6px 10px -6px rgba(0,0,0,.35), 0 3px 0 color-mix(in srgb, ${c} 58%, black), 0 10px 22px rgba(10,8,20,.3)` };
  }
  // "Halo": a transparent outline with the button's own color as text/border, plus a layered
  // glow — the glow itself is the whole visual, so it has to be there at rest (no hover reveal
  // to lean on). The fill is only a faint tint of the SAME color (not a dark navy base) so nothing
  // dilutes it, and text/border use the full accent directly instead of a fixed white.
  if (collection === "aura") {
    const c = brandVivid(bg, type, useNetworkAccent);
    const vars = { "--button-accent": c, "--button-on-accent": contrastTextColor(c) } as CSSProperties;
    return { ...vars, background: `color-mix(in srgb, ${c} 12%, transparent)`, color: c, border: `2px solid ${c}`, boxShadow: `0 0 14px color-mix(in srgb, ${c} 60%, transparent), 0 0 32px color-mix(in srgb, ${c} 34%, transparent), inset 0 0 14px color-mix(in srgb, ${c} 16%, transparent)` };
  }
  return { background: `linear-gradient(180deg, color-mix(in srgb, ${bg} 92%, white), ${bg})`, color: text, border: "1px solid rgba(255,255,255,.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 8px 18px rgba(20,22,30,.13)" };
}

export function isBrandIconCollection(collection: ButtonZoneStyle["collection"]) {
  return collection === "brandmark" || collection === "brandpanel";
}

export function recommendedIconAppearance(collection: ButtonZoneStyle["collection"]): ButtonZoneStyle["iconAppearance"] {
  // Brutalismo (colorMode "one", every button the same flat color) reads flat two ways at once
  // otherwise: the button surface and the icon underneath both carry zero color of their own.
  // "Ícono real" gives each badge its own network color as the one accent in an otherwise
  // monochrome row — the same "uniform card, colorful badge" pattern Firma de Marca/Brand Stage
  // already use, requested specifically for Brutalismo's default.
  return isBrandIconCollection(collection) || collection === "brutal" ? "brand" : "minimal";
}

export function buttonIconStyle(collection: ButtonZoneStyle["collection"], bg: string, size: number, type?: string, appearance = recommendedIconAppearance(collection), isAuthentic = false, useNetworkAccent = true): CSSProperties {
  const base: CSSProperties = { width: size, height: size, flexGrow: 0, flexShrink: 0, flexBasis: size, display: "inline-grid", placeItems: "center", lineHeight: 0 };
  // Gated on `appearance === "brand"` — this used to fire for Instagram/Spotify on Vibrante no
  // matter which icon appearance was selected, so "Ícono minimalista" vs "Ícono real" had no
  // visible effect on their badge at all (reported: "casi ni cambian los iconos").
  if (isAuthentic && type && BRAND_AUTHENTIC[type] && !AUTHENTIC_LOOK_EXCLUDED_COLLECTIONS.includes(collection)) {
    if (appearance === "brand") {
      const a = BRAND_ICON[type] || BRAND_AUTHENTIC[type];
      return { ...base, borderRadius: "50%", background: a.background, color: a.color, border: "1px solid rgba(255,255,255,.22)" };
    }
    // Falling through to the generic collection treatment below (a translucent-WHITE badge)
    // technically differs in code but, for Spotify specifically, renders almost identically to
    // "real" by coincidence: white blended over a vivid green button reads as roughly the same
    // green the authentic badge itself uses. A deliberately dark, neutral badge here instead —
    // reused for both Instagram and Spotify so the rule stays simple — guarantees minimal and
    // real never accidentally converge on the same button color again.
    return { ...base, borderRadius: "50%", background: "rgba(10,10,16,.34)", color: "#ffffff", border: "1px solid rgba(255,255,255,.3)" };
  }
  // Halo and Arcade had the exact same problem as Vibrante above, just structurally: their
  // per-network "vivid accent" badge used to render identically regardless of `appearance`, so
  // the icon toggle did nothing for every network on these two templates, not just two of them.
  // "Real" keeps that vivid per-network accent (unchanged below). "Minimal" now genuinely means
  // monochrome — one neutral tone for every icon regardless of which network it is, matching
  // what the toggle's own label already promises ("tratamiento monocromático coordinado con la
  // botonera") instead of silently reusing the colored version under a different name.
  if (collection === "aura") {
    const c = appearance === "brand" ? brandVivid(bg, type, useNetworkAccent) : "#eef6ff";
    return { ...base, borderRadius: "50%", color: c, background: "rgba(3,8,12,.78)", border: `1.5px solid ${appearance === "brand" ? c : "rgba(238,246,255,.55)"}`, boxShadow: "none" };
  }
  if (collection === "gummy") {
    const c = appearance === "brand" ? brandVivid(bg, type, useNetworkAccent) : "#ffffff";
    return { ...base, borderRadius: 9, color: c, background: "rgba(6,9,15,.62)", border: `1px solid ${appearance === "brand" ? `color-mix(in srgb, ${c} 42%, rgba(255,255,255,.28))` : "rgba(255,255,255,.3)"}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.13)" };
  }
  if (appearance === "brand") {
    const palette = BRAND_ICON[type || ""] || { background: "#6c63ff", color: "#ffffff" };
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
  if (collection === "corporate") return { ...base, borderRadius: 7, background: "rgba(255,255,255,.12)", border: `1px solid color-mix(in srgb, ${bg} 45%, rgba(255,255,255,.22))` };
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
  // no preset template uses yet. The badge tint used to be hardcoded translucent white — fine on
  // a colorful button, but invisible on a light one (Brutalismo's default is a plain white
  // button), leaving the icon with no visible circle to sit in and reading as a bare, oversized
  // glyph. Picking white-vs-black tint from the button's own computed contrast color keeps the
  // badge visible against any button color, the same way `text` already does for the label.
  const badgeTint = contrastTextColor(bg) === "#ffffff" ? "255,255,255" : "0,0,0";
  return { ...base, borderRadius: "50%", background: `rgba(${badgeTint},.14)`, border: `1px solid rgba(${badgeTint},.22)` };
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
  // True whenever this button's color is genuinely "cada red con su color" (auto) and nobody
  // picked a custom override for it — Instagram/Spotify then get their real look (gradient /
  // true green) on ANY template, not just Vibrante. This used to be scoped to zone.preset ===
  // "vibrant" while the feature was still being proven out on one template at a time; now that
  // buttonCollectionStyle merges the authentic background/color onto each collection's own
  // shape instead of replacing it outright (see collectionBaseStyle below), every collection
  // keeps its own border/shadow/radius identity, so there's no more reason to hold it back to
  // one preset — the person can turn it on anywhere just by picking "Cada red con su color".
  const isAuthentic = !hasCustomColor && zone.colorMode === "auto";
  // Whether Halo/Arcade (the only two collections that read this) should swap in their own
  // curated "vivid accent" per network instead of the color resolved just above. Must be false
  // whenever a specific color was actually chosen for this button — either "Un color para
  // todos" (zone.colorMode "one") or a per-button custom override — otherwise that chosen color
  // gets silently replaced by the network's fixed accent and picking a color does nothing.
  const useNetworkAccent = !hasCustomColor && zone.colorMode === "auto";
  return { background, text: contrastTextColor(background), isAuthentic, useNetworkAccent };
}
