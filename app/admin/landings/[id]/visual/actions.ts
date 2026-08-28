"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAllActions, normalizeUrl, isPlausiblePhone, AUTO_COLORS } from "@/lib/landing-catalog";

const fail = (landingId: string, message: string): never => redirect(`/admin/landings/${landingId}/visual?error=${encodeURIComponent(message)}`);
const hexColor = /^#[0-9a-f]{6}$/i;
function color(value: FormDataEntryValue | null, fallback: string) {
  const candidate = String(value || "");
  return hexColor.test(candidate) ? candidate : fallback;
}

async function auth() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/admin/login");
  return { supabase, user: data.user };
}

async function ownedLanding(landingId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", userId).maybeSingle();
  return { supabase, data, error };
}

// Saves (or creates) exactly one catalog button (WhatsApp, Instagram, etc.) — independent
// from every other button, so editing one can never affect another.
export async function saveTemplateAction(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const source = String(fd.get("source_field") || "");
  const { supabase, data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const item = getAllActions().find((entry) => entry.sourceField === source);
  if (!item) return fail(landingId, "Tipo de botón inválido.");

  let value = String(fd.get("value") || "").trim();
  if (item.input === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(landingId, "El email no parece válido. Revisalo y probá de nuevo.");
  if (item.input === "phone" && !isPlausiblePhone(value)) fail(landingId, "El número parece incompleto. Escribilo con código de país, ej: 5493511234567.");
  if (item.input === "url") value = normalizeUrl(value);
  const message = item.message ? String(fd.get("message") || "Hola, quiero hacer una consulta.").trim() : "";
  const customColorOn = fd.get("custom_color") === "on";
  const backgroundColor = customColorOn ? color(fd.get("color"), AUTO_COLORS[item.type] || "#1f2937") : AUTO_COLORS[item.type] || "#1f2937";
  const textColor = customColorOn ? color(fd.get("text_color"), "#ffffff") : "#ffffff";

  const { data: existing, error: existingError } = await supabase.from("actions").select("id").eq("landing_id", landingId).eq("source_field", source).eq("is_generated", true).maybeSingle();
  if (existingError) fail(landingId, existingError.message);

  if (existing) {
    const { error } = await supabase.from("actions").update({ title: item.label, type: item.type, icon: item.icon, url: value, message, enabled: true, use_auto_color: !customColorOn, background_color: backgroundColor, text_color: textColor }).eq("id", existing.id);
    if (error) fail(landingId, error.message);
  } else {
    const { data: last, error: positionError } = await supabase.from("actions").select("position").eq("landing_id", landingId).order("position", { ascending: false }).limit(1).maybeSingle();
    if (positionError) fail(landingId, positionError.message);
    const { error } = await supabase.from("actions").insert({ landing_id: landingId, title: item.label, type: item.type, url: value, message, icon: item.icon, use_auto_color: !customColorOn, background_color: backgroundColor, text_color: textColor, enabled: true, source_field: source, is_generated: true, position: (last?.position ?? -1) + 1 });
    if (error) fail(landingId, error.message);
  }
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Boton actualizado`);
}

// Turns off exactly one catalog button. Never touches any other button's row.
export async function removeTemplateAction(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const source = String(fd.get("source_field") || "");
  const { supabase, data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { error } = await supabase.from("actions").update({ enabled: false }).eq("landing_id", landingId).eq("source_field", source).eq("is_generated", true);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Boton quitado`);
}

// Same up/down reorder as the classic editor's moveAction, but redirects back to /visual
// instead of the classic route — reusing the shared one would silently bounce the user away.
export async function moveVisualAction(fd: FormData) {
  const { supabase, user } = await auth();
  const id = String(fd.get("id") || "");
  const landingId = String(fd.get("landing_id") || "");
  const direction = String(fd.get("direction") || "");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { data, error } = await supabase.from("actions").select("id,position").eq("landing_id", landingId).order("position");
  if (error) fail(landingId, error.message);
  const actions = data ?? [];
  const index = actions.findIndex((item) => item.id === id);
  const otherIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || otherIndex < 0 || otherIndex >= actions.length) {
    revalidatePath(`/admin/landings/${landingId}/visual`);
    redirect(`/admin/landings/${landingId}/visual`);
  }
  const current = actions[index];
  const other = actions[otherIndex];
  const firstUpdate = await supabase.from("actions").update({ position: other.position }).eq("id", current.id).eq("landing_id", landingId);
  if (firstUpdate.error) fail(landingId, firstUpdate.error.message);
  const secondUpdate = await supabase.from("actions").update({ position: current.position }).eq("id", other.id).eq("landing_id", landingId);
  if (secondUpdate.error) fail(landingId, secondUpdate.error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Orden actualizado`);
}

const validFonts = ["modern", "classic", "friendly", "minimal"];

// Saves just the button font — separate from every per-button save so it can never touch button data.
export async function saveButtonFont(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const { supabase, data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const buttonFont = validFonts.includes(String(fd.get("button_font"))) ? String(fd.get("button_font")) : "modern";
  const { error } = await supabase.from("landings").update({ button_font: buttonFont }).eq("id", landingId);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Fuente de botones actualizada`);
}
