export type TemplateValue = "professional" | "hotel" | "tourism" | "restaurant" | "business";

export const AUTO_COLORS: Record<string, string> = {
  whatsapp: "#25d366", instagram: "#c13584", tiktok: "#111111", facebook: "#1877f2", maps: "#db4437",
  youtube: "#ff0033", spotify: "#1db954", mercadopago: "#009ee3", telegram: "#229ed9", email: "#334155",
  phone: "#475569", calendar: "#e05252", website: "#1f2937", url: "#1f2937",
};

export const templates: { value: TemplateValue; label: string; description: string }[] = [
  { value: "professional", label: "Profesional", description: "Diseño neutro para cualquier rubro." },
  { value: "hotel", label: "Hotelería", description: "Pensada para hoteles, cabañas y alojamientos." },
  { value: "tourism", label: "Turismo", description: "Excursiones, agencias y actividades." },
  { value: "restaurant", label: "Gastronomía", description: "Restaurantes, bares y cafeterías." },
  { value: "business", label: "Negocio", description: "Comercios y servicios profesionales." },
];

export const businessProfiles: {
  value: string;
  label: string;
  description: string;
  icon: string;
  templates: TemplateValue[];
}[] = [
  { value: "custom", label: "Personalizado", description: "Armá tu landing desde cero.", icon: "✨", templates: ["professional", "hotel", "tourism", "restaurant", "business"] },
  { value: "hotel", label: "Hotelería", description: "Hoteles, cabañas y alojamientos.", icon: "🏨", templates: ["hotel", "professional"] },
  { value: "tourism", label: "Turismo", description: "Agencias y excursiones.", icon: "🧭", templates: ["tourism", "professional"] },
  { value: "restaurant", label: "Gastronomía", description: "Restaurantes, bares y cafeterías.", icon: "🍽️", templates: ["restaurant", "professional"] },
  { value: "business", label: "Negocio", description: "Comercios y servicios profesionales.", icon: "💼", templates: ["business", "professional"] },
];

export function getBusinessProfile(value: string) {
  return businessProfiles.find((profile) => profile.value === value) || businessProfiles[0];
}

type ActionType = "whatsapp" | "instagram" | "tiktok" | "facebook" | "website" | "email" | "phone" | "maps" | "youtube" | "spotify" | "mercadopago" | "calendar" | "telegram" | "url";

type ActionDef = {
  type: ActionType;
  label: string;
  icon: string;
  input: "phone" | "email" | "text" | "url";
  placeholder: string;
  message: boolean;
};

const ACTION_DEFS: Record<ActionType, ActionDef> = {
  whatsapp: { type: "whatsapp", label: "WhatsApp", icon: "💬", input: "phone", placeholder: "549351XXXXXXXX", message: true },
  instagram: { type: "instagram", label: "Instagram", icon: "📸", input: "url", placeholder: "https://instagram.com/tuusuario", message: false },
  tiktok: { type: "tiktok", label: "TikTok", icon: "🎵", input: "url", placeholder: "https://tiktok.com/@tuusuario", message: false },
  facebook: { type: "facebook", label: "Facebook", icon: "📘", input: "url", placeholder: "https://facebook.com/tupagina", message: false },
  website: { type: "website", label: "Sitio web", icon: "🌐", input: "url", placeholder: "https://tusitio.com", message: false },
  email: { type: "email", label: "Email", icon: "✉️", input: "email", placeholder: "contacto@negocio.com", message: false },
  phone: { type: "phone", label: "Teléfono", icon: "📞", input: "phone", placeholder: "549351XXXXXXXX", message: false },
  maps: { type: "maps", label: "Cómo llegar", icon: "📍", input: "url", placeholder: "https://maps.google.com/...", message: false },
  youtube: { type: "youtube", label: "YouTube", icon: "▶️", input: "url", placeholder: "https://youtube.com/@tucanal", message: false },
  spotify: { type: "spotify", label: "Spotify", icon: "🎧", input: "url", placeholder: "https://open.spotify.com/...", message: false },
  mercadopago: { type: "mercadopago", label: "Pagar con Mercado Pago", icon: "💳", input: "url", placeholder: "https://mpago.la/...", message: false },
  calendar: { type: "calendar", label: "Reservar turno", icon: "📅", input: "url", placeholder: "https://calendly.com/...", message: false },
  telegram: { type: "telegram", label: "Telegram", icon: "📨", input: "url", placeholder: "https://t.me/tucanal", message: false },
  url: { type: "url", label: "Enlace", icon: "🔗", input: "url", placeholder: "https://...", message: false },
};

const TEMPLATE_ACTIONS: Record<TemplateValue, ActionType[]> = {
  professional: ["whatsapp", "website", "email", "phone", "instagram", "maps"],
  hotel: ["whatsapp", "maps", "calendar", "instagram", "facebook", "website"],
  tourism: ["whatsapp", "calendar", "maps", "instagram", "youtube", "website"],
  restaurant: ["whatsapp", "maps", "instagram", "facebook", "mercadopago", "website"],
  business: ["whatsapp", "email", "phone", "website", "instagram", "calendar"],
};

export function getTemplateActions(template: string) {
  const types = TEMPLATE_ACTIONS[template as TemplateValue] || TEMPLATE_ACTIONS.professional;
  return types.map((type) => ({ sourceField: type, ...ACTION_DEFS[type] }));
}
