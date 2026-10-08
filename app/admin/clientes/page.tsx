import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { newClient, deleteClient } from "../actions";
import ClientCreationForm from "../client-creation-form";
import DeleteClientButton from "../delete-client-button";
import ModalTrigger from "../modal-trigger";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconEdit, IconPlus, IconUsers } from "@/components/icons";

type SearchParams = Promise<{ q?: string | string[] }>;

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");

  const [{ data: clients }, { data: pages }] = await Promise.all([
    supabase.from("clients").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase.from("landings").select("client_id,business_type").eq("owner_id", userId),
  ]);
  const pageCount = new Map<string, { total: number; landings: number; cards: number }>();
  for (const page of pages || []) {
    if (!page.client_id) continue;
    const count = pageCount.get(page.client_id) || { total: 0, landings: 0, cards: 0 };
    count.total += 1;
    if (page.business_type === "contact") count.cards += 1;
    else count.landings += 1;
    pageCount.set(page.client_id, count);
  }
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filtered = (clients || []).filter((client) => !normalized || `${client.name} ${client.email || ""} ${client.phone || ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalized));

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="library-page-header">
      <div><p className="eyebrow">Organización</p><h1>Clientes</h1><p className="muted">Cada cliente reúne todas sus landings y tarjetas personales.</p></div>
      <ModalTrigger label="Nuevo cliente" icon={<IconPlus />} title="Nuevo cliente" description="Después vas a poder agregarle todas las landings y tarjetas que necesite."><ClientCreationForm action={newClient} returnTo="/admin/clientes" /></ModalTrigger>
    </header>

    <section className="elevated-section">
      {!!clients?.length && <form action="/admin/clientes" method="get" className="admin-library-filters compact" role="search"><label className="admin-filter-search">Buscar cliente<input name="q" type="search" defaultValue={query} placeholder="Nombre, email o WhatsApp" /></label><button className="btn" type="submit">Buscar</button>{query && <Link className="btn secondary" href="/admin/clientes">Limpiar</Link>}</form>}
      {!!clients?.length && <p className="admin-library-count">{filtered.length} de {clients.length} {clients.length === 1 ? "cliente" : "clientes"}</p>}
      {!clients?.length ? <div className="empty-state"><IconUsers /><strong>Todavía no tenés clientes</strong><p className="muted">Creá el primero para después agregar sus landings y tarjetas.</p></div> : !filtered.length ? <div className="empty-state"><IconUsers /><strong>No encontramos ese cliente</strong><p className="muted">Probá con otro nombre, email o teléfono.</p></div> : <div className="client-library-grid">{filtered.map((client) => {
        const count = pageCount.get(client.id) || { total: 0, landings: 0, cards: 0 };
        return <article className="client-library-card" key={client.id}>
          <div className="client-library-main"><div className="avatar small colorful" style={{ background: client.primary_color || "#1f2937" }}>{client.name.slice(0, 1)}</div><div><h2>{client.name}</h2><p>{client.email || client.phone || "Sin datos de contacto"}</p></div></div>
          <div className="client-library-counts"><span><strong>{count.landings}</strong> landings</span><span><strong>{count.cards}</strong> tarjetas</span></div>
          <div className="client-library-actions"><Link className="btn secondary" href={`/admin/clientes/${client.id}`}><IconEdit /> Abrir cliente</Link><DeleteClientButton action={deleteClient} clientId={client.id} clientName={client.name} returnTo="/admin/clientes" /></div>
        </article>;
      })}</div>}
    </section>
  </main>;
}
