"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { newPet, petLook } from "@/lib/pet";
import { BATCH_MAX, newActivationCode, newTagSlug } from "@/lib/pet-tags";
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

// Lo mismo para varias a la vez (el panel con varias elegidas), en un solo pedido: de a una, Next
// las manda en fila y con muchas tardaría.
export async function saveTagPrints(batchId: string, units: { id: string; print: TagPrint }[]): Promise<boolean> {
  if (!Array.isArray(units) || units.length > 500) return false;
  const results = await Promise.all(units.map((unit) => saveTagPrint(batchId, unit.id, unit.print)));
  return results.every(Boolean);
}

// "Completar hoja": agrega al lote las chapitas que faltan para llenar la última hoja. Son de stock
// (sin nombre), cada una con su código de activación, y siguen la numeración del lote (después de la
// última, aunque ya esté activada). Igual que al crear el lote: si falla el código, no queda nada a medias.
export async function addTagsToBatch(batchId: string, count: number, character = ""): Promise<{ ok: boolean; error?: string }> {
  if (!ID.test(batchId) || !Number.isInteger(count) || count < 1 || count > BATCH_MAX) return { ok: false, error: "Cantidad inválida." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) return { ok: false, error: "Se cerró la sesión. Volvé a entrar." };
  const { data: batch } = await supabase.from("tag_batches").select("id").eq("id", batchId).eq("owner_id", userId).maybeSingle();
  if (!batch) return { ok: false, error: "No encontré el lote." };
  const { data: last } = await supabase.from("landings").select("tag_number").eq("batch_id", batchId).order("tag_number", { ascending: false }).limit(1).maybeSingle();
  const start = (last?.tag_number || 0) + 1;
  const look = petLook(undefined);
  // El dibujo elegido para las nuevas (un genérico, por ejemplo); vacío = el automático del lote.
  const print = cleanTagPrint({ character });
  const rows = Array.from({ length: count }, (_, index) => ({
    owner_id: userId, client_id: null, business_type: "pet", template: "professional", plan: "lifetime", published: false,
    business_name: `Chapita ${start + index}`, slug: newTagSlug(), batch_id: batchId, tag_number: start + index,
    primary_color: look.accent, background_color: look.background, button_style: { pet: newPet(), ...(print.character ? { print } : {}) },
  }));
  const { data: tags, error } = await supabase.from("landings").insert(rows).select("id");
  if (error || !tags) return { ok: false, error: error?.message || "No se pudieron crear las chapitas." };
  const { error: codesError } = await supabase.from("tag_activations").insert(tags.map((tag) => ({ landing_id: tag.id, code: newActivationCode() })));
  if (codesError) {
    await supabase.from("landings").delete().in("id", tags.map((tag) => tag.id));
    return { ok: false, error: codesError.message };
  }
  revalidatePath(`/admin/chapitas/${batchId}`);
  revalidatePath(`/admin/chapitas/${batchId}/imprimir`);
  return { ok: true };
}
