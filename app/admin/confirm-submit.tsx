"use client";

import { useRef, type ReactNode } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";

// Confirmación propia (en vez del cartel del navegador "localhost dice…") para acciones que no se
// pueden deshacer, como eliminar. Va DENTRO del <form>: el botón de afuera solo abre el cartel y
// el de "confirmar" es el que envía el formulario.
export default function ConfirmSubmit({ title, message, confirmLabel, pendingText = "Un momento…", className = "", buttonTitle, children }: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  pendingText?: string;
  className?: string;
  buttonTitle?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" className={className} title={buttonTitle} aria-label={buttonTitle} onClick={() => dialogRef.current?.showModal()}>{children}</button>
    <dialog ref={dialogRef} className="modal confirm-modal" onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}>
      <div className="modal-content">
        <div className="confirm-modal-icon" aria-hidden="true">!</div>
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="btn secondary" onClick={() => dialogRef.current?.close()}>Cancelar</button>
          <PendingSubmitButton className="btn danger" pendingText={pendingText}>{confirmLabel}</PendingSubmitButton>
        </div>
      </div>
    </dialog>
  </>;
}
