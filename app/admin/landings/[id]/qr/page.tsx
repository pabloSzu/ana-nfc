import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconExternalLink, IconEye } from "@/components/icons";

export default async function QR({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).maybeSingle();
  if (!landing) notFound();
  const url = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/" + landing.slug;
  // El QR apunta a la misma URL pero marcada, para poder separar después cuántos escaneos
  // vinieron del código impreso y cuántos del chip. Es la única forma de distinguirlos, y solo
  // funciona si se decide antes de imprimir: sobre un QR ya entregado no hay vuelta atrás.
  const qrUrl = url + "?s=qr";
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=" + encodeURIComponent(qrUrl);
  // Un QR es un objeto físico: se imprime, se pega en un local y ahí queda. Si NEXT_PUBLIC_SITE_URL
  // apunta a localhost o a una IP de red interna — como pasa siempre en desarrollo — el código sale
  // igual de prolijo que uno bueno y no falla acá: falla meses después, en el celular de un cliente,
  // sobre plástico ya entregado. Por eso el aviso es un bloque rojo y no un texto gris.
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  const isLocal = /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);

  return (
    <main className="shell">
      <header className="builder-header">
        <Link className="back-link" href={`/admin/landings/${id}/editor-v2`}>← Volver</Link>
        <div>
          <p className="eyebrow">Código QR</p>
          <h1>{landing.business_name}</h1>
        </div>
      </header>
      <div className="card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        {isLocal && (
          <div className="qr-local-warning" role="alert">
            <strong>Este QR no sirve para imprimir</strong>
            <p>Apunta a <code>{host}</code>, que es esta computadora. En el celular de otra persona no abre nada.</p>
            <p>Generá el QR definitivo desde el sitio publicado, no desde el entorno local.</p>
          </div>
        )}
        <img
          src={qr}
          alt={`QR de ${landing.business_name}`}
          style={{ width: "min(320px, 100%)", margin: "0 auto var(--space-4)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}
        />
        <p className="muted" style={{ wordBreak: "break-all", fontSize: "0.8125rem" }}>{qrUrl}</p>
        <div className="row-actions" style={{ justifyContent: "center", marginTop: "var(--space-4)" }}>
          <a className="btn" href={qr} target="_blank" rel="noreferrer"><IconExternalLink /> Descargar QR</a>
          <a className="btn secondary" href={url} target="_blank" rel="noreferrer"><IconEye /> Ver landing</a>
        </div>
        <p className="muted" style={{ marginTop: "var(--space-5)", fontSize: "0.75rem" }}>En la tag NFC grabá {url}?s=nfc — misma página, pero así el panel te separa los escaneos del chip de los del QR.</p>
      </div>
    </main>
  );
}
