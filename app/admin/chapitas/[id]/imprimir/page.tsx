import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getSiteOrigin, isLocalSite } from "@/lib/site-url";
import { activationPath, formatCode, shortTagCode, shortTagRange } from "@/lib/pet-tags";
import { createAdminClient } from "@/lib/supabase/admin";
import QRCode from "qrcode";
import PrintStudio, { type PrintItem } from "./print-studio";
import { cleanTagPrint } from "./tag-face";
import "./print-studio.css";

// Imprimir el material de un lote (solo las chapitas sin activar):
//  · tarjetas: la tarjetita del paquete, frente y dorso, con el QR secreto y el código de
//    activación. El código nunca va en la chapita: si alguien encuentra al perro, no tiene que
//    poder quedársela.
//  · chapitas: frente ilustrado, con nombre opcional, y dorso con el QR público permanente.
// El diseño, los tamaños y las líneas de corte se eligen en la pantalla (print-studio.tsx).
export default async function PrintBatch({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ que?: string }> }) {
  const { id } = await params;
  const { que } = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const { data: batch } = await supabase.from("tag_batches").select("id,name").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (!batch) notFound();
  const { data: tags } = await supabase.from("landings").select("id,tag_number,button_style").eq("batch_id", id).eq("owner_id", userId).is("activated_at", null).order("tag_number");
  const ids = (tags || []).map((tag) => tag.id);
  const { data: codes } = ids.length ? await supabase.from("tag_activations").select("landing_id,code").in("landing_id", ids) : { data: [] };
  const codeOf = new Map((codes || []).map((row) => [row.landing_id, row.code]));
  const origin = getSiteOrigin();
  // El QR del dorso usa el link corto (/q/…). Si otra chapita empezara con el mismo código
  // (casi imposible), esa sale con el link largo de siempre.
  const admin = createAdminClient();
  const isUnique = async (id: string) => {
    const [from, to] = shortTagRange(shortTagCode(id))!;
    const { count, error } = await admin.from("landings").select("id", { count: "exact", head: true }).not("batch_id", "is", null).gte("id", from).lte("id", to);
    return !error && count === 1;
  };
  // Los QR se generan en el servidor: la impresión no depende de un tercero ni manda los enlaces
  // (el de activación tiene un secreto de un solo uso) fuera de BIONFC.
  const qr = (text: string) => QRCode.toDataURL(text, { width: 480, margin: 0, errorCorrectionLevel: "M", color: { dark: "#1d1410", light: "#00000000" } });
  const items: PrintItem[] = await Promise.all((tags || []).map(async (tag) => {
    const code = codeOf.get(tag.id) || "";
    return {
      id: tag.id,
      number: tag.tag_number,
      code: code ? formatCode(code) : "",
      // Lo elegido para imprimir esta unidad (nombre, animal, color), guardado en la chapita.
      print: cleanTagPrint(tag.button_style && typeof tag.button_style === "object" ? (tag.button_style as { print?: unknown }).print : null),
      activationQr: code ? await qr(`${origin}${activationPath(code)}`) : "",
      // El de la chapita: va dentro de un cuadrado blanco (tag-face.tsx), que ya le da el margen
      // que necesitan los celulares para leerlo.
      tagQr: await QRCode.toDataURL(await isUnique(tag.id) ? `${origin}/q/${shortTagCode(tag.id)}` : `${origin}/go/${tag.id}?s=qr`, { width: 480, margin: 1, errorCorrectionLevel: "M", color: { dark: "#1d1410", light: "#ffffff" } }),
    };
  }));

  return <PrintStudio batchId={batch.id} batchName={batch.name} items={items} host={new URL(origin).host} isLocal={isLocalSite(origin)} initialMode={que === "tarjetas" ? "cards" : "qr"} />;
}
