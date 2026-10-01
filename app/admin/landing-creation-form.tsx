"use client";

import { useState } from "react";

export default function LandingCreationForm({ clients, action, kind }: { clients: Array<{ id: string; name: string }>; action: (formData: FormData) => void | Promise<void>; kind: "custom" | "contact" }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form action={action} className="stack" onSubmit={() => setSubmitting(true)}>
      <input type="hidden" name="business_type" value={kind} />
      <label className="label">Cliente<select name="client_id"><option value="">Sin cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label className="label">{kind === "contact" ? "Nombre de la persona" : "Nombre de la landing"}<input name="business_name" placeholder={kind === "contact" ? "Ej. Ana Pérez" : "Ej. Aurora Hotel"} required /></label>
      <label className="label">URL (opcional)<input name="slug" placeholder={kind === "contact" ? "ana-perez" : "aurora-hotel"} /></label>
      <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Si dejás la URL vacía, se genera sola. {kind === "contact" ? "La foto y los datos de contacto" : "Las imágenes y los botones"} se configuran después, en el editor.</p>
      <button className="btn full" type="submit" disabled={submitting}>{submitting ? "Creando..." : kind === "contact" ? "Crear tarjeta y editar" : "Crear landing y editar"}</button>
    </form>
  );
}
