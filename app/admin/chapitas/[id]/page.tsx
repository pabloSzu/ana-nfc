import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import CopyButton from "@/components/copy-button";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconEdit, IconExternalLink, IconPaw, IconShieldCheck } from "@/components/icons";
import PendingSubmitButton from "@/components/pending-submit-button";
import { LuPrinter as IconPrinter } from "react-icons/lu";
import { getSiteOrigin, isLocalSite } from "@/lib/site-url";
import { parsePet } from "@/lib/pet";
import { formatCode, tagState, unitNumber, type TagState } from "@/lib/pet-tags";
import ModalTrigger from "../../modal-trigger";
import { regenerateTagCode, setBatchArchived, updateBatch } from "../actions";
import RegenerateCodeButton from "../regenerate-code-button";
import "../chapitas.css";

const STATE_LABEL = { stock: "Sin activar", active: "Activada", lost: "¡Perdida!" } as const;
const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "stock", label: "Sin activar" },
  { key: "active", label: "Activadas" },
  { key: "lost", label: "Perdidas" },
] as const;
type Filter = typeof FILTERS[number]["key"];

// Un lote: arriba, de qué lote se trata y cómo va; después qué hacer con él (imprimir, grabar,
// verificar); abajo, cada unidad con su link para grabar, su código y en qué está (con filtros).
export default async function BatchPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ver?: string }> }) {
  const { id } = await params;
  const { ver } = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const { data: batch } = await supabase.from("tag_batches").select("id,name,reseller,created_at,archived_at").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (!batch) notFound();
  const { data: tags } = await supabase.from("landings").select("id,slug,pet_slug,business_name,tag_number,activated_at,published,client_id,button_style").eq("batch_id", id).eq("owner_id", userId).order("tag_number");
  const ids = (tags || []).map((tag) => tag.id);
  const clientIds = (tags || []).map((tag) => tag.client_id).filter(Boolean) as string[];
  const [{ data: codes }, { data: members }] = await Promise.all([
    ids.length ? supabase.from("tag_activations").select("landing_id,code").in("landing_id", ids) : Promise.resolve({ data: [] }),
    clientIds.length ? supabase.from("client_members").select("client_id,email").in("client_id", clientIds) : Promise.resolve({ data: [] }),
  ]);
  const codeOf = new Map((codes || []).map((row) => [row.landing_id, row.code]));
  const emailOf = new Map((members || []).map((row) => [row.client_id, row.email]));
  const origin = getSiteOrigin();

  const rows = (tags || []).map((tag) => {
    const pet = parsePet(tag.button_style);
    return { tag, state: tagState({ activated_at: tag.activated_at, lost: pet.lost }) as TagState };
  });
  const count = (state: TagState) => rows.filter((row) => row.state === state).length;
  const counts: Record<Filter, number> = { all: rows.length, stock: count("stock"), active: count("active"), lost: count("lost") };
  const filter: Filter = FILTERS.some((item) => item.key === ver) ? ver as Filter : "all";
  const visible = filter === "all" ? rows : rows.filter((row) => row.state === filter);
  const activated = counts.active + counts.lost;
  const created = new Date(batch.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <Link className="ch-back-lots" href="/admin/chapitas"><span aria-hidden="true">←</span><strong>Volver a lotes</strong></Link>

    {/* Encabezado propio del lote (franja naranja de Mascotas): que se note que estás adentro de uno. */}
    <header className="ch-lot-head">
      <span className="ch-lot-icon" aria-hidden="true"><IconPaw /></span>
      <div className="ch-lot-title">
        <p className="ch-lot-eyebrow">Lote<span>{batch.reseller || "Venta directa"}</span><small>Creado el {created}</small></p>
        <h1>{batch.name}</h1>
      </div>
      <div className="ch-lot-side">
        <div className="ch-lot-progress">
          <strong>{activated} de {rows.length} activadas</strong>
          <div className="ch-progress"><span style={{ width: `${rows.length ? (activated / rows.length) * 100 : 0}%` }} /></div>
          <small>{counts.stock} sin activar{counts.lost ? ` · ${counts.lost} ${counts.lost === 1 ? "perdida" : "perdidas"}` : ""}</small>
        </div>
        <div className="ch-lot-manage">
          <ModalTrigger label="Editar lote" icon={<IconEdit />} title="Editar datos del lote" description="Podés corregir el nombre y el canal de venta. Las unidades y sus códigos no cambian." variant="secondary">
            <form action={updateBatch} className="stack">
              <input type="hidden" name="batchId" value={batch.id} />
              <label className="label">Nombre del lote<input name="name" maxLength={60} required defaultValue={batch.name} /></label>
              <label className="label">Veterinaria o revendedor (opcional)<input name="reseller" maxLength={60} defaultValue={batch.reseller || ""} /></label>
              <PendingSubmitButton className="btn full" pendingText="Guardando…">Guardar cambios</PendingSubmitButton>
            </form>
          </ModalTrigger>
          {!batch.archived_at && <details className="ch-lot-more">
            <summary aria-label="Más acciones del lote">•••</summary>
            <div><strong>Más acciones</strong><p>Podés ocultarlo del stock sin borrar sus unidades.</p><form action={setBatchArchived}><input type="hidden" name="batchId" value={batch.id} /><input type="hidden" name="archive" value="true" /><PendingSubmitButton pendingText="Archivando…">Archivar lote</PendingSubmitButton></form></div>
          </details>}
        </div>
      </div>
    </header>

    {batch.archived_at && <form action={setBatchArchived} className="ch-archive-bar is-archived">
      <input type="hidden" name="batchId" value={batch.id} />
      <input type="hidden" name="archive" value="false" />
      <p><strong>Este lote está archivado</strong><span>No cuenta en los totales, pero conserva todas sus chapitas y códigos.</span></p>
      <PendingSubmitButton pendingText="Restaurando…">Restaurar lote</PendingSubmitButton>
    </form>}

    {isLocalSite(origin) && <aside className="admin-assignment-warning"><IconExternalLink /><p><strong>Estás en desarrollo ({new URL(origin).host}).</strong><span>Los links y QR de esta pantalla apuntan a tu computadora: no los grabes en chapitas reales. Grabalas desde el Admin de bionfc.com.</span></p></aside>}

    {/* Lo que se hace con un lote, cada cosa con su color: imprimir (tarjetas y chapitas, en el
        mismo estudio) y, si algo se mezcló, verificar. Los links para grabar están en la tabla. */}
    <section className="ch-lot-actions" aria-label="Qué hacer con este lote">
      <Link className="ch-action is-print" href={`/admin/chapitas/${id}/imprimir?que=tarjetas`} target="_blank">
        <span className="ch-action-icon"><IconPrinter /></span>
        <strong>Impresión</strong>
        <small>Tarjetas del paquete y chapitas, listas para cortar.</small>
        <span className="ch-action-go">Abrir el estudio →</span>
      </Link>
      <Link className="ch-action is-verify" href="/admin/chapitas/verificar">
        <span className="ch-action-icon"><IconShieldCheck /></span>
        <strong>¿Se te mezclaron tarjetas y chapitas?</strong>
        <small>Escaneá cualquiera con el celu y te decimos de qué unidad es.</small>
        <span className="ch-action-go">Verificar →</span>
      </Link>
    </section>

    <section className="ch-units" id="unidades">
      <div className="ch-units-head">
        <h2>Unidades</h2>
        <nav className="ch-filters" aria-label="Filtrar unidades">
          {FILTERS.filter((item) => item.key === "all" || counts[item.key]).map((item) => <Link key={item.key} href={item.key === "all" ? `/admin/chapitas/${id}#unidades` : `/admin/chapitas/${id}?ver=${item.key}#unidades`} className={filter === item.key ? "is-active" : ""} aria-current={filter === item.key ? "true" : undefined}>{item.label}<span>{counts[item.key]}</span></Link>)}
        </nav>
      </div>
      {visible.length ? <table className="ch-table">
        <thead><tr><th>N°</th><th>Estado</th><th>Mascota / código</th><th>Link para grabar en el chip (NFC)</th><th /></tr></thead>
        <tbody>{visible.map(({ tag, state }) => {
          const nfc = `${origin}/go/${tag.id}?s=nfc`;
          return <tr key={tag.id} className={`is-${state}`}>
            <td className="ch-number">{unitNumber(tag.tag_number)}</td>
            <td><span className={`ch-state is-${state}`}>{STATE_LABEL[state]}</span></td>
            <td>{tag.activated_at
              ? <><strong>{tag.business_name || "Sin nombre todavía"}</strong><small>{emailOf.get(tag.client_id) || "—"}{tag.published ? "" : " · sin publicar"}</small></>
              : <code className="ch-code">{codeOf.has(tag.id) ? formatCode(codeOf.get(tag.id)!) : "—"}</code>}</td>
            <td><div className="ch-link"><code>{nfc.replace(/^https?:\/\//, "")}</code><CopyButton text={nfc} label="Copiar" /></div></td>
            <td><div className="ch-actions">
              {!tag.activated_at && codeOf.has(tag.id) && <RegenerateCodeButton action={regenerateTagCode} landingId={tag.id} batchId={batch.id} unit={unitNumber(tag.tag_number)} />}
              {tag.activated_at && <Link className="icon-text-button accent" href={`/admin/landings/${tag.id}/mascota`}><IconEdit /> Editar</Link>}
              {tag.published && <a className="icon-text-button" href={`/mascota/${tag.pet_slug || tag.slug}`} target="_blank" rel="noopener noreferrer"><IconExternalLink /> Ver</a>}
            </div></td>
          </tr>;
        })}</tbody>
      </table> : <p className="muted ch-units-empty">No hay unidades en este filtro.</p>}
    </section>
  </main>;
}
