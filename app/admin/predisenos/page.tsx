import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { AdminThemeBackdrop } from "@/components/admin-theme";
import { IconEdit, IconPlus } from "@/components/icons";
import TemplatePreview from "@/components/template-preview";
import { BUSINESS_TEMPLATES, sortTemplateRows, templateFromLanding } from "@/lib/business-templates";
import { copyAsTemplate, createTemplate, importBuiltinTemplates, updateTemplate } from "../actions";
import ModalTrigger from "../modal-trigger";
import PendingSubmitButton from "@/components/pending-submit-button";
import ConfirmSubmit from "./confirm-submit";

// Admin → Prediseños: las páginas de base que se eligen al crear una landing o desde el editor.
// Cada una es una landing propia (ver Prediseños en app/admin/actions.ts), así que se edita con
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

  const op = (id: string, value: string, label: string, className = "pd-icon", title = label) => <form action={updateTemplate}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={value} />
    <button type="submit" className={className} title={title} aria-label={title}>{label}</button>
  </form>;

  return <main className="shell admin-shell admin-library-page">
    <AdminThemeBackdrop />
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="library-page-header">
      <div><p className="eyebrow">Diseño</p><h1>Prediseños</h1><p className="muted">Las páginas de base que elegís al crear una landing o desde el editor. Elegir uno copia la página entera: textos, botones, fotos y colores.</p></div>
      <div className="library-page-actions">
        <ModalTrigger label="Nuevo prediseño" icon={<IconPlus />} title="Nuevo prediseño" description="Se crea vacío y se abre en el editor para armarlo.">
          <form action={createTemplate} className="stack">
            <label className="label">Nombre<input name="template_name" maxLength={40} required placeholder="Ej. Heladería · verano" /></label>
            <PendingSubmitButton className="btn full" pendingText="Creando…">Crear y editar</PendingSubmitButton>
          </form>
        </ModalTrigger>
      </div>
    </header>

    {!rows.length ? <section className="elevated-section pd-empty">
      <div><h2>Todavía usás los prediseños de BIONFC</h2><p className="muted">Son estos {BUSINESS_TEMPLATES.length}. Traelos a tu cuenta para poder editarlos, ocultar los que no uses, cambiarles el orden o sumar los tuyos.</p></div>
      <form action={importBuiltinTemplates}><PendingSubmitButton className="btn" pendingText="Trayendo…">Traer los {BUSINESS_TEMPLATES.length} a mi cuenta</PendingSubmitButton></form>
      <ul className="pd-grid">{BUSINESS_TEMPLATES.map((template) => <li key={template.id} className="pd-card">
        <TemplatePreview template={template} className="pd-preview" />
        <div className="pd-copy"><strong>{template.name}</strong><small>{template.note}</small></div>
      </li>)}</ul>
    </section> : <>
      <ul className="pd-grid">{rows.map((row, index) => {
        const template = templateFromLanding(row);
        return <li key={row.id} className={`pd-card${row.template_hidden ? " is-hidden" : ""}`}>
          <TemplatePreview template={template} className="pd-preview" />
          <div className="pd-copy">
            <strong>{row.template_name}</strong>
            {row.template_hidden ? <span className="pd-badge">Oculto</span> : <small>{index + 1}° en la lista</small>}
          </div>
          <div className="pd-actions">
            <Link className="btn pd-edit" href={`/admin/landings/${row.id}/editor-v2`}><IconEdit /> Editar</Link>
            {op(row.id, "up", "↑", "pd-icon", "Subir")}
            {op(row.id, "down", "↓", "pd-icon", "Bajar")}
          </div>
          <details className="pd-more"><summary>Más opciones</summary><div>
            <form action={updateTemplate} className="pd-rename">
              <input type="hidden" name="id" value={row.id} /><input type="hidden" name="op" value="rename" />
              <input name="template_name" maxLength={40} required defaultValue={row.template_name || ""} aria-label="Nombre" />
              <button type="submit" className="pd-text">Renombrar</button>
            </form>
            <div className="pd-row">
              {op(row.id, row.template_hidden ? "show" : "hide", row.template_hidden ? "Mostrar" : "Ocultar", "pd-text", row.template_hidden ? "Volver a ofrecerlo" : "No ofrecerlo al crear páginas")}
              <form action={copyAsTemplate}><input type="hidden" name="id" value={row.id} /><button type="submit" className="pd-text">Duplicar</button></form>
              <form action={updateTemplate}><input type="hidden" name="id" value={row.id} /><input type="hidden" name="op" value="delete" /><ConfirmSubmit className="pd-text is-danger" message={`¿Eliminar el prediseño "${row.template_name}"? Las páginas creadas desde él no cambian.`}>Eliminar</ConfirmSubmit></form>
            </div>
          </div></details>
        </li>;
      })}</ul>
      {missingBuiltins > 0 && <form action={importBuiltinTemplates} className="pd-import"><span className="muted">Faltan {missingBuiltins} de los prediseños de BIONFC.</span><button type="submit" className="pd-text">Traerlos</button></form>}
      <p className="muted pd-tip">Para guardar la página de un cliente como prediseño: Gestión → &quot;Guardar como prediseño&quot;. Se crea una copia; la página del cliente no cambia.</p>
    </>}
  </main>;
}
