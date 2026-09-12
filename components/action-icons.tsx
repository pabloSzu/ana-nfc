import type { IconType } from "react-icons";
import {
  FaCarSide, FaFacebookF, FaInstagram, FaSpotify, FaTelegram, FaTicket,
  FaTiktok, FaUtensils, FaWallet, FaWhatsapp, FaYoutube,
} from "react-icons/fa6";
import {
  FiBell, FiBookOpen, FiBriefcase, FiCamera, FiClock, FiCoffee, FiDownload,
  FiFlag, FiGift, FiGlobe, FiHeart, FiHelpCircle, FiHome, FiInfo, FiLink,
  FiMail, FiMapPin, FiMusic, FiPhone, FiShoppingCart, FiStar, FiTag,
} from "react-icons/fi";

const actionIcons: Record<string, IconType> = {
  whatsapp: FaWhatsapp,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  facebook: FaFacebookF,
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
  const Icon = (icon && customIcons[icon]) || actionIcons[type] || FiLink;
  return <Icon className={`action-type-icon${className ? ` ${className}` : ""}`} aria-hidden="true" focusable="false" />;
}
