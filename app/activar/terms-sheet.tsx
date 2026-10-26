"use client";

// Los términos al activar, en una hoja que sube desde abajo (en la compu, al centro) sin salir de
// la pantalla: arriba el título fijo con la ✕, en el medio el resumen y el texto completo con su
// propio scroll, y abajo, fijo, "Acepto" (tilda la casilla y cierra).
import { useEffect, useRef } from "react";
import { TermsSections, TermsSummary } from "@/components/terms-content";
import { TERMS_UPDATED } from "@/lib/terms";

export default function TermsSheet({ open, onClose, onAccept }: { open: boolean; onClose: () => void; onAccept: () => void }) {
  const sheet = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={sheet} className="terms-sheet" aria-labelledby="terms-sheet-title" onClose={onClose} onClick={(event) => { if (event.target === sheet.current) onClose(); }}>
    <header><div><span>Antes de continuar</span><strong id="terms-sheet-title">Términos y privacidad</strong><small>Actualizados el {TERMS_UPDATED}</small></div><button type="button" onClick={onClose} aria-label="Cerrar">✕</button></header>
    <div className="terms-sheet-body terms">
      <p className="terms-sheet-intro">Este es el resumen de lo que aceptás al activar tu chapita.</p>
      <TermsSummary compact />
      <div className="terms-sheet-full">
        <strong>Términos completos</strong>
        <small>Abrí cada punto si querés leer el detalle.</small>
      </div>
      <TermsSections compact />
    </div>
    <footer>
      <small>Al continuar confirmás que leíste y aceptás estos términos.</small>
      <button type="button" className="mi-button" onClick={() => { onAccept(); onClose(); }}>Aceptar y continuar</button>
    </footer>
  </dialog>;
}
