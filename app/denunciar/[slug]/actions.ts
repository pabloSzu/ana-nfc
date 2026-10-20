"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Cualquiera puede denunciar una página publicada (la base lo permite solo para publicadas). Las
// denuncias aparecen en el Resumen del Admin.
export async function sendReport(fd: FormData) {
  const slug = String(fd.get("slug") || "");
  const back = `/denunciar/${encodeURIComponent(slug)}`;
  const reason = String(fd.get("reason") || "").trim().slice(0, 1000);
  const contact = String(fd.get("contact") || "").trim().slice(0, 200);
  if (!reason) redirect(`${back}?error=${encodeURIComponent("Contanos qué pasa con la página.")}`);
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("id").eq("slug", slug).eq("published", true).maybeSingle();
  if (!landing) redirect(`${back}?error=${encodeURIComponent("Esa página ya no está publicada.")}`);
  const { error } = await supabase.from("reports").insert({ landing_id: landing!.id, reason, contact });
  if (error) redirect(`${back}?error=${encodeURIComponent("No se pudo enviar. Probá de nuevo.")}`);
  redirect(`${back}?enviada=1`);
}
