"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { newPet, petLook } from "@/lib/pet";
import { BATCH_MAX, newActivationCode, newTagSlug } from "@/lib/pet-tags";

// Genera un lote de chapitas para vender: cada una es una chapita de mascota vacía, sin cliente
// y sin publicar, con su código de activación. La base solo deja hacerlo al staff (RLS).
export async function createBatch(fd: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const fail = (message: string): never => redirect(`/admin/chapitas?error=${encodeURIComponent(message)}`);

  const name = String(fd.get("name") || "").trim().slice(0, 60);
  const reseller = String(fd.get("reseller") || "").trim().slice(0, 60);
  const count = Math.floor(Number(fd.get("count")));
  // Las chapitas no vencen: "anual" no tiene sentido sin botones a los que pasar (ver
  // lib/landing-plan.ts) y llenaría el Resumen de alertas que no se pueden resolver.
  const plan = "lifetime";
  if (!name) fail("Poné un nombre para el lote.");
  if (!Number.isFinite(count) || count < 1 || count > BATCH_MAX) fail(`La cantidad tiene que ser entre 1 y ${BATCH_MAX}.`);

  const { data: batch, error: batchError } = await supabase.from("tag_batches").insert({ name, reseller, owner_id: userId }).select("id").single();
  if (batchError || !batch) fail(batchError?.message || "No se pudo crear el lote.");
  const look = petLook(undefined);
  const rows = Array.from({ length: count }, (_, index) => ({
    owner_id: userId, client_id: null, business_type: "pet", template: "professional", plan, published: false,
    business_name: `Chapita ${index + 1}`, slug: newTagSlug(), batch_id: batch!.id, tag_number: index + 1,
    primary_color: look.accent, background_color: look.background, button_style: { pet: newPet() },
  }));
  const { data: tags, error: tagsError } = await supabase.from("landings").insert(rows).select("id");
  if (tagsError || !tags) {
    await supabase.from("tag_batches").delete().eq("id", batch!.id);
    fail(tagsError?.message || "No se pudieron crear las chapitas.");
  }
  const { error: codesError } = await supabase.from("tag_activations").insert(tags!.map((tag) => ({ landing_id: tag.id, code: newActivationCode() })));
  if (codesError) {
    await supabase.from("landings").delete().eq("batch_id", batch!.id);
    await supabase.from("tag_batches").delete().eq("id", batch!.id);
    fail(codesError.message);
  }
  revalidatePath("/admin/chapitas");
  redirect(`/admin/chapitas/${batch!.id}?saved=${encodeURIComponent(`Lote creado: ${count} ${count === 1 ? "chapita" : "chapitas"}`)}`);
}

// Si se perdió la tarjetita antes de activar, invalida el código anterior y crea otro. La
// operación real es transaccional en la base: nunca queda una chapita sin código por un fallo a
// mitad de camino, y una chapita ya activada no se puede tocar desde acá.
export async function regenerateTagCode(fd: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");

  const landingId = String(fd.get("landingId") || "");
  const batchId = String(fd.get("batchId") || "");
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!validId.test(landingId) || !validId.test(batchId)) redirect("/admin/chapitas");

  const { data, error } = await supabase.rpc("regenerate_tag_code", {
    p_landing: landingId,
    p_code: newActivationCode(),
  });
  if (error || !data) {
    redirect(`/admin/chapitas/${batchId}?error=${encodeURIComponent("No se pudo cambiar el código. Solo se puede hacer antes de activar la chapita.")}`);
  }
  revalidatePath(`/admin/chapitas/${batchId}`);
  redirect(`/admin/chapitas/${batchId}?saved=${encodeURIComponent("Código anterior anulado. Imprimí o copiá el nuevo código.")}`);
}

// Los datos administrativos del lote sí se pueden corregir. La cantidad, las unidades y sus
// códigos no forman parte de esta edición porque ya representan piezas físicas identificables.
export async function updateBatch(fd: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/admin/login");

  const batchId = String(fd.get("batchId") || "");
  const name = String(fd.get("name") || "").trim().slice(0, 60);
  const reseller = String(fd.get("reseller") || "").trim().slice(0, 60);
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!validId.test(batchId)) redirect("/admin/chapitas?error=" + encodeURIComponent("Lote inválido."));
  if (!name) redirect(`/admin/chapitas/${batchId}?error=${encodeURIComponent("Poné un nombre para el lote.")}`);

  const { data, error } = await supabase.from("tag_batches")
    .update({ name, reseller })
    .eq("id", batchId)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();
  if (error || !data) redirect(`/admin/chapitas/${batchId}?error=${encodeURIComponent(error?.message || "No se pudo editar el lote.")}`);

  revalidatePath("/admin/chapitas");
  revalidatePath(`/admin/chapitas/${batchId}`);
  redirect(`/admin/chapitas/${batchId}?saved=${encodeURIComponent("Datos del lote actualizados.")}`);
}

// Oculta un lote del stock y de los totales sin borrar sus chapitas ni sus códigos. Se puede
// restaurar desde "Lotes archivados". La igualdad por owner_id mantiene la operación dentro de
// la cuenta aunque alguien manipule el formulario.
export async function setBatchArchived(fd: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/admin/login");

  const batchId = String(fd.get("batchId") || "");
  const archive = String(fd.get("archive") || "") === "true";
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!validId.test(batchId)) redirect("/admin/chapitas?error=" + encodeURIComponent("Lote inválido."));

  const { data, error } = await supabase.rpc("set_tag_batch_archived", { p_batch: batchId, p_archived: archive });
  if (error || !data) redirect("/admin/chapitas?error=" + encodeURIComponent(error?.message || "No se pudo actualizar el lote."));

  revalidatePath("/admin/chapitas");
  revalidatePath(`/admin/chapitas/${batchId}`);
  redirect(`/admin/chapitas?saved=${encodeURIComponent(archive ? "Lote archivado. No se borró nada." : "Lote restaurado.")}`);
}
