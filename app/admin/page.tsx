import { createClient } from "@/lib/supabase/server";
import { newClient, newLanding, publish, renameLanding, deleteLanding, deleteClient } from "./actions";
import LandingCreationForm from "./landing-creation-form";
import DeleteClientButton from "./delete-client-button";
import DeleteLandingButton from "./delete-landing-button";
import RenameLandingButton from "./rename-landing-button";
import ViewLandingButton from "./view-landing-button";
import ModalTrigger from "./modal-trigger";
import { IconPlus, IconEdit, IconQrCode, IconPlay, IconPause, IconUsers, IconFileText, IconCheckCircle, IconRocket, IconWifi, IconDroplet } from "@/components/icons";
import Toast from "@/components/toast";
import Link from "next/link";
import { Suspense } from "react";
import { AdminThemeBackdrop } from "@/components/admin-theme";

type AdminSearchParams = Promise<{ q?: string | string[]; type?: string | string[]; status?: string | string[]; sort?: string | string[] }>;
const queryValue = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
const searchable = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });
const sortOptions = ["created_desc", "created_asc", "updated_desc", "updated_asc", "name_asc", "name_desc"] as const;
type SortOption = typeof sortOptions[number];
const timestamp = (value: string | null | undefined) => value ? Date.parse(value) || 0 : 0;

