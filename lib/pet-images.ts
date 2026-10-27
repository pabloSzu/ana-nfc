import "server-only";
import { getSiteOrigin } from "@/lib/site-url";

// Arma de antemano las imágenes para compartir (app/api/og/mascota): la primera vez tardan unos
// segundos, y el momento en que se ven por primera vez es justo el final del recorrido ("Subir a
// mi historia"). Pedirlas al guardar las deja listas en la caché (la dirección lleva la versión,
// así que quedan guardadas). Corre después de responder; si falla, no pasa nada: se arman al pedirlas.
export async function warmPetImages(slug: string, version: string) {
  const origin = getSiteOrigin();
  await Promise.allSettled(["historia", "publicacion"].map((format) =>
    fetch(`${origin}/api/og/mascota/${encodeURIComponent(slug)}?formato=${format}&v=${version}`, { cache: "no-store" }).then((response) => response.arrayBuffer())));
}
