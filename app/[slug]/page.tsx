import { cache } from "react";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import LandingRenderer from "@/components/landing-renderer";
import { parseTitleStyle } from "@/lib/landing-catalog";
import { normalizeSource, trackLandingView } from "@/lib/track-view";
import "../globals.css";

const publicSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

const getLanding = cache((slug: string) => unstable_cache(
  async () => {
    const { data } = await publicSupabase
      .from("landings")
      .select("*, actions(*)")
      .eq("slug", slug)
      .eq("published", true)
      .eq("actions.enabled", true)
      .order("position", { referencedTable: "actions" })
      .maybeSingle();
    return data;
  },
  ["public-landing", slug],
  { revalidate: 300 },
)());

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) return { title: "Mi Landing Web Fácil" };
  const titleStyle = parseTitleStyle(landing);
  const title = ((landing.business_type === "contact" ? landing.business_name : titleStyle.headline || landing.business_name) || "Mi Landing Web Fácil").replace(/\s+/g, " ").trim();
  const description = landing.description || "Mirá todos mis links y contactos en un solo lugar.";
  const images = landing.logo_url ? [landing.logo_url] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: { title, description, images, url: `/${slug}`, type: "website", locale: "es_AR" },
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
  const { actions, ...landingData } = landing;
  return (
    <div
      className="landing-page-shell"
      style={{ "--landing-shell-color": landingData.background_color || "#f7f5f0" } as CSSProperties}
    >
      <LandingRenderer landing={landingData} actions={actions || []} />
    </div>
  );
}
