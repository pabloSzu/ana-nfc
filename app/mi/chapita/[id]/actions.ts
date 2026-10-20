"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isPlausiblePhone } from "@/lib/landing-catalog";
import { cleanPet, parsePet, petHasContact, petLook } from "@/lib/pet";

const ERRORS: Record<string, string> = {
  sin_permiso: "Esta chapita no es tuya o ya no tenés acceso.",
  nombre_invalido: "Poné el nombre de tu mascota.",
  foto_invalida: "No se pudo usar esa foto. Subila de nuevo.",
};

// Guardado del dueño. No escribe en la tabla: llama a save_my_pet, que revisa que la chapita
// sea suya y guarda solo nombre, foto, colores y datos. Se publica sola cuando hay un WhatsApp.
export async function saveMyPet(fd: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/mi/entrar");
  const landingId = String(fd.get("landing_id") || "");
  const back = `/mi/chapita/${landingId}`;
  const fail = (message: string): never => redirect(`${back}?error=${encodeURIComponent(message)}`);

  const { data: landing } = await supabase.from("landings").select("id,slug,logo_url").eq("id", landingId).maybeSingle();
  if (!landing) fail(ERRORS.sin_permiso);
  const name = String(fd.get("business_name") || "").trim().slice(0, 60);
  if (!name) fail(ERRORS.nombre_invalido);
  let raw: unknown = {};
  try { raw = JSON.parse(String(fd.get("pet") || "{}")); } catch { fail("No se pudieron leer los datos."); }
  const pet = cleanPet(parsePet({ pet: raw }));
  const badPhone = pet.family.find((member) => member.phone && !isPlausiblePhone(member.phone));
  if (badPhone) fail(`El número ${badPhone.name ? `de ${badPhone.name} ` : ""}parece incompleto. Cargalo con código de país, por ejemplo 54 9 351 123 4567.`);

  let logoUrl: string = landing!.logo_url || "";
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) fail("La foto no puede superar 5 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) fail("La foto debe ser JPG, PNG o WEBP.");
    // A la carpeta del dueño: es la única donde la base le deja subir.
    const path = `${userId}/${landingId}/logo-${Date.now()}.${photo.type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) fail("No se pudo subir la foto. Probá con otra.");
    logoUrl = supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
  } else if (fd.get("remove_photo") === "true") {
    logoUrl = "";
  }

  const look = petLook(pet.look);
  const { error } = await supabase.rpc("save_my_pet", {
    p_landing: landingId, p_name: name, p_pet: pet, p_logo_url: logoUrl,
    p_accent: look.accent, p_background: look.background, p_publish: petHasContact(pet),
  });
  if (error) fail(Object.entries(ERRORS).find(([key]) => error.message.includes(key))?.[1] || "No se pudo guardar. Probá de nuevo.");
  revalidatePath(back);
  revalidatePath("/mi");
  // La página pública se guarda en caché (app/[slug]/page.tsx): sin esto, el cartel de perdido
  // tardaría minutos en aparecer.
  if (landing!.slug) revalidatePath(`/${landing!.slug}`);
  redirect(`${back}?saved=${encodeURIComponent(pet.lost ? "Guardado: el cartel de perdido ya se ve en la chapita" : "Cambios guardados")}`);
}
