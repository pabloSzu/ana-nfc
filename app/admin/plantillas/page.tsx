import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconEdit, IconPlus } from "@/components/icons";
import TemplatePreview from "@/components/template-preview";
import { BUSINESS_TEMPLATES, sortTemplateRows, templateFromLanding } from "@/lib/business-templates";
import { createTemplate, importBuiltinTemplates, updateTemplate } from "../actions";
import ModalTrigger from "../modal-trigger";
import PendingSubmitButton from "@/components/pending-submit-button";
import TemplateMenu from "./template-menu";

// Admin → Plantillas: las páginas de base que se eligen al crear una landing o desde el editor.
// Cada una es una landing propia (ver Plantillas en app/admin/actions.ts), así que se edita con
// el editor de siempre; acá se crean, renombran, ordenan, ocultan y eliminan.
export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const { data } = await supabase.from("landings").select("*, actions(*)").eq("owner_id", userId).not("template_name", "is", null);
  const rows = sortTemplateRows(data || []);
  const names = new Set(rows.map((row) => row.template_name));
  const missingBuiltins = BUSINESS_TEMPLATES.filter((template) => !names.has(template.name)).length;

  const move = (id: string, op: "up" | "down", disabled: boolean) => <form action={updateTemplate}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} />
    <button type="submit" className="tl-move" disabled={disabled} title={op === "up" ? "Mover antes" : "Mover después"} aria-label={op === "up" ? "Mover antes" : "Mover después"}>{op === "up" ? "←" : "→"}</button>
  </form>;

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="library-page-header">
      <div><p className="eyebrow">Diseño</p><h1>Plantillas</h1><p className="muted">Las páginas de base que elegís al crear una landing o desde el editor. Elegir una copia la página entera: textos, botones, fotos y colores.</p></div>
      <div className="library-page-actions">
        <ModalTrigger label="Nueva plantilla" icon={<IconPlus />} title="Nueva plantilla" description="Se crea vacía y se abre en el editor para armarla.">
          <form action={createTemplate} className="stack">
            <label className="label">Nombre<input name="template_name" maxLength={40} required placeholder="Ej. Heladería · verano" /></label>
            <PendingSubmitButton className="btn full" pendingText="Creando…">Crear y editar</PendingSubmitButton>
          </form>
        </ModalTrigger>
      </div>
    </header>

    {!rows.length ? <section className="elevated-section pd-empty">
      <div><h2>Todavía usás las plantillas de BIONFC</h2><p className="muted">Son estas {BUSINESS_TEMPLATES.length}. Traelas a tu cuenta para poder editarlas, ocultar las que no uses, cambiarles el orden o sumar las tuyas.</p></div>
      <form action={importBuiltinTemplates}><PendingSubmitButton className="btn" pendingText="Trayendo…">Traer las {BUSINESS_TEMPLATES.length} a mi cuenta</PendingSubmitButton></form>
      <ul className="pd-grid">{BUSINESS_TEMPLATES.map((template) => <li key={template.id} className="pd-card">
        <TemplatePreview template={template} className="pd-preview" />
        <div className="pd-copy"><strong>{template.name}</strong><small>{template.note}</small></div>
      </li>)}</ul>
    </section> : <>
      <ul className="tl-grid">{rows.map((row, index) => {
        const template = templateFromLanding(row);
        const buttons = template.actions.length;
        return <li key={row.id} className={`tl-card${row.template_hidden ? " is-hidden" : ""}`}>
          <div className="tl-art">
            <TemplatePreview template={template} className="tl-thumb" />
            <span className="tl-pos" aria-label={`Posición ${index + 1}`}>{index + 1}</span>
            {row.template_hidden && <span className="tl-hidden-badge">Oculta</span>}
          </div>
          <div className="tl-copy">
            <strong>{row.template_name}</strong>
            <small>{buttons} {buttons === 1 ? "botón" : "botones"} · {row.template_hidden ? "No se ofrece al crear páginas" : "Visible al crear páginas"}</small>
          </div>
          <div className="tl-actions">
            <Link className="btn tl-edit" href={`/admin/landings/${row.id}/editor-v2`}><IconEdit /> Editar</Link>
            {move(row.id, "up", index === 0)}{move(row.id, "down", index === rows.length - 1)}
            <TemplateMenu id={row.id} name={String(row.template_name)} hidden={Boolean(row.template_hidden)} />
          </div>
        </li>;
      })}</ul>
      {missingBuiltins > 0 && <form action={importBuiltinTemplates} className="pd-import"><span className="muted">Faltan {missingBuiltins} de las plantillas de BIONFC.</span><PendingSubmitButton className="pd-text" pendingText="Trayendo…">Traerlas</PendingSubmitButton></form>}
      <p className="muted pd-tip">Para guardar la página de un cliente como plantilla: Gestión → &quot;Guardar como plantilla&quot;. Se crea una copia; la página del cliente no cambia.</p>
    </>}
  </main>;
}
