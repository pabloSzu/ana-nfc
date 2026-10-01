"use client";

import { IconTrash } from "@/components/icons";

export default function DeleteLandingButton({ action, landingId, label = "Eliminar landing", className = "", isContact = false }: { action: (formData: FormData) => void | Promise<void>; landingId: string; label?: string; className?: string; isContact?: boolean }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`¿Eliminar esta ${isContact ? "tarjeta" : "landing"}?\nTambién se eliminarán sus enlaces y acciones.\nEsta acción no se puede deshacer.`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={landingId} />
      <button className={`icon-text-button danger ${className}`.trim()} type="submit" title={label} aria-label={label}><IconTrash /> <span className="btn-label">{label}</span></button>
    </form>
  );
}
