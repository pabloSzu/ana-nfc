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
  google?: { family: string; weights: number[] };
};

export const FONT_OPTIONS: FontOption[] = [
  { id: "modern", label: "Moderna", family: "'Space Grotesk', sans-serif", google: { family: "Space Grotesk", weights: [400, 500, 600, 700] } },
  { id: "minimal", label: "Minimalista", family: "'Inter', sans-serif", google: { family: "Inter", weights: [400, 500, 600, 700, 800, 900] } },
  { id: "friendly", label: "Amigable", family: "'Poppins', sans-serif", google: { family: "Poppins", weights: [400, 500, 600, 700, 800, 900] } },
  { id: "classic", label: "Clásica", family: "'Playfair Display', serif", google: { family: "Playfair Display", weights: [400, 500, 600, 700, 800, 900] } },
  { id: "elegant", label: "Elegante", family: "'Cormorant Garamond', serif", google: { family: "Cormorant Garamond", weights: [400, 500, 600, 700] } },
  { id: "bold", label: "Audaz", family: "'Archivo Black', sans-serif", google: { family: "Archivo Black", weights: [400] } },
  { id: "handwritten", label: "Manuscrita", family: "'Caveat', cursive", google: { family: "Caveat", weights: [400, 500, 600, 700] } },
  { id: "mono", label: "Técnica", family: "'JetBrains Mono', monospace", google: { family: "JetBrains Mono", weights: [400, 500, 600, 700, 800] } },
];

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
