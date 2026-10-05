import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { IconExternalLink, IconEye } from "@/components/icons";
import { getSiteOrigin, isLocalSite } from "@/lib/site-url";

export default async function QR({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (!landing) notFound();
  // La URL física usa el ID estable, no el slug editable: una tarjeta o un QR ya entregado
  // deben seguir abriendo la landing aunque se cambie su nombre o enlace público.
  const siteOrigin = getSiteOrigin();
  const publicUrl = `${siteOrigin}/${encodeURIComponent(landing.slug)}`;
  const permanentUrl = `${siteOrigin}/go/${landing.id}`;
  // El QR apunta a la misma URL pero marcada, para poder separar después cuántos escaneos
  // vinieron del código impreso y cuántos del chip. Es la única forma de distinguirlos, y solo
  // funciona si se decide antes de imprimir: sobre un QR ya entregado no hay vuelta atrás.
  const qrUrl = permanentUrl + "?s=qr";
  const nfcUrl = permanentUrl + "?s=nfc";
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=" + encodeURIComponent(qrUrl);
  // Un QR es un objeto físico: se imprime, se pega en un local y ahí queda. Si NEXT_PUBLIC_SITE_URL
  // apunta a localhost o a una IP de red interna — como pasa siempre en desarrollo — el código sale
  // igual de prolijo que uno bueno y no falla acá: falla meses después, en el celular de un cliente,
  // sobre plástico ya entregado. Por eso el aviso es un bloque rojo y no un texto gris.
  const host = new URL(siteOrigin).hostname;
  const isLocal = isLocalSite(siteOrigin);

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
            <strong>QR de prueba: no lo imprimas</strong>
            <p>El Admin está usando <code>{host}</code>, una dirección disponible solamente en esta computadora.</p>
            <p>La descarga queda bloqueada hasta abrir esta pantalla desde el sitio publicado.</p>
          </div>
        )}
        <img
          src={qr}
          alt={`QR de ${landing.business_name}`}
          style={{ width: "min(320px, 100%)", margin: "0 auto var(--space-4)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}
        />
        <div className="qr-addresses">
          <div><span>Dirección pública</span><strong>{publicUrl}</strong><small>Es el enlace legible para compartir. Puede cambiar si renombrás la página.</small></div>
          <div><span>Dirección permanente del QR</span><strong>{qrUrl}</strong><small>El código usa este identificador técnico para seguir funcionando aunque cambie el enlace público.</small></div>
        </div>
        <div className="row-actions" style={{ justifyContent: "center", marginTop: "var(--space-4)" }}>
          {isLocal
            ? <span className="btn is-disabled" aria-disabled="true" title="Abrí esta pantalla desde el sitio publicado para descargar el QR definitivo"><IconExternalLink /> Descarga bloqueada</span>
            : <a className="btn" href={qr} target="_blank" rel="noreferrer"><IconExternalLink /> Descargar QR</a>}
          <a className="btn secondary" href={publicUrl} target="_blank" rel="noreferrer"><IconEye /> Ver página pública</a>
        </div>
        <div className="qr-nfc-instructions">
          <strong>Dirección para grabar en el chip NFC</strong>
          <code>{nfcUrl}</code>
          <p>Usá la dirección completa, incluyendo <code>?s=nfc</code>. Así el Admin puede distinguir NFC, QR y enlaces directos.</p>
        </div>
      </div>
    </main>
  );
}
