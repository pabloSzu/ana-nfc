"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import AdminPageAvatar, { type AdminPageAvatarData } from "@/components/admin-page-avatar";
import PendingSubmitButton from "@/components/pending-submit-button";
import { IconAlertCircle, IconCalendar, IconEdit, IconEye, IconLink, IconPause, IconPlay, IconQrCode } from "@/components/icons";
import RenameLandingButton from "../rename-landing-button";
import ViewLandingButton from "../view-landing-button";
import DeleteLandingButton from "../delete-landing-button";
import AssignClientButton from "../assign-client-button";
import CopyButton from "@/components/copy-button";
import type { PlanTone } from "@/lib/landing-plan";
import { PAGE_SORTS, relativeDay, shortDate, sortPages, type PageSort } from "@/lib/page-sort";

type Action = (fd: FormData) => void | Promise<void>;
export type PageKind = "landing" | "contact" | "pet" | "direct";
export type PageView = "all" | "attention" | "published" | "draft";

export type PageRow = {
  id: string;
  name: string;
  slug: string;
  kind: PageKind;
  published: boolean;
  clientId: string | null;
  clientName: string;
  status: { label: string; tone: PlanTone };
  destination: string;
  attention: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  views: { total: number; last30: number };
  avatar: AdminPageAvatarData;
};

const KINDS: { value: PageKind | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "landing", label: "Landings" },
  { value: "contact", label: "Tarjetas" },
  { value: "direct", label: "Links directos" },
];

const VIEWS: { value: PageView; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "attention", label: "Requieren atención" },
  { value: "published", label: "Publicadas" },
  { value: "draft", label: "Borradores" },
];

const KIND_LABEL: Record<PageKind, string> = { landing: "Landing", contact: "Tarjeta personal", pet: "Mascota", direct: "Link directo" };

const searchable = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Menú ⋯ de cada fila con las acciones que se usan poco. Se cierra al tocar afuera o con Esc;
// los diálogos de Renombrar y Eliminar viven adentro, así que tocar en ellos no lo cierra.
function RowMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      const menu = ref.current;
      if (!menu?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" && !document.querySelector("dialog[open]") : !menu.contains(event.target as Node)) menu.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  return <details className="pl-menu" ref={ref}>
    <summary aria-label="Más acciones" title="Más acciones">⋯</summary>
    <div className="pl-menu-items">{children}</div>
  </details>;
}

