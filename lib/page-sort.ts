// Orden del listado de Páginas (/admin/paginas). Lógica pura, con tests en tests/page-sort.test.ts.

export type PageSort = "recent" | "edited" | "oldest" | "name" | "expiring" | "views";

export const PAGE_SORTS: { value: PageSort; label: string }[] = [
  { value: "recent", label: "Más recientes" },
  { value: "edited", label: "Editadas hace poco" },
  { value: "oldest", label: "Más antiguas" },
  { value: "name", label: "Nombre (A-Z)" },
  { value: "expiring", label: "Vencen primero" },
  { value: "views", label: "Más visitas" },
];

export function parsePageSort(value: unknown): PageSort {
  return PAGE_SORTS.some((item) => item.value === value) ? value as PageSort : "recent";
}

type Sortable = { name: string; createdAt: string; updatedAt: string; expiresAt: string; views: { total: number } };

const time = (value: string) => { const parsed = Date.parse(value); return Number.isFinite(parsed) ? parsed : 0; };

// No modifica el arreglo recibido. "Vencen primero" deja al final las que no vencen (sin fecha).
export function sortPages<T extends Sortable>(rows: T[], sort: PageSort): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  const compare: Record<PageSort, (a: T, b: T) => number> = {
    recent: (a, b) => time(b.createdAt) - time(a.createdAt),
    edited: (a, b) => time(b.updatedAt) - time(a.updatedAt),
    oldest: (a, b) => time(a.createdAt) - time(b.createdAt),
    name: byName,
    expiring: (a, b) => (a.expiresAt ? time(a.expiresAt) : Infinity) - (b.expiresAt ? time(b.expiresAt) : Infinity) || byName(a, b),
    views: (a, b) => b.views.total - a.views.total || byName(a, b),
  };
  return [...rows].sort(compare[sort]);
}

// "Hoy", "Ayer", "Hace 3 días", "Hace 2 semanas" o la fecha, en hora de Córdoba. Para mostrar
// cuándo se editó una página de un vistazo; la fecha exacta va en el tooltip.
export function relativeDay(value: string, now = new Date()): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";
  const day = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" });
  const days = Math.round((Date.parse(day(now)) - Date.parse(day(new Date(parsed)))) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) { const weeks = Math.floor(days / 7); return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`; }
  return `el ${shortDate(value)}`;
}

// "14 oct 2026" en hora de Córdoba, igual en cualquier navegador o servidor.
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function shortDate(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "";
  const [year, month, day] = new Date(parsed).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" }).split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
