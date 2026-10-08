import { createClient } from "@/lib/supabase/server";
import { newClient, newLanding } from "./actions";
import LandingCreationForm from "./landing-creation-form";
import ClientCreationForm from "./client-creation-form";
import ModalTrigger from "./modal-trigger";
import { IconPlus, IconQrCode, IconUsers, IconFileText, IconCheckCircle, IconRocket, IconWifi, IconDroplet } from "@/components/icons";
import Toast from "@/components/toast";
import Link from "next/link";
import { Suspense } from "react";
import { AdminThemeBackdrop } from "@/components/admin-theme";

export default async function Admin() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) return <main className="auth-shell"><div className="auth-card" style={{ textAlign: "center" }}><div className="auth-mark" style={{ margin: "0 auto 16px" }}>M</div><h1>Mi Landing Web Fácil</h1><p className="muted">Iniciá sesión para gestionar tus clientes y landings.</p><Link className="btn full" href="/admin/login">Ingresar</Link></div></main>;
  const [{ data: clients }, { data: landings }] = await Promise.all([
    supabase.from("clients").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase.from("landings").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
  ]);
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

    <div className="admin-action-bar">
      {!!clients?.length && <ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description="Elegí el cliente al que pertenece; el resto lo completás en el editor.">
        <LandingCreationForm clients={clients} action={newLanding} kind="custom" />
      </ModalTrigger>}
      {!!clients?.length && <ModalTrigger label="Nueva tarjeta personal" icon={<IconPlus />} title="Nueva tarjeta personal" description="Elegí el cliente y después completá la foto y los datos en el editor." variant="secondary">
        <LandingCreationForm clients={clients} action={newLanding} kind="contact" />
      </ModalTrigger>}
      <ModalTrigger label="Nuevo cliente" icon={<IconPlus />} title="Nuevo cliente" description="Cada cliente funciona como una carpeta para todas sus landings y tarjetas." variant={clients?.length ? "secondary" : "primary"}>
        <ClientCreationForm action={newClient} />
      </ModalTrigger>
    </div>

    <div className="dashboard-overview-grid">
      <section className="elevated-section dashboard-overview-card">
        <div className="section-heading rich-heading"><span className="step"><IconFileText /></span><div><p className="eyebrow">Actividad reciente</p><h2>Últimas páginas</h2></div><Link className="text-button" href="/admin/paginas">Ver todas →</Link></div>
        {!landings?.length ? <div className="empty-state compact"><IconFileText /><strong>Todavía no hay páginas</strong><p className="muted">Primero creá un cliente y agregale una.</p></div> : <div className="dashboard-recent-list">{landings.slice(0, 5).map((landing) => <Link key={landing.id} href={`/admin/landings/${landing.id}/editor-v2`}><div className="avatar small colorful" style={{ background: landing.primary_color || "#1f2937" }}>{landing.business_name.slice(0, 1)}</div><span><strong>{landing.business_name}</strong><small>{landing.business_type === "contact" ? "Tarjeta personal" : "Landing"}</small></span><em className={landing.published ? "is-live" : ""}>{landing.published ? "Publicada" : "Borrador"}</em></Link>)}</div>}
      </section>
      <section className="elevated-section dashboard-overview-card">
        <div className="section-heading rich-heading"><span className="step warm"><IconUsers /></span><div><p className="eyebrow warm-text">Organización</p><h2>Clientes recientes</h2></div><Link className="text-button" href="/admin/clientes">Ver todos →</Link></div>
        {!clients?.length ? <div className="empty-state compact"><IconUsers /><strong>Todavía no hay clientes</strong><p className="muted">Creá el primero con el botón de arriba.</p></div> : <div className="dashboard-recent-list">{clients.slice(0, 5).map((client) => <Link key={client.id} href={`/admin/clientes/${client.id}`}><div className="avatar small colorful" style={{ background: client.primary_color || "#1f2937" }}>{client.name.slice(0, 1)}</div><span><strong>{client.name}</strong><small>{landingCountByClient.get(client.id) || 0} {(landingCountByClient.get(client.id) || 0) === 1 ? "página" : "páginas"}</small></span><em>Abrir →</em></Link>)}</div>}
      </section>
    </div>
  </main>;
}
