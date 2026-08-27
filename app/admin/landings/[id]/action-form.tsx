"use client";

import { useState } from "react";
import { ActionTypeIcon } from "@/components/action-icons";
import { AUTO_COLORS } from "@/lib/landing-catalog";

export const actionTypes: [string, string, string][] = [
  ["whatsapp", "WhatsApp", "Mensaje y número de la landing"],
  ["instagram", "Instagram", "Perfil de Instagram"],
  ["tiktok", "TikTok", "Perfil de TikTok"],
  ["facebook", "Facebook", "Página de Facebook"],
  ["website", "Website", "Sitio web"],
  ["email", "Email", "Correo electrónico"],
  ["phone", "Teléfono", "Número de teléfono"],
  ["maps", "Google Maps", "Ubicación"],
  ["youtube", "YouTube", "Canal de YouTube"],
  ["spotify", "Spotify", "Perfil o playlist"],
  ["mercadopago", "Mercado Pago", "Cobros"],
  ["calendar", "Reservar", "Calendario"],
  ["telegram", "Telegram", "Canal o contacto"],
  ["url", "Link", "Cualquier enlace"],
];

export default function ActionForm({ action, landingId }: { action: (formData: FormData) => void | Promise<void>; landingId: string }) {
  const [type, setType] = useState("whatsapp");
  const selected = actionTypes.find(([value]) => value === type);
  const needsUrl = !["whatsapp", "email", "phone"].includes(type);
  return <form action={action} className="stack action-builder">
    <input type="hidden" name="landing_id" value={landingId} />
    <div className="type-picker">{actionTypes.map(([value, title]) => <label className={type === value ? "type-choice active" : "type-choice"} key={value}><input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} /><ActionTypeIcon type={value} /><b>{title}</b></label>)}</div>
    <label className="label">Título<input name="title" placeholder={selected?.[1] || "Mi acción"} required /></label>
    {type === "whatsapp" && <label className="label">Mensaje WhatsApp<input name="message" defaultValue="Hola, quiero hacer una consulta." /></label>}
    {type === "email" && <label className="label">Email<input name="value" type="email" placeholder="contacto@empresa.com" required /></label>}
    {type === "phone" && <label className="label">Número<input name="value" type="tel" placeholder="+54 9 351..." required /></label>}
    {needsUrl && <label className="label">URL<input name="url" type="url" placeholder="https://..." required /></label>}
    <div className="form-split"><label className="label">Color<input name="background_color" type="color" defaultValue={AUTO_COLORS[type] || "#1f2937"} /></label><label className="label">Texto<input name="text_color" type="color" defaultValue="#ffffff" /></label></div>
    <label className="check-label"><input name="use_auto_color" type="checkbox" defaultChecked /> Usar color automático de {selected?.[1] || "la red"}</label>
    <button className="btn full" type="submit">+ Agregar acción</button>
  </form>;
}
