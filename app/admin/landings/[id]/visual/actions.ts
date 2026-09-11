"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl, isPlausiblePhone, getAllActions, AUTO_COLORS } from "@/lib/landing-catalog";

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

const validTypes = ["whatsapp", "instagram", "tiktok", "facebook", "website", "email", "phone", "maps", "youtube", "spotify", "mercadopago", "calendar", "telegram", "url"];

const validFontsIdentity = ["modern", "classic", "friendly", "minimal"];

// Visual-editor-scoped copy of the classic identity save — same fields, but redirects
// back to /visual instead of the classic route (classic `save` bounced users out).
export async function saveIdentity(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("id") || "");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const businessName = String(fd.get("business_name") || "").trim();
  if (!businessName) fail(landingId, "El nombre de la landing es obligatorio.");
  const redirectUrl = normalizeUrl(String(fd.get("redirect_url") || ""));
  const backgroundType = ["color", "gradient", "image"].includes(String(fd.get("background_type"))) ? String(fd.get("background_type")) : "color";
  const customTextColor = fd.get("custom_text_color") === "on" ? color(fd.get("text_color"), "#161b18") : null;
  const fontPair = validFontsIdentity.includes(String(fd.get("font_pair"))) ? String(fd.get("font_pair")) : "modern";
  const customPanelColor = fd.get("custom_panel_color") === "on" ? color(fd.get("text_panel_color"), "#000000") : null;
  const { error } = await supabase.from("landings").update({
    business_name: businessName, description: String(fd.get("description") || "").trim(), logo_url: String(fd.get("logo_url") || "").trim(),
    primary_color: color(fd.get("primary_color"), "#1f2937"), background_color: color(fd.get("background_color"), "#f7f5f0"),
    background_type: backgroundType, background_gradient_to: color(fd.get("background_gradient_to"), "#a6c1ee"),
    text_color: customTextColor, text_panel: fd.get("text_panel") === "on", text_panel_color: customPanelColor,
    font_pair: fontPair, redirect_url: redirectUrl,
  }).eq("id", landingId).eq("owner_id", user.id);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  revalidatePath("/admin");
  redirect(`/admin/landings/${landingId}/visual?saved=Identidad actualizada`);
}

export async function uploadLogoVisual(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const file = fd.get("file");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
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
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Logo actualizado&open=logo`);
}

export async function uploadBackgroundImageVisual(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const file = fd.get("file");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
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
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Fondo actualizado&open=background`);
}

export async function removeLogoVisual(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const { supabase, data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { error } = await supabase.from("landings").update({ logo_url: "" }).eq("id", landingId).eq("owner_id", user.id);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Logo eliminado&open=logo`);
}

export async function removeBackgroundImageVisual(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const { supabase, data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { error } = await supabase.from("landings").update({ background_image_url: "", background_type: "color" }).eq("id", landingId).eq("owner_id", user.id);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Imagen de fondo eliminada&open=background`);
}

