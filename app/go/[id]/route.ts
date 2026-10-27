import { createClient } from "@/lib/supabase/server";
import { readWithLegacyFallback } from "@/lib/public-read-compat";
import { VERIFY_COOKIE, VERIFY_HOURS, VERIFY_LAST_COOKIE } from "@/lib/pet-tags";
import { cookies } from "next/headers";

// Link permanente que se graba en el chip NFC y en el QR. Lleva a la página publicada; si no hay
// ninguna, nunca a un error técnico:
//  · chapita de lote sin activar → a activarla (quien la escanea casi siempre es el que la compró);
//  · cualquier otra cosa sin publicar (activada sin datos, pausada) → a una página que explica.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const valid = /^[0-9a-f-]{36}$/i.test(id);
  const url = new URL(request.url);
  const source = url.searchParams.get("s");
  // Verificar armado: la pantalla de verificación controla que la chapita sea de quien escanea; si
  // no, vuelve acá con publico=1 y sigue como cualquier escaneo.
  const cookieStore = await cookies();
  if (valid && cookieStore.has(VERIFY_COOKIE) && !url.searchParams.has("publico")) {
    const via = source === "nfc" || source === "qr" ? source : "link";
    const previous = cookieStore.get(VERIFY_LAST_COOKIE)?.value;
    const query = new URLSearchParams({ via, ...(previous ? { antes: previous } : {}) });
    const response = redirectTo(`/admin/chapitas/verificar/${id}?${query}`);
    response.headers.append("Set-Cookie", `${VERIFY_LAST_COOKIE}=${id}.${via}; Path=/; Max-Age=${VERIFY_HOURS * 3600}; HttpOnly; SameSite=Lax${url.protocol === "https:" ? "; Secure" : ""}`);
    return response;
  }
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
  if (!slug) {
    const { data: pending } = valid ? await supabase.rpc("tag_pending", { p_landing: id }) : { data: false };
    return redirectTo(pending ? "/activar" : "/sin-datos");
  }

  // Solo las chapitas van a /mascota/…; landings y tarjetas siguen en su dirección de siempre.
  // Si la consulta falla, se va a la dirección directa, que abre cualquier página.
  const { data: info } = await supabase.rpc("public_landing", { p_slug: slug });
  const isPet = (info as { business_type?: string } | null)?.business_type === "pet";
  const destination = new URL(`${isPet ? "/mascota" : ""}/${encodeURIComponent(slug)}`, "http://x");
  if (source === "nfc" || source === "qr") destination.searchParams.set("s", source);
  // Temporal: una redirección permanente cacheada podría apuntar a un slug viejo.
  return redirectTo(destination.pathname + destination.search);
}

// Redirección relativa: el navegador sigue en la misma dirección por la que entró. Con una
// absoluta armada desde request.url, en desarrollo quedaba en "localhost" aunque se entrara
// por la IP de la red (otro celular o compu del WiFi) y ahí se cortaba.
function redirectTo(path: string) {
  return new Response(null, { status: 307, headers: { Location: path } });
}
