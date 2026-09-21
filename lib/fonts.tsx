// Single shared font catalog used by the title, the subtitle and the button zone — before
// this, each of the three had its own separate list (and the button one referenced Google
// Fonts that were never actually loaded anywhere, so they silently fell back to system fonts).
// Every option here is either a real Google Font (with the exact weight cuts that family
// publishes, so we never request a weight Google doesn't have) or a safe system font that
// needs no network request at all.
export type FontOption = {
  id: string;
  label: string;
  family: string;
  category: "Modernas" | "Elegantes" | "Expresivas" | "Manuscritas" | "Técnicas";
  displayOnly?: boolean;
  google?: { family: string; weights: number[] };
};

export const FONT_OPTIONS: FontOption[] = [
  { id: "modern", label: "Space Grotesk", category: "Modernas", family: "'Space Grotesk', sans-serif", google: { family: "Space Grotesk", weights: [400, 500, 600, 700] } },
  { id: "minimal", label: "Inter", category: "Modernas", family: "'Inter', sans-serif", google: { family: "Inter", weights: [400, 500, 600, 700, 800, 900] } },
  { id: "friendly", label: "Poppins", category: "Modernas", family: "'Poppins', sans-serif", google: { family: "Poppins", weights: [400, 500, 600, 700, 800, 900] } },
  { id: "classic", label: "Playfair Display", category: "Elegantes", family: "'Playfair Display', serif", google: { family: "Playfair Display", weights: [400, 500, 600, 700, 800, 900] } },
  { id: "elegant", label: "Cormorant Garamond", category: "Elegantes", family: "'Cormorant Garamond', serif", google: { family: "Cormorant Garamond", weights: [400, 500, 600, 700] } },
  { id: "bold", label: "Archivo Black", category: "Expresivas", displayOnly: true, family: "'Archivo Black', sans-serif", google: { family: "Archivo Black", weights: [400] } },
  { id: "handwritten", label: "Caveat", category: "Manuscritas", displayOnly: true, family: "'Caveat', cursive", google: { family: "Caveat", weights: [400, 500, 600, 700] } },
  { id: "mono", label: "JetBrains Mono", category: "Técnicas", family: "'JetBrains Mono', monospace", google: { family: "JetBrains Mono", weights: [400, 500, 600, 700, 800] } },
  { id: "manrope", label: "Manrope", category: "Modernas", family: "'Manrope', sans-serif", google: { family: "Manrope", weights: [400, 500, 600, 700, 800] } },
  { id: "fustat", label: "Fustat", category: "Modernas", family: "'Fustat', sans-serif", google: { family: "Fustat", weights: [400, 500, 600, 700, 800] } },
  { id: "ibm-plex-sans", label: "IBM Plex Sans", category: "Modernas", family: "'IBM Plex Sans', sans-serif", google: { family: "IBM Plex Sans", weights: [400, 500, 600, 700] } },
  { id: "domine", label: "Domine", category: "Elegantes", family: "'Domine', serif", google: { family: "Domine", weights: [400, 500, 600, 700] } },
  { id: "old-standard", label: "Old Standard TT", category: "Elegantes", family: "'Old Standard TT', serif", google: { family: "Old Standard TT", weights: [400, 700] } },
  { id: "viaoda", label: "Viaoda Libre", category: "Elegantes", displayOnly: true, family: "'Viaoda Libre', serif", google: { family: "Viaoda Libre", weights: [400] } },
  { id: "anton", label: "Anton", category: "Expresivas", displayOnly: true, family: "'Anton', sans-serif", google: { family: "Anton", weights: [400] } },
  { id: "alfa-slab", label: "Alfa Slab One", category: "Expresivas", displayOnly: true, family: "'Alfa Slab One', serif", google: { family: "Alfa Slab One", weights: [400] } },
  { id: "belanosima", label: "Belanosima", category: "Expresivas", displayOnly: true, family: "'Belanosima', sans-serif", google: { family: "Belanosima", weights: [400, 600, 700] } },
  { id: "chango", label: "Chango", category: "Expresivas", displayOnly: true, family: "'Chango', sans-serif", google: { family: "Chango", weights: [400] } },
  { id: "space-mono", label: "Space Mono", category: "Técnicas", family: "'Space Mono', monospace", google: { family: "Space Mono", weights: [400, 700] } },
  { id: "oxanium", label: "Oxanium", category: "Técnicas", family: "'Oxanium', sans-serif", google: { family: "Oxanium", weights: [400, 500, 600, 700, 800] } },
  { id: "kavivanar", label: "Kavivanar", category: "Manuscritas", displayOnly: true, family: "'Kavivanar', cursive", google: { family: "Kavivanar", weights: [400] } },
  { id: "salsa", label: "Salsa", category: "Manuscritas", displayOnly: true, family: "'Salsa', cursive", google: { family: "Salsa", weights: [400] } },
];

export function getFontWeights(id: string): number[] {
  return FONT_OPTIONS.find(font => font.id === id || font.family === id)?.google?.weights || [400,500,600,700,800,900];
}

export function resolveFontWeight(id: string, requested: number): number {
  const weights = getFontWeights(id);
  return weights.reduce((nearest, weight) => Math.abs(weight-requested) < Math.abs(nearest-requested) ? weight : nearest, weights[0]);
}

export function getFontFamily(id: string | null | undefined): string {
  return (FONT_OPTIONS.find((option) => option.id === id) || FONT_OPTIONS[0]).family;
}

// Title/subtitle used to store a literal CSS font-family string directly (e.g.
// "Inter,ui-sans-serif,system-ui,sans-serif") instead of an id. Landings saved before this
// catalog existed still have that raw value in the database — resolving it here (instead of
// only supporting ids) keeps them rendering exactly as they did.
export function resolveTextFont(idOrLegacyFamily: string | null | undefined): string {
  if (!idOrLegacyFamily) return FONT_OPTIONS[0].family;
  const match = FONT_OPTIONS.find((option) => option.id === idOrLegacyFamily);
  return match ? match.family : idOrLegacyFamily;
}

function googleFontsHref(ids: (string | null | undefined)[]): string | null {
  const families = new Map<string, number[]>();
  for (const id of ids) {
    const option = FONT_OPTIONS.find((f) => f.id === id);
    if (option?.google) families.set(option.google.family, option.google.weights);
  }
  if (!families.size) return null;
  const parts = Array.from(families.entries()).map(
    ([family, weights]) => `family=${family.replace(/ /g, "+")}:wght@${weights.join(";")}`
  );
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

// Renders nothing but a <link>, so it's safe to drop anywhere in the tree (server or client
// component) — the browser fetches a rel=stylesheet link no matter where in the document it
// sits. The editor passes every catalog id (so every option in every font picker previews
// correctly, instantly), while the public page and admin previews pass only the 2-3 ids the
// landing actually uses, so real visitors never download fonts they'll never see.
export function FontLinks({ ids }: { ids: (string | null | undefined)[] }) {
  const href = googleFontsHref(ids);
  if (!href) return null;
  return <link rel="stylesheet" href={href} />;
}

export const ALL_FONT_IDS = FONT_OPTIONS.map((f) => f.id);
