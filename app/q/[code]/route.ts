import { createAdminClient } from "@/lib/supabase/admin";
import { shortTagRange } from "@/lib/pet-tags";

// Link corto del QR impreso en el dorso de la chapita (ver shortTagCode en lib/pet-tags.ts):
// busca la chapita de lote cuyo id empieza así y sigue por el link permanente /go/<id>, que
// decide a dónde ir. Si no hay una sola, nunca a un error técnico.
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const range = shortTagRange(code.toLowerCase());
  if (!range) return redirectTo("/sin-datos");
  // Con la clave secreta: una chapita sin activar no se puede leer en público.
  const { data, error } = await createAdminClient().from("landings").select("id").not("batch_id", "is", null).gte("id", range[0]).lte("id", range[1]).limit(2);
  if (error) console.error("No se pudo resolver /q", { code, message: error.message });
  if (data?.length !== 1) return redirectTo("/sin-datos");
  return redirectTo(`/go/${data[0].id}?s=qr`);
}

// Relativa, como en /go: el navegador sigue en la dirección por la que entró.
function redirectTo(path: string) {
  return new Response(null, { status: 307, headers: { Location: path } });
}
