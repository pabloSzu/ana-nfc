import { buildActionLink } from "./landing-catalog";
import { pickButtonLink, type ButtonLike } from "./landing-plan";

// Link de respaldo automático: el primer botón de la página que sirva como destino (WhatsApp,
// Instagram, web, reseñas…). La regla vive en pickButtonLink (lib/landing-plan.ts, con tests);
// acá solo se le pasa cómo arma el link cada tipo de botón.
export function firstButtonLink(actions?: ButtonLike[] | null): string | null {
  return pickButtonLink(actions, buildActionLink);
}

// Agrega auto_fallback a una página leída con sus botones (select "*, actions(...)").
export function withAutoFallback<T extends { actions?: ButtonLike[] | null }>(landing: T): T & { auto_fallback: string | null } {
  return { ...landing, auto_fallback: firstButtonLink(landing.actions) };
}
