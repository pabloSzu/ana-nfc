"use client";

import { useRef, useState, type FormEvent } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";

type LandingCreationFormProps = {
  clients: Array<{ id: string; name: string }>;
  action: (formData: FormData) => void | Promise<void>;
  // "direct" crea un producto con link directo en un solo paso: queda publicado y se abre la
  // pantalla del QR y el NFC para grabarlo.
  kind: "custom" | "contact" | "direct";
  clientId?: string;
  clientName?: string;
  returnTo?: string;
  // Prediseños para elegir al crear (ver templateChoices en lib/business-templates.ts).
  templates?: Array<{ id: string; name: string }>;
};

export default function LandingCreationForm({ clients, action, kind, clientId, clientName, returnTo, templates = [] }: LandingCreationFormProps) {
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
      {kind === "direct" ? <>
        <label className="label">Nombre (para identificarlo vos)<input name="business_name" placeholder="Ej. Reseñas Café Nube" required /></label>
        <label className="label">Link que abre el producto<input name="direct_url" type="text" inputMode="url" placeholder="g.page/r/cafe-nube/review" required /><small className="field-help">Reseñas de Google, Instagram, WhatsApp, web… Se puede cambiar después sin regrabar el chip.</small></label>
        <PendingSubmitButton className="btn full" pendingText="Creando link directo…" disabled={submitting}>Crear y grabar el NFC</PendingSubmitButton>
        {submitting && <p className="form-pending-message" role="status">Guardando y abriendo el QR y el NFC…</p>}
      </> : <>
        <label className="label">{kind === "contact" ? "Nombre de la persona" : "Nombre de la landing"}<input name="business_name" placeholder={kind === "contact" ? "Ej. Ana Pérez" : "Ej. Aurora Hotel"} required /></label>
        <label className="label">URL (opcional)<input name="slug" placeholder={kind === "contact" ? "ana-perez" : "aurora-hotel"} /></label>
        {kind === "custom" && <label className="label">Prediseño<select name="rubro_template" defaultValue="">
          <option value="">Página en blanco</option>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select><small className="field-help">Arranca con el diseño, la foto y los botones de ejemplo. Después los cambiás por los del cliente.</small></label>}
        <label className="label">Plan<select name="plan" defaultValue="annual"><option value="annual">Anual · se renueva cada año</option><option value="lifetime">Sin vencimiento · propia, regalo o cortesía</option></select></label>
        <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Si dejás la URL vacía, se genera sola. {kind === "contact" ? "La foto y los datos de contacto" : "Las imágenes y los botones"} se configuran después, en el editor.</p>
        <PendingSubmitButton className="btn full" pendingText={kind === "contact" ? "Creando tarjeta…" : "Creando landing…"} disabled={submitting}>{kind === "contact" ? "Crear tarjeta y editar" : "Crear landing y editar"}</PendingSubmitButton>
        {submitting && <p className="form-pending-message" role="status">Guardando y abriendo el editor…</p>}
      </>}
    </form>
  );
}
