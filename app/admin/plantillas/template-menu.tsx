"use client";

import { useEffect, useRef } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";
import { IconEdit, IconEye, IconPause, IconPlus, IconTrash } from "@/components/icons";
import { copyAsTemplate, updateTemplate } from "../actions";
import ConfirmSubmit from "../confirm-submit";

// Menú ⋯ de cada plantilla (mismo estilo que el de Páginas): Renombrar abre su propio cartel, así
// el nombre se escribe cómodo; el resto son acciones de un toque. Se cierra al tocar afuera o con Esc.
export default function TemplateMenu({ id, name, hidden }: { id: string; name: string; hidden: boolean }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const renameRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      const menu = menuRef.current;
      if (!menu?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" && !document.querySelector("dialog[open]") : !menu.contains(event.target as Node)) menu.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  return <details className="pl-menu" ref={menuRef}>
    <summary aria-label="Más acciones" title="Más acciones">⋯</summary>
    <div className="pl-menu-items">
      <button type="button" className="icon-text-button" onClick={() => renameRef.current?.showModal()}><IconEdit /> Renombrar</button>
      <form action={copyAsTemplate}><input type="hidden" name="id" value={id} /><PendingSubmitButton className="icon-text-button" pendingText="Duplicando…"><IconPlus /> Duplicar</PendingSubmitButton></form>
      <form action={updateTemplate}><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={hidden ? "show" : "hide"} /><PendingSubmitButton className="icon-text-button" pendingText="Guardando…">{hidden ? <><IconEye /> Mostrar al crear páginas</> : <><IconPause /> Ocultar</>}</PendingSubmitButton></form>
      <form action={updateTemplate}><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="delete" />
        <ConfirmSubmit className="icon-text-button danger" title={`¿Eliminar "${name}"?`} message="Deja de aparecer como plantilla. Las páginas que ya creaste desde ella no cambian." confirmLabel="Sí, eliminar" pendingText="Eliminando…"><IconTrash /> Eliminar</ConfirmSubmit>
      </form>
      <dialog ref={renameRef} className="modal">
        <div className="modal-content">
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={() => renameRef.current?.close()}>✕</button>
          <h2>Renombrar plantilla</h2>
          <p className="muted">Es el nombre que ves al elegirla en el editor y al crear una página.</p>
          <form action={updateTemplate} className="stack">
            <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="rename" />
            <label className="label">Nombre<input name="template_name" maxLength={40} required defaultValue={name} autoFocus /></label>
            <PendingSubmitButton className="btn full" pendingText="Guardando…">Guardar nombre</PendingSubmitButton>
          </form>
        </div>
      </dialog>
    </div>
  </details>;
}
