// Plan, vencimiento y redirección de una landing o tarjeta. Todo lo que decide si una página se
// muestra, se redirige o está por vencer sale de acá, para que la página pública, la lista del
// Admin, el inicio, el editor y la pantalla de Gestión digan siempre lo mismo.
//
// Son funciones puras (sin base ni red): las Server Actions solo leen el formulario, llaman a
// estas funciones y guardan lo que devuelven. Así cada regla se prueba en tests/landing-plan.test.ts.

export type LandingPlan = "annual" | "direct" | "lifetime";

export const PLANS: LandingPlan[] = ["annual", "direct", "lifetime"];

export const PLAN_LABELS: Record<LandingPlan, string> = {
  annual: "Anual",
  direct: "Link directo",
  lifetime: "Sin vencimiento",
};

// Días que la página sigue visible después de vencer, antes de pasar sola al link de respaldo.
export const GRACE_DAYS = 15;
// Desde cuántos días antes del vencimiento se avisa "por vencer".
export const WARNING_DAYS = 30;

const DAY = 24 * 60 * 60 * 1000;
const TIME_ZONE = "America/Argentina/Cordoba";

export type PlanFields = {
  plan?: string | null;
  expires_at?: string | null;
  fallback_url?: string | null;
  redirect_url?: string | null;
  published?: boolean | null;
  button_style?: unknown;
  // No es una columna: el primer botón de la página (ver lib/landing-fallback.ts), que se usa
  // como link de respaldo cuando no se cargó uno a mano.
  auto_fallback?: string | null;
};

const text = (value: unknown) => String(value ?? "").trim();
const toTime = (value: number | Date) => (value instanceof Date ? value.getTime() : value);

// El link de respaldo que corresponde: el cargado a mano, o si no, el primer botón de la página.
export function fallbackOf(landing: PlanFields): string {
  return text(landing.fallback_url) || text(landing.auto_fallback);
}

export function planOf(landing: PlanFields): LandingPlan {
  return landing.plan === "direct" || landing.plan === "lifetime" ? landing.plan : "annual";
}

export function parsePlan(value: unknown): LandingPlan {
  return PLANS.includes(value as LandingPlan) ? (value as LandingPlan) : "annual";
}

// A dónde manda la página pública, o null si se muestra.
// - Link directo: siempre a su link (redirect_url).
// - Anual: a redirect_url si se pasó a mano al link de respaldo; si no, y venció hace más de
//   GRACE_DAYS, sola al link de respaldo (el cargado a mano o, si no hay, el primer botón).
// - Sin vencimiento: nunca redirige.
export function effectiveRedirect(landing: PlanFields, now: number | Date = Date.now()): string | null {
  const plan = planOf(landing);
  const fixed = text(landing.redirect_url);
  if (plan === "lifetime") return null;
  if (fixed) return fixed;
  if (plan === "direct") return null;
  const fallback = fallbackOf(landing);
  if (!fallback || !landing.expires_at) return null;
  return toTime(now) > new Date(landing.expires_at).getTime() + GRACE_DAYS * DAY ? fallback : null;
}

export type PlanTone = "ok" | "warn" | "danger" | "neutral" | "muted";
export type PlanStatus = {
  key: "direct" | "direct-missing" | "lifetime" | "redirected" | "pending" | "active" | "expiring" | "expired";
  label: string;
  tone: PlanTone;
  days?: number;
};

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
}

const plural = (count: number, word: string) => `${count} ${count === 1 ? word : word + "s"}`;

