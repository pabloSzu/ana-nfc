import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconCheckCircle, IconFileText, IconPlus, IconPaw, IconQrCode, IconShieldCheck, IconSmartphone } from "@/components/icons";
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
        <a className="btn secondary" href="#guia">Ver cómo funciona</a>
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

    <section className="elevated-section ch-guide" id="guia">
      <header className="ch-section-heading"><div><p className="eyebrow">Guía rápida</p><h2>De una chapita vacía a una mascota protegida</h2></div><span>Vos preparás el producto. El comprador carga sus propios datos.</span></header>
      <ol className="ch-flow">
        <li><span>1</span><div><strong>Generá un lote</strong><p>Elegí cuántas chapitas vas a fabricar y, si corresponde, qué veterinaria las venderá.</p></div></li>
        <li><span>2</span><div><strong>Grabá e imprimí</strong><p>Cada chapita lleva su link permanente en el NFC y el QR. En el paquete va otra tarjeta privada para activarla.</p></div></li>
        <li><span>3</span><div><strong>Vendé la chapita</strong><p>No necesitás pedirle datos al comprador. Le entregás el producto cerrado con su tarjeta de activación.</p></div></li>
        <li><span>4</span><div><strong>El comprador la activa</strong><p>Escanea la tarjeta del paquete, confirma su email y carga la foto, el WhatsApp y los datos de su mascota.</p></div></li>
      </ol>

      <div className="ch-user-journey">
        <article><IconShieldCheck /><div><strong>Primera vez: activar</strong><p>Usa el QR privado del paquete o entra a <b>bionfc.com/activar</b>. El código de 8 caracteres se usa una sola vez.</p></div></article>
        <article><IconSmartphone /><div><strong>Después: editar o marcar perdida</strong><p>Entra a <b>bionfc.com/mi/entrar</b>, escribe su email y recibe un código de 6 números. No tiene contraseña para recordar.</p></div></article>
        <article><IconPaw /><div><strong>Si alguien encuentra la mascota</strong><p>Escanea el QR o acerca el celular al NFC y ve la ficha pública. No necesita cuenta, email ni código.</p></div></article>
      </div>

      <aside className="ch-code-explainer">
        <div><span className="ch-code-sample">ABCD-2346</span><p><strong>Código de activación</strong><br />8 caracteres · está en el paquete · se usa una sola vez.</p></div>
        <div><span className="ch-code-sample is-otp">906438</span><p><strong>Código de acceso</strong><br />6 números · llega por email · vence y se pide uno nuevo cada vez.</p></div>
      </aside>

      <div className="ch-faq">
        <h3>Dudas comunes</h3>
        <details><summary>¿Qué pasa si el dueño pierde su contraseña?</summary><p>No existe contraseña. Siempre entra desde <b>bionfc.com/mi/entrar</b> y recibe un código nuevo de 6 números en su email.</p></details>
        <details><summary>¿Qué pasa si no le llega el email?</summary><p>Puede revisar Spam o Promociones y tocar “Mandar otro código”. Si sigue sin llegar, te contacta para que revises que esté usando el mismo email con el que activó.</p></details>
        <details><summary>¿Qué pasa si pierde la tarjeta de activación?</summary><p>Si todavía no activó, desde el lote tocás “Cambiar código” y le das una tarjeta nueva. Si ya activó, no pasa nada: ese código ya fue consumido y no se necesita otra vez.</p></details>
        <details><summary>¿Qué pasa si cambia o pierde el acceso a su email?</summary><p>Por seguridad no se cambia automáticamente. La familia te contacta y vos verificás el caso antes de transferir la chapita a otro email.</p></details>
        <details><summary>¿El QR y el NFC se vencen?</summary><p>No. Ambos apuntan al enlace permanente de esa chapita. La familia puede cambiar los datos y el diseño sin volver a grabarla.</p></details>
      </div>
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
