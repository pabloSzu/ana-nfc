"use client";

import { useRef, type ReactNode } from "react";

export default function ModalTrigger({ label, icon, title, description, variant = "primary", children }: { label: string; icon?: ReactNode; title: string; description?: string; variant?: "primary" | "secondary"; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={variant === "secondary" ? "btn secondary" : "btn"} onClick={() => dialogRef.current?.showModal()}>
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
