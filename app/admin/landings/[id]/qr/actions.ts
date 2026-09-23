"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseQrStyle } from "@/lib/qr";

export async function saveQrStyle(formData: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = (claims?.claims as { sub?: string } | undefined)?.sub;
  if (!userId) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const fail = (message: string): never => redirect(`/admin/landings/${id}/qr?error=${encodeURIComponent(message)}`);

  const { data: landing, error: lookupError } = await supabase
    .from("landings").select("id,primary_color").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (lookupError) fail(lookupError.message);
  if (!landing) fail("Landing inexistente o sin permisos");

  let raw: unknown = {};
  try { raw = JSON.parse(String(formData.get("qr_style") || "{}")); } catch { fail("No se pudo leer el estilo del QR."); }
  // Se normaliza acá y no se guarda lo que mandó el navegador: parseQrStyle recorta colores,
  // estilos y tamaño de logo a valores válidos, así que la base nunca recibe algo que después
  // rompa el render.
  const style = parseQrStyle(raw, { foreground: landing!.primary_color });

  const { error } = await supabase.from("landings").update({ qr_style: style }).eq("id", id).eq("owner_id", userId);
  if (error) fail(error.message);

  revalidatePath(`/admin/landings/${id}/qr`);
  redirect(`/admin/landings/${id}/qr?saved=${encodeURIComponent("Diseño del QR guardado")}`);
}
