"use client";

export default function DeleteLandingButton({ action, label = "Eliminar landing" }: { action: (formData: FormData) => void | Promise<void>; label?: string }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm("¿Eliminar esta landing?\nTambién se eliminarán sus acciones.\nEsta acción no se puede deshacer.")) event.preventDefault(); }}><button className="danger-button" type="submit">{label}</button></form>;
}
