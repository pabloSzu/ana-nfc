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
  return <svg {...base}><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.55L3 20l1.05-5.4A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 9.5c.3 3 2.7 5.4 5.7 5.7.9.1 1.3-.5 1.3-1.1v-1c-1 .3-2.3 0-3-.7l-.6-.6c-.7-.7-1-2-.7-3h-1c-.6 0-1.2.4-1.1 1.3.1.5.2 1 .4 1.4Z" fill="currentColor" stroke="none" /></svg>;
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

export function ActionTypeIcon({ type, className }: { type: string; className?: string }) {
  const Icon = actionIconMap[type] || IconLink;
  return <span className={className}><Icon /></span>;
}
