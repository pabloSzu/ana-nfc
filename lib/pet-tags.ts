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
// /go/<id>?s=qr completo el QR tiene 37×37 cuadraditos; así, 29×29, y cada uno sale más grande
// impreso (en una chapita de 30 mm, ~0,36 mm: se lee bien). El chip NFC sigue con /go/<id>.
export const SHORT_TAG_LENGTH = 12;

export function shortTagCode(id: string): string {
  return id.replace(/-/g, "").slice(0, SHORT_TAG_LENGTH).toLowerCase();
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

export type TagState = "stock" | "active" | "lost";

// En qué está una chapita del lote, para la lista del Admin.
export function tagState(tag: { activated_at?: string | null; lost?: boolean }): TagState {
  if (!tag.activated_at) return "stock";
  return tag.lost ? "lost" : "active";
}
