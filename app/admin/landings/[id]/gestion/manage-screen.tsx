import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { IconEdit, IconExternalLink, IconQrCode } from "@/components/icons";
import { copyAsTemplate, renewLanding, saveLandingManagement, setLandingRedirect } from "@/app/admin/actions";
import { effectiveRedirect, fallbackOf, formatDate, pageKindLabel, planOf, planStatus, renewedExpiry } from "@/lib/landing-plan";
import ManagePanel, { type ManagePanelData } from "./manage-panel";

type ManageLanding = Parameters<typeof planStatus>[0] & { id: string; slug: string; business_name: string; business_type?: string | null; published?: boolean | null };
type ManageClient = { id: string; name: string; phone?: string | null; notes?: string | null } | null;

// La pantalla de Gestión, separada de la carga de datos de page.tsx.
export default function ManageScreen({ landing, client }: { landing: ManageLanding; client: ManageClient }) {
  const plan = planOf(landing);
  const status = planStatus(landing);
  const kind = landing.business_type === "contact" ? "tarjeta" : "página";
  const opens = effectiveRedirect(landing);
  const phone = String(client?.phone || "").replace(/\D/g, "");
  const data: ManagePanelData = {
    id: landing.id,
    plan,
    kind,
    published: Boolean(landing.published),
    status,
    expiresLabel: landing.expires_at ? formatDate(landing.expires_at) : "",
    expiresDate: landing.expires_at ? new Date(landing.expires_at).toLocaleDateString("en-CA", { timeZone: "America/Argentina/Cordoba" }) : "",
    fallbackUrl: String(landing.fallback_url || ""),
    autoFallback: String(landing.auto_fallback || ""),
    effectiveFallback: fallbackOf(landing),
    directUrl: plan === "direct" ? String(landing.redirect_url || "") : "",
    manualRedirect: plan === "annual" && Boolean(String(landing.redirect_url || "").trim()),
    opens: landing.published ? opens || "" : "",
    showBranding: (landing.button_style as Record<string, unknown> | null)?.showBranding !== false,
    whatsapp: phone && landing.expires_at && plan === "annual"
      ? `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${client?.name || ""}! Te escribo de BIONFC. Tu ${kind} "${landing.business_name}" ${status.key === "expired" || status.key === "redirected" ? "venció" : "vence"} el ${formatDate(landing.expires_at)}. ¿Querés renovarla por un año más? Son $10.000 e incluye los cambios que necesites. Si no la renovás, tu producto sigue funcionando y abre tu link principal.`)}`
      : "",
    hasClientPhone: Boolean(phone),
    renewUntil: formatDate(renewedExpiry(landing.expires_at)),
  };

  return (
    <main className="shell admin-shell manage-shell">
      <Suspense fallback={null}><Toast /></Suspense>
      <header className="manage-header">
        <Link className="back-link" href="/admin/paginas">← Páginas</Link>
        <div className="manage-title">
          <div>
            <p className="eyebrow">Gestión · {pageKindLabel(landing)}</p>
            <h1>{landing.business_name}</h1>
            <p className="muted">{client ? <>Cliente: <Link href={`/admin/clientes/${client.id}`}>{client.name}</Link></> : "Sin cliente asignado"}</p>
          </div>
          <nav className="manage-quick">
            {plan !== "direct" && <Link className="icon-text-button accent" href={`/admin/landings/${landing.id}/editor-v2`}><IconEdit /> Editar diseño</Link>}
            <Link className="icon-text-button accent" href={`/admin/landings/${landing.id}/qr`}><IconQrCode /> QR y NFC</Link>
            {landing.published && <a className="icon-text-button accent" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconExternalLink /> Probar como cliente</a>}
          </nav>
        </div>
      </header>

      <ManagePanel data={data} saveAction={saveLandingManagement} renewAction={renewLanding} redirectAction={setLandingRedirect} />

      {landing.business_type !== "contact" && plan !== "direct" && <section className="card manage-template">
        <div><strong>Guardar como plantilla</strong><p>Crea una copia de esta página en <Link href="/admin/plantillas">Plantillas</Link>, para arrancar otras desde ella. Esta página no cambia.</p></div>
        <form action={copyAsTemplate} className="manage-template-form">
          <input type="hidden" name="id" value={landing.id} />
          <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/gestion`} />
          <input name="template_name" maxLength={40} required placeholder="Ej. Café · degradé" aria-label="Nombre de la plantilla" />
          <button className="btn" type="submit">Guardar copia</button>
        </form>
      </section>}
      {client?.notes && <section className="card manage-notes"><strong>Notas del cliente</strong><p>{client.notes}</p></section>}
    </main>
  );
}
