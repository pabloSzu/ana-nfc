"use client";

import { IconTrash } from "@/components/icons";

export default function DeleteClientButton({ action, clientId, clientName }: { action: (formData: FormData) => void | Promise<void>; clientId: string; clientName: string }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`¿Eliminar el cliente ${clientName}? Sus landings no se eliminarán.`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={clientId} />
      <button className="icon-text-button danger" type="submit"><IconTrash /> Eliminar</button>
    </form>
  );
}
