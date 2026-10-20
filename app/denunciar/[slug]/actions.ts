"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { allow, clientIp } from "@/lib/supabase/admin";

// Cualquiera puede denunciar una página publicada (la base lo permite solo para publicadas). Las
// denuncias aparecen en el Resumen del Admin. Con límite por IP y un campo trampa para bots.
export async function sendReport(fd: FormData) {
  const slug = String(fd.get("slug") || "");
  const back = `/denunciar/${encodeURIComponent(slug)}`;
  // Campo invisible: una persona no lo completa; un bot que llena todo, sí.
  if (String(fd.get("website") || "")) redirect(`${back}?enviada=1`);
  const reason = String(fd.get("reason") || "").trim().slice(0, 1000);
  const contact = String(fd.get("contact") || "").trim().slice(0, 200);
  if (!reason) redirect(`${back}?error=${encodeURIComponent("Contanos qué pasa con la página.")}`);
  if (!(await allow(`report:${await clientIp()}`, 5, 60 * 60))) redirect(`${back}?error=${encodeURIComponent("Mandaste varias denuncias seguidas. Probá de nuevo en un rato.")}`);
  const supabase = await createClient();
  const { data: page } = await supabase.rpc("public_landing", { p_slug: slug });
  const landingId = (page as { id?: string } | null)?.id;
  if (!landingId) redirect(`${back}?error=${encodeURIComponent("Esa página ya no está publicada.")}`);
  const { error } = await supabase.from("reports").insert({ landing_id: landingId, reason, contact });
  if (error) redirect(`${back}?error=${encodeURIComponent("No se pudo enviar. Probá de nuevo.")}`);
  redirect(`${back}?enviada=1`);
}
