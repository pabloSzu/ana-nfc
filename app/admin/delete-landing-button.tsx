"use client";

export default function DeleteLandingButton({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm("¿Eliminar esta landing?\nTambién se eliminarán sus acciones.\nEsta acción no se puede deshacer.")) event.preventDefault(); }}><button className="danger-button" type="submit">Eliminar landing</button></form>;
}
