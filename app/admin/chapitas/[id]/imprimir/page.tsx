import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getSiteOrigin } from "@/lib/site-url";
import { formatCode } from "@/lib/pet-tags";
import PrintButton from "./print-button";
import "../../chapitas.css";

// Hojas para imprimir de un lote:
//  · tarjetas: la tarjetita que va adentro del paquete, con el código de activación. El código
//    nunca va en la chapita: si alguien encuentra al perro, no tiene que poder quedársela.
//  · qr: los QR de cada chapita, numerados, para grabar o imprimir en sticker.
export default async function PrintBatch({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ que?: string }> }) {
  const { id } = await params;
  const { que } = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const { data: batch } = await supabase.from("tag_batches").select("id,name").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (!batch) notFound();
  const { data: tags } = await supabase.from("landings").select("id,tag_number").eq("batch_id", id).eq("owner_id", userId).is("activated_at", null).order("tag_number");
  const ids = (tags || []).map((tag) => tag.id);
  const { data: codes } = ids.length ? await supabase.from("tag_activations").select("landing_id,code").in("landing_id", ids) : { data: [] };
  const codeOf = new Map((codes || []).map((row) => [row.landing_id, row.code]));
  const origin = getSiteOrigin();
  const host = new URL(origin).host;
  const isQr = que === "qr";
  const qrImage = (url: string) => "https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=0&data=" + encodeURIComponent(url);

  return <div className="ch-print">
    <header className="ch-print-bar">
      <div><strong>{batch.name}</strong><span>{isQr ? "QR de cada chapita" : "Tarjetitas con el código de activación"} · {tags?.length || 0} sin activar</span></div>
      <PrintButton />
    </header>
    {isQr
      ? <div className="ch-sheet ch-sheet-qr">{(tags || []).map((tag) => <figure key={tag.id}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagen externa para imprimir */}
          <img src={qrImage(`${origin}/go/${tag.id}?s=qr`)} alt={`QR chapita ${tag.tag_number}`} />
          <figcaption>N° {tag.tag_number}</figcaption>
        </figure>)}</div>
      : <div className="ch-sheet ch-sheet-cards">{(tags || []).map((tag) => <article key={tag.id} className="ch-card">
          <p className="ch-card-brand">BIONFC · chapita de mascota</p>
          <h2>Activá tu chapita</h2>
          <ol>
            <li>Acercá el celular a la chapita o escaneá su QR. También podés entrar a <strong>{host}/activar</strong></li>
            <li>Poné este código:</li>
          </ol>
          <p className="ch-card-code">{codeOf.has(tag.id) ? formatCode(codeOf.get(tag.id)!) : "—"}</p>
          <p className="ch-card-foot">Cargá los datos de tu mascota y listo. Guardá esta tarjetita: el código se usa una sola vez. · N° {tag.tag_number}</p>
        </article>)}</div>}
  </div>;
}
