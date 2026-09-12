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
  buttonZone: Omit<ButtonZoneStyle, "oneColor" | "templateId" | "contentAlign">;
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
    buttonZone: { preset: "minimal", layout: "center", gap: 10, height: 52, radius: 12, width: 100, shadow: "none", finish: "solid", collection: "minimal", colorMode: "one", textSize: 14, iconSize: 27 },
    title: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 800, size: 27, align: "center" }, subtitle: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 500, size: 14 }, logo: { shape: "round", size: 116 },
  },
  {
    id: "brutalism", name: "Brutalismo", description: "Blanco y negro puro, bordes duros, cero adornos. Estudios, moda y marcas con carácter.",
    background: "#f4f3ee", bg1: "#f4f3ee", bg2: "#e6e4db", accent: "#0a0a0a", oneColor: "#ffffff", foreground: "#0a0a0a",
    buttonFont: "modern",
    buttonZone: { preset: "brutalism", layout: "center", gap: 13, height: 56, radius: 0, width: 100, shadow: "none", finish: "solid", collection: "brutal", colorMode: "one", textSize: 15, iconSize: 28 },
    title: { font: "'Arial Black',Arial,sans-serif", weight: 900, size: 32, align: "center" }, subtitle: { font: "'Courier New',monospace", weight: 700, size: 13 }, logo: { shape: "square", size: 120 },
  },
  {
    id: "neobrutal", name: "Neobrutalismo", description: "Colores fuertes, bordes marcados y sombra dura. Marcas jóvenes, apps y creadores.",
    background: "linear-gradient(150deg,#fff267,#ff8bd0)", bg1: "#fff267", bg2: "#ff8bd0", accent: "#1a1a1a", oneColor: "#7c5cff", foreground: "#171923",
    buttonFont: "friendly",
    buttonZone: { preset: "neobrutal", layout: "center", gap: 13, height: 56, radius: 14, width: 100, shadow: "none", finish: "solid", collection: "retro", colorMode: "auto", textSize: 15, iconSize: 29 },
    title: { font: "'Arial Black',Arial,sans-serif", weight: 900, size: 30, align: "center" }, subtitle: { font: "'Trebuchet MS',sans-serif", weight: 700, size: 14 }, logo: { shape: "square", size: 122 },
  },
  {
    id: "glass", name: "Glassmorfismo", description: "Vidrio esmerilado sobre un fondo vivo. Fotografía, eventos y vida nocturna.",
    background: "linear-gradient(150deg,#1c0f3d,#ff4fa3)", bg1: "#1c0f3d", bg2: "#ff4fa3", accent: "#ffffff", oneColor: "#ffffff", foreground: "#ffffff",
    buttonFont: "minimal",
    buttonZone: { preset: "glass", layout: "center", gap: 11, height: 56, radius: 18, width: 100, shadow: "soft", finish: "glass", collection: "glass", colorMode: "one", textSize: 14, iconSize: 29 },
    title: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 800, size: 29, align: "center" }, subtitle: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 500, size: 14 }, logo: { shape: "round", size: 124 },
  },
  {
    id: "elegant", name: "Elegante", description: "Editorial, oscura y con detalles dorados. Hoteles boutique, joyerías y alta gama.",
    background: "linear-gradient(150deg,#181310,#3d2b1f)", bg1: "#181310", bg2: "#3d2b1f", accent: "#d9b26a", oneColor: "#d9b26a", foreground: "#f3e6cf",
    buttonFont: "classic",
    buttonZone: { preset: "elegant", layout: "center", gap: 14, height: 54, radius: 6, width: 100, shadow: "soft", finish: "solid", collection: "luxury", colorMode: "one", textSize: 14, iconSize: 26 },
    title: { font: "Georgia,serif", weight: 700, size: 30, align: "center" }, subtitle: { font: "Georgia,serif", weight: 400, size: 14 }, logo: { shape: "round", size: 114 },
  },
  {
    id: "corporate", name: "Corporativo", description: "Prolijo, confiable y sobrio. Estudios, consultoras y servicios profesionales.",
    background: "linear-gradient(160deg,#f4f6fb,#dfe6f3)", bg1: "#f4f6fb", bg2: "#dfe6f3", accent: "#1d4ed8", oneColor: "#1d4ed8", foreground: "#111827",
    buttonFont: "minimal",
    buttonZone: { preset: "corporate", layout: "center", gap: 10, height: 52, radius: 10, width: 100, shadow: "soft", finish: "solid", collection: "corporate", colorMode: "one", textSize: 14, iconSize: 26 },
    title: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 800, size: 26, align: "center" }, subtitle: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 500, size: 14 }, logo: { shape: "square", size: 112 },
  },
  {
    id: "vibrant", name: "Vibrante", description: "Cada red conserva su color oficial. Perfil personal o multi-marca.",
    background: "linear-gradient(150deg,#35236d,#dd5f7c)", bg1: "#35236d", bg2: "#dd5f7c", accent: "#ef5577", oneColor: "#ef5577", foreground: "#ffffff",
    buttonFont: "modern",
    buttonZone: { preset: "vibrant", layout: "center", gap: 11, height: 57, radius: 18, width: 100, shadow: "strong", finish: "solid", collection: "brand", colorMode: "auto", textSize: 14, iconSize: 30 },
    title: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 900, size: 29, align: "center" }, subtitle: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 600, size: 14 }, logo: { shape: "square", size: 122 },
  },
  {
    id: "natural", name: "Natural", description: "Cálida y orgánica. Wellness, gastronomía consciente y turismo rural.",
    background: "linear-gradient(150deg,#f4ede1,#c9d6b8)", bg1: "#f4ede1", bg2: "#c9d6b8", accent: "#4c6b4a", oneColor: "#4c6b4a", foreground: "#2b3a26",
    buttonFont: "friendly",
    buttonZone: { preset: "natural", layout: "center", gap: 12, height: 56, radius: 26, width: 100, shadow: "soft", finish: "solid", collection: "soft", colorMode: "one", textSize: 14, iconSize: 28 },
    title: { font: "'Trebuchet MS',sans-serif", weight: 800, size: 28, align: "center" }, subtitle: { font: "'Trebuchet MS',sans-serif", weight: 500, size: 15 }, logo: { shape: "round", size: 126 },
  },
  {
    id: "pastel", name: "Pastel", description: "Suave, luminosa y delicada. Belleza, salud y cuidado personal.",
    background: "linear-gradient(150deg,#ffe6ef,#e3e6ff)", bg1: "#ffe6ef", bg2: "#e3e6ff", accent: "#cf7fb9", oneColor: "#cf7fb9", foreground: "#3d2a3c",
    buttonFont: "friendly",
    buttonZone: { preset: "pastel", layout: "center", gap: 11, height: 54, radius: 22, width: 100, shadow: "soft", finish: "solid", collection: "pastel", colorMode: "one", textSize: 14, iconSize: 27 },
    title: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 700, size: 27, align: "center" }, subtitle: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 500, size: 14 }, logo: { shape: "round", size: 118 },
  },
  {
    id: "neon", name: "Neon Night", description: "Oscura y magnética con brillo ambiental. Bares, boliches y eventos nocturnos.",
    background: "linear-gradient(150deg,#07050f,#1c1033)", bg1: "#07050f", bg2: "#1c1033", accent: "#8b5cff", oneColor: "#8b5cff", foreground: "#ffffff",
    buttonFont: "modern",
    buttonZone: { preset: "neon", layout: "center", gap: 13, height: 57, radius: 16, width: 100, shadow: "strong", finish: "solid", collection: "glow", colorMode: "auto", textSize: 14, iconSize: 30 },
    title: { font: "'Arial Black',Arial,sans-serif", weight: 900, size: 29, align: "center" }, subtitle: { font: "Inter,ui-sans-serif,system-ui,sans-serif", weight: 500, size: 14 }, logo: { shape: "square", size: 118 },
  },
  {
    id: "creator", name: "Pop Studio", description: "Audaz y expresiva, pero siempre ordenada. Creadores y marcas digitales.",
    background: "linear-gradient(150deg,#ff3e88,#ff9a3d)", bg1: "#ff3e88", bg2: "#ff9a3d", accent: "#5b2be0", oneColor: "#5b2be0", foreground: "#ffffff",
    buttonFont: "friendly",
    buttonZone: { preset: "creator", layout: "center", gap: 12, height: 58, radius: 22, width: 100, shadow: "strong", finish: "solid", collection: "candy", colorMode: "one", textSize: 15, iconSize: 31 },
    title: { font: "'Arial Black',Arial,sans-serif", weight: 900, size: 30, align: "center" }, subtitle: { font: "'Trebuchet MS',sans-serif", weight: 700, size: 14 }, logo: { shape: "square", size: 118 },
  },
];

