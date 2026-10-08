"use client";

import { useRef } from "react";
import { IconUsers } from "@/components/icons";
import PendingSubmitButton from "@/components/pending-submit-button";

export default function AssignClientButton({ action, landingId, clients, returnTo = "/admin/paginas" }: { action: (formData: FormData) => void | Promise<void>; landingId: string; clients: Array<{ id: string; name: string }>; returnTo?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" className="icon-text-button accent" onClick={() => dialogRef.current?.showModal()}><IconUsers /> Asignar</button>
    <dialog ref={dialogRef} className="modal"><div className="modal-content"><button type="button" className="modal-close" aria-label="Cerrar" onClick={() => dialogRef.current?.close()}>✕</button><h2>Asignar cliente</h2><p className="muted">Elegí dónde querés organizar esta página.</p><form action={action} className="stack"><input type="hidden" name="id" value={landingId} /><input type="hidden" name="return_to" value={returnTo} /><label className="label">Cliente<select name="client_id" required defaultValue=""><option value="" disabled>Elegí un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><PendingSubmitButton className="btn full" pendingText="Asignando…">Asignar cliente</PendingSubmitButton></form></div></dialog>
  </>;
}
