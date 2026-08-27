"use client";

import { useRef, type ReactNode } from "react";

export default function ModalTrigger({ label, icon, title, description, children }: { label: string; icon?: ReactNode; title: string; description?: string; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn" onClick={() => dialogRef.current?.showModal()}>
        {icon && <span>{icon}</span>} {label}
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-content">
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={() => dialogRef.current?.close()}>✕</button>
          <h2>{title}</h2>
          {description && <p className="muted">{description}</p>}
          {children}
        </div>
      </dialog>
    </>
  );
}
