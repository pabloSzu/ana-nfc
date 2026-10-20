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
