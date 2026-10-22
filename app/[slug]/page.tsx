import { cache } from "react";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import LandingRenderer from "@/components/landing-renderer";
import { parseTitleStyle } from "@/lib/landing-catalog";
import { normalizeSource, trackLandingView } from "@/lib/track-view";
import { effectiveRedirect } from "@/lib/landing-plan";
import { firstButtonLink } from "@/lib/landing-fallback";
import { readWithLegacyFallback } from "@/lib/public-read-compat";
import "../globals.css";

const publicSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

// Puente de despliegue: antes de las migraciones de chapitas, producción lee las tablas
// directamente. Después del lockdown esa lectura deja de estar permitida y pasa por el RPC.
// Mantener ambos caminos en este deploy permite migrar sin cortar las páginas existentes.
const getLanding = cache((slug: string) => unstable_cache(
  async () => {
    const { data, rpcError, legacyError } = await readWithLegacyFallback(
      () => publicSupabase.rpc("public_landing", { p_slug: slug }),
      () => publicSupabase
        .from("landings")
        .select("*, actions(*)")
        .eq("slug", slug)
        .eq("published", true)
        .eq("actions.enabled", true)
        .order("position", { referencedTable: "actions" })
        .maybeSingle(),
    );
    if (legacyError) {
      console.error("No se pudo leer la landing por RPC ni por el esquema anterior", {
        slug,
        rpc: rpcError?.message,
        legacy: legacyError.message,
      });
    }
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

// Marca la landing como larga (.is-long) cuando su contenido no entra en la pantalla del celular
// con las barras del navegador visibles. Ver el comentario de .landing-page-shell en globals.css.
//
// La pantalla se mide con un elemento invisible de 100svh, que no cambia cuando las barras
// aparecen o desaparecen. Por eso NO se vuelve a medir en cada cambio de barras: solo al cargar,
// cuando terminan de cargar fuentes e imágenes (cambian el alto del contenido) y si cambia el
// ancho, al girar el celular. Medir en cada cambio de barras sería peligroso: para medir se saca
// la clase un instante, la página se achica, y si la persona está scrolleada abajo el navegador
// podría reacomodar el scroll, que es justo el salto que esto evita.
const FIT_SCRIPT = `(function () {
  var shell = document.currentScript && document.currentScript.parentElement;
  if (!shell) return;
  var lastWidth = -1;
  function check() {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    var screen = probe.offsetHeight;
    probe.remove();
    shell.classList.remove("is-long");
    shell.classList.toggle("is-long", shell.scrollHeight > screen + 1);
  }
  function recheck() { lastWidth = -1; check(); }
  check();
  window.addEventListener("load", recheck);
  window.addEventListener("resize", check);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(recheck);
})();`;

export default async function Landing({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const landing = await getLanding(slug);
  if (!landing) notFound();
  // Se cuenta antes del redirect a propósito: una landing con redirect_url sigue siendo una
  // tarjeta que alguien apoyó, y es justo la que más necesita el dato (no se ve nada de lo
  // nuestro, así que el conteo es lo único que queda). trackLandingView difiere el insert
  // con after(), así que esto no agrega nada al tiempo de respuesta.
  await trackLandingView(landing.id, normalizeSource((await searchParams).s), landing.owner_id);
  // Link directo, página pasada a mano al link de respaldo, o página anual vencida hace más de
  // los días de gracia (ver lib/landing-plan.ts). Se calcula en cada visita, fuera del caché, así
  // el vencimiento se cumple solo sin ninguna tarea programada.
  const target = effectiveRedirect({ ...landing, auto_fallback: firstButtonLink(landing.actions) });
  if (target) redirect(target);
  const { actions, ...landingData } = landing;
  // Solo un color hexadecimal: este valor va a parar a una etiqueta <style>, y un texto libre de
  // la base ahí adentro podría inyectar CSS en la página.
  const shellColor = /^#[0-9a-f]{3,8}$/i.test(String(landingData.background_color || "")) ? landingData.background_color : "#f7f5f0";
  return (
    <div
      className="landing-page-shell"
      // FIT_SCRIPT le agrega "is-long" antes de que React hidrate; la diferencia es a propósito.
      suppressHydrationWarning
      style={{ "--landing-shell-color": shellColor } as CSSProperties}
    >
      {/* En el celular, el fondo de toda la ventana —lo que queda detrás de la página— toma el
          color de la landing. La página mide como la pantalla con las barras del navegador
          visibles, así una landing corta no scrollea; pero al ocultarse las barras la pantalla
          crece, y ese espacio de más mostraba el fondo genérico del sitio, una franja de otro
          color al pie. Pintando la ventana del mismo color, ese espacio no se distingue de la
          landing. En escritorio no hace falta: ahí las barras no cambian de tamaño. */}
      <style>{`@media (max-width: 767px) { html, body { background: ${shellColor}; } }`}</style>
      <LandingRenderer landing={landingData} actions={actions || []} />
      <script dangerouslySetInnerHTML={{ __html: FIT_SCRIPT }} />
    </div>
  );
}
