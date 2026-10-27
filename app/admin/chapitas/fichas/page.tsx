import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { parsePet } from "@/lib/pet";
import MascotasNav from "../mascotas-nav";
import "../chapitas.css";

const PAGE_SIZE = 40;

export default async function PetProfilesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const query = String(params.q || "").trim().slice(0, 60);
  const page = Math.max(1, Math.min(1000, Number.parseInt(String(params.page || "1"), 10) || 1));
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");

  let request = supabase.from("landings")
    .select("id,business_name,slug,pet_slug,batch_id,tag_number,activated_at,published,blocked_at,client_id,button_style,created_at", { count: "exact" })
    .eq("owner_id", userId)
    .eq("business_type", "pet")
    .is("pet_archived_at", null)
    .or("batch_id.is.null,activated_at.not.is.null")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (query) request = request.ilike("business_name", `%${query}%`);
  const { data: pets, count, error } = await request;
  const clientIds = [...new Set((pets || []).map((pet) => pet.client_id).filter((id): id is string => Boolean(id)))];
  const batchIds = [...new Set((pets || []).map((pet) => pet.batch_id).filter((id): id is string => Boolean(id)))];
  const [{ data: clients }, { data: batches }] = await Promise.all([
    clientIds.length ? supabase.from("clients").select("id,name").eq("owner_id", userId).in("id", clientIds) : Promise.resolve({ data: [] }),
    batchIds.length ? supabase.from("tag_batches").select("id,name").eq("owner_id", userId).in("id", batchIds) : Promise.resolve({ data: [] }),
  ]);
  const clientNames = new Map((clients || []).map((client) => [client.id, client.name]));
  const batchNames = new Map((batches || []).map((batch) => [batch.id, batch.name]));
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  const pageHref = (target: number) => `/admin/chapitas/fichas?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(target) })}`;

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <header className="library-page-header ch-pets-head">
      <div><p className="eyebrow">BIONFC Mascotas</p><h1>Mascotas activadas</h1><p className="muted">Las mascotas de quienes ya activaron su chapita: podés ver y editar cada una. Las chapitas sin vender están en «Lotes».</p></div>
      <div className="library-page-actions"><Link className="btn secondary" href="/admin/chapitas">Ver lotes</Link></div>
    </header>
    <MascotasNav active="fichas" />
    <section className="elevated-section ch-profiles">
      <div className="ch-profiles-head"><div><h2>{count || 0} {(count || 0) === 1 ? "mascota" : "mascotas"}</h2><p>También aparecen las que se crearon a mano antes de los lotes; no hace falta crear una para cada venta.</p></div><form method="get" role="search"><label className="sr-only" htmlFor="pet-search">Buscar mascota</label><input id="pet-search" type="search" name="q" defaultValue={query} placeholder="Buscar por nombre…" /><button className="btn secondary" type="submit">Buscar</button></form></div>
      {error ? <p className="ch-profiles-empty" role="alert">No se pudieron cargar las mascotas. Probá de nuevo.</p>
        : !pets?.length ? <p className="ch-profiles-empty">{query ? "No hay mascotas con ese nombre." : "Todavía no hay mascotas activadas. Creá un lote de prueba y activá una chapita para ver el recorrido."}</p>
        : <ul className="ch-profile-list">{pets.map((pet) => {
          const lost = parsePet(pet.button_style).lost;
          const label = pet.blocked_at ? "Pausada" : !pet.published ? "Sin publicar" : lost ? "Perdida" : "Publicada";
          const publicSlug = pet.pet_slug || pet.slug;
          return <li key={pet.id}>
            <div className="ch-profile-mark" aria-hidden="true">🐾</div>
            <div className="ch-profile-details"><strong>{pet.business_name || "Sin nombre todavía"}</strong><small>{pet.client_id ? clientNames.get(pet.client_id) || "Familia sin nombre" : "Sin familia asignada"}</small><small>{pet.batch_id ? `${batchNames.get(pet.batch_id) || "Tanda"} · unidad ${pet.tag_number || "—"}` : "Creada a mano"}</small></div>
            <span className={`ch-profile-status${pet.published && !pet.blocked_at ? " is-live" : ""}`}>{label}</span>
            <div className="ch-profile-actions"><Link className="btn secondary" href={`/admin/landings/${pet.id}/mascota`}>Editar</Link>{pet.published && !pet.blocked_at && <a href={`/mascota/${publicSlug}`} target="_blank" rel="noopener noreferrer">Ver pública ↗</a>}</div>
          </li>;
        })}</ul>}
      {!error && totalPages > 1 && <nav className="ch-profile-pages" aria-label="Páginas de fichas">{page > 1 ? <Link href={pageHref(page - 1)}>← Anterior</Link> : <span />}{page} de {totalPages}{page < totalPages ? <Link href={pageHref(page + 1)}>Siguiente →</Link> : <span />}</nav>}
    </section>
  </main>;
}
