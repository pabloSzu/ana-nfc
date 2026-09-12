import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import DevicePreview from "./device-preview";

export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/admin/login");
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).eq("owner_id", user.user.id).maybeSingle();
  if (!landing) notFound();
  const { data: actions } = await supabase.from("actions").select("*").eq("landing_id", id).order("position");
  return <DevicePreview landing={landing} actions={actions || []} backHref={`/admin/landings/${id}`} />;
}