export const BUTTON_COLLECTIONS: { id: ButtonZoneStyle["collection"]; name: string; description: string }[] = [
  { id: "soft", name: "Soft Cards", description: "Suaves, cálidos y con profundidad delicada." },
  { id: "brand", name: "Colores de marca", description: "Degradados intensos para redes y acciones." },
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
  if (collection === "glass") return { background: `linear-gradient(135deg, rgba(255,255,255,.5), rgba(255,255,255,.14) 45%, color-mix(in srgb, ${bg} 55%, transparent) 100%)`, color: "#ffffff", textShadow: "0 1px 5px rgba(0,0,0,.4)", border: "1.5px solid rgba(255,255,255,.75)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.85), inset 0 -12px 18px -12px rgba(255,255,255,.35), 0 14px 30px rgba(0,0,0,.25)", backdropFilter: "blur(20px) saturate(1.6)" };
  if (collection === "brand") return { background: `linear-gradient(135deg, color-mix(in srgb, ${bg} 88%, white), color-mix(in srgb, ${bg} 78%, black))`, color: text, border: "1px solid rgba(255,255,255,.2)", boxShadow: `0 9px 22px color-mix(in srgb, ${bg} 30%, transparent), inset 0 1px 0 rgba(255,255,255,.28)` };
  if (collection === "glow") return { background: `linear-gradient(135deg, color-mix(in srgb, ${bg} 78%, #10101a), #12121d)`, color: "#ffffff", border: `1px solid color-mix(in srgb, ${bg} 78%, white)`, boxShadow: `0 0 0 1px color-mix(in srgb, ${bg} 18%, transparent), 0 8px 26px color-mix(in srgb, ${bg} 44%, transparent), inset 0 1px 0 rgba(255,255,255,.16)` };
  // These two used to hardcode their background/text and quietly ignore the chosen color —
  // the "Colores" picker (global or per-button) looked broken because for these two
  // collections specifically, it genuinely did nothing. They keep their signature look
  // (gold text on dark for luxury, thin near-white cards for minimal) but the actual
  // color choice now always visibly does something, same as every other collection.
  if (collection === "luxury") return { background: `linear-gradient(145deg, color-mix(in srgb, ${bg} 34%, #26221d), color-mix(in srgb, ${bg} 20%, #11100e))`, color: "#f7dfa5", border: `1px solid color-mix(in srgb, ${bg} 42%, rgba(229,194,112,.68))`, boxShadow: "inset 0 1px 0 rgba(255,244,207,.12), 0 10px 24px rgba(0,0,0,.28)" };
  if (collection === "minimal") return { background: `color-mix(in srgb, ${bg} 12%, #ffffff)`, color: "#1b1c22", border: `1.5px solid color-mix(in srgb, ${bg} 46%, #d8d9df)`, boxShadow: "0 5px 18px rgba(21,24,35,.07)" };
  if (collection === "split") return { background: `linear-gradient(135deg, color-mix(in srgb, ${bg} 94%, white), color-mix(in srgb, ${bg} 85%, black))`, color: text, border: "1px solid rgba(255,255,255,.22)", boxShadow: `0 10px 22px color-mix(in srgb, ${bg} 25%, transparent), inset 0 1px 0 rgba(255,255,255,.24)` };
  if (collection === "bento") return { background: index % 3 === 1 ? `linear-gradient(135deg,${bg},color-mix(in srgb, ${bg} 72%, black))` : `color-mix(in srgb, ${bg} 88%, white)`, color: text, border: "1px solid rgba(255,255,255,.3)", boxShadow: "0 9px 22px rgba(20,22,30,.15)" };
  if (collection === "pastel") return { background: `linear-gradient(125deg, color-mix(in srgb, ${bg} 34%, #fff), color-mix(in srgb, ${bg} 58%, #f8efff))`, color: "#343044", border: "1px solid rgba(255,255,255,.72)", boxShadow: "inset 0 1px 0 #fff, 0 8px 20px rgba(83,65,112,.12)" };
  if (collection === "metallic") return { background: `linear-gradient(115deg, color-mix(in srgb, ${bg} 66%, #252735), color-mix(in srgb, ${bg} 30%, #f2f4fa) 48%, color-mix(in srgb, ${bg} 72%, #171923))`, color: "#fff", border: "1px solid rgba(255,255,255,.4)", boxShadow: "inset 0 1px 1px rgba(255,255,255,.52), inset 0 -1px 1px rgba(0,0,0,.25), 0 8px 20px rgba(16,18,28,.2)" };
  if (collection === "retro") return { background: bg, color: text, border: "2.5px solid #191724", boxShadow: "4px 4px 0 #191724" };
  if (collection === "editorial") return { background: "rgba(255,255,255,.08)", color: text, border: "0", borderTop: `1px solid color-mix(in srgb, ${bg} 62%, white)`, borderBottom: `1px solid color-mix(in srgb, ${bg} 62%, white)`, boxShadow: "none" };
  if (collection === "candy") return { background: `linear-gradient(120deg, color-mix(in srgb, ${bg} 82%, #ff8bd5), color-mix(in srgb, ${bg} 78%, #8d7bff))`, color: "#fff", border: "2px solid rgba(255,255,255,.65)", boxShadow: `inset 0 2px 0 rgba(255,255,255,.4), 0 8px 18px color-mix(in srgb, ${bg} 24%, transparent)` };
  if (collection === "ocean") return { background: `linear-gradient(125deg, color-mix(in srgb, ${bg} 62%, #083b66), color-mix(in srgb, ${bg} 72%, #16b8ca))`, color: "#fff", border: "1px solid rgba(173,244,255,.48)", boxShadow: "inset 0 1px 0 rgba(220,251,255,.38), 0 9px 22px rgba(5,69,96,.25)" };
  if (collection === "brutal") return { background: bg, color: text, border: "3px solid #0a0a0a", boxShadow: "5px 5px 0 #0a0a0a" };
  if (collection === "corporate") return { background: bg, color: text, border: "1px solid rgba(255,255,255,.22)", boxShadow: "0 6px 16px rgba(15,23,42,.16)" };
  return { background: `linear-gradient(180deg, color-mix(in srgb, ${bg} 92%, white), ${bg})`, color: text, border: "1px solid rgba(255,255,255,.3)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 8px 18px rgba(20,22,30,.13)" };
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
