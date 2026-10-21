import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconCheckCircle, IconFileText, IconPlay, IconPlus, IconPaw, IconQrCode } from "@/components/icons";
import PendingSubmitButton from "@/components/pending-submit-button";
import { BATCH_MAX } from "@/lib/pet-tags";
import ModalTrigger from "../modal-trigger";
import { createBatch } from "./actions";
import "./chapitas.css";

// Admin → Chapitas: lotes de chapitas para vender en la calle o dejar en veterinarias. Cada
// chapita la activa el comprador con el código de su tarjetita (ver /activar).
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
      <div><p className="eyebrow ch-eyebrow"><IconPaw /> BIONFC Mascotas</p><h1>Chapitas</h1><p className="muted">Acá preparás los lotes, imprimís el material y ves cuáles ya activaron los compradores.</p></div>
      <div className="library-page-actions">
        <Link className="btn secondary" href="/admin/chapitas/tutorial"><IconPlay /> Ver tutorial</Link>
        <ModalTrigger label="Generar lote" icon={<IconPlus />} title="Generar lote de chapitas" description="Se crean vacías y sin publicar, cada una con su código de activación.">
          <form action={createBatch} className="stack">
            <label className="label">Nombre del lote<input name="name" maxLength={60} required placeholder="Ej. Calle · octubre" /></label>
            <label className="label">Veterinaria o revendedor (opcional)<input name="reseller" maxLength={60} placeholder="Ej. Veterinaria Patitas" /><small className="field-help">Para saber cuántas vendió cada uno.</small></label>
            <label className="label">Cantidad<input name="count" type="number" min={1} max={BATCH_MAX} defaultValue={10} required /></label>
            <PendingSubmitButton className="btn full" pendingText="Generando…">Generar</PendingSubmitButton>
          </form>
        </ModalTrigger>
      </div>
    </header>

    <section className="ch-overview" aria-label="Resumen de chapitas">
      <article><span className="ch-overview-icon"><IconQrCode /></span><small>Total preparadas</small><strong>{totals.total}</strong></article>
      <article><span className="ch-overview-icon is-stock"><IconFileText /></span><small>Disponibles para vender</small><strong>{stock}</strong></article>
      <article><span className="ch-overview-icon is-active"><IconCheckCircle /></span><small>Activadas por clientes</small><strong>{totals.active}</strong></article>
    </section>

    <section className="elevated-section ch-tutorial-card" aria-labelledby="tutorial-title">
      <div className="ch-tutorial-copy">
        <p className="eyebrow">¿Es tu primera vez?</p>
        <h2 id="tutorial-title">Mirá el recorrido completo antes de fabricar</h2>
        <p>Te mostramos qué imprimís, qué grabás en el NFC, qué recibe el comprador y qué ve quien encuentra la mascota.</p>
        <Link className="btn" href="/admin/chapitas/tutorial"><IconPlay /> Ver tutorial paso a paso</Link>
      </div>
      <Image src="/images/bionfc/tutorial-chapitas.webp" alt="Chapita NFC, paquete de activación y ficha de la mascota en un celular" width={1600} height={534} priority />
    </section>

    {!batches?.length ? <section className="elevated-section ch-empty">
      <h2>Todavía no hay lotes</h2>
      <p className="muted">Empezá con un lote chico de prueba. Podés generar una sola chapita para recorrer todo el proceso antes de fabricar más.</p>
    </section> : <ul className="ch-batches">{batches.map((batch) => {
      const count = counts.get(batch.id) || { total: 0, active: 0 };
      return <li key={batch.id}><Link href={`/admin/chapitas/${batch.id}`}>
        <div><strong>{batch.name}</strong><small>{batch.reseller || "Venta directa"} · {new Date(batch.created_at).toLocaleDateString("es-AR")}</small></div>
        <div className="ch-progress" aria-label={`${count.active} de ${count.total} activadas`}><span style={{ width: `${count.total ? (count.active / count.total) * 100 : 0}%` }} /></div>
        <em>{count.active} de {count.total} activadas</em>
      </Link></li>;
    })}</ul>}
  </main>;
}
