import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import LandingRenderer from "@/components/landing-renderer";

export default async function Landing({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (!landing) notFound();
  if (landing.redirect_url) redirect(landing.redirect_url);
  const { data: actions } = await supabase.from("actions").select("*").eq("landing_id", landing.id).eq("enabled", true).order("position");
  return <LandingRenderer landing={landing} actions={actions || []} />;
}
