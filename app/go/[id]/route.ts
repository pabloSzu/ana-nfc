import { createClient } from "@/lib/supabase/server";
import { readWithLegacyFallback } from "@/lib/public-read-compat";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  // Puente de despliegue: el RPC existe después de las migraciones. Antes de aplicarlas,
  // conservamos la consulta que usa hoy producción. Tras el lockdown el RPC será el camino
  // exitoso y la lectura directa ya no será necesaria.
  const { data: slug, rpcError, legacyError } = await readWithLegacyFallback(
    async () => {
      const result = await supabase.rpc("public_landing_slug", { p_landing: id });
      return { data: result.data ? String(result.data) : null, error: result.error };
    },
    async () => {
      const result = await supabase.from("landings").select("slug").eq("id", id).eq("published", true).maybeSingle();
      return { data: result.data?.slug || null, error: result.error };
    },
  );
  if (legacyError) {
    console.error("No se pudo resolver /go por RPC ni por el esquema anterior", {
      id,
      rpc: rpcError?.message,
      legacy: legacyError.message,
    });
  }
  if (!slug) return new Response("Landing no disponible", { status: 404 });

  const source = new URL(request.url).searchParams.get("s");
  const destination = new URL(`/${encodeURIComponent(slug)}`, request.url);
  if (source === "nfc" || source === "qr") destination.searchParams.set("s", source);
  // Temporal: una redirección permanente cacheada podría apuntar a un slug viejo.
  return Response.redirect(destination, 307);
}