export function planStatus(landing: PlanFields, now: number | Date = Date.now()): PlanStatus {
  const plan = planOf(landing);
  if (plan === "direct") return text(landing.redirect_url)
    ? { key: "direct", label: "Link directo · no vence", tone: "neutral" }
    : { key: "direct-missing", label: "Link directo · falta cargar el link", tone: "warn" };
  if (plan === "lifetime") return { key: "lifetime", label: "Sin vencimiento", tone: "neutral" };
  if (text(landing.redirect_url)) return { key: "redirected", label: "Abre el link de respaldo", tone: "neutral" };
  if (!landing.expires_at) return { key: "pending", label: "El año empieza al publicarla", tone: "muted" };
  const days = Math.ceil((new Date(landing.expires_at).getTime() - toTime(now)) / DAY);
  if (days < 0) {
    if (effectiveRedirect(landing, now)) return { key: "redirected", label: "Vencida · abre el link de respaldo", tone: "neutral", days };
    if (!fallbackOf(landing)) return { key: "expired", label: `Vencida hace ${plural(-days, "día")} · falta link de respaldo`, tone: "danger", days };
    return { key: "expired", label: `Vencida · pasa al link de respaldo en ${plural(Math.max(1, GRACE_DAYS + days), "día")}`, tone: "danger", days };
  }
  if (days === 0) return { key: "expiring", label: "Vence hoy", tone: "warn", days };
  if (days <= WARNING_DAYS) return { key: "expiring", label: `Vence en ${plural(days, "día")}`, tone: "warn", days };
  return { key: "active", label: `Activa hasta el ${formatDate(landing.expires_at)}`, tone: "ok", days };
}

function addYear(from: Date) {
  const next = new Date(from);
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

export function oneYearFromNow(now: Date = new Date()) {
  return addYear(now);
}

// Un año más. Si todavía no venció, se suma desde el vencimiento (el cliente no pierde los días
// que le quedaban); si ya venció, el año corre desde hoy.
export function renewedExpiry(expiresAt: string | null | undefined, now: Date = new Date()) {
  const current = expiresAt ? new Date(expiresAt) : null;
  return addYear(current && current > now ? current : now);
}

// "instagram.com/x" → "https://instagram.com/x". Devuelve "" si está vacío y null si no parece
// un link (sin punto en el dominio, espacios, etc.).
export function normalizeLink(raw: unknown): string | null {
  const value = text(raw);
  if (!value) return "";
  if (/\s/.test(value)) return null;
  const url = /^https?:\/\//i.test(value) ? value : "https://" + value;
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes(".") && !parsed.hostname.startsWith(".") && !parsed.hostname.endsWith(".") ? url : null;
  } catch {
    return null;
  }
}

// --- Lo que guarda cada acción ---------------------------------------------------------------

export type Update = Record<string, unknown>;
export type UpdateResult = { ok: true; update: Update; message: string } | { ok: false; error: string };

// Al publicar. El año de una página anual empieza la primera vez que se publica; despublicar y
// volver a publicar no lo reinicia (para eso está "Renovar un año").
export function publishUpdate(landing: PlanFields, desired: boolean, now: Date = new Date()): Update {
  if (desired && planOf(landing) === "annual" && !landing.expires_at) return { published: true, expires_at: oneYearFromNow(now) };
  return { published: desired };
}

export function renewalUpdate(landing: PlanFields, now: Date = new Date()): UpdateResult {
  if (planOf(landing) !== "annual") return { ok: false, error: "Solo se renuevan las páginas con plan anual." };
  const expires_at = renewedExpiry(landing.expires_at, now);
  // Renovar también saca la redirección al link de respaldo: la página vuelve a mostrarse.
  return { ok: true, update: { expires_at, redirect_url: null }, message: `Renovada hasta el ${formatDate(expires_at)}` };
}

export function manualRedirectUpdate(landing: PlanFields, activate: boolean): UpdateResult {
  if (planOf(landing) !== "annual") return { ok: false, error: "La redirección al link de respaldo es solo para el plan anual." };
  if (!activate) return { ok: true, update: { redirect_url: null }, message: "La página vuelve a mostrarse" };
  const fallback = fallbackOf(landing);
  if (!fallback) return { ok: false, error: "Primero cargá el link de respaldo o agregale un botón a la página." };
  return { ok: true, update: { redirect_url: fallback }, message: "Ahora abre el link de respaldo" };
}

export type ManagementInput = {
  plan: unknown;
  expiresAt?: unknown;
  fallbackUrl?: unknown;
  directUrl?: unknown;
  showBranding?: boolean;
};

