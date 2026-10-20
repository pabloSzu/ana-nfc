// Chapita de mascota (landings con business_type "pet"). Es un producto propio, como la tarjeta
// personal: no usa botones ni plantillas de landing. Todo lo de la mascota vive en
// button_style.pet con una forma fija; la foto es logo_url y el nombre, business_name.
// Funciones puras, sin dependencias, para que la página, el editor, el guardado y los tests
// (tests/pet.test.ts) usen las mismas reglas.

export type PetLook = {
  id: string;
  label: string;
  background: string;
  backgroundTo: string;
  accent: string;
  accentInk: string;
  ink: string;
  card: string;
  titleFont: string;
  bodyFont: string;
  dark?: boolean;
};

// Diseños de la chapita: cambian solo colores y letras, nunca los datos.
export const PET_LOOKS: PetLook[] = [
  { id: "calido", label: "Cálido", background: "#fff6ec", backgroundTo: "#fde3cc", accent: "#e07a3f", accentInk: "#ffffff", ink: "#4a2b17", card: "#fffaf5", titleFont: "friendly", bodyFont: "friendly" },
  { id: "pastel", label: "Pastel", background: "#f4f1ff", backgroundTo: "#e3f1ff", accent: "#7465e8", accentInk: "#ffffff", ink: "#2c2856", card: "#ffffff", titleFont: "friendly", bodyFont: "friendly" },
  { id: "campo", label: "Campo", background: "#f1f5ea", backgroundTo: "#dce8cf", accent: "#4d7a38", accentInk: "#ffffff", ink: "#22351a", card: "#fbfcf8", titleFont: "fraunces", bodyFont: "manrope" },
  { id: "divertido", label: "Divertido", background: "#fff4b8", backgroundTo: "#ffd6e6", accent: "#f2508a", accentInk: "#ffffff", ink: "#3b1d2b", card: "#fffdf6", titleFont: "chango", bodyFont: "friendly" },
  { id: "noche", label: "Noche", background: "#171b29", backgroundTo: "#0d1019", accent: "#f4b740", accentInk: "#1b1405", ink: "#f5f1e8", card: "#222738", titleFont: "sora", bodyFont: "sora", dark: true },
];

export function petLook(id: string | undefined): PetLook {
  return PET_LOOKS.find((look) => look.id === id) || PET_LOOKS[0];
}

export type PetFamily = { name: string; phone: string };

export const PET_ABOUT_FIELDS = [
  { key: "breed", label: "Raza", placeholder: "Caniche toy" },
  { key: "age", label: "Edad", placeholder: "4 años" },
  { key: "sex", label: "Sexo", placeholder: "Macho" },
  { key: "size", label: "Tamaño", placeholder: "Chico" },
  { key: "color", label: "Color", placeholder: "Blanco con manchas" },
  { key: "character", label: "Carácter", placeholder: "Manso, un poco miedoso" },
] as const;

export const PET_HEALTH_FIELDS = [
  { key: "vaccines", label: "Vacunas", placeholder: "Al día" },
  { key: "neutered", label: "Castrado", placeholder: "Sí" },
  { key: "medication", label: "Medicación", placeholder: "Una pastilla por día" },
  { key: "allergies", label: "Alergias", placeholder: "Ninguna" },
  { key: "vet", label: "Veterinaria", placeholder: "Patitas · 351 555-1234" },
] as const;

export type PetAboutKey = (typeof PET_ABOUT_FIELDS)[number]["key"];
export type PetHealthKey = (typeof PET_HEALTH_FIELDS)[number]["key"];

export type PetData = {
  look: string;
  greeting: string;
  message: string;
  family: PetFamily[];
  about: Record<PetAboutKey, string>;
  health: Record<PetHealthKey, string>;
  finder: string;
  // Modo perdido: arriba de todo aparece el cartel rojo, con la zona y la recompensa si están.
  lost: boolean;
  lostZone: string;
  reward: string;
};

export const PET_FAMILY_MAX = 2;
export const DEFAULT_PET_GREETING = "¡Hola! Soy";
export const DEFAULT_PET_MESSAGE = "Si me encontraste solito, avisale a mi familia, por favor 🐾";

const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";
const record = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function fields<K extends string>(raw: unknown, keys: readonly { key: K }[], max: number): Record<K, string> {
  const source = record(raw);
  return Object.fromEntries(keys.map(({ key }) => [key, text(source[key], max)])) as Record<K, string>;
}

// Lee y limpia lo guardado (o lo que manda el editor): cualquier valor raro se descarta. No
// recorta espacios, así el editor puede leer su propio borrador mientras se escribe; lo hace
// cleanPet al guardar.
export function parsePet(buttonStyle: unknown): PetData {
  const pet = record(record(buttonStyle).pet);
  return {
    look: petLook(text(pet.look, 20)).id,
    greeting: typeof pet.greeting === "string" ? text(pet.greeting, 40) : DEFAULT_PET_GREETING,
    message: typeof pet.message === "string" ? text(pet.message, 200) : DEFAULT_PET_MESSAGE,
    family: (Array.isArray(pet.family) ? pet.family : []).slice(0, PET_FAMILY_MAX).map((member) => ({ name: text(record(member).name, 40), phone: text(record(member).phone, 30) })),
    about: fields(pet.about, PET_ABOUT_FIELDS, 80),
    health: fields(pet.health, PET_HEALTH_FIELDS, 120),
    finder: text(pet.finder, 500),
    lost: pet.lost === true,
    lostZone: text(pet.lostZone, 120),
    reward: text(pet.reward, 60),
  };
}

export function cleanPet(pet: PetData): PetData {
  const trim = <T extends Record<string, string>>(values: T) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])) as T;
  return {
    ...pet,
    greeting: pet.greeting.trim(),
    message: pet.message.trim(),
    family: pet.family.map((member) => ({ name: member.name.trim(), phone: member.phone.trim() })).filter((member) => member.name || member.phone),
    about: trim(pet.about),
    health: trim(pet.health),
    finder: pet.finder.trim(),
    lostZone: pet.lostZone.trim(),
    reward: pet.reward.trim(),
  };
}

export function newPet(phone = ""): PetData {
  return { ...parsePet({}), family: phone ? [{ name: "", phone }] : [] };
}

// Lo que se muestra de una ficha: solo los datos completados, en el orden de la lista.
export function petRows<K extends string>(values: Record<K, string>, keys: readonly { key: K; label: string }[]) {
  return keys.map(({ key, label }) => ({ label, value: (values[key] || "").trim() })).filter((row) => row.value);
}

const digits = (phone: string) => phone.replace(/\D/g, "");

export function petWhatsappHref(phone: string, petName: string): string {
  const number = digits(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(`¡Hola! Encontré a ${petName.trim() || "tu mascota"} 🐾`)}` : "";
}

export function petCallHref(phone: string): string {
  const number = digits(phone);
  return number ? `tel:+${number}` : "";
}

// Para publicar hace falta al menos un número de la familia: sin eso la chapita no sirve.
export function petHasContact(pet: PetData): boolean {
  return pet.family.some((member) => digits(member.phone).length >= 8);
}
