const base = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconWhatsapp() {
  return <svg {...base}><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.55L3 20l1.05-5.4A8.5 8.5 0 1 1 21 11.5Z" /><path d="M9.3 9.6a5 5 0 0 0 5.1 5.1" /><circle cx="9.3" cy="9.6" r="0.9" fill="currentColor" stroke="none" /><circle cx="14.4" cy="14.7" r="0.9" fill="currentColor" stroke="none" /></svg>;
}

function IconInstagram() {
  return <svg {...base}><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" /><circle cx="12" cy="12" r="4.3" /><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" /></svg>;
}

function IconTiktok() {
  return <svg {...base}><path d="M9 18.5V5.5l3.2-.3a5.3 5.3 0 0 0 4.8 4.4V13a8.4 8.4 0 0 1-4.8-1.6V17a5 5 0 1 1-4-4.9" /></svg>;
}

function IconFacebook() {
  return <svg {...base} strokeWidth={1.6}><path d="M15.5 3h-2A4.5 4.5 0 0 0 9 7.5V10H6.5v3.5H9V21h3.5v-7.5h2.7l.5-3.5h-3.2V8a1.3 1.3 0 0 1 1.3-1.3h2Z" /></svg>;
}

function IconWebsite() {
  return <svg {...base}><circle cx="12" cy="12" r="9.5" /><path d="M12 2.5c2.6 2.6 4 6 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-6-4-9.5s1.4-6.9 4-9.5Z" /><line x1="2.5" y1="12" x2="21.5" y2="12" /></svg>;
}

function IconEmail() {
  return <svg {...base}><rect x="2.5" y="4.5" width="19" height="15" rx="2.2" /><path d="M3.5 6.5 12 13l8.5-6.5" /></svg>;
}

function IconPhone() {
  return <svg {...base}><path d="M21 16.4v3a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 18.7 18.7 0 0 1-5.7-5.7 19 19 0 0 1-3-8.3A2 2 0 0 1 3.8 2.5h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.7a2 2 0 0 1-.4 2.1L8 10.1a15.3 15.3 0 0 0 5.8 5.8l1.1-1.1a2 2 0 0 1 2.1-.4c.9.4 1.8.6 2.7.7a2 2 0 0 1 1.3 2.3Z" /></svg>;
}

function IconMaps() {
  return <svg {...base}><path d="M19.5 10.2c0 6-7.5 11.3-7.5 11.3s-7.5-5.3-7.5-11.3a7.5 7.5 0 0 1 15 0Z" /><circle cx="12" cy="10.2" r="2.7" /></svg>;
}

function IconYoutube() {
  return <svg {...base}><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" /><polygon points="10.5 9.3 15.5 12 10.5 14.7 10.5 9.3" fill="currentColor" stroke="none" /></svg>;
}

function IconSpotify() {
  return <svg {...base}><circle cx="12" cy="12" r="9.5" /><path d="M7 9.8c3-1 7.2-.7 10 1" /><path d="M7.6 13c2.5-.7 5.9-.5 8.4.9" /><path d="M8.2 16c2-.5 4.5-.4 6.3.6" /></svg>;
}

function IconMercadoPago() {
  return <svg {...base}><rect x="2.5" y="5.5" width="19" height="13" rx="2.2" /><line x1="2.5" y1="10" x2="21.5" y2="10" /><line x1="6" y1="14.3" x2="10" y2="14.3" /></svg>;
}

