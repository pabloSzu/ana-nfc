import type { IconType } from "react-icons";
import {
  FaCarSide, FaFacebookF, FaInstagram, FaLinkedinIn, FaSpotify, FaTelegram, FaTicket,
  FaTiktok, FaUtensils, FaWhatsapp, FaYoutube,
} from "react-icons/fa6";
import { SiGoogle, SiGooglemaps } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";
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

// Mercado Pago's real logo, straight from the brand's own SVG: the cyan oval, the white
// handshake, and the navy keyline that traces the whole mark.
// This is the one glyph here that is NOT drawn in currentColor, on purpose — the oval is part
// of the logo, and Mercado Pago's brand does not have a monochrome-silhouette version that
// still reads as Mercado Pago at button size. Because it carries its own color it also carries
// its own legibility: the navy keyline is what keeps it crisp on a white button and on a cyan
// one alike, which is exactly why the brand file ships it.
// It follows that this mark ALREADY IS a badge. buttonIconStyle gives it a transparent disc
// instead of a colored one (see the mercadopago case there) — a colored disc behind it renders
// as an oval inside a circle, and a white one disappears on the pale templates.
// The same handshake, alone and in currentColor — the variant used everywhere the full-color
// lockup below would fight the template: the translucent collections (Glassmorfismo, Cristal
// premium, Pastel, Candy) whose whole look is a see-through surface, and the monochrome ones
// (Minimal Line, Luxury, Neon Glow) that coordinate every icon to one tone. An opaque cyan oval
// dropped into any of those reads as a sticker pasted on top.
// viewBox is the handshake's measured ink box exactly (x 28.4-240.9, y 274.8-366.5), with no
// padding around it: the brand file's own box is mostly the oval's empty space, and any margin
// left here comes straight off the drawn size. The mark is ~2.3:1, so it can never fill a square
// box top to bottom — it earns its presence on width instead, hence its own CSS size below.
function MercadoPagoMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="28 274 214 94" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M99.9,299.2c-0.1,0.1-1.1,1.2-0.4,2.1c1.7,2.1,6.8,3.3,12,2.2c3.1-0.7,7-3.8,10.9-6.9c4.2-3.3,8.3-6.6,12.4-7.9c4.4-1.4,7.2-0.8,9.1-0.2c2,0.6,4.4,2,8.3,4.8c7.2,5.4,36.1,30.7,41.2,35c4-1.8,23.2-9.6,47.5-14.9c-2.1-13-9.9-25.3-21.9-35c-16.7,7-38.4,11.2-58.4,1.5c-0.1,0-10.9-5.1-21.5-4.9c-15.8,0.4-22.7,7.2-29.9,14.5L99.9,299.2L99.9,299.2z" />
      <path fill="currentColor" d="M192.1,331c-0.3-0.3-34-29.8-41.7-35.5c-4.4-3.3-6.9-4.2-9.5-4.5c-1.3-0.2-3.2,0.1-4.5,0.4c-3.6,1-8.2,4.1-12.3,7.3c-4.3,3.4-8.3,6.6-12,7.4c-4.8,1.1-10.6-0.2-13.3-2c-1.1-0.7-1.8-1.6-2.2-2.4c-1-2.3,0.8-4.1,1.1-4.4l9.3-10.1c1.1-1.1,2.2-2.2,3.3-3.2c-3,0.4-5.8,1.2-8.5,1.9c-3.4,0.9-6.6,1.8-9.9,1.8c-1.4,0-8.7-1.2-10.1-1.6c-8.4-2.3-18-4.5-29-9.7c-13.2,9.8-21.8,21.9-24.4,35.5c1.9,0.5,6.9,1.6,8.2,1.9c29.9,6.7,39.2,13.5,40.9,14.9c1.8-2,4.5-3.3,7.4-3.3c3.3,0,6.3,1.7,8.1,4.2c1.7-1.4,4.1-2.5,7.1-2.5c1.4,0,2.8,0.3,4.3,0.7c3.4,1.2,5.1,3.4,6,5.4c1.1-0.5,2.5-0.9,4.2-0.9c1.6,0,3.3,0.4,5,1.1c5.5,2.4,6.4,7.8,5.9,11.9c0.4,0,0.8-0.1,1.2-0.1c6.5,0,11.9,5.3,11.9,11.9c0,2-0.5,3.9-1.4,5.6c1.8,1,6.3,3.3,10.3,2.8c3.2-0.4,4.4-1.5,4.8-2.1c0.3-0.4,0.6-0.9,0.3-1.3l-8.4-9.4c0,0-1.4-1.3-0.9-1.8c0.5-0.5,1.3,0.2,1.9,0.7c4.3,3.6,9.5,9,9.5,9c0.1,0.1,0.4,0.7,2.4,1.1c1.7,0.3,4.6,0.1,6.7-1.6c0.5-0.4,1-1,1.5-1.5c0,0-0.1,0.1-0.1,0.1c2.2-2.8-0.2-5.6-0.2-5.6l-9.9-11.1c0,0-1.4-1.3-0.9-1.8c0.4-0.5,1.3,0.2,2,0.7c3.1,2.6,7.5,7,11.8,11.2c0.8,0.6,4.5,2.9,9.5-0.3c3-2,3.6-4.4,3.5-6.2c-0.2-2.4-2.1-4.1-2.1-4.1l-13.5-13.5c0,0-1.4-1.2-0.9-1.8c0.4-0.5,1.3,0.2,1.9,0.7c4.3,3.6,15.9,14.2,15.9,14.2c0.2,0.1,4.2,3,9.1-0.2c1.8-1.1,2.9-2.8,3-4.8C194.5,333,192.1,331,192.1,331L192.1,331z" />
      <path fill="currentColor" d="M126.8,348.1c-2.1,0-4.4,1.2-4.7,1c-0.2-0.1,0.1-0.9,0.3-1.4c0.2-0.5,2.9-8.7-3.7-11.6c-5.1-2.2-8.3,0.3-9.3,1.4c-0.3,0.3-0.4,0.3-0.4-0.1c-0.1-1.5-0.8-5.5-5.2-6.9c-6.3-1.9-10.4,2.5-11.4,4.1c-0.5-3.6-3.5-6.4-7.2-6.4c-4.1,0-7.3,3.3-7.4,7.3c0,4.1,3.3,7.3,7.3,7.3c2,0,3.8-0.8,5.1-2c0,0,0.1,0.1,0,0.2c-0.3,1.8-0.9,8.4,6,11.1c2.8,1.1,5.1,0.3,7.1-1.1c0.6-0.4,0.7-0.2,0.6,0.3c-0.3,1.7,0.1,5.3,5.2,7.4c3.9,1.6,6.2,0,7.7-1.4c0.7-0.6,0.8-0.5,0.9,0.4c0.2,4.9,4.3,8.8,9.2,8.8c5.1,0,9.2-4.1,9.2-9.2C136,352.3,131.9,348.2,126.8,348.1L126.8,348.1z" />
    </svg>
  );
}

