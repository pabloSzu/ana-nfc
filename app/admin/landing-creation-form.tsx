"use client";

import { useState } from "react";

export default function LandingCreationForm({ clients, action }: { clients: Array<{ id: string; name: string }>; action: (formData: FormData) => void | Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [kind, setKind] = useState("custom");
  return (
    <form action={action} className="stack" onSubmit={() => setSubmitting(true)}>
      <label className="label">Cliente<select name="client_id"><option value="">Sin cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label className="label">¿Para qué es?<select name="business_type" value={kind} onChange={(event) => setKind(event.target.value)}><option value="custom">Landing de enlaces</option><option value="contact">Tarjeta personal · Guardar contacto</option></select></label>
      <label className="label">{kind === "contact" ? "Nombre de la persona" : "Nombre de la landing"}<input name="business_name" placeholder={kind === "contact" ? "Ej. Ana Pérez" : "Ej. Aurora Hotel"} required /></label>
      <label className="label">URL (opcional)<input name="slug" placeholder={kind === "contact" ? "ana-perez" : "aurora-hotel"} /></label>
      <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Si la dejás vacía, se genera sola. La foto, colores y botones de contacto se configuran después, en el editor.</p>
      <button className="btn full" type="submit" disabled={submitting}>{submitting ? "Creando..." : "Crear y empezar a editar"}</button>
    </form>
  );
}
