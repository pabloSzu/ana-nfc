import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePet } from "@/lib/pet";
import { getSiteOrigin } from "@/lib/site-url";
import Toast from "@/components/toast";
import PetEditor from "@/app/admin/landings/[id]/mascota/pet-editor";
import { saveMyPet } from "./actions";
import "@/app/admin/landings/[id]/mascota/pet-editor.css";

// El dueño edita su chapita con el mismo editor que el Admin, en modo "owner". Solo la ve si es
// miembro del cliente de la chapita (RLS: "el miembro lee las páginas de su cliente").
export default async function OwnerPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect(`/mi/entrar`);
  const { data: landing } = await supabase.from("landings").select("id,slug,pet_slug,business_name,business_type,logo_url,button_style,published,blocked_at,client_id").eq("id", id).is("pet_archived_at", null).maybeSingle();
  if (!landing || landing.business_type !== "pet") notFound();
  const { data: member } = await supabase.from("client_members").select("client_id").eq("client_id", landing.client_id).eq("user_id", userId).maybeSingle();
  if (!member) notFound();
  // Para la compu: su cuenta arriba y el link de su página.
  const email = (claims?.claims as { email?: string } | undefined)?.email || "";
  return <>
    <Suspense fallback={null}><Toast /></Suspense>
    <PetEditor
      mode="owner"
      landing={{ id: landing.id, slug: landing.pet_slug || landing.slug, name: landing.business_name || "", photoUrl: landing.logo_url || "", published: Boolean(landing.published), blocked: Boolean(landing.blocked_at) }}
      initialPet={parsePet(landing.button_style)}
      saveAction={saveMyPet}
      owner={{ email, host: new URL(getSiteOrigin()).host }}
    />
  </>;
}
