"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllActions } from "@/lib/landing-catalog";

const validTypes = ["whatsapp", "instagram", "tiktok", "facebook", "website", "email", "phone", "maps", "youtube", "spotify", "mercadopago", "calendar", "telegram", "url"];
const hexColor = /^#[0-9a-f]{6}$/i;
const fail = (id: string, message: string): never => redirect(`/admin/landings/${id}?error=${encodeURIComponent(message)}`);

async function auth() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/admin/login");
  return { supabase, user: data.user };
}

async function ownedLanding(id: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("landings").select("id").eq("id", id).eq("owner_id", userId).maybeSingle();
  return { supabase, data, error };
}

function color(value: FormDataEntryValue | null, fallback: string) {
  const candidate = String(value || "");
  return hexColor.test(candidate) ? candidate : fallback;
}

export async function save(fd: FormData) {
  const { supabase, user } = await auth();
  const id = String(fd.get("id") || "");
  const { data: landing, error: lookupError } = await supabase.from("landings").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (lookupError) fail(id, lookupError.message);
  if (!landing) fail(id, "Landing inexistente o sin permisos.");
  const businessName = String(fd.get("business_name") || "").trim();
  if (!businessName) fail(id, "El nombre de la landing es obligatorio.");
  const redirectUrl = String(fd.get("redirect_url") || "").trim();
  if (redirectUrl && !/^https?:\/\//i.test(redirectUrl)) fail(id, "El link externo debe empezar con http:// o https://.");
  const backgroundType = ["color", "gradient", "image"].includes(String(fd.get("background_type"))) ? String(fd.get("background_type")) : "color";
  const customTextColor = fd.get("custom_text_color") === "on" ? color(fd.get("text_color"), "#161b18") : null;
  const validFonts = ["modern", "classic", "friendly", "minimal"];
  const fontPair = validFonts.includes(String(fd.get("font_pair"))) ? String(fd.get("font_pair")) : "modern";
  const customPanelColor = fd.get("custom_panel_color") === "on" ? color(fd.get("text_panel_color"), "#000000") : null;
  const { error } = await supabase.from("landings").update({ business_name: businessName, description: String(fd.get("description") || "").trim(), logo_url: String(fd.get("logo_url") || "").trim(), whatsapp: String(fd.get("whatsapp") || "").trim(), primary_color: color(fd.get("primary_color"), "#1f2937"), background_color: color(fd.get("background_color"), "#f7f5f0"), background_type: backgroundType, background_gradient_to: color(fd.get("background_gradient_to"), "#a6c1ee"), text_color: customTextColor, text_panel: fd.get("text_panel") === "on", text_panel_color: customPanelColor, font_pair: fontPair, redirect_url: redirectUrl }).eq("id", id).eq("owner_id", user.id);
  if (error) fail(id, error.message);
  redirect(`/admin/landings/${id}?saved=Identidad actualizada`);
}

export async function addAction(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const title = String(fd.get("title") || "").trim();
  const type = String(fd.get("type") || "whatsapp");
  if (!landingId || !title || !validTypes.includes(type)) fail(landingId, "Datos de acción inválidos.");
  const { data: landing, error: landingError } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", user.id).maybeSingle();
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { data: last, error: positionError } = await supabase.from("actions").select("position").eq("landing_id", landingId).order("position", { ascending: false }).limit(1).maybeSingle();
  if (positionError) fail(landingId, positionError.message);
  const value = String(fd.get("url") || fd.get("value") || fd.get("existing_url") || "").trim();
  if (["email"].includes(type) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(landingId, "El email de la acción no es válido.");
  if (!["whatsapp", "email", "phone"].includes(type) && !/^https?:\/\//i.test(value)) fail(landingId, "La URL debe comenzar con http:// o https://.");
  const { error } = await supabase.from("actions").insert({ landing_id: landingId, title, type, message: String(fd.get("message") || "").trim(), url: value, icon: String(fd.get("icon") || "→").trim(), background_color: color(fd.get("background_color"), "#1f2937"), text_color: color(fd.get("text_color"), "#ffffff"), icon_color: color(fd.get("icon_color"), "#ffffff"), use_auto_color: fd.get("use_auto_color") === "on", position: (last?.position ?? -1) + 1 });
  if (error) fail(landingId, error.message);
  redirect(`/admin/landings/${landingId}?saved=Acción agregada`);
}

export async function updateAction(fd: FormData) {
  const { supabase, user } = await auth();
  const id = String(fd.get("id") || "");
  const landingId = String(fd.get("landing_id") || "");
  const type = String(fd.get("type") || "url");
  const { data: landing, error: landingError } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", user.id).maybeSingle();
  if (landingError) fail(landingId, landingError.message);
  if (!landing || !validTypes.includes(type)) fail(landingId, "Acción inválida o sin permisos.");
  const title = String(fd.get("title") || "").trim();
  if (!title) fail(landingId, "El título de la acción es obligatorio.");
  const value = String(fd.get("value") || fd.get("url") || fd.get("existing_url") || "").trim();
  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(landingId, "El email de la acción no es válido.");
  if (!["whatsapp", "email", "phone"].includes(type) && value && !/^https?:\/\//i.test(value)) fail(landingId, "La URL debe comenzar con http:// o https://.");
  const { data: action, error: actionError } = await supabase.from("actions").select("id").eq("id", id).eq("landing_id", landingId).maybeSingle();
  if (actionError) fail(landingId, actionError.message);
  if (!action) fail(landingId, "Acción inexistente o sin permisos.");
  const position = Number(fd.get("position"));
  const message = String(fd.get("message") ?? fd.get("existing_message") ?? "").trim();
  const { error } = await supabase.from("actions").update({ title, type, message, url: value, icon: String(fd.get("icon") || "→").trim(), background_color: color(fd.get("background_color"), "#1f2937"), text_color: color(fd.get("text_color"), "#ffffff"), icon_color: color(fd.get("icon_color"), "#ffffff"), use_auto_color: fd.get("use_auto_color") === "on", enabled: fd.get("enabled") === "on", position: Number.isInteger(position) && position >= 0 ? position : 0 }).eq("id", id).eq("landing_id", landingId);
  if (error) fail(landingId, error.message);
  redirect(`/admin/landings/${landingId}`);
}

export async function removeAction(fd: FormData) {
  const { supabase, user } = await auth(); const id = String(fd.get("id") || ""); const landingId = String(fd.get("landing_id") || "");
  const { data: landing, error: landingError } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", user.id).maybeSingle(); if (landingError) fail(landingId, landingError.message); if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { error } = await supabase.from("actions").delete().eq("id", id).eq("landing_id", landingId); if (error) fail(landingId, error.message); redirect(`/admin/landings/${landingId}`);
}

export async function moveAction(fd: FormData) {
  const { supabase, user } = await auth(); const id = String(fd.get("id") || ""); const landingId = String(fd.get("landing_id") || ""); const direction = String(fd.get("direction") || "");
  const { data: landing, error: landingError } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", user.id).maybeSingle(); if (landingError) fail(landingId, landingError.message); if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { data, error } = await supabase.from("actions").select("id,position").eq("landing_id", landingId).order("position"); if (error) fail(landingId, error.message); const actions = data ?? []; const index = actions.findIndex((item) => item.id === id); const otherIndex = direction === "up" ? index - 1 : index + 1; if (index < 0 || otherIndex < 0 || otherIndex >= actions.length) redirect(`/admin/landings/${landingId}`);
  const current = actions[index]; const other = actions[otherIndex]; const firstUpdate = await supabase.from("actions").update({ position: other.position }).eq("id", current.id).eq("landing_id", landingId); if (firstUpdate.error) fail(landingId, firstUpdate.error.message); const secondUpdate = await supabase.from("actions").update({ position: current.position }).eq("id", other.id).eq("landing_id", landingId); if (secondUpdate.error) fail(landingId, secondUpdate.error.message); redirect(`/admin/landings/${landingId}`);
}

export async function uploadLogo(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const file = fd.get("file");
  const { data: landing, error: landingError } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", user.id).maybeSingle();
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  if (!(file instanceof File) || file.size === 0) fail(landingId, "Seleccioná una imagen.");
  const imageFile = file as File;
  if (imageFile.size > 5 * 1024 * 1024) fail(landingId, "La imagen no puede superar 5 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) fail(landingId, "La imagen debe ser JPG, PNG o WEBP.");
  const extension = imageFile.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${user.id}/${landingId}/logo-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, imageFile, { contentType: imageFile.type, upsert: false });
  if (uploadError) fail(landingId, uploadError.message);
  const { data: publicUrl } = supabase.storage.from("landing-assets").getPublicUrl(path);
  const { error } = await supabase.from("landings").update({ logo_url: publicUrl.publicUrl }).eq("id", landingId).eq("owner_id", user.id);
  if (error) fail(landingId, error.message);
  redirect(`/admin/landings/${landingId}?saved=Logo actualizado`);
}

export async function uploadBackgroundImage(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const file = fd.get("file");
  const { data: landing, error: landingError } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", user.id).maybeSingle();
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  if (!(file instanceof File) || file.size === 0) fail(landingId, "Seleccioná una imagen.");
  const imageFile = file as File;
  if (imageFile.size > 5 * 1024 * 1024) fail(landingId, "La imagen no puede superar 5 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) fail(landingId, "La imagen debe ser JPG, PNG o WEBP.");
  const extension = imageFile.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${user.id}/${landingId}/bg-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, imageFile, { contentType: imageFile.type, upsert: false });
  if (uploadError) fail(landingId, uploadError.message);
  const { data: publicUrl } = supabase.storage.from("landing-assets").getPublicUrl(path);
  const { error } = await supabase.from("landings").update({ background_image_url: publicUrl.publicUrl, background_type: "image" }).eq("id", landingId).eq("owner_id", user.id);
  if (error) fail(landingId, error.message);
  redirect(`/admin/landings/${landingId}?saved=Fondo actualizado`);
}

export async function removeLogo(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const { error } = await supabase.from("landings").update({ logo_url: "" }).eq("id", landingId).eq("owner_id", user.id);
  if (error) fail(landingId, error.message);
  redirect(`/admin/landings/${landingId}?saved=Logo eliminado`);
}

export async function removeBackgroundImage(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const { error } = await supabase.from("landings").update({ background_image_url: "", background_type: "color" }).eq("id", landingId).eq("owner_id", user.id);
  if (error) fail(landingId, error.message);
  redirect(`/admin/landings/${landingId}?saved=Imagen de fondo eliminada`);
}

export async function saveProfileActions(fd: FormData) {
  const { supabase, user } = await auth(); const landingId = String(fd.get("landing_id") || "");
  const { data: landing, error: landingError } = await supabase.from("landings").select("id").eq("id", landingId).eq("owner_id", user.id).maybeSingle(); if (landingError) fail(landingId, landingError.message); if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const buttonFont = ["modern", "classic", "friendly", "minimal"].includes(String(fd.get("button_font"))) ? String(fd.get("button_font")) : "modern";
  const { error: fontError } = await supabase.from("landings").update({ button_font: buttonFont }).eq("id", landingId).eq("owner_id", user.id); if (fontError) fail(landingId, fontError.message);
  const { data: allActions, error: existingError } = await supabase.from("actions").select("*").eq("landing_id", landingId); if (existingError) fail(landingId, existingError.message); const existing = allActions?.filter((action) => action.is_generated) || []; let nextPosition = Math.max(-1, ...(allActions || []).map((action) => action.position ?? -1)) + 1;
  for (const item of getAllActions()) {
    const source = item.sourceField; const isEnabled = fd.get(`enabled_${source}`) === "on"; const found = existing?.find((action) => action.source_field === source);
    const value = item.noValue ? "ok" : String(fd.get(`value_${source}`) || "").trim();
    const customColorOn = fd.get(`custom_color_${source}`) === "on"; const customColor = color(fd.get(`color_${source}`), "#1f2937"); const customTextColor = color(fd.get(`text_${source}`), "#ffffff");
    const payload = { title: item.label, type: item.type, url: item.noValue ? "" : value, message: item.type === "whatsapp" ? String(fd.get(`message_${source}`) || "Hola, quiero hacer una consulta.") : "", icon: item.icon, use_auto_color: !customColorOn, background_color: customColor, text_color: customTextColor, enabled: Boolean(value && isEnabled), source_field: source, is_generated: true, position: found?.position ?? nextPosition++ };
    if (!value || !isEnabled) { if (found) { const { error } = await supabase.from("actions").update(payload).eq("id", found.id).eq("landing_id", landingId).eq("is_generated", true); if (error) fail(landingId, error.message); } continue; }
    const result = found ? await supabase.from("actions").update(payload).eq("id", found.id).eq("landing_id", landingId) : await supabase.from("actions").insert({ landing_id: landingId, ...payload }); if (result.error) fail(landingId, result.error.message);
  }
  redirect(`/admin/landings/${landingId}?saved=Acciones del perfil actualizadas`);
}
