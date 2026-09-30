import { createClient } from "@/lib/supabase/server";
import { buildContactCard } from "@/lib/contact-card";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("id,business_name,description,title_style,button_style,business_type").eq("slug", slug).eq("published", true).maybeSingle();
  if (!landing || landing.business_type !== "contact") return new Response("Contacto no disponible", { status: 404 });

  const { data: actions, error } = await supabase.from("actions").select("type,url").eq("landing_id", landing.id).eq("enabled", true).order("position");
  if (error) return new Response("No se pudo generar el contacto", { status: 500 });

  const pageUrl = new URL(`/go/${landing.id}`, request.url).toString();
  const card = buildContactCard(landing, actions || [], pageUrl);
  return new Response(card, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacto.vcf"',
      "Cache-Control": "no-store",
    },
  });
}
