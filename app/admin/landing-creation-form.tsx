"use client";

import { useRef, useState, type FormEvent } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";

type LandingCreationFormProps = {
  clients: Array<{ id: string; name: string }>;
  action: (formData: FormData) => void | Promise<void>;
  kind: "custom" | "contact";
  clientId?: string;
  clientName?: string;
  returnTo?: string;
};

export default function LandingCreationForm({ clients, action, kind, clientId, clientName, returnTo }: LandingCreationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const requestKeyRef = useRef<HTMLInputElement>(null);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitting) {
      event.preventDefault();
      return;
    }
    if (requestKeyRef.current && !requestKeyRef.current.value) requestKeyRef.current.value = crypto.randomUUID();
    setSubmitting(true);
  }
  return (
    <form action={action} className="stack" onSubmit={handleSubmit}>
      <input ref={requestKeyRef} type="hidden" name="request_key" />
      <input type="hidden" name="business_type" value={kind} />
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}
      {clientId ? <>
        <input type="hidden" name="client_id" value={clientId} />
        <div className="creation-client-lock"><span>Cliente</span><strong>{clientName}</strong><small>Se asignará automáticamente.</small></div>
      </> : <label className="label">Cliente<select name="client_id" required defaultValue=""><option value="" disabled>Elegí un cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select><small className="field-help">Toda página nueva debe pertenecer a un cliente.</small></label>}
      <label className="label">{kind === "contact" ? "Nombre de la persona" : "Nombre de la landing"}<input name="business_name" placeholder={kind === "contact" ? "Ej. Ana Pérez" : "Ej. Aurora Hotel"} required /></label>
      <label className="label">URL (opcional)<input name="slug" placeholder={kind === "contact" ? "ana-perez" : "aurora-hotel"} /></label>
      <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Si dejás la URL vacía, se genera sola. {kind === "contact" ? "La foto y los datos de contacto" : "Las imágenes y los botones"} se configuran después, en el editor.</p>
      <PendingSubmitButton className="btn full" pendingText={kind === "contact" ? "Creando tarjeta…" : "Creando landing…"} disabled={submitting}>{kind === "contact" ? "Crear tarjeta y editar" : "Crear landing y editar"}</PendingSubmitButton>
      {submitting && <p className="form-pending-message" role="status">Guardando y abriendo el editor…</p>}
    </form>
  );
}
