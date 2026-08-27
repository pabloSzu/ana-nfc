import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import LandingRenderer from "@/components/landing-renderer";

export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) redirect("/admin/login");
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).eq("owner_id", user.user.id).maybeSingle();
  if (!landing) notFound();
  const { data: actions } = await supabase.from("actions").select("*").eq("landing_id", id).order("position");
  return <><div className="preview-toolbar"><Link className="back-link" href={`/admin/landings/${id}`}>← Volver al editor</Link><span className="status">Borrador</span></div><LandingRenderer landing={landing} actions={actions || []} preview /></>;
}
