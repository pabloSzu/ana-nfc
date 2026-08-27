"use client";

import { useState } from "react";
import { actionTypes } from "./action-form";
import { ActionTypeIcon } from "@/components/action-icons";
import { AUTO_COLORS } from "@/lib/landing-catalog";

type Props = { action: any; landingId: string; update: (fd: FormData) => void | Promise<void>; remove: (fd: FormData) => void | Promise<void>; move: (fd: FormData) => void | Promise<void>; first: boolean; last: boolean };

export default function ActionCard({ action, landingId, update, remove, move, first, last }: Props) {
  const [type, setType] = useState(action.type);
  const selected = actionTypes.find(([value]) => value === type);
  const needsUrl = !["whatsapp", "email", "phone"].includes(type);
  const fallbackColor = AUTO_COLORS[type] || "#1f2937";
  return <article className="action-card">
    <div className="action-card-head"><span className="action-icon" style={{ background: action.background_color || AUTO_COLORS[action.type] || "#1f2937", color: action.text_color || "#fff" }}><ActionTypeIcon type={action.type} /></span><div><span className="type-label">{selected?.[1] || "Link"}</span><h3>{action.title}</h3></div><span className={action.enabled ? "status published" : "status"}>{action.enabled ? "Activa" : "Desactivada"}</span></div>
    <form action={update} className="stack compact-form">
      <input type="hidden" name="id" value={action.id} /><input type="hidden" name="landing_id" value={landingId} /><input type="hidden" name="existing_message" value={action.message || ""} /><input type="hidden" name="existing_url" value={action.url || ""} /><input type="hidden" name="position" value={action.position} />
      <label className="label">Tipo<select name="type" value={type} onChange={(event) => setType(event.target.value)}>{actionTypes.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>
      <label className="label">Título<input name="title" defaultValue={action.title} required /></label>
      {type === "whatsapp" && <label className="label">Mensaje WhatsApp<input name="message" defaultValue={action.message || ""} /></label>}
      {type === "email" && <label className="label">Email<input name="value" type="email" defaultValue={action.url || ""} required /></label>}
      {type === "phone" && <label className="label">Teléfono<input name="value" type="tel" defaultValue={action.url || ""} required /></label>}
      {needsUrl && <label className="label">URL<input name="url" type="url" defaultValue={action.url || ""} required /></label>}
      <div className="form-split"><label className="label">Fondo<input name="background_color" type="color" defaultValue={action.background_color || fallbackColor} /></label><label className="label">Texto<input name="text_color" type="color" defaultValue={action.text_color || "#ffffff"} /></label></div>
      <label className="check-label"><input name="use_auto_color" type="checkbox" defaultChecked={action.use_auto_color ?? true} /> Usar color automático</label><label className="check-label"><input name="enabled" type="checkbox" defaultChecked={action.enabled ?? true} /> Acción activa</label>
      <button className="btn secondary" type="submit">Guardar cambios</button>
    </form>
    <div className="card-actions"><span className="muted">Orden</span><div className="order-actions"><form action={move}><input type="hidden" name="id" value={action.id} /><input type="hidden" name="landing_id" value={landingId} /><input type="hidden" name="direction" value="up" /><button className="icon-button" type="submit" disabled={first} aria-label="Subir">↑</button></form><form action={move}><input type="hidden" name="id" value={action.id} /><input type="hidden" name="landing_id" value={landingId} /><input type="hidden" name="direction" value="down" /><button className="icon-button" type="submit" disabled={last} aria-label="Bajar">↓</button></form></div></div>
    <form action={remove} onSubmit={(event) => { if (!window.confirm("¿Eliminar esta acción?")) event.preventDefault(); }}><input type="hidden" name="id" value={action.id} /><input type="hidden" name="landing_id" value={landingId} /><button className="danger-button" type="submit">Eliminar</button></form>
  </article>;
}
