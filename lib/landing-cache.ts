// Etiqueta de caché de la página pública de cada link (app/[slug]/page.tsx). Al guardar una página
// se invalida con revalidateLandingPage (solo desde Server Actions), así un cambio (por ejemplo, prender "¡Estoy perdido!") se
// ve al instante y no recién a los 5 minutos.
import { revalidatePath, updateTag } from "next/cache";

export const landingTag = (slug: string) => `landing:${slug}`;

export function revalidateLandingPage(slug: string | null | undefined) {
  if (!slug) return;
  // updateTag (no revalidateTag): se llama desde Server Actions y vence la caché en el acto.
  updateTag(landingTag(slug));
  revalidatePath(`/${slug}`);
}
