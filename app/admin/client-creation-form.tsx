"use client";

import { useRef, useState, type FormEvent } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";

export default function ClientCreationForm({ action, returnTo = "/admin" }: { action: (formData: FormData) => void | Promise<void>; returnTo?: string }) {
  const requestKeyRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitted) {
      event.preventDefault();
      return;
    }
    if (requestKeyRef.current && !requestKeyRef.current.value) requestKeyRef.current.value = crypto.randomUUID();
    setSubmitted(true);
  }

  return <form action={action} className="stack" onSubmit={handleSubmit}>
    <input ref={requestKeyRef} type="hidden" name="request_key" />
    <input type="hidden" name="return_to" value={returnTo} />
    <label className="label">Nombre del negocio<input name="name" placeholder="Ej. Aurora Hotel" required /></label>
    <label className="label">Email<input name="email" type="email" placeholder="contacto@aurorahotel.com" /></label>
    <label className="label">WhatsApp<input name="phone" placeholder="549351XXXXXXXX" /></label>
    <div className="color-row"><label className="label">Color principal<input name="primary_color" type="color" defaultValue="#1f2937" /></label><label className="label">Color de fondo<input name="background_color" type="color" defaultValue="#f7f5f0" /></label></div>
    <PendingSubmitButton className="btn full" pendingText="Creando cliente…" disabled={submitted}>Crear cliente</PendingSubmitButton>
    {submitted && <p className="form-pending-message" role="status">Guardando el cliente. No cierres esta ventana.</p>}
  </form>;
}