// Google Maps' real pin, from the brand's own SVG — the five-color teardrop.
// Like Mercado Pago's lockup it is not drawn in currentColor, and it renders only in brandMark
// mode; everywhere else the monochrome Simple Icons glyph inherits the button's color as usual.
// Its badge is deliberately WHITE (see BRAND_ICON), not the red one the mono glyph used to sit
// on, for two reasons. The pin is mostly red itself, so a red disc swallows it. And the pin's
// centre is a genuine hole — no path covers it — so whatever sits behind shows through it: on
// white that reads as the pin's own white eye, on a colored button it reads as a smear.
// A white disc that goes invisible on a pale button is fine here in a way it was not for
// Mercado Pago: the pin carries its own five colors, so it stays legible with or without it.
function GoogleMapsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 92.3 132.3" aria-hidden="true" focusable="false">
      <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z" />
      <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z" />
      <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3" />
      <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3" />
      <path fill="#34a853" d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2" />
    </svg>
  );
}

function MercadoPagoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="20 240 230 170" aria-hidden="true" focusable="false">
      <path fill="#00BCFF" d="M134.9,251.7c-59.3,0-107.4,30.8-107.4,68.7s48.1,71.7,107.4,71.7s107.4-33.7,107.4-71.7S194.2,251.7,134.9,251.7z" />
      <path fill="#FFFFFF" d="M99.9,299.2c-0.1,0.1-1.1,1.2-0.4,2.1c1.7,2.1,6.8,3.3,12,2.2c3.1-0.7,7-3.8,10.9-6.9c4.2-3.3,8.3-6.6,12.4-7.9c4.4-1.4,7.2-0.8,9.1-0.2c2,0.6,4.4,2,8.3,4.8c7.2,5.4,36.1,30.7,41.2,35c4-1.8,23.2-9.6,47.5-14.9c-2.1-13-9.9-25.3-21.9-35c-16.7,7-38.4,11.2-58.4,1.5c-0.1,0-10.9-5.1-21.5-4.9c-15.8,0.4-22.7,7.2-29.9,14.5L99.9,299.2L99.9,299.2z" />
      <path fill="#FFFFFF" d="M192.1,331c-0.3-0.3-34-29.8-41.7-35.5c-4.4-3.3-6.9-4.2-9.5-4.5c-1.3-0.2-3.2,0.1-4.5,0.4c-3.6,1-8.2,4.1-12.3,7.3c-4.3,3.4-8.3,6.6-12,7.4c-4.8,1.1-10.6-0.2-13.3-2c-1.1-0.7-1.8-1.6-2.2-2.4c-1-2.3,0.8-4.1,1.1-4.4l9.3-10.1c1.1-1.1,2.2-2.2,3.3-3.2c-3,0.4-5.8,1.2-8.5,1.9c-3.4,0.9-6.6,1.8-9.9,1.8c-1.4,0-8.7-1.2-10.1-1.6c-8.4-2.3-18-4.5-29-9.7c-13.2,9.8-21.8,21.9-24.4,35.5c1.9,0.5,6.9,1.6,8.2,1.9c29.9,6.7,39.2,13.5,40.9,14.9c1.8-2,4.5-3.3,7.4-3.3c3.3,0,6.3,1.7,8.1,4.2c1.7-1.4,4.1-2.5,7.1-2.5c1.4,0,2.8,0.3,4.3,0.7c3.4,1.2,5.1,3.4,6,5.4c1.1-0.5,2.5-0.9,4.2-0.9c1.6,0,3.3,0.4,5,1.1c5.5,2.4,6.4,7.8,5.9,11.9c0.4,0,0.8-0.1,1.2-0.1c6.5,0,11.9,5.3,11.9,11.9c0,2-0.5,3.9-1.4,5.6c1.8,1,6.3,3.3,10.3,2.8c3.2-0.4,4.4-1.5,4.8-2.1c0.3-0.4,0.6-0.9,0.3-1.3l-8.4-9.4c0,0-1.4-1.3-0.9-1.8c0.5-0.5,1.3,0.2,1.9,0.7c4.3,3.6,9.5,9,9.5,9c0.1,0.1,0.4,0.7,2.4,1.1c1.7,0.3,4.6,0.1,6.7-1.6c0.5-0.4,1-1,1.5-1.5c0,0-0.1,0.1-0.1,0.1c2.2-2.8-0.2-5.6-0.2-5.6l-9.9-11.1c0,0-1.4-1.3-0.9-1.8c0.4-0.5,1.3,0.2,2,0.7c3.1,2.6,7.5,7,11.8,11.2c0.8,0.6,4.5,2.9,9.5-0.3c3-2,3.6-4.4,3.5-6.2c-0.2-2.4-2.1-4.1-2.1-4.1l-13.5-13.5c0,0-1.4-1.2-0.9-1.8c0.4-0.5,1.3,0.2,1.9,0.7c4.3,3.6,15.9,14.2,15.9,14.2c0.2,0.1,4.2,3,9.1-0.2c1.8-1.1,2.9-2.8,3-4.8C194.5,333,192.1,331,192.1,331L192.1,331z" />
      <path fill="#FFFFFF" d="M126.8,348.1c-2.1,0-4.4,1.2-4.7,1c-0.2-0.1,0.1-0.9,0.3-1.4c0.2-0.5,2.9-8.7-3.7-11.6c-5.1-2.2-8.3,0.3-9.3,1.4c-0.3,0.3-0.4,0.3-0.4-0.1c-0.1-1.5-0.8-5.5-5.2-6.9c-6.3-1.9-10.4,2.5-11.4,4.1c-0.5-3.6-3.5-6.4-7.2-6.4c-4.1,0-7.3,3.3-7.4,7.3c0,4.1,3.3,7.3,7.3,7.3c2,0,3.8-0.8,5.1-2c0,0,0.1,0.1,0,0.2c-0.3,1.8-0.9,8.4,6,11.1c2.8,1.1,5.1,0.3,7.1-1.1c0.6-0.4,0.7-0.2,0.6,0.3c-0.3,1.7,0.1,5.3,5.2,7.4c3.9,1.6,6.2,0,7.7-1.4c0.7-0.6,0.8-0.5,0.9,0.4c0.2,4.9,4.3,8.8,9.2,8.8c5.1,0,9.2-4.1,9.2-9.2C136,352.3,131.9,348.2,126.8,348.1L126.8,348.1z" />
      <path fill="#0A0080" d="M134.9,248.9c-60.4,0-109.4,32.1-109.4,71.6c0,1,0,3.8,0,4.2c0,41.8,42.8,75.7,109.4,75.7s109.4-33.9,109.4-75.7v-4.2C244.3,281,195.3,248.9,134.9,248.9L134.9,248.9z M239.3,312.5c-23.8,5.3-41.5,13-46,14.9c-10.4-9.1-34.4-29.9-40.9-34.8c-3.7-2.8-6.2-4.3-8.5-4.9c-1-0.3-2.4-0.6-4.2-0.6c-1.7,0-3.4,0.3-5.3,0.9c-4.2,1.3-8.4,4.7-12.4,7.9L122,296c-3.8,3-7.7,6.1-10.6,6.8c-1.3,0.3-2.6,0.4-3.9,0.4c-3.3,0-6.3-1-7.4-2.4c-0.2-0.2-0.1-0.6,0.4-1.2l0.1-0.1l9.1-9.8c7.2-7.2,13.9-13.9,29.5-14.3c0.3,0,0.5,0,0.8,0c9.7,0,19.4,4.3,20.4,4.8c9.1,4.4,18.4,6.7,27.9,6.7c9.8,0,19.9-2.4,30.5-7.3C229.7,289,237.1,300.3,239.3,312.5L239.3,312.5z M134.9,253.1c32.1,0,60.8,9.2,80.1,23.7c-9.3,4-18.2,6.1-26.8,6.1c-8.8,0-17.6-2.1-26.1-6.3c-0.4-0.2-11.1-5.3-22.3-5.3c-0.3,0-0.6,0-0.9,0c-13.1,0.3-20.4,4.9-25.4,9c-4.8,0.1-9,1.3-12.7,2.3c-3.3,0.9-6.1,1.7-8.9,1.7c-1.1,0-3.2-0.1-3.4-0.1c-3.2-0.1-19.2-4-32-8.8C75.9,261.7,103.8,253.1,134.9,253.1L134.9,253.1z M52.9,278.2c13.3,5.5,29.5,9.7,34.7,10c1.4,0.1,2.9,0.3,4.5,0.3c3.4,0,6.8-1,10.1-1.9c1.9-0.5,4.1-1.1,6.3-1.6c-0.6,0.6-1.2,1.2-1.8,1.8l-9.3,10c-0.7,0.7-2.3,2.7-1.3,5.1c0.4,1,1.3,1.9,2.4,2.7c2.2,1.5,6.2,2.5,9.8,2.5c1.4,0,2.7-0.1,3.9-0.4c3.9-0.9,8-4.1,12.3-7.6c3.4-2.7,8.3-6.2,12.1-7.2c1.1-0.3,2.3-0.5,3.4-0.5c0.3,0,0.6,0,0.9,0.1c2.5,0.3,4.9,1.2,9.1,4.4c7.6,5.7,41.3,35.2,41.6,35.5c0,0,2.2,1.9,2,5c-0.1,1.7-1,3.2-2.7,4.3c-1.4,0.9-2.9,1.4-4.4,1.4c-2.3,0-3.8-1.1-3.9-1.1c-0.1-0.1-11.7-10.7-15.9-14.3c-0.7-0.6-1.3-1.1-2-1.1c-0.4,0-0.7,0.2-0.9,0.4c-0.7,0.8,0.1,2,1,2.7l13.5,13.6c0,0,1.7,1.6,1.9,3.7c0.1,2.2-1,4.1-3.2,5.6c-1.6,1.1-3.2,1.6-4.8,1.6c-2.1,0-3.5-0.9-3.8-1.2l-1.9-1.9c-3.5-3.5-7.2-7.1-9.9-9.3c-0.7-0.5-1.3-1-2-1c-0.3,0-0.6,0.1-0.9,0.4c-0.3,0.3-0.5,0.9,0.2,2c0.3,0.4,0.7,0.8,0.7,0.8l9.8,11.1c0.1,0.1,2,2.4,0.2,4.7l-0.4,0.4c-0.3,0.3-0.6,0.6-0.9,0.9c-1.7,1.4-3.9,1.5-4.8,1.5c-0.5,0-0.9,0-1.3-0.1c-1-0.2-1.6-0.4-1.9-0.8l-0.1-0.1c-0.5-0.6-5.5-5.6-9.6-9c-0.5-0.5-1.2-1-1.9-1c-0.3,0-0.6,0.1-0.9,0.4c-0.8,0.9,0.4,2.2,0.9,2.7l8.4,9.3c0,0.1-0.1,0.3-0.3,0.6c-0.3,0.4-1.3,1.4-4.4,1.8c-0.4,0-0.7,0.1-1.1,0.1c-3.1,0-6.5-1.5-8.2-2.4c0.8-1.7,1.2-3.5,1.2-5.3c0-6.9-5.6-12.5-12.5-12.5c-0.1,0-0.3,0-0.4,0c0.2-3.2-0.2-9.1-6.4-11.8c-1.8-0.8-3.5-1.2-5.2-1.2c-1.3,0-2.6,0.2-3.8,0.7c-1.3-2.5-3.4-4.3-6.1-5.2c-1.5-0.5-3-0.8-4.5-0.8c-2.6,0-4.9,0.8-7,2.2c-2-2.5-5-4-8.2-4c-2.8,0-5.5,1.1-7.5,3.1c-2.6-2-13-8.6-40.7-14.9c-1.3-0.3-4.3-1.2-6.2-1.7C33.2,299,41.1,287.6,52.9,278.2L52.9,278.2z M104.3,350.5l-0.3-0.3h-0.3c-0.2,0-0.5,0.1-0.8,0.3c-1.4,1-2.8,1.5-4.1,1.5c-0.8,0-1.5-0.2-2.3-0.4c-6.4-2.5-5.9-8.6-5.6-10.4c0-0.4,0-0.7-0.3-0.9l-0.5-0.4l-0.4,0.4c-1.3,1.2-2.9,1.9-4.6,1.9c-3.7,0-6.7-3-6.7-6.7c0-3.7,3-6.7,6.7-6.7c3.3,0,6.2,2.5,6.6,5.8l0.2,1.8l1-1.5c0.1-0.2,2.8-4.3,7.8-4.3c0.9,0,1.9,0.2,2.9,0.5c4,1.2,4.6,4.8,4.7,6.3c0.1,0.9,0.7,0.9,0.8,0.9c0.3,0,0.6-0.2,0.8-0.4c0.7-0.8,2.4-2.1,4.9-2.1c1.2,0,2.4,0.3,3.7,0.8c6.3,2.7,3.4,10.7,3.4,10.8c-0.5,1.3-0.6,1.9-0.1,2.2l0.2,0.1h0.2c0.3,0,0.6-0.1,1.2-0.3c0.9-0.3,2.1-0.7,3.4-0.7l0,0c4.7,0.1,8.6,3.9,8.6,8.6c0,4.7-3.9,8.6-8.6,8.6c-4.6,0-8.4-3.6-8.6-8.2c0-0.4-0.1-1.4-0.9-1.4c-0.4,0-0.7,0.2-1,0.5c-1,0.9-2.3,1.9-4.2,1.9c-0.9,0-1.8-0.2-2.8-0.6c-4.9-2-5-5.3-4.8-6.7C104.5,351.1,104.6,350.8,104.3,350.5L104.3,350.5z M134.9,387.7c-58.1,0-105.2-30.1-105.2-67.3c0-1.5,0.1-3,0.3-4.5c0.5,0.1,5.1,1.2,6,1.4c28.3,6.3,37.7,12.8,39.3,14.1c-0.5,1.3-0.8,2.7-0.8,4.1c0,5.9,4.8,10.6,10.6,10.6c0.7,0,1.3-0.1,2-0.2c0.9,4.3,3.7,7.6,8,9.3c1.3,0.5,2.5,0.7,3.8,0.7c0.8,0,1.6-0.1,2.4-0.3c0.8,2,2.6,4.5,6.6,6.2c1.4,0.6,2.8,0.9,4.2,0.9c1.1,0,2.2-0.2,3.2-0.6c1.9,4.7,6.5,7.8,11.6,7.8c3.4,0,6.6-1.4,9-3.8c2,1.1,6.3,3.2,10.6,3.2c0.6,0,1.1,0,1.6-0.1c4.3-0.5,6.3-2.2,7.2-3.5c0.2-0.2,0.3-0.5,0.4-0.7c1,0.3,2.1,0.5,3.4,0.5c2.3,0,4.6-0.8,6.9-2.4c2.2-1.6,3.8-3.9,4-5.9c0,0,0-0.1,0-0.1c0.8,0.2,1.5,0.2,2.3,0.2c2.4,0,4.8-0.7,7-2.2c4.4-2.9,5.1-6.6,5.1-9c0.8,0.2,1.5,0.2,2.3,0.2c2.3,0,4.5-0.7,6.6-2c2.7-1.7,4.3-4.4,4.6-7.5c0.2-2.1-0.4-4.2-1.5-6c7.3-3.1,24-9.2,43.6-13.7c0.1,1.1,0.1,2.2,0.1,3.4C240.1,357.6,193,387.7,134.9,387.7L134.9,387.7z" />
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
  maps: SiGooglemaps,
  youtube: FaYoutube,
  spotify: FaSpotify,
  mercadopago: MercadoPagoMarkIcon,
  calendar: FiClock,
  telegram: FaTelegram,
  review: SiGoogle,
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
  // The lockup gets its own class on top: it fills the whole box (it IS the badge), while the
  // bare handshake above sits inset like every other glyph.
  // Google's own flat four-color G, from Flat Color Icons — the mark Google itself uses at this
  // size. Unlike the Maps pin and the Mercado Pago lockup, which are inlined from the brands'
  // own files, this one needs no inlining: it is a handful of plain paths with no gradients,
  // filters or ids, so it costs nothing and cannot collide with another SVG's defs.
  if (brandMark && !icon && type === "review") return <FcGoogle className={sharedClassName} />;
  if (brandMark && !icon && type === "maps") return <GoogleMapsIcon className={`${sharedClassName} action-type-icon-maps-pin`} />;
  if (brandMark && !icon && type === "mercadopago") return <MercadoPagoIcon className={`${sharedClassName} action-type-icon-mp-lockup`} />;
  const Icon = (icon && customIcons[icon]) || actionIcons[type] || FiLink;
  // Feather-style (Fi) icons draw with a 2px stroke by default, which reads as thin/hard to
  // make out at button-icon sizes — bumping it here (ignored by the solid-fill Fa6 brand marks,
  // which have no stroke to speak of) makes every outline icon read bolder across the board.
  return <Icon className={sharedClassName} strokeWidth={2.5} aria-hidden="true" focusable="false" />;
}
