import { createClient } from "@/lib/supabase/server";
import { newClient, newLanding, publish, deleteLanding, deleteClient } from "./actions";
import { logout } from "./login/actions";
import LandingCreationForm from "./landing-creation-form";
import DeleteClientButton from "./delete-client-button";
import DeleteLandingButton from "./delete-landing-button";
import ModalTrigger from "./modal-trigger";
import { IconPlus, IconEdit, IconEye, IconQrCode, IconPlay, IconPause, IconUsers, IconFileText, IconCheckCircle, IconLogOut } from "@/components/icons";
import Link from "next/link";

export default async function Admin({ searchParams }: { searchParams: Promise<{ error?: string; success?: string; saved?: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return <main className="auth-shell"><div className="auth-card" style={{ textAlign: "center" }}><div className="auth-mark" style={{ margin: "0 auto 16px" }}>M</div><h1>Mi Landing Web Fácil</h1><p className="muted">Iniciá sesión para gestionar tus clientes y landings.</p><Link className="btn full" href="/admin/login">Ingresar</Link></div></main>;
  const [{ data: clients }, { data: landings }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("landings").select("*").order("created_at", { ascending: false }),
  ]);
  const params = await searchParams;
  const published = landings?.filter((landing) => landing.published).length || 0;
  const clientById = new Map((clients || []).map((client) => [client.id, client]));
  const landingCountByClient = new Map<string, number>();
  landings?.forEach((landing) => { if (landing.client_id) landingCountByClient.set(landing.client_id, (landingCountByClient.get(landing.client_id) || 0) + 1); });

  return <main className="shell">
    <header className="app-header"><div><p className="eyebrow">Mi Landing Web Fácil</p><h1>Tu espacio de landings</h1><p className="muted">Creá y gestioná las landings para tus tags NFC.</p></div><form action={logout}><button className="btn secondary" type="submit"><IconLogOut /> Salir</button></form></header>
    {params.error && <div className="error">{params.error}</div>}{params.success && <div className="success">{params.success}</div>}{params.saved && <div className="success">{params.saved}</div>}

    <section className="stats"><div><strong>{clients?.length || 0}</strong><span><IconUsers /> Clientes</span></div><div><strong>{landings?.length || 0}</strong><span><IconFileText /> Landings</span></div><div><strong>{published}</strong><span><IconCheckCircle /> Publicadas</span></div></section>

    <div className="row-actions" style={{ marginBottom: "var(--space-6)" }}>
      <ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description="Lo esencial para arrancar; el resto lo completás en el editor.">
        <LandingCreationForm clients={clients || []} action={newLanding} />
      </ModalTrigger>
      <ModalTrigger label="Nuevo cliente" icon={<IconPlus />} title="Nuevo cliente" description="Solo hace falta si querés agrupar varias landings bajo la misma persona o negocio." variant="secondary">
        <form action={newClient} className="stack"><label className="label">Nombre del negocio<input name="name" placeholder="Ej. Aurora Hotel" required /></label><label className="label">Email<input name="email" type="email" placeholder="contacto@aurorahotel.com" /></label><label className="label">WhatsApp<input name="phone" placeholder="549351XXXXXXXX" /></label><div className="color-row"><label className="label">Color principal<input name="primary_color" type="color" defaultValue="#1f2937" /></label><label className="label">Color de fondo<input name="background_color" type="color" defaultValue="#f7f5f0" /></label></div><button className="btn full" type="submit">Crear cliente</button></form>
      </ModalTrigger>
    </div>

    <section className="list-section">
      <div className="section-heading"><div><p className="eyebrow">Tu biblioteca</p><h2>Landings</h2></div></div>
      {!landings?.length ? <div className="empty-state"><IconFileText /><strong>Todavía no creaste ninguna landing</strong><p className="muted">Usá el botón "Nueva landing" de arriba.</p></div> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Landing</th><th>Cliente</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {landings.map((landing) => { const client = landing.client_id ? clientById.get(landing.client_id) : null; return (
                <tr key={landing.id}>
                  <td><div className="table-entity"><div className="avatar small" style={{ background: landing.primary_color || "#1f2937" }}>{landing.logo_url ? <img src={landing.logo_url} alt="" /> : landing.business_name.slice(0, 1)}</div><div><strong>{landing.business_name}</strong><small>/{landing.slug}{landing.redirect_url && " ↗ externo"}</small></div></div></td>
                  <td>{client ? client.name : <span className="muted">Sin cliente</span>}</td>
                  <td><span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span></td>
                  <td>
                    <div className="table-actions">
                      <Link className="icon-text-button" href={`/admin/landings/${landing.id}`}><IconEdit /> Editar</Link>
                      <Link className="icon-text-button" href={`/${landing.slug}`} target="_blank"><IconEye /> Ver</Link>
                      <Link className="icon-text-button" href={`/admin/landings/${landing.id}/qr`}><IconQrCode /> QR</Link>
                      <form action={publish}><input type="hidden" name="id" value={landing.id} /><input type="hidden" name="published" value={String(!landing.published)} /><input type="hidden" name="return_to" value="/admin" /><button className="icon-text-button accent" type="submit">{landing.published ? <><IconPause /> Despublicar</> : <><IconPlay /> Publicar</>}</button></form>
                      <DeleteLandingButton action={deleteLanding} label="Eliminar" />
                    </div>
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      )}
    </section>

    <details className="advanced-actions list-section">
      <summary><IconUsers /> Clientes ({clients?.length || 0}) — agrupá landings de la misma persona o negocio</summary>
      {!clients?.length ? <div className="empty-state"><IconUsers /><strong>Todavía no tenés clientes</strong><p className="muted">Usá el botón "Nuevo cliente" de arriba.</p></div> : (
        <div className="table-wrap" style={{ marginTop: "var(--space-4)" }}>
          <table className="data-table">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Landings</th><th></th></tr></thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td><div className="table-entity"><div className="avatar small" style={{ background: client.primary_color || "#1f2937" }}>{client.name.slice(0, 1)}</div><strong>{client.name}</strong></div></td>
                  <td><span className="muted">{client.email || "Sin email"}</span></td>
                  <td>{landingCountByClient.get(client.id) || 0}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="icon-text-button" href={`/admin/clientes/${client.id}`}><IconEdit /> Editar</Link>
                      <DeleteClientButton action={deleteClient} clientId={client.id} clientName={client.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  </main>;
}
