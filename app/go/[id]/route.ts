import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("slug").eq("id", id).eq("published", true).maybeSingle();
  if (!landing) {
    // Una chapita de lote que todavía no se activó: quien la escanea (casi siempre el que la
    // acaba de comprar) va a activarla, en vez de ver un error.
    const { data: pending } = await supabase.rpc("tag_pending", { p_landing: id });
    if (pending) return Response.redirect(new URL("/activar", request.url), 307);
    return new Response("Landing no disponible", { status: 404 });
  }

  const source = new URL(request.url).searchParams.get("s");
  const destination = new URL(`/${encodeURIComponent(landing.slug)}`, request.url);
  if (source === "nfc" || source === "qr") destination.searchParams.set("s", source);
  // Temporal: una redirección permanente cacheada podría apuntar a un slug viejo.
  return Response.redirect(destination, 307);
}
