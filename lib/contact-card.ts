// Link completo de una red a partir de lo que se cargó: un link, un dominio sin https o solo el
// usuario. Igual que la página (buildActionLink y quickSocialHref en landing-catalog), pero acá
// aparte para que este archivo no dependa del resto de la app y se pueda testear solo.
const SOCIAL_PREFIX: Record<string, string> = {
  instagram: "instagram.com/", tiktok: "tiktok.com/@", telegram: "t.me/",
  facebook: "facebook.com/", linkedin: "linkedin.com/in/", youtube: "youtube.com/@",
};
function socialUrl(type: string, value: string): string {
  const clean = (value || "").trim().replace(/^@/, "");
  if (!clean) return "";
  if (/^https?:\/\//i.test(clean)) return clean;
  // Un dominio sin https ("instagram.com/x", "miweb.com.ar"); "lucia.arq" es un usuario, no un dominio.
  if (/^[\w-]+(\.[\w-]+)*\.(com|net|org|ar|io|me|co|app|link|bio)(\.[a-z]{2})?(\/|$)/i.test(clean)) return `https://${clean}`;
  return SOCIAL_PREFIX[type] ? `https://${SOCIAL_PREFIX[type]}${clean}` : "";
}

type ContactAction = { type: string; url?: string | null };

type ContactLanding = {
  business_name: string;
  description?: string | null;
  title_style?: unknown;
  button_style?: unknown;
};

// Saca el número de lo que la persona haya pegado: un link de WhatsApp (wa.me/…, api.whatsapp.com
// /send?phone=…), un "tel:…" o el número escrito con espacios, guiones o paréntesis. Sin esto, un
// link pegado en el campo de WhatsApp se guardaba tal cual y terminaba como "número" en el contacto.
export function phoneFromInput(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const fromLink = raw.match(/wa\.me\/\+?(\d{6,})/i) || raw.match(/[?&]phone=\+?(\d{6,})/i);
  if (fromLink) return fromLink[1];
  const text = raw.replace(/^tel:/i, "");
  const digits = text.replace(/\D/g, "");
  return text.trim().startsWith("+") ? `+${digits}` : digits;
}

// Número en formato internacional para la agenda: "+5493511234567".
function internationalPhone(value: string): string {
  const number = phoneFromInput(value);
  if (!number) return "";
  return number.startsWith("+") ? number : `+${number}`;
}

function escapeVCard(value: string): string {
  return value.trim().replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

// "María José Pérez" → apellido "Pérez", nombres "María José", para que la agenda lo ordene bien.
function splitName(full: string): { given: string; family: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return { given: full.trim(), family: "" };
  return { given: parts.slice(0, -1).join(" "), family: parts[parts.length - 1] };
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram", linkedin: "LinkedIn", facebook: "Facebook", tiktok: "TikTok",
  youtube: "YouTube", telegram: "Telegram", spotify: "Spotify", website: "Sitio web",
};

// Contacto descargable (.vcf) de una tarjeta personal. Cada número y cada link lleva su etiqueta
// (WhatsApp, Instagram, Tarjeta digital…) con el formato itemN.X-ABLabel que entienden iPhone y
// Android: así no aparecen dos "página de inicio" iguales ni un link en lugar de un número.
// photoJpegBase64: la foto de perfil ya achicada (JPEG en base64, ver lib/contact-photo.ts), para
// que el contacto quede con la cara de la persona en la agenda y en WhatsApp.
export function buildContactCard(landing: ContactLanding, actions: ContactAction[], pageUrl: string, photoJpegBase64 = ""): string {
  const style = landing.title_style && typeof landing.title_style === "object" ? landing.title_style as Record<string, unknown> : {};
  const role = typeof style.eyebrow === "string" ? style.eyebrow.trim() : "";
  const company = (landing.description || "").trim();
  const name = landing.business_name.trim();
  const { given, family } = splitName(name);
  const first = (type: string) => (actions.find((item) => item.type === type)?.url || "").trim();
  const phone = internationalPhone(first("phone"));
  const whatsapp = internationalPhone(first("whatsapp"));
  const email = first("email");
  const buttonStyle = landing.button_style && typeof landing.button_style === "object" ? landing.button_style as Record<string, unknown> : {};
  const secondPhone = internationalPhone(typeof buttonStyle.contactSecondPhone === "string" ? buttonStyle.contactSecondPhone.slice(0, 50) : "");
  const address = typeof buttonStyle.contactAddress === "string" ? buttonStyle.contactAddress.trim().slice(0, 200) : "";
  // "Sobre mí" va como nota del contacto: es el lugar de la agenda para un texto libre.
  const bio = typeof buttonStyle.contactBio === "string" ? buttonStyle.contactBio.trim().slice(0, 360) : "";

  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${escapeVCard(name)}`, `N:${escapeVCard(family)};${escapeVCard(given)};;;`];
  if (role) lines.push(`TITLE:${escapeVCard(role)}`);
  if (company) lines.push(`ORG:${escapeVCard(company)}`);

  let item = 0;
  const labeled = (field: string, value: string, label: string) => {
    item += 1;
    lines.push(`item${item}.${field}:${escapeVCard(value)}`, `item${item}.X-ABLabel:${escapeVCard(label)}`);
  };

  // Números: el teléfono como celular; el WhatsApp con su propia etiqueta si es otro número (si
  // es el mismo no se repite); el segundo teléfono, si no repite ninguno de los anteriores.
  const seen = new Set<string>();
  if (phone) { lines.push(`TEL;TYPE=CELL:${phone}`); seen.add(phone); }
  if (whatsapp && !seen.has(whatsapp)) { labeled("TEL", whatsapp, "WhatsApp"); seen.add(whatsapp); }
  if (secondPhone && !seen.has(secondPhone)) lines.push(`TEL;TYPE=VOICE:${secondPhone}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email)}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(address)};;;;`);
  if (bio) lines.push(`NOTE:${escapeVCard(bio)}`);

  // Links, cada uno con su nombre y sin repetir: primero la tarjeta digital, después WhatsApp
  // (para abrir el chat directo), el sitio web y las redes.
  const seenUrls = new Set<string>();
  const addUrl = (url: string, label: string) => {
    if (!url || !/^https?:\/\//i.test(url) || seenUrls.has(url)) return;
    seenUrls.add(url);
    labeled("URL", url, label);
  };
  addUrl(pageUrl, "Tarjeta digital");
  if (whatsapp) addUrl(`https://wa.me/${whatsapp.replace(/\D/g, "")}`, "WhatsApp");
  for (const action of actions) {
    const label = SOCIAL_LABELS[action.type];
    if (label) addUrl(socialUrl(action.type, action.url || ""), label);
  }

  // La foto va al final y "plegada" en renglones de 75 caracteres (cada renglón siguiente empieza
  // con un espacio), como pide el formato vCard: una línea de varios KB la rompen algunos celulares.
  if (photoJpegBase64) {
    const photo = `PHOTO;ENCODING=b;TYPE=JPEG:${photoJpegBase64}`;
    lines.push(photo.match(/.{1,74}/g)!.join("\r\n "));
  }

  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}
