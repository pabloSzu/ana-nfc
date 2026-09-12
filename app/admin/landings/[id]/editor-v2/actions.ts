"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl, isPlausiblePhone, AUTO_COLORS } from "@/lib/landing-catalog";

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

const validTypes = ["whatsapp", "instagram", "tiktok", "facebook", "linkedin", "website", "email", "phone", "maps", "youtube", "spotify", "mercadopago", "calendar", "telegram", "url"];

const validFontsIdentity = ["modern", "classic", "friendly", "minimal"];
const validFonts = ["modern", "classic", "friendly", "minimal"];

function parseJson(raw: FormDataEntryValue | null): Record<string, unknown> {
  try { return JSON.parse(String(raw || "{}")); } catch { return {}; }
}

// editor-v2 works as a local draft. This is its single persistence point: identity, visual
// styles, button-zone settings and the complete ordered button list are saved together only
// when the user presses the main "Guardar cambios" button.
export async function saveDesignStyle(fd: FormData) {
  const { user } = await auth();
  const landingId = String(fd.get("landing_id") || "");
  const requestedReturnTo = String(fd.get("return_to") || "");
  const returnTo = requestedReturnTo === "/admin" || requestedReturnTo.startsWith(`/admin/landings/${landingId}/`)
    ? requestedReturnTo
    : `/admin/landings/${landingId}/editor-v2`;
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
  revalidatePath(`/admin/landings/${landingId}/editor-v2`);
  revalidatePath("/admin");
  redirect(`${returnTo}?saved=Cambios guardados`);
}
