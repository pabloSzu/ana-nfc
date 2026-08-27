"use client";

import { useState } from "react";
import { getTemplateActions } from "@/lib/landing-catalog";

type SavedAction = { source_field?: string; is_generated?: boolean; enabled?: boolean; url?: string; message?: string };

export default function ProfileActionsForm({ template, action, landingId, initial }: { template: string; action: (formData: FormData) => void | Promise<void>; landingId: string; initial: SavedAction[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState(template);
  const templateActions = getTemplateActions(selectedTemplate);
  const initialBySource: Record<string, SavedAction> = Object.fromEntries(initial.filter((item) => item.is_generated && item.source_field).map((item) => [item.source_field, item]));
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.entries(initialBySource).map(([source, item]) => [source, item.enabled !== false])));
  return <form action={action} className="profile-actions-form stack"><input type="hidden" name="landing_id" value={landingId} /><label className="label">Plantilla<select name="template" value={selectedTemplate} onChange={(event) => { setSelectedTemplate(event.target.value); setEnabled({}); }}>{["professional", "hotel", "tourism", "restaurant", "business"].map((value) => <option key={value} value={value}>{value === "restaurant" ? "Gastronomía" : value[0].toUpperCase() + value.slice(1)}</option>)}</select></label><div className="profile-action-grid">{templateActions.map((item) => { const on = enabled[item.sourceField] ?? (initialBySource[item.sourceField]?.enabled === true); const saved = initialBySource[item.sourceField]; return <div className={on ? "profile-action-row active" : "profile-action-row"} key={item.sourceField}><span className="profile-action-icon">{item.icon}</span><div className="profile-action-name"><b>{item.label}</b><small>{item.input === "phone" ? "Número" : item.input === "email" ? "Correo electrónico" : item.input === "text" ? "Texto informativo" : "URL pública"}</small></div><label className="switch"><input type="checkbox" name={`enabled_${item.sourceField}`} checked={on} onChange={(event) => setEnabled({ ...enabled, [item.sourceField]: event.target.checked })} /><span>{on ? "ON" : "OFF"}</span></label><input className="profile-action-value" name={`value_${item.sourceField}`} defaultValue={saved?.url || ""} placeholder={item.placeholder} disabled={!on} required={on} /><input className="profile-action-message" name={`message_${item.sourceField}`} defaultValue={saved?.message || ""} placeholder="Mensaje opcional" disabled={!on || !item.message} /></div>; })}</div><button className="btn full" type="submit">Guardar todos los cambios</button></form>;
}
