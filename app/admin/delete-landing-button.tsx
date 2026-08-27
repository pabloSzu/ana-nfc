"use client";

import { IconTrash } from "@/components/icons";

export default function DeleteLandingButton({ action, label = "Eliminar landing" }: { action: (formData: FormData) => void | Promise<void>; label?: string }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm("¿Eliminar esta landing?\nTambién se eliminarán sus acciones.\nEsta acción no se puede deshacer.")) event.preventDefault(); }}>
      <button className="icon-text-button danger" type="submit"><IconTrash /> {label}</button>
    </form>
  );
}
