import type { IconType } from "react-icons";
import {
  FaCarSide, FaFacebookF, FaInstagram, FaLinkedinIn, FaSpotify, FaTelegram, FaTicket,
  FaTiktok, FaUtensils, FaWallet, FaWhatsapp, FaYoutube,
} from "react-icons/fa6";
import {
  FiAward, FiBell, FiBookOpen, FiBriefcase, FiCamera, FiClock, FiCoffee, FiDownload,
  FiFlag, FiGift, FiGlobe, FiHeart, FiHelpCircle, FiHome, FiInfo, FiLink, FiLock,
  FiMail, FiMapPin, FiMusic, FiPercent, FiPhone, FiShare2, FiShoppingCart, FiStar,
  FiTag, FiThumbsUp, FiTruck, FiUsers, FiVideo, FiWifi,
} from "react-icons/fi";

function SpotifyWavesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 8.3c4.4-1.25 9.8-.94 14 1.12" fill="none" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path d="M5.8 12.15c3.75-1 8.55-.7 12.2 1.05" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M6.55 15.75c3.05-.72 6.88-.47 9.92.96" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function YoutubePlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9.25 7.25 17 12l-7.75 4.75z" fill="currentColor" />
    </svg>
  );
}

const actionIcons: Record<string, IconType> = {
  whatsapp: FaWhatsapp,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  facebook: FaFacebookF,
  linkedin: FaLinkedinIn,
  website: FiGlobe,
  email: FiMail,
  phone: FiPhone,
  maps: FiMapPin,
  youtube: FaYoutube,
  spotify: FaSpotify,
  mercadopago: FaWallet,
  calendar: FiClock,
  telegram: FaTelegram,
  url: FiLink,
};

const customIcons: Record<string, IconType> = {
  star: FiStar,
  heart: FiHeart,
  gift: FiGift,
  tag: FiTag,
  cart: FiShoppingCart,
  ticket: FaTicket,
  camera: FiCamera,
  music: FiMusic,
  clock: FiClock,
  info: FiInfo,
  help: FiHelpCircle,
  home: FiHome,
  briefcase: FiBriefcase,
  book: FiBookOpen,
  coffee: FiCoffee,
  utensils: FaUtensils,
  car: FaCarSide,
  download: FiDownload,
  flag: FiFlag,
  bell: FiBell,
  location: FiMapPin,
  users: FiUsers,
  award: FiAward,
  video: FiVideo,
  share: FiShare2,
  percent: FiPercent,
  lock: FiLock,
  truck: FiTruck,
  wifi: FiWifi,
  thumbsup: FiThumbsUp,
};

export const CUSTOM_ICON_OPTIONS: { id: string; label: string }[] = [
  { id: "star", label: "Estrella" },
  { id: "heart", label: "Corazón" },
  { id: "gift", label: "Regalo" },
  { id: "tag", label: "Precio" },
  { id: "percent", label: "Descuento" },
  { id: "cart", label: "Carrito" },
  { id: "ticket", label: "Entrada" },
  { id: "location", label: "Ubicación" },
  { id: "camera", label: "Cámara" },
  { id: "video", label: "Video" },
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
  { id: "truck", label: "Envío" },
  { id: "users", label: "Comunidad" },
  { id: "award", label: "Premio" },
  { id: "thumbsup", label: "Me gusta" },
  { id: "share", label: "Compartir" },
  { id: "lock", label: "Seguro" },
  { id: "wifi", label: "WiFi" },
  { id: "download", label: "Descarga" },
  { id: "flag", label: "Bandera" },
  { id: "bell", label: "Aviso" },
];

export function ActionTypeIcon({ type, icon, className, brandMark = false }: { type: string; icon?: string | null; className?: string; brandMark?: boolean }) {
  const iconKey = icon && customIcons[icon] ? icon : (actionIcons[type] ? type : "url");
  const sharedClassName = `action-type-icon action-type-icon-${iconKey}${className ? ` ${className}` : ""}`;
  if (brandMark && !icon && type === "spotify") return <SpotifyWavesIcon className={sharedClassName} />;
  if (brandMark && !icon && type === "youtube") return <YoutubePlayIcon className={sharedClassName} />;
  const Icon = (icon && customIcons[icon]) || actionIcons[type] || FiLink;
  // Feather-style (Fi) icons draw with a 2px stroke by default, which reads as thin/hard to
  // make out at button-icon sizes — bumping it here (ignored by the solid-fill Fa6 brand marks,
  // which have no stroke to speak of) makes every outline icon read bolder across the board.
  return <Icon className={sharedClassName} strokeWidth={2.5} aria-hidden="true" focusable="false" />;
}
