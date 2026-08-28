import { cache } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import LandingRenderer from "@/components/landing-renderer";

const getLanding = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("landings").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) return { title: "Mi Landing Web Fácil" };
  const title = landing.business_name || "Mi Landing Web Fácil";
  const description = landing.description || "Mirá todos mis links y contactos en un solo lugar.";
  const images = landing.logo_url ? [landing.logo_url] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { card: "summary", title, description, images },
  };
}

export default async function Landing({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) notFound();
  if (landing.redirect_url) redirect(landing.redirect_url);
  const supabase = await createClient();
  const { data: actions } = await supabase.from("actions").select("*").eq("landing_id", landing.id).eq("enabled", true).order("position");
  return <LandingRenderer landing={landing} actions={actions || []} />;
}