// One button model, no "one per type" cap — you can add WhatsApp as many times as you
// want. Every button (old catalog rows included) is edited/moved/removed the same way.
export async function addButton(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const title = String(fd.get("title") || "").trim();
  const type = String(fd.get("type") || "url");
  if (!landingId || !title || !validTypes.includes(type)) fail(landingId, "Datos de botón inválidos.");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { data: last, error: positionError } = await supabase.from("actions").select("position").eq("landing_id", landingId).order("position", { ascending: false }).limit(1).maybeSingle();
  if (positionError) fail(landingId, positionError.message);
  let value = String(fd.get("url") || fd.get("value") || "").trim();
  if (type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(landingId, "El email no parece válido. Revisalo y probá de nuevo.");
  if (["whatsapp", "phone"].includes(type) && value && !isPlausiblePhone(value)) fail(landingId, "El número parece incompleto. Escribilo con código de país, ej: 5493511234567.");
  if (!["whatsapp", "email", "phone"].includes(type) && value && !value.startsWith("http")) value = normalizeUrl(value);
  const { error } = await supabase.from("actions").insert({
    landing_id: landingId, title, subtitle: String(fd.get("subtitle") || "").trim(), type,
    message: String(fd.get("message") || "").trim(), url: value, icon: String(fd.get("icon") || "").trim(),
    background_color: color(fd.get("background_color"), "#1f2937"), text_color: color(fd.get("text_color"), "#ffffff"),
    use_auto_color: fd.get("use_auto_color") === "on", enabled: true, position: (last?.position ?? -1) + 1,
  });
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Boton agregado`);
}

// Tapping a preset icon (or "Crear personalizado") creates the button right away with
// blank/default fields, then the page auto-opens its edit popover — same "tap it into
// existence, then fill it in" flow as the reference, instead of a form-first add screen.
export async function quickAddButton(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const type = String(fd.get("type") || "url");
  if (!landingId || !validTypes.includes(type)) fail(landingId, "Tipo de botón inválido.");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { data: last, error: positionError } = await supabase.from("actions").select("position").eq("landing_id", landingId).order("position", { ascending: false }).limit(1).maybeSingle();
  if (positionError) fail(landingId, positionError.message);
  const item = getAllActions().find((entry) => entry.type === type);
  const { data: inserted, error } = await supabase.from("actions").insert({
    landing_id: landingId, title: item?.label || "Nuevo botón", subtitle: "", type, message: "", url: "",
    icon: "", background_color: AUTO_COLORS[type] || "#1f2937", text_color: "#ffffff", use_auto_color: true,
    enabled: true, position: (last?.position ?? -1) + 1,
  }).select("id").single();
  if (error || !inserted) return fail(landingId, error?.message || "No se pudo crear el botón.");
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Boton agregado&opened=${inserted.id}`);
}

export async function updateButton(fd: FormData) {
  const { supabase, user } = await auth();
  const id = String(fd.get("id") || "");
  const landingId = String(fd.get("landing_id") || "");
  const type = String(fd.get("type") || "url");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing || !validTypes.includes(type)) fail(landingId, "Botón inválido o sin permisos.");
  const title = String(fd.get("title") || "").trim();
  if (!title) fail(landingId, "El nombre del botón es obligatorio.");
  let value = String(fd.get("url") || fd.get("value") || "").trim();
  if (type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail(landingId, "El email no parece válido. Revisalo y probá de nuevo.");
  if (["whatsapp", "phone"].includes(type) && value && !isPlausiblePhone(value)) fail(landingId, "El número parece incompleto. Escribilo con código de país, ej: 5493511234567.");
  if (!["whatsapp", "email", "phone"].includes(type) && value && !value.startsWith("http")) value = normalizeUrl(value);
  const { data: action, error: actionError } = await supabase.from("actions").select("id,position").eq("id", id).eq("landing_id", landingId).maybeSingle();
  if (actionError) fail(landingId, actionError.message);
  if (!action) fail(landingId, "Botón inexistente o sin permisos.");
  const { error } = await supabase.from("actions").update({
    title, subtitle: String(fd.get("subtitle") || "").trim(), type, message: String(fd.get("message") || "").trim(), url: value,
    icon: String(fd.get("icon") || "").trim(), background_color: color(fd.get("background_color"), "#1f2937"),
    text_color: color(fd.get("text_color"), "#ffffff"), use_auto_color: fd.get("use_auto_color") === "on", enabled: true,
  }).eq("id", id).eq("landing_id", landingId);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Boton actualizado`);
}

export async function removeButton(fd: FormData) {
  const { supabase, user } = await auth();
  const id = String(fd.get("id") || "");
  const landingId = String(fd.get("landing_id") || "");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { error } = await supabase.from("actions").delete().eq("id", id).eq("landing_id", landingId);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Boton eliminado`);
}

export async function duplicateButton(fd: FormData) {
  const { supabase, user } = await auth();
  const id = String(fd.get("id") || "");
  const landingId = String(fd.get("landing_id") || "");
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const { data: original, error: originalError } = await supabase.from("actions").select("*").eq("id", id).eq("landing_id", landingId).maybeSingle();
  if (originalError) fail(landingId, originalError.message);
  if (!original) fail(landingId, "Botón inexistente o sin permisos.");
  const { data: last, error: positionError } = await supabase.from("actions").select("position").eq("landing_id", landingId).order("position", { ascending: false }).limit(1).maybeSingle();
  if (positionError) fail(landingId, positionError.message);
  const { id: _oldId, position: _oldPosition, source_field: _sourceField, is_generated: _isGenerated, ...rest } = original;
  const { error } = await supabase.from("actions").insert({ ...rest, title: `${original.title} copia`, landing_id: landingId, position: (last?.position ?? -1) + 1, is_generated: false, source_field: null });
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Boton duplicado`);
}

// Up/down reorder, redirects back to /visual instead of the classic editor route.
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

export async function reorderButtons(fd: FormData) {
  const { supabase, user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const order = String(fd.get("order") || "").split(",").filter(Boolean);
  const { data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  for (let i = 0; i < order.length; i++) {
    const { error } = await supabase.from("actions").update({ position: i }).eq("id", order[i]).eq("landing_id", landingId);
    if (error) fail(landingId, error.message);
  }
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Orden actualizado`);
}

