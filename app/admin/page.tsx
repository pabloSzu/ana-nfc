import { createClient } from "@/lib/supabase/server";
import { newClient, newLanding, publish, deleteLanding, deleteClient } from "./actions";
import { logout } from "./login/actions";
import LandingCreationForm from "./landing-creation-form";
import DeleteClientButton from "./delete-client-button";
import DeleteLandingButton from "./delete-landing-button";
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
  return <main className="shell">
    <header className="app-header"><div><p className="eyebrow">Mi Landing Web Fácil</p><h1>Tu espacio de landings</h1><p className="muted">Gestioná tus clientes y sus landings.</p></div><form action={logout}><button className="icon-button" aria-label="Salir">↗</button></form></header>
    {params.error && <div className="error">{params.error}</div>}{params.success && <div className="success">{params.success}</div>}{params.saved && <div className="success">{params.saved}</div>}
    <section className="stats"><div><strong>{clients?.length || 0}</strong><span>Clientes</span></div><div><strong>{landings?.length || 0}</strong><span>Landings</span></div><div><strong>{published}</strong><span>Publicadas</span></div></section>
    <div className="admin-sections">
      <section className="card form-card"><div className="section-heading"><span className="step">01</span><div><h2>Nuevo cliente</h2><p className="muted">Definí la identidad inicial.</p></div></div><form action={newClient} className="stack"><label className="label">Nombre del negocio<input name="name" placeholder="Ej. Aurora Hotel" required /></label><label className="label">Email<input name="email" type="email" placeholder="contacto@aurorahotel.com" /></label><label className="label">WhatsApp<input name="phone" placeholder="549351XXXXXXXX" /></label><div className="color-row"><label className="label">Color principal<input name="primary_color" type="color" defaultValue="#1f2937" /></label><label className="label">Color de fondo<input name="background_color" type="color" defaultValue="#f7f5f0" /></label></div><button className="btn full" type="submit">+ Crear cliente</button></form></section>
      <section className="card form-card"><div className="section-heading"><span className="step">02</span><div><h2>Nueva landing</h2><p className="muted">Elegí un perfil y personalizalo después.</p></div></div><LandingCreationForm clients={clients || []} action={newLanding} /></section>
    </div>
    <section className="list-section"><div className="section-heading"><div><p className="eyebrow">Tu biblioteca</p><h2>Clientes y landings</h2></div></div><div className="entity-list">{!clients?.length && <div className="empty-state"><span>📋</span><strong>Todavía no tenés clientes</strong><p className="muted">Creá el primero con el formulario de arriba.</p></div>}{clients?.map((client) => { const clientLandings = landings?.filter((landing) => landing.client_id === client.id) || []; return <article className="entity-card" key={client.id}><div className="entity-top"><div className="avatar small" style={{ background: client.primary_color || "#1f2937" }}>{client.name.slice(0, 1)}</div><div><h3>{client.name}</h3><p className="muted">{client.email || "Sin email"}</p><span className="status published">{clientLandings.length} {clientLandings.length === 1 ? "landing" : "landings"} · Activo</span></div><DeleteClientButton action={deleteClient} clientId={client.id} clientName={client.name} /></div>{clientLandings.map((landing) => <div className="landing-row" key={landing.id}><div><strong>{landing.business_name}</strong><span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span></div><div className="row-actions"><Link className="text-button" href={`/admin/landings/${landing.id}`}>Editar</Link><Link className="text-button" href={`/${landing.slug}`} target="_blank">Ver ↗</Link><form action={publish}><input type="hidden" name="id" value={landing.id} /><input type="hidden" name="published" value={String(!landing.published)} /><input type="hidden" name="return_to" value="/admin" /><button className="text-button" type="submit">{landing.published ? "Despublicar" : "Publicar"}</button></form><DeleteLandingButton action={deleteLanding} /></div></div>)}<Link className="subtle-link" href={`/admin/clientes/${client.id}`}>Ver cliente y todas sus landings →</Link></article>; })}</div></section>
  </main>;
}
