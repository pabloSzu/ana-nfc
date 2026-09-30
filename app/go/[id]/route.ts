import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("slug").eq("id", id).eq("published", true).maybeSingle();
  if (!landing) return new Response("Landing no disponible", { status: 404 });

  const source = new URL(request.url).searchParams.get("s");
  const destination = new URL(`/${encodeURIComponent(landing.slug)}`, request.url);
  if (source === "nfc" || source === "qr") destination.searchParams.set("s", source);
  // Temporal: una redirección permanente cacheada podría apuntar a un slug viejo.
  return Response.redirect(destination, 307);
}
