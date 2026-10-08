"use client";

import { IconTrash } from "@/components/icons";
import PendingSubmitButton from "@/components/pending-submit-button";

export default function DeleteClientButton({ action, clientId, clientName, returnTo = "/admin" }: { action: (formData: FormData) => void | Promise<void>; clientId: string; clientName: string; returnTo?: string }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`¿Eliminar el cliente ${clientName}? Sus landings no se eliminarán.`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={clientId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <PendingSubmitButton className="icon-text-button danger secondary-action" pendingText="Eliminando…" title="Eliminar" aria-label="Eliminar"><IconTrash /> <span className="btn-label">Eliminar</span></PendingSubmitButton>
    </form>
  );
}
