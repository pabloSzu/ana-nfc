import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getSiteOrigin } from "@/lib/site-url";
import { activationPath, formatCode } from "@/lib/pet-tags";
import QRCode from "qrcode";
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
  // Los dos QR se generan dentro del servidor: la impresión no depende de un tercero ni envía
  // enlaces (el de activación contiene además un secreto de un solo uso) fuera de BIONFC.
  const exteriorQrs = isQr ? new Map(await Promise.all((tags || []).map(async (tag) => [tag.id, await QRCode.toDataURL(`${origin}/go/${tag.id}?s=qr`, { width: 400, margin: 0, errorCorrectionLevel: "M" })] as const))) : new Map<string, string>();
  const cards = isQr ? [] : await Promise.all((tags || []).map(async (tag) => {
    const code = codeOf.get(tag.id);
    const activationUrl = code ? `${origin}${activationPath(code)}` : "";
    const activationQr = activationUrl ? await QRCode.toDataURL(activationUrl, { width: 400, margin: 0, errorCorrectionLevel: "M" }) : "";
    return { ...tag, code, activationQr };
  }));

  return <div className="ch-print">
    <header className="ch-print-bar">
      <div><strong>{batch.name}</strong><span>{isQr ? "QR de cada chapita" : "Tarjetitas con el código de activación"} · {tags?.length || 0} sin activar</span></div>
      <PrintButton />
    </header>
    {isQr
      ? <div className="ch-sheet ch-sheet-qr">{(tags || []).map((tag) => <figure key={tag.id}>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR generado en el servidor */}
          <img src={exteriorQrs.get(tag.id)} alt={`QR chapita ${tag.tag_number}`} />
          <figcaption><span>UNIDAD</span><strong>{tag.tag_number}</strong></figcaption>
        </figure>)}</div>
      : <div className="ch-sheet ch-sheet-cards">{cards.map((tag) => <article key={tag.id} className="ch-card">
          <div className="ch-card-head"><p className="ch-card-brand">BIONFC · chapita de mascota</p><span className="ch-unit"><small>UNIDAD</small>{tag.tag_number}</span></div>
          <h2>Activá tu chapita</h2>
          <div className="ch-card-activation">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR secreto generado en el servidor */}
            {tag.activationQr && <img src={tag.activationQr} alt={`QR secreto para activar la chapita ${tag.tag_number}`} />}
            <div><strong>1. Escaneá este QR</strong><span>2. Confirmá tu email</span><span>3. Cargá los datos de tu mascota</span></div>
          </div>
          <p className="ch-card-backup">Si no podés escanearlo, entrá a <strong>{host}/activar</strong> y escribí:</p>
          <p className="ch-card-code">{tag.code ? formatCode(tag.code) : "—"}</p>
          <p className="ch-card-foot">Este QR y código son privados y se usan una sola vez. Guardá la tarjeta hasta terminar la activación.</p>
        </article>)}</div>}
  </div>;
}
