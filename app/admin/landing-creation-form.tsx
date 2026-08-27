"use client";

import { useMemo, useState } from "react";
import { businessProfiles, getBusinessProfile, templates } from "@/lib/landing-catalog";

export default function LandingCreationForm({ clients, action }: { clients: Array<{ id: string; name: string }>; action: (formData: FormData) => void | Promise<void> }) {
  const [profile, setProfile] = useState("custom");
  const selected = getBusinessProfile(profile);
  const availableTemplates = useMemo(() => templates.filter((template) => selected.templates.includes(template.value)), [selected]);
  return <form action={action} className="stack">
    <label className="label">Cliente<select name="client_id"><option value="">Sin cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
    <fieldset className="profile-picker"><legend>Tipo de perfil</legend><div className="profile-grid">{businessProfiles.map((item) => <label className={profile === item.value ? "profile-choice active" : "profile-choice"} key={item.value}><input type="radio" name="business_type" value={item.value} checked={profile === item.value} onChange={() => setProfile(item.value)} /><span className="profile-icon">{item.icon}</span><b>{item.label}</b><small>{item.description}</small></label>)}</div></fieldset>
    <label className="label">Nombre de la landing<input name="business_name" placeholder="Ej. Aurora Hotel" required /></label>
    <label className="label">URL<input name="slug" placeholder="aurora-hotel" /></label>
    <fieldset className="profile-picker"><legend>Plantilla visual</legend><div className="template-grid">{availableTemplates.map((template, index) => <label className="template-option" key={template.value}><input type="radio" name="template" value={template.value} defaultChecked={index === 0} /><span><b>{template.label}</b><small>{template.description}</small></span></label>)}</div></fieldset>
    <button className="btn full" type="submit">+ Crear landing</button>
  </form>;
}
