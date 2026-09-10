export const actionIconMap: Record<string, string> = {
  whatsapp: "fa-brands fa-whatsapp",
  instagram: "fa-brands fa-instagram",
  tiktok: "fa-brands fa-tiktok",
  facebook: "fa-brands fa-facebook-f",
  website: "fa-solid fa-globe",
  email: "fa-solid fa-envelope",
  phone: "fa-solid fa-phone",
  maps: "fa-solid fa-location-dot",
  youtube: "fa-brands fa-youtube",
  spotify: "fa-brands fa-spotify",
  mercadopago: "fa-solid fa-wallet",
  calendar: "fa-regular fa-calendar-check",
  telegram: "fa-brands fa-telegram",
  url: "fa-solid fa-link",
};

export const customIconMap: Record<string, string> = {
  star: "fa-solid fa-star",
  heart: "fa-solid fa-heart",
  gift: "fa-solid fa-gift",
  tag: "fa-solid fa-tag",
  cart: "fa-solid fa-cart-shopping",
  ticket: "fa-solid fa-ticket",
  camera: "fa-solid fa-camera",
  music: "fa-solid fa-music",
  clock: "fa-regular fa-clock",
  info: "fa-solid fa-circle-info",
  help: "fa-solid fa-circle-question",
  home: "fa-solid fa-house",
  briefcase: "fa-solid fa-briefcase",
  book: "fa-solid fa-book-open",
  coffee: "fa-solid fa-mug-hot",
  utensils: "fa-solid fa-utensils",
  car: "fa-solid fa-car",
  download: "fa-solid fa-download",
  flag: "fa-solid fa-flag",
  bell: "fa-solid fa-bell",
};

export const CUSTOM_ICON_OPTIONS: { id: string; label: string }[] = [
  { id: "star", label: "Estrella" },
  { id: "heart", label: "Corazón" },
  { id: "gift", label: "Regalo" },
  { id: "tag", label: "Precio" },
  { id: "cart", label: "Carrito" },
  { id: "ticket", label: "Entrada" },
  { id: "camera", label: "Cámara" },
  { id: "music", label: "Música" },
  { id: "clock", label: "Horario" },
  { id: "info", label: "Info" },
  { id: "help", label: "Ayuda" },
  { id: "home", label: "Inicio" },
  { id: "briefcase", label: "Trabajo" },
  { id: "book", label: "Menú/Libro" },
  { id: "coffee", label: "Café" },
  { id: "utensils", label: "Comida" },
  { id: "car", label: "Auto" },
  { id: "download", label: "Descarga" },
  { id: "flag", label: "Bandera" },
  { id: "bell", label: "Aviso" },
];

export function ActionTypeIcon({ type, icon, className }: { type: string; icon?: string | null; className?: string }) {
  const faClass = (icon && customIconMap[icon]) || actionIconMap[type] || "fa-solid fa-link";
  return <i className={`${faClass}${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}