// Listado de páginas: filtros instantáneos (tipo, estado y búsqueda) y, por fila, un botón
// principal según el tipo —Editar diseño, o Cambiar link en un link directo— más lo frecuente a
// la vista y el resto en el menú ⋯. Los filtros quedan en la URL para poder volver o compartirla.
export default function PagesList({ rows, clients, initialKind, initialView, initialQuery, initialSort = "recent", actions }: {
  rows: PageRow[];
  clients: { id: string; name: string }[];
  initialKind: PageKind | "all";
  initialView: PageView;
  initialQuery: string;
  initialSort?: PageSort;
  actions: { publish: Action; rename: Action; remove: Action; assign: Action };
}) {
  const [kind, setKind] = useState<PageKind | "all">(initialKind);
  const [view, setView] = useState<PageView>(initialView);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<PageSort>(initialSort);
  const returnTo = "/admin/paginas";

  useEffect(() => {
    const params = new URLSearchParams();
    if (kind !== "all") params.set("type", kind);
    if (view !== "all") params.set("view", view);
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "recent") params.set("sort", sort);
    const next = params.toString() ? `?${params}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [kind, view, query, sort]);

  const matchesView = (row: PageRow, value: PageView) => value === "all" || (value === "attention" ? Boolean(row.attention) : value === "published" ? row.published : !row.published);
  const matchesKind = (row: PageRow, value: PageKind | "all") => value === "all" || row.kind === value;
  const needle = searchable(query.trim());
  const matchesQuery = (row: PageRow) => !needle || searchable(`${row.name} ${row.slug} ${row.clientName} ${row.destination}`).includes(needle);

  const counts = useMemo(() => ({
    kind: Object.fromEntries(KINDS.map((item) => [item.value, rows.filter((row) => matchesView(row, view) && matchesKind(row, item.value) && matchesQuery(row)).length])),
    view: Object.fromEntries(VIEWS.map((item) => [item.value, rows.filter((row) => matchesView(row, item.value) && matchesKind(row, kind) && matchesQuery(row)).length])),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [rows, kind, view, needle]);
  const visible = sortPages(rows.filter((row) => matchesKind(row, kind) && matchesView(row, view) && matchesQuery(row)), sort);
  const filtered = kind !== "all" || view !== "all" || Boolean(needle);

  return <div className="pl">
    <div className="pl-filters" role="search">
      <div className="pl-search-row">
        <label className="pl-search">
          <span className="sr-only">Buscar</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, cliente o link…" />
        </label>
        <label className="pl-sort"><span>Ordenar</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as PageSort)}>{PAGE_SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        </label>
      </div>
      <div className="pl-chips" role="group" aria-label="Tipo">
        {KINDS.map((item) => <button key={item.value} type="button" className={`pl-chip is-${item.value}`} aria-pressed={kind === item.value} onClick={() => setKind(item.value)}>
          {item.value !== "all" && <i aria-hidden="true" />}{item.label} <b>{counts.kind[item.value]}</b>
        </button>)}
      </div>
      <div className="pl-chips is-views" role="group" aria-label="Estado">
        {VIEWS.map((item) => <button key={item.value} type="button" className={`pl-chip${item.value === "attention" ? " is-attention" : ""}`} aria-pressed={view === item.value} onClick={() => setView(item.value)}>
          {item.value === "attention" && <IconAlertCircle aria-hidden="true" />}{item.label} <b>{counts.view[item.value]}</b>
        </button>)}
        {(filtered || sort !== "recent") && <button type="button" className="pl-clear" onClick={() => { setKind("all"); setView("all"); setQuery(""); setSort("recent"); }}>Limpiar</button>}
      </div>
    </div>

    {!visible.length
      ? <div className="empty-state"><strong>{view === "attention" && !needle ? "Nada pendiente" : "No hay páginas con esos filtros"}</strong><p className="muted">{view === "attention" && !needle ? "No hay vencimientos ni páginas sin cliente. 🎉" : "Probá otra búsqueda o limpiá los filtros."}</p></div>
      : <ul className="pl-rows">{visible.map((row) => <li key={row.id} className={`pl-row is-${row.kind}`}>
        <div className="pl-main">
          <div className="pl-avatar">{row.kind === "direct" ? <span className="pl-direct-icon"><IconLink /></span> : <AdminPageAvatar page={row.avatar} />}</div>
          <div className="pl-copy">
            <div className="pl-name"><strong>{row.name}</strong><span className={`pl-kind is-${row.kind}`}>{KIND_LABEL[row.kind]}</span></div>
            <small className="pl-sub">{row.kind === "direct" ? (row.destination ? <>→ {row.destination.replace(/^https?:\/\//, "")}</> : "Sin link cargado") : row.kind === "pet" ? `/mascota/${row.slug}` : `/${row.slug}`}</small>
            <small className="pl-client">{row.clientId ? <Link href={`/admin/clientes/${row.clientId}`}>{row.clientName}</Link> : <span className="pl-noclient">Sin cliente · <AssignClientButton action={actions.assign} landingId={row.id} clients={clients} returnTo={returnTo} /></span>}</small>
          </div>
        </div>
        <div className="pl-state">
          <Link className={`plan-status is-${row.status.tone}`} href={`/admin/landings/${row.id}/gestion`}>{row.status.label}</Link>
          <small>{row.views.total ? `${row.views.total} visitas · ${row.views.last30} en 30 días` : "Sin visitas"}</small>
          <small className="pl-edited" title={`Creada el ${shortDate(row.createdAt)} · Última edición el ${shortDate(row.updatedAt)}`}>Editada {relativeDay(row.updatedAt)}</small>
        </div>
        <div className="pl-actions">
          {row.kind === "direct"
            ? <Link className="btn pl-primary" href={`/admin/landings/${row.id}/gestion`}><IconLink /> Cambiar link</Link>
            : <Link className="btn pl-primary" href={row.kind === "pet" ? `/admin/landings/${row.id}/mascota` : `/admin/landings/${row.id}/editor-v2`}><IconEdit /> {row.kind === "pet" ? "Abrir ficha" : "Editar diseño"}</Link>}
          <Link className="pl-icon" href={`/admin/landings/${row.id}/gestion`} title="Gestión: plan y vencimiento" aria-label="Gestión"><IconCalendar /></Link>
          {row.kind === "direct"
            ? <a className="pl-icon" href={`/${row.slug}`} target="_blank" rel="noreferrer" title="Ver: abre el link para probarlo" aria-label="Ver el link"><IconEye /></a>
            : <ViewLandingButton slug={row.slug} landingId={row.id} published={row.published} publishAction={actions.publish} className="pl-icon" isContact={row.kind === "contact"} isPet={row.kind === "pet"} returnTo={returnTo} />}
          <Link className="pl-icon" href={`/admin/landings/${row.id}/qr`} title="QR y NFC" aria-label="QR y NFC"><IconQrCode /></Link>
          <RowMenu>
            <CopyButton text={row.kind === "pet" ? `/mascota/${row.slug}` : `/${row.slug}`} label="Copiar link" className="pl-menu-copy" />
            {row.kind !== "pet" && <RenameLandingButton action={actions.rename} landingId={row.id} currentName={row.name} currentSlug={row.slug} isContact={row.kind === "contact"} returnTo={returnTo} />}
            {row.kind !== "direct" && row.kind !== "pet" && <form action={actions.publish}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="published" value={String(!row.published)} />
              <input type="hidden" name="return_to" value={returnTo} />
              <PendingSubmitButton className="icon-text-button" pendingText={row.published ? "Despublicando…" : "Publicando…"}>{row.published ? <><IconPause /> Despublicar</> : <><IconPlay /> Publicar</>}</PendingSubmitButton>
            </form>}
            {row.kind === "direct" && !row.published && <form action={actions.publish}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="published" value="true" />
              <input type="hidden" name="return_to" value={returnTo} />
              <PendingSubmitButton className="icon-text-button" pendingText="Publicando…"><IconEye /> Activar</PendingSubmitButton>
            </form>}
            <DeleteLandingButton action={actions.remove} landingId={row.id} label="Eliminar" isContact={row.kind === "contact"} returnTo={returnTo} />
          </RowMenu>
        </div>
        {row.attention && <p className="pl-attention"><IconAlertCircle aria-hidden="true" /> {row.attention}</p>}
      </li>)}</ul>}
  </div>;
}
