import { createClient } from "@/lib/supabase/server";
import { buildContactCard } from "@/lib/contact-card";
import { contactPhotoBase64 } from "@/lib/contact-photo";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  // Se lee con public_landing: la tabla ya no se puede consultar directo desde afuera.
  const { data, error } = await supabase.rpc("public_landing", { p_slug: slug });
  if (error) return new Response("No se pudo generar el contacto", { status: 500 });
  const landing = data as ({ id: string; business_name: string; business_type: string; logo_url?: string | null; actions?: { type: string; url: string }[] } & Record<string, unknown>) | null;
  if (!landing || landing.business_type !== "contact") return new Response("Contacto no disponible", { status: 404 });
  const actions = landing.actions || [];

  const pageUrl = new URL(`/go/${landing.id}`, request.url).toString();
  const photo = await contactPhotoBase64(landing.logo_url, request.url);
  const card = buildContactCard(landing, actions, pageUrl, photo);
  return new Response(card, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacto.vcf"',
      "Cache-Control": "no-store",
    },
  });
}
