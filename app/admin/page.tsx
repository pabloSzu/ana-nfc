import { createClient } from "@/lib/supabase/server";
import { newClient, newLanding, resolveReport } from "./actions";
import LandingCreationForm from "./landing-creation-form";
import ClientCreationForm from "./client-creation-form";
import ModalTrigger from "./modal-trigger";
import { IconAlertCircle, IconPlus, IconQrCode, IconUsers, IconFileText, IconCheckCircle, IconRocket, IconWifi, IconDroplet } from "@/components/icons";
import Toast from "@/components/toast";
import Link from "next/link";
import { Suspense } from "react";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import AdminPageAvatar from "@/components/admin-page-avatar";
import { editHref, pageKindLabel, planStatus } from "@/lib/landing-plan";
import { withAutoFallback } from "@/lib/landing-fallback";
import { templateChoices } from "@/lib/business-templates";

export default async function Admin() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) return <main className="auth-shell"><div className="auth-card" style={{ textAlign: "center" }}><div className="auth-mark" style={{ margin: "0 auto 16px" }}>M</div><h1>Mi Landing Web Fácil</h1><p className="muted">Iniciá sesión para gestionar tus clientes y landings.</p><Link className="btn full" href="/admin/login">Ingresar</Link></div></main>;
  const [{ data: clients }, { data: allLandings }, { data: reports }] = await Promise.all([
    supabase.from("clients").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    // Las chapitas de un lote que todavía no se vendieron no son páginas: se ven en Chapitas.
    supabase.from("landings").select("*, actions(type,url,enabled,position)").eq("owner_id", userId).or("batch_id.is.null,activated_at.not.is.null").order("created_at", { ascending: false }),
    supabase.from("reports").select("id,reason,contact,created_at,landing:landings(id,slug,business_name,business_type,plan)").is("resolved_at", null).order("created_at", { ascending: false }),
  ]);
  // Las plantillas son landings propias pero no páginas de clientes: no cuentan acá.
  const landings = (allLandings || []).filter((landing) => !landing.template_name);
  const templates = templateChoices(allLandings || []);
  const totalClients = clients?.length || 0;
  const totalPages = landings?.length || 0;
  const totalCards = landings?.filter((landing) => landing.business_type === "contact").length || 0;
  const totalLandings = totalPages - totalCards;
  const published = landings?.filter((landing) => landing.published).length || 0;
  const drafts = totalPages - published;
  const landingCountByClient = new Map<string, number>();
  landings?.forEach((landing) => { if (landing.client_id) landingCountByClient.set(landing.client_id, (landingCountByClient.get(landing.client_id) || 0) + 1); });
  const activeClients = Array.from(landingCountByClient.values()).filter((count) => count > 0).length;
  const publishRate = totalPages ? Math.round((published / totalPages) * 100) : 0;
  // Lo que pide acción: páginas que vencen en los próximos 30 días o ya vencieron, ordenadas por
  // la que vence primero.
  const renewals = (landings || [])
    .map((landing) => ({ landing, status: planStatus(withAutoFallback(landing)) }))
    .filter(({ status }) => status.key === "expiring" || status.key === "expired")
    .sort((a, b) => (a.status.days ?? 0) - (b.status.days ?? 0));
  return <main className="shell admin-shell">
    <AdminThemeBackdrop />
    <header className="app-header admin-hero">
      <div className="hero-copy">
        <div className="brand-lockup"><span className="brand-mark"><IconRocket /></span><p className="eyebrow">Mi Landing Web Fácil</p></div>
        <h1>Tu centro de comando</h1>
        <p className="muted">Landings, tarjetas personales, clientes y tags NFC en un solo lugar.</p>
        <div className="hero-pills">
          <span><IconWifi /> NFC ready</span>
          <span><IconDroplet /> Colores por marca</span>
          <span><IconCheckCircle /> {publishRate}% publicadas</span>
        </div>
      </div>
    </header>
    <Suspense fallback={null}><Toast /></Suspense>

    <section className="stats">
      <div className="stat-card"><span className="stat-icon"><IconUsers /></span><small>Clientes</small><strong>{totalClients}</strong><span>{activeClients} con página</span></div>
      <div className="stat-card"><span className="stat-icon"><IconFileText /></span><small>Páginas</small><strong>{totalPages}</strong><span>{totalLandings} landings · {totalCards} tarjetas</span></div>
      <div className="stat-card"><span className="stat-icon"><IconCheckCircle /></span><small>Publicadas</small><strong>{published}</strong><span>{drafts} en borrador · {publishRate}% del total</span></div>
      {/* Same number as "Publicadas" on purpose, not a bug: a tag/QR's URL 404s until the
          landing behind it is published (app/[slug]/page.tsx filters on published:true), so
          "ready" and "published" are the same set. The old subtitle ("con QR activo") didn't
          say why the two cards matched — this one names the actual condition instead. */}
      <div className="stat-card"><span className="stat-icon"><IconQrCode /></span><small>Tags listos</small><strong>{published}</strong><span>= publicadas (el QR solo funciona así)</span></div>
    </section>

    {!!reports?.length && <section className="elevated-section renewals-card">
      <div className="section-heading rich-heading"><span className="step warm"><IconAlertCircle /></span><div><p className="eyebrow warm-text">Denuncias</p><h2>{reports.length === 1 ? "1 página denunciada" : `${reports.length} páginas denunciadas`}</h2></div></div>
      <ul className="report-list">{reports.map((report) => { const page = (Array.isArray(report.landing) ? report.landing[0] : report.landing) as { id: string; slug: string; business_name: string; business_type: string; plan: string } | null; return <li key={report.id}>
        <div><strong>{page?.business_name || "Página"}</strong><p>{report.reason}</p><small>{new Date(report.created_at).toLocaleDateString("es-AR")}{report.contact ? ` · ${report.contact}` : ""}</small></div>
        <div className="report-actions">{page && <a className="icon-text-button" href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">Ver</a>}{page && <Link className="icon-text-button" href={editHref(page)}>Editar</Link>}<form action={resolveReport}><input type="hidden" name="id" value={report.id} /><button type="submit" className="icon-text-button accent">Resuelta</button></form></div>
      </li>; })}</ul>
    </section>}

    {renewals.length > 0 && <section className="elevated-section renewals-card">
      <div className="section-heading rich-heading"><span className="step warm"><IconAlertCircle /></span><div><p className="eyebrow warm-text">Renovaciones</p><h2>{renewals.length === 1 ? "1 página vence pronto" : `${renewals.length} páginas vencen pronto`}</h2></div><Link className="text-button" href="/admin/paginas?view=attention">Ver en la lista →</Link></div>
      <div className="dashboard-recent-list">{renewals.slice(0, 6).map(({ landing, status }) => <Link key={landing.id} href={`/admin/landings/${landing.id}/gestion`}><AdminPageAvatar page={landing} /><span><strong>{landing.business_name}</strong><small>{pageKindLabel(landing)}</small></span><em className={`plan-status is-${status.tone}`}>{status.label}</em></Link>)}</div>
    </section>}

    <div className="admin-action-bar">
      {!!clients?.length && <ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description="Elegí el cliente al que pertenece; el resto lo completás en el editor.">
        <LandingCreationForm clients={clients} action={newLanding} kind="custom" templates={templates} />
      </ModalTrigger>}
      {!!clients?.length && <ModalTrigger label="Nueva tarjeta personal" icon={<IconPlus />} title="Nueva tarjeta personal" description="Elegí el cliente y después completá la foto y los datos en el editor." variant="secondary">
        <LandingCreationForm clients={clients} action={newLanding} kind="contact" />
      </ModalTrigger>}
      {!!clients?.length && <ModalTrigger label="Nueva chapita de mascota" icon={<IconPlus />} title="Nueva chapita de mascota" description="Elegí el cliente (la familia) y después completá la foto y los datos en el editor." variant="secondary">
        <LandingCreationForm clients={clients} action={newLanding} kind="pet" />
      </ModalTrigger>}
      {!!clients?.length && <ModalTrigger label="Nuevo link directo" icon={<IconPlus />} title="Nuevo link directo" description="El producto abre un solo link. Queda publicado y vas directo a grabar el NFC." variant="secondary">
        <LandingCreationForm clients={clients} action={newLanding} kind="direct" />
      </ModalTrigger>}
      <ModalTrigger label="Nuevo cliente" icon={<IconPlus />} title="Nuevo cliente" description="Cada cliente funciona como una carpeta para todas sus landings y tarjetas." variant={clients?.length ? "secondary" : "primary"}>
        <ClientCreationForm action={newClient} />
      </ModalTrigger>
    </div>

    <div className="dashboard-overview-grid">
      <section className="elevated-section dashboard-overview-card">
        <div className="section-heading rich-heading"><span className="step"><IconFileText /></span><div><p className="eyebrow">Actividad reciente</p><h2>Últimas páginas</h2></div><Link className="text-button" href="/admin/paginas">Ver todas →</Link></div>
        {!landings?.length ? <div className="empty-state compact"><IconFileText /><strong>Todavía no hay páginas</strong><p className="muted">Primero creá un cliente y agregale una.</p></div> : <div className="dashboard-recent-list">{landings.slice(0, 5).map((landing) => <Link key={landing.id} href={editHref(landing)}><AdminPageAvatar page={landing} /><span><strong>{landing.business_name}</strong><small>{pageKindLabel(landing)}</small></span><em className={landing.published ? "is-live" : ""}>{landing.published ? "Publicada" : "Borrador"}</em></Link>)}</div>}
      </section>
      <section className="elevated-section dashboard-overview-card">
        <div className="section-heading rich-heading"><span className="step warm"><IconUsers /></span><div><p className="eyebrow warm-text">Organización</p><h2>Clientes recientes</h2></div><Link className="text-button" href="/admin/clientes">Ver todos →</Link></div>
        {!clients?.length ? <div className="empty-state compact"><IconUsers /><strong>Todavía no hay clientes</strong><p className="muted">Creá el primero con el botón de arriba.</p></div> : <div className="dashboard-recent-list">{clients.slice(0, 5).map((client) => <Link key={client.id} href={`/admin/clientes/${client.id}`}><div className="avatar small colorful" style={{ background: client.primary_color || "#1f2937" }}>{client.name.slice(0, 1)}</div><span><strong>{client.name}</strong><small>{landingCountByClient.get(client.id) || 0} {(landingCountByClient.get(client.id) || 0) === 1 ? "página" : "páginas"}</small></span><em>Abrir →</em></Link>)}</div>}
      </section>
    </div>
  </main>;
}
