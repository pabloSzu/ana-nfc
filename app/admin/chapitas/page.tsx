import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconPlus } from "@/components/icons";
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
  const [{ data: batches }, { data: tags }] = await Promise.all([
    supabase.from("tag_batches").select("id,name,reseller,created_at").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase.from("landings").select("batch_id,activated_at").eq("owner_id", userId).not("batch_id", "is", null),
  ]);
  const counts = new Map<string, { total: number; active: number }>();
  for (const tag of tags || []) {
    const count = counts.get(tag.batch_id) || { total: 0, active: 0 };
    count.total += 1;
    if (tag.activated_at) count.active += 1;
    counts.set(tag.batch_id, count);
  }

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="library-page-header">
      <div><p className="eyebrow">Para vender</p><h1>Chapitas</h1><p className="muted">Lotes de chapitas de mascota listas para vender. El comprador la activa solo con el código de la tarjetita: vos no configurás nada.</p></div>
      <div className="library-page-actions">
        <ModalTrigger label="Generar lote" icon={<IconPlus />} title="Generar lote de chapitas" description="Se crean vacías y sin publicar, cada una con su código de activación.">
          <form action={createBatch} className="stack">
            <label className="label">Nombre del lote<input name="name" maxLength={60} required placeholder="Ej. Calle · octubre" /></label>
            <label className="label">Veterinaria o revendedor (opcional)<input name="reseller" maxLength={60} placeholder="Ej. Veterinaria Patitas" /><small className="field-help">Para saber cuántas vendió cada uno.</small></label>
            <label className="label">Cantidad<input name="count" type="number" min={1} max={BATCH_MAX} defaultValue={10} required /></label>
            <label className="label">Plan<select name="plan" defaultValue="lifetime"><option value="lifetime">Sin vencimiento</option><option value="annual">Anual · se renueva cada año</option></select></label>
            <PendingSubmitButton className="btn full" pendingText="Generando…">Generar</PendingSubmitButton>
          </form>
        </ModalTrigger>
      </div>
    </header>

    {!batches?.length ? <section className="elevated-section ch-empty">
      <h2>Todavía no hay lotes</h2>
      <ol className="ch-steps">
        <li><strong>Generá un lote</strong> con la cantidad de chapitas que vas a grabar.</li>
        <li><strong>Grabá cada chapita</strong> con su QR y su chip, e imprimí las tarjetitas con los códigos para el paquete.</li>
        <li><strong>Vendela.</strong> El comprador escanea, pone el código, entra con su email y carga los datos de su mascota.</li>
      </ol>
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
