import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { assignLandingClient, deleteLanding, newLanding, publish, renameLanding } from "../actions";
import LandingCreationForm from "../landing-creation-form";
import DeleteLandingButton from "../delete-landing-button";
import RenameLandingButton from "../rename-landing-button";
import ViewLandingButton from "../view-landing-button";
import ModalTrigger from "../modal-trigger";
import PendingSubmitButton from "@/components/pending-submit-button";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconEdit, IconFileText, IconPause, IconPlay, IconPlus, IconQrCode, IconUsers } from "@/components/icons";
import AssignClientButton from "../assign-client-button";

type SearchParams = Promise<{ q?: string | string[]; type?: string | string[]; status?: string | string[] }>;
type ViewCount = { landing_id: string; total?: number | string | null; last_30_days?: number | string | null; qr?: number | string | null; nfc?: number | string | null; direct?: number | string | null };
const value = (item: string | string[] | undefined) => typeof item === "string" ? item : "";
const searchable = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function VisitCount({ views }: { views?: ViewCount }) {
  const total = Number(views?.total) || 0;
  return <div className="scan-count"><div className="scan-count-summary"><strong>{total}</strong><small className="muted">{total ? `${Number(views?.last_30_days) || 0} en 30 días` : "Sin visitas"}</small></div><div className="scan-sources"><span>QR <b>{Number(views?.qr) || 0}</b></span><span>NFC <b>{Number(views?.nfc) || 0}</b></span><span>Directo <b>{Number(views?.direct) || 0}</b></span></div></div>;
}

