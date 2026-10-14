import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { assignLandingClient, deleteLanding, newLanding, publish, renameLanding } from "../actions";
import LandingCreationForm from "../landing-creation-form";
import ModalTrigger from "../modal-trigger";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconFileText, IconPlus, IconUsers } from "@/components/icons";
import { effectiveRedirect, planOf, planStatus } from "@/lib/landing-plan";
import { withAutoFallback } from "@/lib/landing-fallback";
import { templateChoices } from "@/lib/business-templates";
import PagesList, { type PageKind, type PageRow, type PageView } from "./pages-list";

type SearchParams = Promise<{ q?: string | string[]; type?: string | string[]; view?: string | string[]; renewal?: string | string[] }>;
type ViewCount = { landing_id: string; total?: number | string | null; last_30_days?: number | string | null };
const value = (item: string | string[] | undefined) => typeof item === "string" ? item : "";

export default async function PagesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialKind = (["landing", "contact", "direct"].includes(value(params.type)) ? value(params.type) : "all") as PageKind | "all";
  // renewal=due y type=unassigned son los links viejos (Inicio, aviso de páginas sin cliente).
  const initialView = (["attention", "published", "draft"].includes(value(params.view)) ? value(params.view) : value(params.renewal) === "due" || value(params.type) === "unassigned" ? "attention" : "all") as PageView;
  const initialQuery = value(params.q).trim().slice(0, 100);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");

  const [{ data: clients }, { data: allPages }, { data: viewCounts, error: viewCountsError }] = await Promise.all([
    supabase.from("clients").select("id,name").eq("owner_id", userId).order("name"),
    supabase.from("landings").select("*, actions(type,url,enabled,position)").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase.from("landing_view_counts").select("landing_id,total,last_30_days"),
  ]);
  // Las plantillas viven en su propio panel (/admin/plantillas), no en esta lista.
  const pages = (allPages || []).filter((page) => !page.template_name);
  if (viewCountsError) console.error("No se pudieron cargar las estadísticas de visitas", { code: viewCountsError.code, message: viewCountsError.message });
  const clientsById = new Map((clients || []).map((client) => [client.id, client]));
  const viewsById = new Map<string, ViewCount>((viewCounts || []).map((row) => [String(row.landing_id), row as ViewCount]));

  const rows: PageRow[] = (pages || []).map((raw) => {
    const page = withAutoFallback(raw);
    const plan = planOf(page);
    const kind: PageKind = plan === "direct" ? "direct" : page.business_type === "contact" ? "contact" : "landing";
    const status = planStatus(page);
    const client = page.client_id ? clientsById.get(page.client_id) : null;
    const views = viewsById.get(page.id);
    // Lo que pide que hagas algo, dicho como tarea. Un borrador no se cuenta: todavía no se vendió.
    const renewal = !page.published ? ""
      : status.key === "direct-missing" ? "Cargá el link que abre el producto."
      : status.key === "expiring" ? "Avisale al cliente para renovar."
      : status.key === "expired" ? (status.label.includes("falta") ? "Vencida y sin link de respaldo: avisale o cargá uno." : "Vencida: avisale, o renovala si ya pagó.")
      : "";
    const attention = [renewal, client ? "" : "Asignale un cliente."].filter(Boolean).join(" ");
    return {
      id: page.id,
      name: page.business_name,
      slug: page.slug,
      kind,
      published: Boolean(page.published),
      clientId: client?.id || null,
      clientName: client?.name || "",
      status: page.published || kind === "direct" ? { label: status.label, tone: status.tone } : { label: "Borrador", tone: "muted" },
      destination: kind === "direct" ? String(page.redirect_url || "") : String(effectiveRedirect(page) || ""),
      attention,
      views: { total: Number(views?.total) || 0, last30: Number(views?.last_30_days) || 0 },
      avatar: { business_name: page.business_name, business_type: page.business_type, logo_url: page.logo_url, logo_style: page.logo_style, primary_color: page.primary_color },
    };
  });
  const returnTo = "/admin/paginas";

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="library-page-header">
      <div><p className="eyebrow">Experiencias digitales</p><h1>Páginas</h1><p className="muted">Landings, tarjetas personales y links directos de todos tus clientes.</p></div>
      <div className="library-page-actions">{clients?.length ? <><ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description="Elegí el cliente al que pertenece."><LandingCreationForm clients={clients} action={newLanding} kind="custom" returnTo={returnTo} templates={templateChoices(allPages || [])} /></ModalTrigger><ModalTrigger label="Nueva tarjeta" icon={<IconPlus />} title="Nueva tarjeta personal" description="Elegí el cliente al que pertenece." variant="secondary"><LandingCreationForm clients={clients} action={newLanding} kind="contact" returnTo={returnTo} /></ModalTrigger><ModalTrigger label="Nuevo link directo" icon={<IconPlus />} title="Nuevo link directo" description="El producto abre un solo link. Queda publicado y vas directo a grabar el NFC." variant="secondary"><LandingCreationForm clients={clients} action={newLanding} kind="direct" returnTo={returnTo} /></ModalTrigger></> : <Link className="btn" href="/admin/clientes"><IconUsers /> Primero creá un cliente</Link>}</div>
    </header>

    {viewCountsError && <aside className="admin-assignment-warning"><IconFileText /><p><strong>No se pudieron cargar las visitas.</strong><span>Las páginas siguen funcionando, pero las estadísticas no están disponibles en este momento.</span></p></aside>}

    <section className="elevated-section">
      {!rows.length
        ? <div className="empty-state"><IconFileText /><strong>Todavía no hay páginas</strong><p className="muted">Creá un cliente y después agregale su primera landing, tarjeta o link directo.</p></div>
        : <PagesList rows={rows} clients={clients || []} initialKind={initialKind} initialView={initialView} initialQuery={initialQuery} actions={{ publish, rename: renameLanding, remove: deleteLanding, assign: assignLandingClient }} />}
    </section>
  </main>;
}
