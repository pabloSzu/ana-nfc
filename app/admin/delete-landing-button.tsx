"use client";

import { IconTrash } from "@/components/icons";
import PendingSubmitButton from "@/components/pending-submit-button";

export default function DeleteLandingButton({ action, landingId, label = "Eliminar landing", className = "", isContact = false, returnTo = "/admin" }: { action: (formData: FormData) => void | Promise<void>; landingId: string; label?: string; className?: string; isContact?: boolean; returnTo?: string }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`¿Eliminar esta ${isContact ? "tarjeta" : "landing"}?\nTambién se eliminarán sus enlaces y acciones.\nEsta acción no se puede deshacer.`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={landingId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <PendingSubmitButton className={`icon-text-button danger ${className}`.trim()} pendingText="Eliminando…" title={label} aria-label={label}><IconTrash /> <span className="btn-label">{label}</span></PendingSubmitButton>
    </form>
  );
}