// "Guardar" en Gestión. Cada plan solo toca lo suyo; lo que no aplica al plan se limpia para que
// no quede nada a medias (por ejemplo, una fecha de vencimiento en una página sin vencimiento).
export function managementUpdate(landing: PlanFields, input: ManagementInput, now: Date = new Date()): UpdateResult {
  const plan = parsePlan(input.plan);
  const previous = planOf(landing);
  const style = landing.button_style && typeof landing.button_style === "object" && !Array.isArray(landing.button_style) ? landing.button_style as Record<string, unknown> : {};
  const withBranding = (update: Update) => ({ ...update, button_style: { ...style, showBranding: input.showBranding !== false } });

  if (plan === "direct") {
    const destination = normalizeLink(input.directUrl);
    if (destination === null) return { ok: false, error: "El link del producto no parece válido. Revisalo y probá de nuevo." };
    if (!destination) return { ok: false, error: "Cargá el link que abre el producto." };
    return { ok: true, update: { plan, redirect_url: destination, expires_at: null }, message: "Guardado: el producto abre el link directo" };
  }

  if (plan === "lifetime") {
    return { ok: true, update: withBranding({ plan, redirect_url: null, expires_at: null }), message: "Guardado: la página no vence" };
  }

  const fallback = normalizeLink(input.fallbackUrl);
  if (fallback === null) return { ok: false, error: "El link de respaldo no parece válido. Revisalo y probá de nuevo." };
  const update: Update = { plan, fallback_url: fallback || null };

  const date = text(input.expiresAt);
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "La fecha de vencimiento no es válida." };
    const parsed = new Date(`${date}T12:00:00-03:00`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return { ok: false, error: "La fecha de vencimiento no es válida." };
    update.expires_at = parsed.toISOString();
  } else {
    // Sin fecha: si ya está publicada, conserva la que tenía o arranca un año desde hoy; si es
    // un borrador, queda vacía y el año empieza al publicarla.
    update.expires_at = landing.published ? (previous === "annual" && landing.expires_at) || oneYearFromNow(now) : null;
  }

  // Al pasar a anual desde otro plan, la página vuelve a mostrarse. Si ya era anual y estaba
  // redirigida a mano, sigue redirigida pero al link de respaldo nuevo (o se muestra si se borró).
  if (previous !== "annual") update.redirect_url = null;
  else if (text(landing.redirect_url)) update.redirect_url = fallback || null;

  return { ok: true, update: withBranding(update), message: "Gestión guardada" };
}

// Cómo se nombra cada página en el Admin. Un link directo es técnicamente una landing que nunca se
// muestra, pero para Pablo es otro producto: no tiene diseño que editar.
export function pageKindLabel(landing: PlanFields & { business_type?: string | null }) {
  if (planOf(landing) === "direct") return "Link directo";
  return landing.business_type === "contact" ? "Tarjeta personal" : landing.business_type === "pet" ? "Chapita de mascota" : "Landing";
}

// Adónde lleva "Editar": el editor de diseño, o Gestión si es un link directo.
export function editHref(landing: PlanFields & { id: string; business_type?: string | null }) {
  if (planOf(landing) === "direct") return `/admin/landings/${landing.id}/gestion`;
  return landing.business_type === "pet" ? `/admin/landings/${landing.id}/mascota` : `/admin/landings/${landing.id}/editor-v2`;
}

export type ButtonLike = { type?: string | null; url?: string | null; enabled?: boolean | null; position?: number | null };

// El primer botón activo de la página que sirva como destino de un NFC. Email, teléfono y
// documentos no sirven, así que se saltean. buildLink arma el link de cada tipo de botón
// (buildActionLink en la app; se recibe por parámetro para poder probarlo sin el catálogo).
export function pickButtonLink(actions: ButtonLike[] | null | undefined, buildLink: (type: string, value: string) => string): string | null {
  const ordered = [...(actions || [])]
    .filter((action) => action.enabled !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  for (const action of ordered) {
    const type = text(action.type);
    const value = text(action.url);
    if (!value || ["email", "phone", "cv"].includes(type)) continue;
    const digits = value.replace(/\D/g, "");
    const href = type === "whatsapp" ? (digits.length >= 8 ? `https://wa.me/${digits}` : "") : buildLink(type, value);
    if (/^https?:\/\/[^\s/]+\.[^\s]+/i.test(href)) return href;
  }
  return null;
}
