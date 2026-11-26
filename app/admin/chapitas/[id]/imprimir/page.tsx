import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSiteOrigin, isLocalSite } from "@/lib/site-url";
import { activationPath, formatCode, shortTagCode, shortTagQrUrl, shortTagRange } from "@/lib/pet-tags";
import { createAdminClient } from "@/lib/supabase/admin";
import PrintStudio, { type PrintSource } from "./print-studio";
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
  const { data: printState } = await supabase.from("tag_batches")
    .select("tag_print_setup,tag_print_reopened_ids,cards_printed_count")
    .eq("id", id).eq("owner_id", userId).maybeSingle();
  const workflow = printState ? {
    setup: printState.tag_print_setup,
    reopenedIds: printState.tag_print_reopened_ids,
    cardsPrintedCount: printState.cards_printed_count,
  } : null;
  const loadTags = <Columns extends string>(columns: Columns) => supabase.from("landings").select(columns)
    .eq("batch_id", id).eq("owner_id", userId).is("activated_at", null).order("tag_number");
  const result = await loadTags("id,tag_number,button_style,tag_print_failed");
  const canMarkResults = !result.error;
  // Durante el despliegue, la base anterior todavía puede servir las hojas de impresión.
  const missingColumn = result.error?.code === "42703" && result.error.message.includes("tag_print_failed");
  const tagResult = missingColumn ? await loadTags("id,tag_number,button_style") : result;
  if (tagResult.error) {
    return <section className="ps-empty" role="alert">
      <h1>No pudimos cargar las chapitas del lote</h1>
      <p>Recargá la página para volver a intentar.</p>
      <Link href={`/admin/chapitas/${batch.id}`}>Volver al lote</Link>
    </section>;
  }
  const tags = tagResult.data;
  const ids = (tags || []).map((tag) => tag.id);
  const { data: codes } = ids.length ? await supabase.from("tag_activations").select("landing_id,code").in("landing_id", ids) : { data: [] };
  const codeOf = new Map((codes || []).map((row) => [row.landing_id, row.code]));
  const origin = getSiteOrigin();
  // El QR del dorso usa el link corto (/q/…). Si otra chapita empezara con el mismo código
  // (casi imposible), esa sale con el link largo de siempre.
  // Antes era una consulta por chapita (con 96, ~1 s): ahora una por tanda de 40, y se cuenta acá.
  const admin = createAdminClient();
  const sharing = new Map<string, number>();
  let checked = true;
  for (let start = 0; start < ids.length; start += 40) {
    const ranges = ids.slice(start, start + 40).map((tagId) => shortTagRange(shortTagCode(tagId))!);
    const { data: hits, error } = await admin.from("landings").select("id").not("batch_id", "is", null).or(ranges.map(([from, to]) => `and(id.gte.${from},id.lte.${to})`).join(","));
    if (error) { checked = false; break; }
    for (const hit of hits || []) sharing.set(shortTagCode(hit.id), (sharing.get(shortTagCode(hit.id)) || 0) + 1);
  }
  const isUnique = (tagId: string) => checked && sharing.get(shortTagCode(tagId)) === 1;
  // Solo los links: los QR (en vector) los dibuja el navegador (qr-vector.ts). Mandarlos ya
  // dibujados hacía la página pesada y lenta de armar.
  const items: PrintSource[] = (tags || []).map((tag) => {
    const code = codeOf.get(tag.id) || "";
    return {
      id: tag.id,
      number: tag.tag_number,
      code: code ? formatCode(code) : "",
      // Lo elegido para imprimir esta unidad (nombre, animal, color), guardado en la chapita.
      print: cleanTagPrint(tag.button_style && typeof tag.button_style === "object" ? (tag.button_style as { print?: unknown }).print : null),
      printFailed: "tag_print_failed" in tag && tag.tag_print_failed === true,
      activationUrl: code ? `${origin}${activationPath(code)}` : "",
      // El de la chapita: va dentro de un cuadrado blanco (tag-face.tsx), que ya le da el margen
      // que necesitan los celulares para leerlo.
      tagUrl: isUnique(tag.id) ? shortTagQrUrl(origin, tag.id) : `${origin.toUpperCase()}/go/${tag.id.toUpperCase()}?s=qr`,
    };
  });

  return <PrintStudio batchId={batch.id} batchName={batch.name} items={items} workflow={workflow} canMarkResults={canMarkResults} host={new URL(origin).host} isLocal={isLocalSite(origin)} initialMode={que === "tarjetas" ? "cards" : "qr"} />;
}
