"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { revalidateLandingPage } from "@/lib/landing-cache";
import { cleanPet, parsePet, petHasContact, petLook, petPhoneProblem } from "@/lib/pet";

const ERRORS: Record<string, string> = {
  sin_permiso: "Esta chapita no es tuya o ya no tenés acceso.",
  datos_invalidos: "No se pudieron leer los datos. Probá de nuevo.",
  nombre_invalido: "Poné el nombre de tu mascota.",
  foto_invalida: "No se pudo usar esa foto. Subila de nuevo.",
};

// Guardado del dueño. No escribe en la tabla: llama a save_my_pet, que revisa que la chapita
// sea suya y guarda solo nombre, foto, colores y datos. Se publica sola cuando hay un WhatsApp.
export async function saveMyPet(fd: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  const landingId = String(fd.get("landing_id") || "");
  const back = `/mi/chapita/${landingId}`;
  // Sesión vencida: vuelve acá después de entrar. Lo que no guardó queda como borrador en el
  // celular (ver pet-editor.tsx) y se ofrece recuperarlo.
  if (!userId) redirect(`/mi/entrar?next=${encodeURIComponent(back)}`);
  const fail = (message: string): never => redirect(`${back}?error=${encodeURIComponent(message)}`);

  const { data: landing } = await supabase.from("landings").select("id,slug,pet_slug,logo_url,blocked_at,published").eq("id", landingId).maybeSingle();
  if (!landing) fail(ERRORS.sin_permiso);
  const name = String(fd.get("business_name") || "").trim().slice(0, 60);
  if (!name) fail(ERRORS.nombre_invalido);
  let raw: unknown = {};
  try { raw = JSON.parse(String(fd.get("pet") || "{}")); } catch { fail("No se pudieron leer los datos."); }
  const pet = cleanPet(parsePet({ pet: raw }));
  if (!landing!.published && !landing!.blocked_at && petHasContact(pet) && fd.get("public_visibility_ack") !== "yes") fail("Confirmá que entendés qué datos se verán públicamente.");
  // Se guarda normalizado (549 + característica + número, ver lib/pet.ts); si no se puede, se avisa.
  const badPhone = pet.family.find((member) => member.phone && petPhoneProblem(member.phone));
  if (badPhone) fail(`Revisá el número ${badPhone.name ? `de ${badPhone.name}` : "de WhatsApp"}: ${petPhoneProblem(badPhone.phone)}`);

  let logoUrl: string = landing!.logo_url || "";
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) fail("La foto es muy pesada (más de 5 MB). Probá con otra o sacale una captura.");
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
  if (landing!.slug) revalidateLandingPage(landing!.slug);
  const { data: savedLanding } = await supabase.from("landings").select("pet_slug").eq("id", landingId).maybeSingle();
  if (savedLanding?.pet_slug) revalidateLandingPage(savedLanding.pet_slug);
  const message = landing!.blocked_at ? "Cambios guardados. La chapita sigue pausada por BIONFC."
    : !petHasContact(pet) ? "Guardado. Falta el WhatsApp para que la chapita funcione."
    : pet.lost ? "Guardado: el cartel de perdido ya se ve en la chapita" : "Cambios guardados";
  redirect(`${back}?saved=${encodeURIComponent(message)}`);
}
