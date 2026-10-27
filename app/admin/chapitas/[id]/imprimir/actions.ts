"use server";

import { createClient } from "@/lib/supabase/server";
import { cleanTagPrint, type TagPrint } from "./tag-face";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Guarda lo elegido para imprimir una unidad (nombre, animal y color) en la chapita misma
// (button_style.print), así no se pierde al cambiar de compu ni lo pisa otra pestaña. Vacío lo borra.
export async function saveTagPrint(batchId: string, landingId: string, print: TagPrint): Promise<boolean> {
  if (!ID.test(batchId) || !ID.test(landingId)) return false;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) return false;
  const { data: landing } = await supabase.from("landings").select("button_style").eq("id", landingId).eq("batch_id", batchId).eq("owner_id", userId).maybeSingle();
  if (!landing) return false;
  const current = landing.button_style && typeof landing.button_style === "object" ? landing.button_style as Record<string, unknown> : {};
  const style = Object.fromEntries(Object.entries(current).filter(([key]) => key !== "print"));
  const clean = cleanTagPrint(print);
  const { error } = await supabase.from("landings").update({ button_style: Object.keys(clean).length ? { ...style, print: clean } : style }).eq("id", landingId).eq("owner_id", userId);
  return !error;
}