export default async function Admin({ searchParams }: { searchParams: AdminSearchParams }) {
  const params = await searchParams;
  const query = queryValue(params.q).trim().slice(0, 100);
  const type = ["landing", "contact"].includes(queryValue(params.type)) ? queryValue(params.type) : "all";
  const status = ["published", "draft"].includes(queryValue(params.status)) ? queryValue(params.status) : "all";
  const requestedSort = queryValue(params.sort);
  const sort: SortOption = sortOptions.includes(requestedSort as SortOption) ? requestedSort as SortOption
    : requestedSort === "oldest" ? "created_asc" : requestedSort === "name" ? "name_asc" : "created_desc";
  const sortHref = (nextSort: SortOption) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (type !== "all") next.set("type", type);
    if (status !== "all") next.set("status", status);
    if (nextSort !== "created_desc") next.set("sort", nextSort);
    const search = next.toString();
    return `/admin${search ? `?${search}` : ""}`;
  };
  const sortLink = (label: string, field: "name" | "created" | "updated") => {
    const active = sort.startsWith(`${field}_`);
    const nextSort: SortOption = active && sort.endsWith("asc") ? `${field}_desc` : `${field}_asc`;
    return <Link className={`admin-sort-link${active ? " is-active" : ""}`} href={sortHref(nextSort)} aria-label={`Ordenar por ${label.toLowerCase()}, ${nextSort.endsWith("asc") ? "ascendente" : "descendente"}`}>
      {label}<span aria-hidden="true">{active ? (sort.endsWith("asc") ? "↑" : "↓") : "↕"}</span>
    </Link>;
  };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="auth-shell"><div className="auth-card" style={{ textAlign: "center" }}><div className="auth-mark" style={{ margin: "0 auto 16px" }}>M</div><h1>Mi Landing Web Fácil</h1><p className="muted">Iniciá sesión para gestionar tus clientes y landings.</p><Link className="btn full" href="/admin/login">Ingresar</Link></div></main>;
  const [{ data: clients }, { data: landings }, { data: viewCounts }] = await Promise.all([
    supabase.from("clients").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("landings").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
    // Una vista agregada y no las filas crudas: una landing que anda bien va a tener miles de
    // visitas y acá solo se necesitan dos números. Si la migración todavía no se corrió, esto
    // devuelve error en vez de tirar, y la columna queda en blanco en lugar de romper el panel.
    supabase.from("landing_view_counts").select("landing_id,total,last_30_days"),
  ]);
  const viewsByLanding = new Map((viewCounts || []).map((row) => [row.landing_id as string, row]));
  const totalClients = clients?.length || 0;
  const totalPages = landings?.length || 0;
  const totalCards = landings?.filter((landing) => landing.business_type === "contact").length || 0;
  const totalLandings = totalPages - totalCards;
  const published = landings?.filter((landing) => landing.published).length || 0;
  const drafts = totalPages - published;
  const clientById = new Map((clients || []).map((client) => [client.id, client]));
  const landingCountByClient = new Map<string, number>();
  landings?.forEach((landing) => { if (landing.client_id) landingCountByClient.set(landing.client_id, (landingCountByClient.get(landing.client_id) || 0) + 1); });
  const activeClients = Array.from(landingCountByClient.values()).filter((count) => count > 0).length;
  const publishRate = totalPages ? Math.round((published / totalPages) * 100) : 0;
  const normalizedQuery = searchable(query);
  const filteredLandings = (landings || []).filter((landing) => {
    if (type === "contact" && landing.business_type !== "contact") return false;
    if (type === "landing" && landing.business_type === "contact") return false;
    if (status === "published" && !landing.published) return false;
    if (status === "draft" && landing.published) return false;
    const clientName = landing.client_id ? clientById.get(landing.client_id)?.name || "" : "";
    return !normalizedQuery || searchable(`${landing.business_name} ${landing.slug} ${clientName}`).includes(normalizedQuery);
  });
  filteredLandings.sort((a, b) => {
    if (sort.startsWith("name_")) {
      const compared = a.business_name.localeCompare(b.business_name, "es", { sensitivity: "base" });
      return (sort === "name_asc" ? compared : -compared) || a.id.localeCompare(b.id);
    }
    const field = sort.startsWith("updated_") ? "updated_at" : "created_at";
    const compared = timestamp(a[field] || a.created_at) - timestamp(b[field] || b.created_at);
    return (sort.endsWith("asc") ? compared : -compared) || a.id.localeCompare(b.id);
  });
  const hasFilters = Boolean(query || type !== "all" || status !== "all" || sort !== "created_desc");

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
      <ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description="Lo esencial para arrancar; el resto lo completás en el editor.">
        <LandingCreationForm clients={clients || []} action={newLanding} kind="custom" />
      </ModalTrigger>
      <ModalTrigger label="Nueva tarjeta personal" icon={<IconPlus />} title="Nueva tarjeta personal" description="Cargá el nombre y después completá la foto y los datos de contacto en el editor." variant="secondary">
        <LandingCreationForm clients={clients || []} action={newLanding} kind="contact" />
      </ModalTrigger>
      <ModalTrigger label="Nuevo cliente" icon={<IconPlus />} title="Nuevo cliente" description="Solo hace falta si querés agrupar varias landings bajo la misma persona o negocio." variant="secondary">
        <form action={newClient} className="stack"><label className="label">Nombre del negocio<input name="name" placeholder="Ej. Aurora Hotel" required /></label><label className="label">Email<input name="email" type="email" placeholder="contacto@aurorahotel.com" /></label><label className="label">WhatsApp<input name="phone" placeholder="549351XXXXXXXX" /></label><div className="color-row"><label className="label">Color principal<input name="primary_color" type="color" defaultValue="#1f2937" /></label><label className="label">Color de fondo<input name="background_color" type="color" defaultValue="#f7f5f0" /></label></div><button className="btn full" type="submit">Crear cliente</button></form>
      </ModalTrigger>
    </div>

    <section className="list-section elevated-section">
      <div className="section-heading rich-heading"><span className="step"><IconFileText /></span><div><p className="eyebrow">Tu biblioteca</p><h2>Mis páginas</h2></div></div>
      {!!landings?.length && <form key={`${query}-${type}-${status}-${sort}`} action="/admin" method="get" className="admin-library-filters" role="search">
        <label className="admin-filter-search">Buscar<input name="q" type="search" defaultValue={query} placeholder="Nombre, cliente o URL" /></label>
        <label>Tipo<select name="type" defaultValue={type}><option value="all">Todas</option><option value="landing">Landings</option><option value="contact">Tarjetas personales</option></select></label>
        <label>Estado<select name="status" defaultValue={status}><option value="all">Todos</option><option value="published">Publicadas</option><option value="draft">Borradores</option></select></label>
        <label>Orden<select name="sort" defaultValue={sort}><option value="created_desc">Creación: recientes</option><option value="created_asc">Creación: antiguas</option><option value="updated_desc">Edición: recientes</option><option value="updated_asc">Edición: antiguas</option><option value="name_asc">Nombre: A-Z</option><option value="name_desc">Nombre: Z-A</option></select></label>
        <button className="btn" type="submit">Filtrar</button>
        {hasFilters && <Link className="btn secondary" href="/admin">Limpiar</Link>}
      </form>}
      {!!landings?.length && <p className="admin-library-count">{filteredLandings.length} de {totalPages} {totalPages === 1 ? "página" : "páginas"}</p>}
      {!landings?.length ? <div className="empty-state"><IconFileText /><strong>Todavía no creaste ninguna página</strong><p className="muted">Empezá con “Nueva landing” o “Nueva tarjeta personal”.</p></div> : (
        !filteredLandings.length ? <div className="empty-state"><IconFileText /><strong>No hay páginas con esos filtros</strong><p className="muted">Probá otra búsqueda o limpiá los filtros.</p><Link className="btn secondary" href="/admin">Ver todas</Link></div> :
        <div className="table-wrap">
          <table className="data-table admin-pages-table">
            <thead><tr><th aria-sort={sort.startsWith("name_") ? sort === "name_asc" ? "ascending" : "descending" : undefined}>{sortLink("Página", "name")}</th><th>Cliente</th><th>Estado</th><th aria-sort={sort.startsWith("created_") ? sort === "created_asc" ? "ascending" : "descending" : undefined}>{sortLink("Creada", "created")}</th><th aria-sort={sort.startsWith("updated_") ? sort === "updated_asc" ? "ascending" : "descending" : undefined}>{sortLink("Editada", "updated")}</th><th>Escaneos</th><th></th></tr></thead>
            <tbody>
              {filteredLandings.map((landing) => { const client = landing.client_id ? clientById.get(landing.client_id) : null; return (
                <tr key={landing.id} className={`admin-page-row ${landing.business_type === "contact" ? "is-contact" : "is-landing"}`}>
                  <td><div className="table-entity"><div className="avatar small colorful" style={{ background: landing.primary_color || "#1f2937" }}>{landing.logo_url ? <img src={landing.logo_url} alt="" /> : landing.business_name.slice(0, 1)}</div><div><strong>{landing.business_name}</strong><span className={`admin-page-kind${landing.business_type === "contact" ? " is-contact" : ""}`}>{landing.business_type === "contact" ? "Tarjeta personal" : "Landing"}</span><small>/{landing.slug}{landing.redirect_url && " externo"}</small></div></div></td>
                  <td>{client ? client.name : <span className="muted">Sin cliente</span>}</td>
                  <td><span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span></td>
                  <td className="admin-date-cell"><span className="admin-mobile-cell-label">Creada</span>{landing.created_at ? <time dateTime={landing.created_at} title={dateTimeFormatter.format(new Date(landing.created_at))}>{dateFormatter.format(new Date(landing.created_at))}</time> : <span className="muted">—</span>}</td>
                  <td className="admin-date-cell"><span className="admin-mobile-cell-label">Editada</span>{landing.updated_at || landing.created_at ? <time dateTime={landing.updated_at || landing.created_at} title={dateTimeFormatter.format(new Date(landing.updated_at || landing.created_at))}>{dateFormatter.format(new Date(landing.updated_at || landing.created_at))}</time> : <span className="muted">—</span>}</td>
                  <td>{(() => { const views = viewsByLanding.get(landing.id); if (!views?.total) return <span className="muted">—</span>; return <div className="scan-count"><strong>{views.total}</strong>{views.last_30_days ? <small className="muted">{views.last_30_days} en 30 días</small> : null}</div>; })()}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="icon-text-button accent slot-edit" href={`/admin/landings/${landing.id}/editor-v2`}><IconEdit /> Editar</Link>
                      <RenameLandingButton action={renameLanding} landingId={landing.id} currentName={landing.business_name} currentSlug={landing.slug} isContact={landing.business_type === "contact"} />
                      <ViewLandingButton slug={landing.slug} landingId={landing.id} published={Boolean(landing.published)} publishAction={publish} className="secondary-action slot-view" isContact={landing.business_type === "contact"} />
                      <Link className="icon-text-button accent secondary-action slot-qr" href={`/admin/landings/${landing.id}/qr`} title="QR" aria-label="QR"><IconQrCode /> <span className="btn-label">QR</span></Link>
                      <form action={publish}><input type="hidden" name="id" value={landing.id} /><input type="hidden" name="published" value={String(!landing.published)} /><input type="hidden" name="return_to" value="/admin" /><button className={`${landing.published ? "icon-text-button" : "icon-text-button success"} slot-publish`} type="submit">{landing.published ? <><IconPause /> Despublicar</> : <><IconPlay /> Publicar</>}</button></form>
                      <DeleteLandingButton action={deleteLanding} landingId={landing.id} label="Eliminar" className="secondary-action slot-delete" isContact={landing.business_type === "contact"} />
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
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Páginas</th><th></th></tr></thead>
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
