import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCode } from "@/lib/pet-tags";
import { unit } from "../../[id]/imprimir/card-designs";
import { stopVerify } from "../actions";
import "../../chapitas.css";

const VIA_LABEL: Record<string, string> = { qr: "el QR del dorso", nfc: "el chip NFC", link: "el link" };

// Lo que ve quien arma la chapita al escanearla con el modo verificación prendido: qué unidad es y
// si coincide con el escaneo anterior (el QR y el NFC de la misma chapita tienen que coincidir).
export default async function VerifyTag({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ via?: string; antes?: string }> }) {
  const { id } = await params;
  const { via = "link", antes = "" } = await searchParams;
  const publicLink = `/go/${id}?${via === "qr" || via === "nfc" ? `s=${via}&` : ""}publico=1`;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  // Si no es una chapita de quien está mirando, sigue como un escaneo cualquiera.
  if (!userId) redirect(publicLink);
  const { data: tag } = await supabase.from("landings").select("id,tag_number,batch_id,activated_at,business_name").eq("id", id).eq("owner_id", userId).not("batch_id", "is", null).maybeSingle();
  if (!tag) redirect(publicLink);

  const [previousId, previousVia = "link"] = antes.split(".");
  const [{ data: batch }, { data: activation }, { data: previous }] = await Promise.all([
    supabase.from("tag_batches").select("name").eq("id", tag.batch_id).maybeSingle(),
    supabase.from("tag_activations").select("code").eq("landing_id", id).maybeSingle(),
    previousId && previousId !== id ? supabase.from("landings").select("tag_number,batch_id").eq("id", previousId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  // El escaneo anterior: la misma chapita por el otro camino (bien) o una distinta (puede estar mal).
  const previousUnit = previous ? `la ${unit(previous.tag_number).toLowerCase()}${previous.batch_id !== tag.batch_id ? " de otro lote" : ""}` : "otra chapita";
  const check = !previousId ? null
    : previousId === id ? (previousVia !== via ? { ok: true, text: `Coincide con ${VIA_LABEL[previousVia] || "el escaneo anterior"}: es la misma unidad.` } : null)
    : { ok: false, text: `El escaneo anterior (${VIA_LABEL[previousVia] || "el link"}) fue ${previousUnit}. Si estás controlando la misma chapita, el QR y el NFC no coinciden.` };

  return <main className="shell admin-shell ch-verify">
    <p className="eyebrow">{batch?.name || "Lote"} · por {VIA_LABEL[via] || "el link"}</p>
    <h1 className="ch-verify-unit">{unit(tag.tag_number)}</h1>
    {check && <p className={`ch-verify-check ${check.ok ? "is-ok" : "is-bad"}`}>{check.ok ? "✓ " : "⚠ "}{check.text}</p>}
    {tag.activated_at
      ? <p className="muted">Ya activada{tag.business_name ? ` · ${tag.business_name}` : ""}.</p>
      : <p className="ch-verify-code"><small>Código de la tarjeta</small><code>{activation?.code ? formatCode(activation.code) : "—"}</code></p>}
    <p className="muted">Ahora {via === "nfc" ? "escaneá el QR del dorso" : "acercá el celu a la chapita (NFC)"}: tiene que decir {unit(tag.tag_number).toLowerCase()}.</p>
    <div className="ch-verify-actions">
      <a className="btn secondary" href={publicLink}>Ver la página pública</a>
      <form action={stopVerify}><button className="btn secondary">Apagar verificación</button></form>
      <Link className="back-link" href={`/admin/chapitas/${tag.batch_id}`}>Ir al lote</Link>
    </div>
  </main>;
}
