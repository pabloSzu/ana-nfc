import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import CopyButton from "@/components/copy-button";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconEdit, IconExternalLink } from "@/components/icons";
import { getSiteOrigin, isLocalSite } from "@/lib/site-url";
import { parsePet } from "@/lib/pet";
import { formatCode, tagState } from "@/lib/pet-tags";
import "../chapitas.css";

const STATE_LABEL = { stock: "Sin activar", active: "Activada", lost: "¡Perdida!" } as const;

// Un lote: cada chapita con su link para grabar, su código y en qué está.
export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const { data: batch } = await supabase.from("tag_batches").select("id,name,reseller,created_at").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (!batch) notFound();
  const { data: tags } = await supabase.from("landings").select("id,slug,business_name,tag_number,activated_at,published,client_id,button_style").eq("batch_id", id).eq("owner_id", userId).order("tag_number");
  const ids = (tags || []).map((tag) => tag.id);
  const clientIds = (tags || []).map((tag) => tag.client_id).filter(Boolean) as string[];
  const [{ data: codes }, { data: members }] = await Promise.all([
    ids.length ? supabase.from("tag_activations").select("landing_id,code").in("landing_id", ids) : Promise.resolve({ data: [] }),
    clientIds.length ? supabase.from("client_members").select("client_id,email").in("client_id", clientIds) : Promise.resolve({ data: [] }),
  ]);
  const codeOf = new Map((codes || []).map((row) => [row.landing_id, row.code]));
  const emailOf = new Map((members || []).map((row) => [row.client_id, row.email]));
  const origin = getSiteOrigin();
  const active = (tags || []).filter((tag) => tag.activated_at).length;

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <Link className="back-link" href="/admin/chapitas">← Chapitas</Link>
    <header className="library-page-header">
      <div><p className="eyebrow">{batch.reseller || "Venta directa"}</p><h1>{batch.name}</h1><p className="muted">{active} de {tags?.length || 0} activadas. Grabá en cada chapita su link NFC y su QR, y poné en el paquete la tarjetita con su código.</p></div>
      <div className="library-page-actions">
        <Link className="btn" href={`/admin/chapitas/${id}/imprimir?que=tarjetas`} target="_blank">Imprimir tarjetitas</Link>
        <Link className="btn secondary" href={`/admin/chapitas/${id}/imprimir?que=qr`} target="_blank">Imprimir QR</Link>
      </div>
    </header>
    {isLocalSite(origin) && <aside className="admin-assignment-warning"><IconExternalLink /><p><strong>Estás en desarrollo ({new URL(origin).host}).</strong><span>Los links y QR de esta pantalla apuntan a tu computadora: no los grabes en chapitas reales. Grabalas desde el Admin de bionfc.com.</span></p></aside>}

    <section className="elevated-section">
      <table className="ch-table">
        <thead><tr><th>N°</th><th>Estado</th><th>Mascota / código</th><th>Link para grabar (NFC)</th><th /></tr></thead>
        <tbody>{(tags || []).map((tag) => {
          const pet = parsePet(tag.button_style);
          const state = tagState({ activated_at: tag.activated_at, lost: pet.lost });
          const nfc = `${origin}/go/${tag.id}?s=nfc`;
          return <tr key={tag.id} className={`is-${state}`}>
            <td className="ch-number">{tag.tag_number}</td>
            <td><span className={`ch-state is-${state}`}>{STATE_LABEL[state]}</span></td>
            <td>{tag.activated_at
              ? <><strong>{tag.business_name || "Sin nombre todavía"}</strong><small>{emailOf.get(tag.client_id) || "—"}{tag.published ? "" : " · sin publicar"}</small></>
              : <code className="ch-code">{codeOf.has(tag.id) ? formatCode(codeOf.get(tag.id)!) : "—"}</code>}</td>
            <td><div className="ch-link"><code>{nfc.replace(/^https?:\/\//, "")}</code><CopyButton text={nfc} label="Copiar" /></div></td>
            <td className="ch-actions">
              {tag.activated_at && <Link className="icon-text-button accent" href={`/admin/landings/${tag.id}/mascota`}><IconEdit /> Editar</Link>}
              {tag.published && <a className="icon-text-button" href={`/${tag.slug}`} target="_blank" rel="noopener noreferrer"><IconExternalLink /> Ver</a>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </section>
  </main>;
}
