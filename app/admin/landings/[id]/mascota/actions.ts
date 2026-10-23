"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { revalidateLandingPage } from "@/lib/landing-cache";
import { cleanPet, parsePet, petLook, petPhoneProblem, type PetSaveResult } from "@/lib/pet";

// Único punto de guardado del editor de la chapita en el Admin: nombre, foto y todos los datos de
// la mascota (button_style.pet) juntos, al tocar "Guardar". Responde qué pasó (PetSaveResult),
// igual que el guardado del dueño; publicar o despublicar desde el Admin va aparte (publish).
export async function savePet(fd: FormData): Promise<PetSaveResult> {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (authError || !userId) redirect("/admin/login");
  const landingId = String(fd.get("landing_id") || "");
  const back = `/admin/landings/${landingId}/mascota`;
  const fail = (error: string): PetSaveResult => ({ ok: false, error });

  const { data: landing, error: lookupError } = await supabase.from("landings").select("id,slug,pet_slug,business_type,button_style,logo_url").eq("id", landingId).eq("owner_id", userId).maybeSingle();
  if (lookupError) return fail(lookupError.message);
  if (!landing || landing.business_type !== "pet") return fail("Chapita inexistente o sin permisos.");

  const name = String(fd.get("business_name") || "").trim().slice(0, 60);
  if (!name) return fail("Poné el nombre de la mascota.");
  let raw: unknown = {};
  try { raw = JSON.parse(String(fd.get("pet") || "{}")); } catch { return fail("No se pudieron leer los datos de la mascota."); }
  const pet = cleanPet(parsePet({ pet: raw }));
  // Se guarda normalizado (549 + característica + número, ver lib/pet.ts); si no se puede, se avisa.
  const badPhone = pet.family.find((member) => member.phone && petPhoneProblem(member.phone));
  if (badPhone) return fail(`Revisá el número ${badPhone.name ? `de ${badPhone.name}` : "de WhatsApp"}: ${petPhoneProblem(badPhone.phone)}`);

  const update: Record<string, unknown> = {
    business_name: name,
    description: pet.message,
    primary_color: petLook(pet.look).accent,
    background_color: petLook(pet.look).background,
    button_style: { ...(landing.button_style && typeof landing.button_style === "object" ? landing.button_style : {}), pet },
  };
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024) return fail("La foto es muy pesada (más de 5 MB). Probá con otra o sacale una captura.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) return fail("La foto debe ser JPG, PNG o WEBP.");
    const path = `${userId}/${landingId}/logo-${Date.now()}.${photo.type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error: uploadError } = await supabase.storage.from("landing-assets").upload(path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) return fail(uploadError.message);
    update.logo_url = supabase.storage.from("landing-assets").getPublicUrl(path).data.publicUrl;
  } else if (fd.get("remove_photo") === "true") {
    update.logo_url = null;
  }

  const { error } = await supabase.from("landings").update(update).eq("id", landingId).eq("owner_id", userId);
  if (error) return fail(error.message);
  revalidatePath(back);
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  // La página pública se guarda en caché (app/[slug]/page.tsx): sin esto el cambio tardaría en verse.
  if (landing.slug) revalidateLandingPage(landing.slug);
  // Si cambió el nombre, el link anterior pasa a ser un alias que redirige: su página guardada
  // también se descarta.
  if (landing.pet_slug) revalidateLandingPage(landing.pet_slug);
  const { data: savedLanding } = await supabase.from("landings").select("pet_slug,published,logo_url").eq("id", landingId).eq("owner_id", userId).maybeSingle();
  if (savedLanding?.pet_slug) revalidateLandingPage(savedLanding.pet_slug);
  return { ok: true, message: "Cambios guardados", lostActivated: false, firstPublish: false, landing: { published: Boolean(savedLanding?.published), slug: savedLanding?.pet_slug || landing.slug, photoUrl: savedLanding?.logo_url || "" } };
}
