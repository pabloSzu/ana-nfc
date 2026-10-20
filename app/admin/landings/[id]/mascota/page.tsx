import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publish } from "@/app/admin/actions";
import { parsePet } from "@/lib/pet";
import Toast from "@/components/toast";
import PetEditor from "./pet-editor";
import { savePet } from "./actions";
import "./pet-editor.css";

export default async function PetEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const { data: landing } = await supabase.from("landings").select("id,slug,business_name,business_type,logo_url,button_style,published,blocked_at").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (!landing) notFound();
  if (landing.business_type !== "pet") redirect(`/admin/landings/${id}/editor-v2`);
  return <>
    <Suspense fallback={null}><Toast /></Suspense>
    <PetEditor
      landing={{ id: landing.id, slug: landing.slug, name: landing.business_name || "", photoUrl: landing.logo_url || "", published: Boolean(landing.published), blocked: Boolean(landing.blocked_at) }}
      initialPet={parsePet(landing.button_style)}
      saveAction={savePet}
      publishAction={publish}
    />
  </>;
}
