import { cache } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import LandingRenderer from "@/components/landing-renderer";
import { normalizeSource, trackLandingView } from "@/lib/track-view";

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

export default async function Landing({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) notFound();
  // Se cuenta antes del redirect a propósito: una landing con redirect_url sigue siendo una
  // tarjeta que alguien apoyó, y es justo la que más necesita el dato (no se ve nada de lo
  // nuestro, así que el conteo es lo único que queda). trackLandingView difiere el insert
  // con after(), así que esto no agrega nada al tiempo de respuesta.
  await trackLandingView(landing.id, normalizeSource((await searchParams).s), landing.owner_id);
  if (landing.redirect_url) redirect(landing.redirect_url);
  const supabase = await createClient();
  const { data: actions } = await supabase.from("actions").select("*").eq("landing_id", landing.id).eq("enabled", true).order("position");
  return <LandingRenderer landing={landing} actions={actions || []} />;
}
