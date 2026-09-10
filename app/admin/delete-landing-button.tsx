"use client";

import { IconTrash } from "@/components/icons";

export default function DeleteLandingButton({ action, landingId, label = "Eliminar landing" }: { action: (formData: FormData) => void | Promise<void>; landingId: string; label?: string }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm("¿Eliminar esta landing?\nTambién se eliminarán sus acciones.\nEsta acción no se puede deshacer.")) event.preventDefault(); }}>
      <input type="hidden" name="id" value={landingId} />
      <button className="icon-text-button danger" type="submit"><IconTrash /> {label}</button>
    </form>
  );
}
