"use client";

import { IconTrash } from "@/components/icons";
import ConfirmSubmit from "./confirm-submit";

export default function DeleteLandingButton({ action, landingId, label = "Eliminar landing", className = "", isContact = false, returnTo = "/admin" }: { action: (formData: FormData) => void | Promise<void>; landingId: string; label?: string; className?: string; isContact?: boolean; returnTo?: string }) {
  const kind = isContact ? "tarjeta" : "landing";
  return (
    <form action={action}>
      <input type="hidden" name="id" value={landingId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <ConfirmSubmit className={`icon-text-button danger ${className}`.trim()} buttonTitle={label} title={`¿Eliminar esta ${kind}?`} message={`También se eliminan sus botones y enlaces. Si alguien escanea su NFC o QR, no va a abrir nada. No se puede deshacer.`} confirmLabel="Sí, eliminar" pendingText="Eliminando…"><IconTrash /> <span className="btn-label">{label}</span></ConfirmSubmit>
    </form>
  );
}
