// Lotes de chapitas que activa el comprador (ver supabase/migrations/20261020120000_pet_tags_and_members.sql).
// Cada chapita es una landing "pet" sin cliente y sin publicar, con un código de activación que
// va impreso en la tarjetita del paquete. Funciones puras, probadas en tests/pet-tags.test.ts.

// Sin 0/O, 1/I/L ni 5/S: el código se lee de un papel y se tipea en un celular.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ2346789";
export const CODE_LENGTH = 8;
export const BATCH_MAX = 100;

export function newActivationCode(random: (max: number) => number = secureRandom): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[random(CODE_ALPHABET.length)]).join("");
}

// Como se guarda: mayúsculas, sin guion ni espacios. Igual que en activate_tag de la base.
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

// Como se imprime y se muestra: "ABCD-2346".
export function formatCode(code: string): string {
  const clean = normalizeCode(code);
  return clean.length === CODE_LENGTH ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

// QR secreto que va adentro del paquete. Precarga el código para que el comprador no tenga
// que copiarlo; el texto impreso queda como respaldo si su cámara no puede leer el QR.
export function activationPath(code: string): string {
  return `/activar?c=${encodeURIComponent(normalizeCode(code))}`;
}

// El link de una chapita de lote no lleva el nombre de la mascota (todavía no existe): es un
// slug corto y al azar. Lo que se graba en el chip y en el QR es igual el link permanente /go/id.
export function newTagSlug(random: (max: number) => number = secureRandom): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return "m-" + Array.from({ length: 7 }, () => chars[random(chars.length)]).join("");
}

// El QR impreso en el dorso usa un link corto: /q/ y los primeros 12 caracteres del id. Con el
// /go/<id>?s=qr completo el QR tiene 37×37 cuadraditos. Al imprimir el link corto en mayúsculas,
// el generador puede usar el modo alfanumérico del estándar: baja de 29×29 a 25×25 módulos sin
// acortar el identificador ni perder seguridad. El chip NFC sigue con /go/<id>.
export const SHORT_TAG_LENGTH = 12;

export function shortTagCode(id: string): string {
  return id.replace(/-/g, "").slice(0, SHORT_TAG_LENGTH).toLowerCase();
}

// HTTPS y el host no distinguen mayúsculas; /q normaliza el código antes de buscarlo. Mantener
// sólo la q minúscula hace que la URL siga siendo la ruta real y el resto queda en el alfabeto
// compacto del QR. En producción da una matriz 25×25 en vez de 29×29 con corrección M.
export function shortTagQrUrl(origin: string, id: string): string {
  return `${origin.replace(/\/$/, "").toUpperCase()}/q/${shortTagCode(id).toUpperCase()}`;
}

// Molde independiente para plotter o láser. El lienzo agrega 2 mm alrededor, pero el path del
// grupo CUT_CONTOUR conserva exactamente el diámetro final elegido.
export function tagCutContourSvg(diameter: number): string {
  const safeDiameter = Math.min(45, Math.max(26, Number.isFinite(diameter) ? diameter : 30));
  const margin = 2;
  const canvas = safeDiameter + margin * 2;
  const center = canvas / 2;
  const radius = safeDiameter / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}mm" height="${canvas}mm" viewBox="0 0 ${canvas} ${canvas}"><title>Contorno de corte BioNFC - ${safeDiameter} mm</title><g id="CUT_CONTOUR" fill="none" stroke="#ff00ff" stroke-width="0.01"><circle id="CutContour" cx="${center}" cy="${center}" r="${radius}"/></g></svg>`;
}

// Los ids que empiezan con ese código corto, como rango de uuid (para buscarlos en la base).
export function shortTagRange(code: string): [string, string] | null {
  if (!new RegExp(`^[0-9a-f]{${SHORT_TAG_LENGTH}}$`).test(code)) return null;
  const head = `${code.slice(0, 8)}-${code.slice(8, 12)}`;
  return [`${head}-0000-0000-000000000000`, `${head}-ffff-ffff-ffffffffffff`];
}

function secureRandom(max: number): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % max;
}

// El N° de unidad ("07"): se usa en la tarjeta, el editor y el lote. No se imprime sobre la
// plancha de chapitas; los pares de frente y dorso ya salen físicamente juntos.
export const unitNumber = (number: number) => String(number).padStart(2, "0");

// Modo "Verificar armado" (app/admin/chapitas/verificar): mientras está la cookie, en el celu de
// quien arma las chapitas /go lleva a la pantalla que dice qué unidad es. La segunda cookie guarda
// el escaneo anterior ("<id>.<qr|nfc|link>") para avisar si el QR y el NFC no son de la misma.
export const VERIFY_COOKIE = "bionfc-verificar";
export const VERIFY_LAST_COOKIE = "bionfc-verificar-ultimo";
export const VERIFY_HOURS = 4;

export type TagState = "stock" | "active" | "lost";

// En qué está una chapita del lote, para la lista del Admin.
export function tagState(tag: { activated_at?: string | null; lost?: boolean }): TagState {
  if (!tag.activated_at) return "stock";
  return tag.lost ? "lost" : "active";
}
