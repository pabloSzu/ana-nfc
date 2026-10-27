import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconHeart, IconPlus, IconPaw, IconQrCode } from "@/components/icons";
import PendingSubmitButton from "@/components/pending-submit-button";
import { BATCH_MAX } from "@/lib/pet-tags";
import ModalTrigger from "../modal-trigger";
import { createBatch } from "./actions";
import MascotasNav from "./mascotas-nav";
import "./chapitas.css";

// Admin → Mascotas: dos mundos, cada uno con su color. Los lotes (naranja) son las chapitas físicas
// que se fabrican y venden; las mascotas activadas (verde) son las páginas que armaron los
// compradores al activar la suya con el código de la tarjeta (ver /activar).
export default async function BatchesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const [{ data: batches }, { data: batchCounts }] = await Promise.all([
    supabase.from("tag_batches").select("id,name,reseller,created_at").eq("owner_id", userId).order("created_at", { ascending: false }),
    // Contado en la base: traer todas las chapitas para contarlas se cortaría a las 1.000.
    supabase.rpc("tag_batch_counts"),
  ]);
  const counts = new Map<string, { total: number; active: number }>();
  for (const row of (batchCounts || []) as { batch_id: string; total: number; active: number }[]) {
    counts.set(row.batch_id, { total: Number(row.total), active: Number(row.active) });
  }
  const totals = Array.from(counts.values()).reduce((sum, count) => ({ total: sum.total + count.total, active: sum.active + count.active }), { total: 0, active: 0 });
  const stock = totals.total - totals.active;

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="library-page-header">
      <div><p className="eyebrow ch-eyebrow"><IconPaw /> BIONFC Mascotas</p><h1>Mascotas</h1><p className="muted">Fabricá chapitas en lotes para vender y seguí las mascotas que ya las activaron.</p></div>
    </header>
    <MascotasNav active="stock" />

    {/* Los dos mundos, lado a lado: lo que fabricás (lotes) y lo que ya está en uso (mascotas). */}
    <section className="ch-worlds" aria-label="Lotes y mascotas">
      <article className="ch-world is-lots">
        <span className="ch-world-icon"><IconQrCode /></span>
        <div className="ch-world-copy"><strong>Lotes de chapitas</strong><small>Las chapitas físicas que fabricás para vender. Cada lote tiene sus tarjetas, sus chapitas y sus códigos.</small></div>
        <dl className="ch-world-stats"><div><dt>Para vender</dt><dd>{stock}</dd></div><div><dt>Fabricadas</dt><dd>{totals.total}</dd></div></dl>
        <ModalTrigger label="Nuevo lote" icon={<IconPlus />} title="Nuevo lote de chapitas" description="Se crean vacías y sin publicar, cada una con su código de activación.">
          <form action={createBatch} className="stack">
            <label className="label">Nombre del lote<input name="name" maxLength={60} required placeholder="Ej. Calle · octubre" /></label>
            <label className="label">Veterinaria o revendedor (opcional)<input name="reseller" maxLength={60} placeholder="Ej. Veterinaria Patitas" /><small className="field-help">Para saber cuántas vendió cada uno.</small></label>
            <label className="label">Cantidad<input name="count" type="number" min={1} max={BATCH_MAX} defaultValue={10} required /></label>
            <PendingSubmitButton className="btn full" pendingText="Generando…">Crear lote</PendingSubmitButton>
          </form>
        </ModalTrigger>
      </article>
      <Link className="ch-world is-pets" href="/admin/chapitas/fichas">
        <span className="ch-world-icon"><IconHeart /></span>
        <div className="ch-world-copy"><strong>Mascotas activadas</strong><small>Cuando alguien activa su chapita, carga los datos de su mascota y aparece acá. Podés ver y editar cada una.</small></div>
        <dl className="ch-world-stats"><div><dt>Activadas</dt><dd>{totals.active}</dd></div></dl>
        <span className="ch-world-go">Ver mascotas →</span>
      </Link>
    </section>

    <div className="ch-lots-head"><h2>Tus lotes</h2>{!!batches?.length && <span>{batches.length}</span>}</div>
    {!batches?.length ? <section className="ch-lots-empty">
      <strong>Todavía no hay lotes</strong>
      <p>Empezá con un lote chico de prueba: podés crear una sola chapita para recorrer todo el proceso antes de fabricar más.</p>
    </section> : <ul className="ch-batches">{batches.map((batch) => {
      const count = counts.get(batch.id) || { total: 0, active: 0 };
      const forSale = count.total - count.active;
      return <li key={batch.id}><Link href={`/admin/chapitas/${batch.id}`} className={count.total ? "" : "is-empty"}>
        <span className="ch-batch-icon" aria-hidden="true"><IconPaw /></span>
        <div className="ch-batch-name"><strong>{batch.name}</strong><small><span>{batch.reseller || "Venta directa"}</span>{new Date(batch.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}</small></div>
        {count.total ? <div className="ch-batch-counts">
          <span className="is-sale">{forSale} para vender</span>
          <span className="is-active">{count.active} {count.active === 1 ? "activada" : "activadas"}</span>
          <div className="ch-progress" aria-label={`${count.active} de ${count.total} activadas`}><span style={{ width: `${(count.active / count.total) * 100}%` }} /></div>
        </div> : <div className="ch-batch-counts"><span>Sin chapitas</span></div>}
        <span className="ch-batch-go" aria-hidden="true">→</span>
      </Link></li>;
    })}</ul>}
  </main>;
}