const validFonts = ["modern", "classic", "friendly", "minimal"];

// Saves the whole button-zone look (gap/height/radius/width/shadow/finish/color mode/
// sizes) as one JSON blob, plus the button font — one style for every button at once.
export async function saveButtonZoneStyle(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const { supabase, data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) fail(landingId, landingError.message);
  if (!landing) fail(landingId, "Landing inexistente o sin permisos.");
  const buttonFont = validFonts.includes(String(fd.get("button_font"))) ? String(fd.get("button_font")) : "modern";
  const styleRaw = String(fd.get("button_style") || "{}");
  let buttonStyle: Record<string, unknown> = {};
  try { buttonStyle = JSON.parse(styleRaw); } catch { buttonStyle = {}; }
  const { error } = await supabase.from("landings").update({ button_font: buttonFont, button_style: buttonStyle }).eq("id", landingId);
  if (error) fail(landingId, error.message);
  revalidatePath(`/admin/landings/${landingId}/visual`);
  redirect(`/admin/landings/${landingId}/visual?saved=Estilo de botones actualizado`);
}

function parseJson(raw: FormDataEntryValue | null): Record<string, unknown> {
  try { return JSON.parse(String(raw || "{}")); } catch { return {}; }
}

// The visual editor works as a local draft. This is its single persistence point:
// identity, visual styles, button-zone settings and the complete ordered button list
// are saved together only when the user presses the main "Guardar cambios" button.
export async function saveDesignStyle(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const requestedReturnTo = String(fd.get("return_to") || "");
  const returnTo = requestedReturnTo === "/admin" || requestedReturnTo.startsWith(`/admin/landings/${landingId}/`)
    ? requestedReturnTo
    : `/admin/landings/${landingId}/visual`;
  const saveFail = (message: string): never => redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
  const { supabase, data: landing, error: landingError } = await ownedLanding(landingId, user.id);
  if (landingError) saveFail(landingError.message);
  if (!landing) saveFail("Landing inexistente o sin permisos.");
  const businessName = String(fd.get("business_name") || "").trim();
  if (!businessName) saveFail("El nombre de la landing es obligatorio.");
  const backgroundType = ["color", "gradient", "image"].includes(String(fd.get("background_type")))
    ? String(fd.get("background_type"))
    : "color";
  const backgroundFile = fd.get("background_image");
  let backgroundImageUrl: string | undefined;
  if (backgroundType === "image" && backgroundFile instanceof File && backgroundFile.size > 0) {
    if (backgroundFile.size > 5 * 1024 * 1024) saveFail("La imagen no puede superar 5 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(backgroundFile.type)) saveFail("La imagen debe ser JPG, PNG o WEBP.");
    const extension = backgroundFile.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${user.id}/${landingId}/bg-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, backgroundFile, { contentType: backgroundFile.type, upsert: false });
    if (uploadError) saveFail(uploadError.message);
    backgroundImageUrl = supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
  } else if (fd.get("remove_background_image") === "true") {
    backgroundImageUrl = "";
  }
  const logoFile = fd.get("logo_image");
  let logoImageUrl: string | undefined;
  if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > 5 * 1024 * 1024) saveFail("El logo no puede superar 5 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(logoFile.type)) saveFail("El logo debe ser JPG, PNG o WEBP.");
    const extension = logoFile.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${user.id}/${landingId}/logo-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, logoFile, { contentType: logoFile.type, upsert: false });
    if (uploadError) saveFail(uploadError.message);
    logoImageUrl = supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
  } else if (fd.get("remove_logo_image") === "true") {
    logoImageUrl = "";
  }
  const landingUpdate: Record<string, unknown> = {
    business_name: businessName,
    description: String(fd.get("description") || "").trim(),
    primary_color: color(fd.get("primary_color"), "#1f2937"),
    background_type: backgroundType,
    background_color: color(fd.get("background_color"), "#f7f5f0"),
    background_gradient_to: color(fd.get("background_gradient_to"), "#a6c1ee"),
    text_color: color(fd.get("text_color"), "#ffffff"),
    text_panel: fd.get("text_panel") === "on",
    text_panel_color: color(fd.get("text_panel_color"), "#000000"),
    font_pair: validFontsIdentity.includes(String(fd.get("font_pair"))) ? String(fd.get("font_pair")) : "modern",
    button_font: validFonts.includes(String(fd.get("button_font"))) ? String(fd.get("button_font")) : "modern",
    button_style: parseJson(fd.get("button_style")),
    title_style: parseJson(fd.get("title_style")),
    subtitle_style: parseJson(fd.get("subtitle_style")),
    logo_style: parseJson(fd.get("logo_style")),
    background_style: parseJson(fd.get("background_style")),
  };
  if (backgroundImageUrl !== undefined) landingUpdate.background_image_url = backgroundImageUrl;
  if (logoImageUrl !== undefined) landingUpdate.logo_url = logoImageUrl;
  const { error } = await supabase.from("landings").update(landingUpdate).eq("id", landingId).eq("owner_id", user.id);
  if (error) saveFail(error.message);

  let requestedButtons: Array<Record<string, unknown>> = [];
  try {
    const parsed = JSON.parse(String(fd.get("buttons") || "[]"));
    if (Array.isArray(parsed)) requestedButtons = parsed;
  } catch {
    saveFail("No se pudieron leer los botones del borrador.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("actions")
    .select("id,enabled")
    .eq("landing_id", landingId);
  if (existingError) saveFail(existingError.message);
  const existingIds = new Set((existing || []).map((item) => item.id));
  const retainedIds = new Set<string>();

  for (let position = 0; position < requestedButtons.length; position++) {
    const button = requestedButtons[position];
    const type = validTypes.includes(String(button.type)) ? String(button.type) : "url";
    const title = String(button.title || "").trim();
    if (!title) saveFail(`El botón ${position + 1} necesita un nombre.`);
    let value = String(button.url || "").trim();
    if (type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) saveFail(`El email del botón “${title}” no parece válido.`);
    if (["whatsapp", "phone"].includes(type) && value && !isPlausiblePhone(value)) saveFail(`El número del botón “${title}” parece incompleto.`);
    if (!["whatsapp", "email", "phone"].includes(type) && value && !value.startsWith("http")) value = normalizeUrl(value);
    const row = {
      landing_id: landingId,
      title,
      subtitle: String(button.subtitle || "").trim(),
      type,
      message: String(button.message || "").trim(),
      url: value,
      icon: String(button.icon || "").trim(),
      background_color: color(String(button.background_color || ""), AUTO_COLORS[type] || "#1f2937"),
      text_color: color(String(button.text_color || ""), "#ffffff"),
      use_auto_color: button.use_auto_color !== false,
      enabled: true,
      position,
    };
    const id = String(button.id || "");
    if (existingIds.has(id)) {
      retainedIds.add(id);
      const { error: updateError } = await supabase.from("actions").update(row).eq("id", id).eq("landing_id", landingId);
      if (updateError) saveFail(updateError.message);
    } else {
      const { error: insertError } = await supabase.from("actions").insert({ ...row, is_generated: false, source_field: null });
      if (insertError) saveFail(insertError.message);
    }
  }

  const removableIds = (existing || [])
    .filter((item) => item.enabled !== false && !retainedIds.has(item.id))
    .map((item) => item.id);
  if (removableIds.length) {
    const { error: deleteError } = await supabase.from("actions").delete().eq("landing_id", landingId).in("id", removableIds);
    if (deleteError) saveFail(deleteError.message);
  }
  revalidatePath(`/admin/landings/${landingId}/visual`);
  revalidatePath(`/admin/landings/${landingId}/editor-v2`);
  revalidatePath("/admin");
  redirect(`${returnTo}?saved=Cambios guardados`);
}
