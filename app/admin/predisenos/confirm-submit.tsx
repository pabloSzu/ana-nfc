"use client";

import type { ReactNode } from "react";

// Botón de formulario que pide confirmación antes de enviar (para Eliminar).
export default function ConfirmSubmit({ message, className, children }: { message: string; className?: string; children: ReactNode }) {
  return <button type="submit" className={className} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
