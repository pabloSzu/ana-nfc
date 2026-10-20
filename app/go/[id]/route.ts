import { createClient } from "@/lib/supabase/server";

// Link permanente que se graba en el chip NFC y en el QR. Lleva a la página publicada; si no hay
// ninguna, nunca a un error técnico:
//  · chapita de lote sin activar → a activarla (quien la escanea casi siempre es el que la compró);
//  · cualquier otra cosa sin publicar (activada sin datos, pausada) → a una página que explica.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valid = /^[0-9a-f-]{36}$/i.test(id);
  const supabase = await createClient();
  const { data: slug } = valid ? await supabase.rpc("public_landing_slug", { p_landing: id }) : { data: null };
  if (!slug) {
    const { data: pending } = valid ? await supabase.rpc("tag_pending", { p_landing: id }) : { data: false };
    return Response.redirect(new URL(pending ? "/activar" : "/sin-datos", request.url), 307);
  }

  const source = new URL(request.url).searchParams.get("s");
  const destination = new URL(`/${encodeURIComponent(String(slug))}`, request.url);
  if (source === "nfc" || source === "qr") destination.searchParams.set("s", source);
  // Temporal: una redirección permanente cacheada podría apuntar a un slug viejo.
  return Response.redirect(destination, 307);
}