function IconCalendar() {
  return <svg {...base}><rect x="3" y="4.5" width="18" height="17" rx="2.2" /><line x1="16" y1="2.5" x2="16" y2="6.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}

function IconTelegram() {
  return <svg {...base}><path d="M21.5 3 11 13.3" /><path d="M21.5 3 15 21l-4-8-8-4Z" /></svg>;
}

function IconLink() {
  return <svg {...base}><path d="M10.5 13.5a5 5 0 0 0 7.5.5l2.8-2.8a5 5 0 0 0-7-7l-1.6 1.5" /><path d="M13.5 10.5a5 5 0 0 0-7.5-.5L3.2 12.8a5 5 0 0 0 7 7l1.6-1.5" /></svg>;
}

export const actionIconMap: Record<string, () => React.ReactElement> = {
  whatsapp: IconWhatsapp,
  instagram: IconInstagram,
  tiktok: IconTiktok,
  facebook: IconFacebook,
  website: IconWebsite,
  email: IconEmail,
  phone: IconPhone,
  maps: IconMaps,
  youtube: IconYoutube,
  spotify: IconSpotify,
  mercadopago: IconMercadoPago,
  calendar: IconCalendar,
  telegram: IconTelegram,
  url: IconLink,
};

function IconStar() {
  return <svg {...base}><polygon points="12 2.5 15.2 8.9 22.3 10 17.1 15 18.4 22 12 18.6 5.6 22 6.9 15 1.7 10 8.8 8.9 12 2.5" /></svg>;
}

function IconHeart() {
  return <svg {...base}><path d="M12 20.5c-4.5-3-9-6.5-9-11.2A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 9 2.9c0 4.7-4.5 8.2-9 11.2Z" /></svg>;
}

function IconGift() {
  return <svg {...base}><rect x="3" y="8" width="18" height="4.5" rx="0.8" /><rect x="4.5" y="12.5" width="15" height="8.5" /><line x1="12" y1="8" x2="12" y2="21" /><path d="M12 8C10.5 4.5 6 4.5 6 7.2S9.5 8 12 8Z" /><path d="M12 8c1.5-3.5 6-3.5 6-.8S14.5 8 12 8Z" /></svg>;
}

function IconTagIcon() {
  return <svg {...base}><path d="M20.5 12.8 12.8 20.5a1.5 1.5 0 0 1-2.1 0l-7.2-7.2a1.5 1.5 0 0 1 0-2.1L11.2 3.5H19a1.5 1.5 0 0 1 1.5 1.5Z" /><circle cx="15.5" cy="8.5" r="1.3" /></svg>;
}

function IconCart() {
  return <svg {...base}><circle cx="9.5" cy="21" r="1.2" /><circle cx="18" cy="21" r="1.2" /><path d="M2.5 3h3l2.6 12.5h10.8L21 8H6.5" /></svg>;
}

function IconTicket() {
  return <svg {...base}><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2 2 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2 2 0 0 0 0-3Z" /><line x1="10" y1="7.5" x2="10" y2="16.5" /></svg>;
}

function IconCamera() {
  return <svg {...base}><path d="M4 8h3l1.5-2.5h7L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>;
}

function IconMusic() {
  return <svg {...base}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
}

function IconClock() {
  return <svg {...base}><circle cx="12" cy="12" r="9.5" /><polyline points="12 7 12 12 15.5 14" /></svg>;
}

function IconInfo() {
  return <svg {...base}><circle cx="12" cy="12" r="9.5" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" /></svg>;
}

function IconHelp() {
  return <svg {...base}><circle cx="12" cy="12" r="9.5" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.3.9-1.3 1.9" /><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" /></svg>;
}

function IconHome() {
  return <svg {...base}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5a1 1 0 0 0 1 1H9v-6h6v6h2.5a1 1 0 0 0 1-1V10" /></svg>;
}

function IconBriefcase() {
  return <svg {...base}><rect x="2.5" y="7.5" width="19" height="12.5" rx="2" /><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" /><line x1="2.5" y1="13" x2="21.5" y2="13" /></svg>;
}

function IconBook() {
  return <svg {...base}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M4 19.5V4.5" /></svg>;
}

function IconCoffee() {
  return <svg {...base}><path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 4c0 1-1 1-1 2" /><path d="M12 4c0 1-1 1-1 2" /></svg>;
}

function IconUtensils() {
  return <svg {...base}><path d="M6 2v8a2 2 0 0 0 4 0V2" /><line x1="8" y1="2" x2="8" y2="22" /><path d="M17 2c-2 0-3 2-3 5s1 5 3 5v10" /></svg>;
}

function IconCar() {
  return <svg {...base}><path d="M3 16V11l2-5h14l2 5v5" /><path d="M3 16h18" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></svg>;
}

function IconDownload() {
  return <svg {...base}><path d="M12 3v12" /><polyline points="7 11 12 16 17 11" /><path d="M4 19h16" /></svg>;
}

function IconFlag() {
  return <svg {...base}><path d="M5 21V4" /><path d="M5 4h13l-3 4 3 4H5" /></svg>;
}

function IconBell() {
  return <svg {...base}><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
}

export const customIconMap: Record<string, () => React.ReactElement> = {
  star: IconStar,
  heart: IconHeart,
  gift: IconGift,
  tag: IconTagIcon,
  cart: IconCart,
  ticket: IconTicket,
  camera: IconCamera,
  music: IconMusic,
  clock: IconClock,
  info: IconInfo,
  help: IconHelp,
  home: IconHome,
  briefcase: IconBriefcase,
  book: IconBook,
  coffee: IconCoffee,
  utensils: IconUtensils,
  car: IconCar,
  download: IconDownload,
  flag: IconFlag,
  bell: IconBell,
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
  const Icon = (icon && customIconMap[icon]) || actionIconMap[type] || IconLink;
  return <span className={className}><Icon /></span>;
}