export default async function PagesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = value(params.q).trim().slice(0, 100);
  const type = ["landing", "contact", "unassigned"].includes(value(params.type)) ? value(params.type) : "all";
  const status = ["published", "draft"].includes(value(params.status)) ? value(params.status) : "all";
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");

  const [{ data: clients }, { data: pages }, { data: viewCounts }] = await Promise.all([
    supabase.from("clients").select("id,name").eq("owner_id", userId).order("name"),
    supabase.from("landings").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase.from("landing_view_counts").select("*"),
  ]);
  const clientsById = new Map((clients || []).map((client) => [client.id, client]));
  const viewsById = new Map<string, ViewCount>((viewCounts || []).map((row) => [String(row.landing_id), row as ViewCount]));
  const normalized = searchable(query);
  const filtered = (pages || []).filter((page) => {
    if (type === "landing" && page.business_type === "contact") return false;
    if (type === "contact" && page.business_type !== "contact") return false;
    if (type === "unassigned" && page.client_id) return false;
    if (status === "published" && !page.published) return false;
    if (status === "draft" && page.published) return false;
    const clientName = page.client_id ? clientsById.get(page.client_id)?.name || "" : "";
    return !normalized || searchable(`${page.business_name} ${page.slug} ${clientName}`).includes(normalized);
  });
  const orphanCount = (pages || []).filter((page) => !page.client_id).length;
  const returnTo = "/admin/paginas";

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="library-page-header">
      <div><p className="eyebrow">Experiencias digitales</p><h1>Páginas</h1><p className="muted">Todas las landings y tarjetas personales, organizadas por cliente.</p></div>
      <div className="library-page-actions">{clients?.length ? <><ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description="Elegí el cliente al que pertenece."><LandingCreationForm clients={clients} action={newLanding} kind="custom" returnTo={returnTo} /></ModalTrigger><ModalTrigger label="Nueva tarjeta" icon={<IconPlus />} title="Nueva tarjeta personal" description="Elegí el cliente al que pertenece." variant="secondary"><LandingCreationForm clients={clients} action={newLanding} kind="contact" returnTo={returnTo} /></ModalTrigger></> : <Link className="btn" href="/admin/clientes"><IconUsers /> Primero creá un cliente</Link>}</div>
    </header>

    {orphanCount > 0 && <aside className="admin-assignment-warning"><IconUsers /><p><strong>{orphanCount} {orphanCount === 1 ? "página necesita" : "páginas necesitan"} un cliente.</strong><span>Son páginas anteriores al nuevo sistema. Podés editarlas, pero las nuevas siempre se crean dentro de un cliente.</span></p><Link href="/admin/paginas?type=unassigned">Ver pendientes</Link></aside>}

    <section className="elevated-section">
      {!!pages?.length && <form action="/admin/paginas" method="get" className="admin-library-filters" role="search"><label className="admin-filter-search">Buscar<input name="q" type="search" defaultValue={query} placeholder="Nombre, cliente o URL" /></label><label>Tipo<select name="type" defaultValue={type}><option value="all">Todas</option><option value="landing">Landings</option><option value="contact">Tarjetas personales</option>{orphanCount > 0 && <option value="unassigned">Sin cliente</option>}</select></label><label>Estado<select name="status" defaultValue={status}><option value="all">Todos</option><option value="published">Publicadas</option><option value="draft">Borradores</option></select></label><PendingSubmitButton className="btn" pendingText="Filtrando…">Filtrar</PendingSubmitButton>{(query || type !== "all" || status !== "all") && <Link className="btn secondary" href="/admin/paginas">Limpiar</Link>}</form>}
      {!!pages?.length && <p className="admin-library-count">{filtered.length} de {pages.length} {pages.length === 1 ? "página" : "páginas"}</p>}
      {!pages?.length ? <div className="empty-state"><IconFileText /><strong>Todavía no hay páginas</strong><p className="muted">Creá un cliente y después agregale su primera landing o tarjeta.</p></div> : !filtered.length ? <div className="empty-state"><IconFileText /><strong>No hay páginas con esos filtros</strong><p className="muted">Probá otra búsqueda o limpiá los filtros.</p></div> : <div className="table-wrap"><table className="data-table admin-pages-table"><thead><tr><th>Página</th><th>Cliente</th><th>Estado</th><th>Visitas</th><th></th></tr></thead><tbody>{filtered.map((page) => {
        const client = page.client_id ? clientsById.get(page.client_id) : null;
        return <tr key={page.id} className={`admin-page-row ${page.business_type === "contact" ? "is-contact" : "is-landing"}`}>
          <td><div className="table-entity"><div className="avatar small colorful" style={{ background: page.primary_color || "#1f2937" }}>{page.logo_url ? <img src={page.logo_url} alt="" /> : page.business_name.slice(0, 1)}</div><div><strong>{page.business_name}</strong><span className={`admin-page-kind${page.business_type === "contact" ? " is-contact" : ""}`}>{page.business_type === "contact" ? "Tarjeta personal" : "Landing"}</span><small>/{page.slug}</small></div></div></td>
          <td>{client ? <Link className="client-table-link" href={`/admin/clientes/${client.id}`}>{client.name}</Link> : <div className="missing-client-cell"><span className="status needs-client">Falta asignar</span>{clients?.length ? <AssignClientButton action={assignLandingClient} landingId={page.id} clients={clients} /> : <Link href="/admin/clientes">Crear cliente</Link>}</div>}</td>
          <td><span className={page.published ? "status published" : "status"}>{page.published ? "Publicada" : "Borrador"}</span></td>
          <td><VisitCount views={viewsById.get(page.id)} /></td>
          <td><div className="table-actions"><Link className="icon-text-button accent slot-edit" href={`/admin/landings/${page.id}/editor-v2`}><IconEdit /> Editar</Link><RenameLandingButton action={renameLanding} landingId={page.id} currentName={page.business_name} currentSlug={page.slug} isContact={page.business_type === "contact"} returnTo={returnTo} /><ViewLandingButton slug={page.slug} landingId={page.id} published={Boolean(page.published)} publishAction={publish} className="secondary-action slot-view" isContact={page.business_type === "contact"} returnTo={returnTo} /><Link className="icon-text-button accent secondary-action slot-qr" href={`/admin/landings/${page.id}/qr`}><IconQrCode /> <span className="btn-label">QR</span></Link><form action={publish}><input type="hidden" name="id" value={page.id} /><input type="hidden" name="published" value={String(!page.published)} /><input type="hidden" name="return_to" value={returnTo} /><PendingSubmitButton className={`${page.published ? "icon-text-button" : "icon-text-button success"} slot-publish`} pendingText={page.published ? "Quitando…" : "Publicando…"}>{page.published ? <><IconPause /> Despublicar</> : <><IconPlay /> Publicar</>}</PendingSubmitButton></form><DeleteLandingButton action={deleteLanding} landingId={page.id} label="Eliminar" className="secondary-action slot-delete" isContact={page.business_type === "contact"} returnTo={returnTo} /></div></td>
        </tr>;
      })}</tbody></table></div>}
    </section>
  </main>;
}
