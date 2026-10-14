"use client";

import { IconTrash } from "@/components/icons";
import ConfirmSubmit from "./confirm-submit";

export default function DeleteClientButton({ action, clientId, clientName, returnTo = "/admin" }: { action: (formData: FormData) => void | Promise<void>; clientId: string; clientName: string; returnTo?: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={clientId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <ConfirmSubmit className="icon-text-button danger secondary-action" buttonTitle="Eliminar" title={`¿Eliminar a ${clientName}?`} message="Sus páginas no se borran: quedan en Páginas, sin cliente asignado." confirmLabel="Sí, eliminar" pendingText="Eliminando…"><IconTrash /> <span className="btn-label">Eliminar</span></ConfirmSubmit>
    </form>
  );
}
