import { createClient } from "@/lib/supabase/server";
import { newClient, newLanding, publish, deleteLanding, deleteClient } from "./actions";
import { logout } from "./login/actions";
import LandingCreationForm from "./landing-creation-form";
import DeleteClientButton from "./delete-client-button";
import DeleteLandingButton from "./delete-landing-button";
import ModalTrigger from "./modal-trigger";
import { IconPlus, IconEdit, IconEye, IconQrCode, IconPlay, IconPause, IconUsers, IconFileText, IconCheckCircle, IconLogOut, IconRocket, IconWifi, IconDroplet } from "@/components/icons";
import Toast from "@/components/toast";
import Link from "next/link";
import { Suspense } from "react";

export default async function Admin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return <main className="auth-shell"><div className="auth-card" style={{ textAlign: "center" }}><div className="auth-mark" style={{ margin: "0 auto 16px" }}>M</div><h1>Mi Landing Web Fácil</h1><p className="muted">Iniciá sesión para gestionar tus clientes y landings.</p><Link className="btn full" href="/admin/login">Ingresar</Link></div></main>;
  const [{ data: clients }, { data: landings }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("landings").select("*").order("created_at", { ascending: false }),
  ]);
  const totalClients = clients?.length || 0;
  const totalLandings = landings?.length || 0;
  const published = landings?.filter((landing) => landing.published).length || 0;
  const drafts = totalLandings - published;
  const clientById = new Map((clients || []).map((client) => [client.id, client]));
  const landingCountByClient = new Map<string, number>();
  landings?.forEach((landing) => { if (landing.client_id) landingCountByClient.set(landing.client_id, (landingCountByClient.get(landing.client_id) || 0) + 1); });
  const activeClients = Array.from(landingCountByClient.values()).filter((count) => count > 0).length;
  const publishRate = totalLandings ? Math.round((published / totalLandings) * 100) : 0;

  return <main className="shell admin-shell">
    <header className="app-header admin-hero">
      <div className="hero-copy">
        <div className="brand-lockup"><span className="brand-mark"><IconRocket /></span><p className="eyebrow">Mi Landing Web Fácil</p></div>
        <h1>Tu centro de comando</h1>
        <p className="muted">Landings, clientes y tags NFC listos para moverse sin perder tiempo.</p>
        <div className="hero-pills">
          <span><IconWifi /> NFC ready</span>
          <span><IconDroplet /> Colores por marca</span>
          <span><IconCheckCircle /> {publishRate}% publicadas</span>
        </div>
      </div>
      <form action={logout}><button className="btn secondary glass" type="submit"><IconLogOut /> Salir</button></form>
    </header>
    <Suspense fallback={null}><Toast /></Suspense>

    <section className="stats">
      <div className="stat-card"><span className="stat-icon"><IconUsers /></span><small>Clientes</small><strong>{totalClients}</strong><span>{activeClients} con landing</span></div>
      <div className="stat-card"><span className="stat-icon"><IconFileText /></span><small>Landings</small><strong>{totalLandings}</strong><span>{drafts} en borrador</span></div>
      <div className="stat-card"><span className="stat-icon"><IconCheckCircle /></span><small>Publicadas</small><strong>{published}</strong><span>{publishRate}% del total</span></div>
      <div className="stat-card"><span className="stat-icon"><IconQrCode /></span><small>Tags listos</small><strong>{published}</strong><span>con QR activo</span></div>
    </section>

    <div className="admin-action-bar">
      <ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description="Lo esencial para arrancar; el resto lo completás en el editor.">
        <LandingCreationForm clients={clients || []} action={newLanding} />
      </ModalTrigger>
      <ModalTrigger label="Nuevo cliente" icon={<IconPlus />} title="Nuevo cliente" description="Solo hace falta si querés agrupar varias landings bajo la misma persona o negocio." variant="secondary">
        <form action={newClient} className="stack"><label className="label">Nombre del negocio<input name="name" placeholder="Ej. Aurora Hotel" required /></label><label className="label">Email<input name="email" type="email" placeholder="contacto@aurorahotel.com" /></label><label className="label">WhatsApp<input name="phone" placeholder="549351XXXXXXXX" /></label><div className="color-row"><label className="label">Color principal<input name="primary_color" type="color" defaultValue="#1f2937" /></label><label className="label">Color de fondo<input name="background_color" type="color" defaultValue="#f7f5f0" /></label></div><button className="btn full" type="submit">Crear cliente</button></form>
      </ModalTrigger>
    </div>

    <section className="list-section elevated-section">
      <div className="section-heading rich-heading"><span className="step"><IconFileText /></span><div><p className="eyebrow">Tu biblioteca</p><h2>Landings</h2></div></div>
      {!landings?.length ? <div className="empty-state"><IconFileText /><strong>Todavía no creaste ninguna landing</strong><p className="muted">Usá el botón "Nueva landing" de arriba.</p></div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Landing</th><th>Cliente</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {landings.map((landing) => { const client = landing.client_id ? clientById.get(landing.client_id) : null; return (
                <tr key={landing.id}>
                  <td><div className="table-entity"><div className="avatar small colorful" style={{ background: landing.primary_color || "#1f2937" }}>{landing.logo_url ? <img src={landing.logo_url} alt="" /> : landing.business_name.slice(0, 1)}</div><div><strong>{landing.business_name}</strong><small>/{landing.slug}{landing.redirect_url && " externo"}</small></div></div></td>
                  <td>{client ? client.name : <span className="muted">Sin cliente</span>}</td>
                  <td><span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span></td>
                  <td>
                    <div className="table-actions">
                      <Link className="icon-text-button accent" href={`/admin/landings/${landing.id}/editor-v2`}><IconEdit /> Editar</Link>
                      <Link className="icon-text-button accent" href={`/${landing.slug}`} target="_blank"><IconEye /> Ver</Link>
                      <Link className="icon-text-button accent" href={`/admin/landings/${landing.id}/qr`}><IconQrCode /> QR</Link>
                      <form action={publish}><input type="hidden" name="id" value={landing.id} /><input type="hidden" name="published" value={String(!landing.published)} /><input type="hidden" name="return_to" value="/admin" /><button className={landing.published ? "icon-text-button" : "icon-text-button success"} type="submit">{landing.published ? <><IconPause /> Despublicar</> : <><IconPlay /> Publicar</>}</button></form>
                      <DeleteLandingButton action={deleteLanding} landingId={landing.id} label="Eliminar" />
                    </div>
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}
    </section>

    <section className="list-section elevated-section">
      <div className="section-heading rich-heading"><span className="step warm"><IconUsers /></span><div><p className="eyebrow warm-text">Tu biblioteca</p><h2>Clientes</h2></div></div>
      {!clients?.length ? <div className="empty-state"><IconUsers /><strong>Todavía no tenés clientes</strong><p className="muted">Usá el botón "Nuevo cliente" de arriba.</p></div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Landings</th><th></th></tr></thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td><div className="table-entity"><div className="avatar small colorful" style={{ background: client.primary_color || "#1f2937" }}>{client.name.slice(0, 1)}</div><strong>{client.name}</strong></div></td>
                  <td><span className="muted">{client.email || "Sin email"}</span></td>
                  <td>{landingCountByClient.get(client.id) || 0}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="icon-text-button accent" href={`/admin/clientes/${client.id}`}><IconEdit /> Editar</Link>
                      <DeleteClientButton action={deleteClient} clientId={client.id} clientName={client.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </main>;
}
