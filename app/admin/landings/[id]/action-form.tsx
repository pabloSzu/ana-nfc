"use client";

import { useState } from "react";

export const actionTypes = [
  ["whatsapp", "WhatsApp", "💬", "Mensaje y número de la landing"],
  ["instagram", "Instagram", "◎", "Perfil de Instagram"],
  ["tiktok", "TikTok", "♪", "Perfil de TikTok"],
  ["facebook", "Facebook", "f", "Página de Facebook"],
  ["website", "Website", "⌁", "Sitio web"],
  ["email", "Email", "✉", "Correo electrónico"],
  ["phone", "Teléfono", "⌕", "Número de teléfono"],
  ["maps", "Google Maps", "⌖", "Ubicación"],
  ["youtube", "YouTube", "▶", "Canal de YouTube"],
  ["spotify", "Spotify", "◉", "Perfil o playlist"],
  ["mercadopago", "Mercado Pago", "$", "Cobros"],
  ["calendar", "Reservar", "▣", "Calendario"],
  ["telegram", "Telegram", "➤", "Canal o contacto"],
  ["url", "Link", "↗", "Cualquier enlace"],
];

const automaticColors: Record<string, string> = {
  whatsapp: "#25d366", instagram: "#c13584", tiktok: "#111111", facebook: "#1877f2", maps: "#db4437", youtube: "#ff0033", spotify: "#1db954", mercadopago: "#009ee3", telegram: "#229ed9", email: "#334155", phone: "#475569", calendar: "#e05252", website: "#1f2937", url: "#1f2937",
};

export default function ActionForm({ action, landingId }: { action: (formData: FormData) => void | Promise<void>; landingId: string }) {
  const [type, setType] = useState("whatsapp");
  const selected = actionTypes.find(([value]) => value === type);
  const needsUrl = !["whatsapp", "email", "phone"].includes(type);
  return <form action={action} className="stack action-builder">
    <input type="hidden" name="landing_id" value={landingId} />
    <div className="type-picker">{actionTypes.map(([value, title, icon]) => <label className={type === value ? "type-choice active" : "type-choice"} key={value}><input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} /><span>{icon}</span><b>{title}</b></label>)}</div>
    <label className="label">Título<input name="title" placeholder={selected?.[1] || "Mi acción"} required /></label>
    {type === "whatsapp" && <label className="label">Mensaje WhatsApp<input name="message" defaultValue="Hola, quiero hacer una consulta." /></label>}
    {type === "email" && <label className="label">Email<input name="value" type="email" placeholder="contacto@empresa.com" required /></label>}
    {type === "phone" && <label className="label">Número<input name="value" type="tel" placeholder="+54 9 351..." required /></label>}
    {needsUrl && <label className="label">URL<input name="url" type="url" placeholder="https://..." required /></label>}
    <div className="form-split"><label className="label">Ícono<select name="icon" defaultValue={selected?.[2]}>{actionTypes.map(([value, title, icon]) => <option key={value} value={icon}>{title} {icon}</option>)}</select></label><label className="label">Color<input name="background_color" type="color" defaultValue={automaticColors[type] || "#1f2937"} /></label></div>
    <div className="form-split"><label className="label">Texto<input name="text_color" type="color" defaultValue="#ffffff" /></label><label className="check-label"><input name="use_auto_color" type="checkbox" defaultChecked /> Usar color automático</label></div>
    <button className="btn full" type="submit">+ Agregar acción</button>
  </form>;
}
