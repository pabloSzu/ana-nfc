import "server-only";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createHmac } from "node:crypto";

// Cliente con la clave secreta (SUPABASE_SECRET_KEY): solo en el servidor, nunca en el navegador.
// Se salta la RLS, así que se usa únicamente para lo que el público no puede hacer solo: validar
// códigos de activación, crear la cuenta de quien activa y contar intentos (límites por IP).
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY (ver docs/CHAPITAS.md, Configuración).");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// La IP de quien hace el pedido. En Vercel, x-forwarded-for la pone Vercel y no se puede falsear.
export async function clientIp(): Promise<string> {
  const list = await headers();
  return (list.get("x-forwarded-for") || "").split(",")[0].trim() || list.get("x-real-ip") || "sin-ip";
}

// true si se permite. Si la base falla, deja pasar: un límite roto no puede frenar una venta.
export async function allow(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    // La tabla de límites no necesita guardar IPs ni emails legibles. La clave secreta funciona
    // como pepper; si rota, solo se reinician los contadores vigentes.
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!secret) throw new Error("Falta SUPABASE_SECRET_KEY");
    const privateKey = createHmac("sha256", secret).update(key).digest("hex");
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", { p_key: privateKey, p_max: max, p_window_seconds: windowSeconds });
    if (error) { console.error("rate_limit_hit falló", { key, message: error.message }); return true; }
    return data !== false;
  } catch (error) {
    console.error("rate_limit_hit falló", { key, error });
    return true;
  }
}
