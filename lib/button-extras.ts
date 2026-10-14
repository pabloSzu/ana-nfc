// Datos extra de un botón (columna actions.extra): botón destacado, reseñas con estrellas,
// WhatsApp "en línea" y horarios con "abierto ahora". Son funciones puras, sin dependencias, para
// que la página pública, el editor y los tests (tests/button-extras.test.ts) usen las mismas reglas.

export type HoursRange = [string, string];
export type DayHours = { closed: boolean; ranges: HoursRange[] };

export type ButtonExtra = {
  // El botón principal de la página: más alto y en el color de la marca.
  featured?: boolean;
  // Reseñas: nota de 1 a 5 y cantidad de reseñas.
  rating?: number;
  reviews?: number;
  // WhatsApp: punto verde y una frase corta ("Respondemos en minutos").
  online?: boolean;
  status?: string;
  // Ubicación: horarios de lunes (0) a domingo (6), hasta dos turnos por día.
  hours?: DayHours[];
};

export const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const DEFAULT_STATUS = "Respondemos en minutos";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultHours(): DayHours[] {
  return DAY_NAMES.map((_, index) => ({ closed: index === 6, ranges: [["09:00", "19:00"]] as HoursRange[] }));
}

// Limpia lo que llega del editor o de la base: cualquier valor raro se descarta.
export function parseButtonExtra(raw: unknown): ButtonExtra {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const extra: ButtonExtra = {};
  if (source.featured === true) extra.featured = true;
  const rating = Number(source.rating);
  if (Number.isFinite(rating) && rating >= 1 && rating <= 5) extra.rating = Math.round(rating * 10) / 10;
  const reviews = Number(source.reviews);
  if (Number.isFinite(reviews) && reviews >= 1) extra.reviews = Math.min(999999, Math.floor(reviews));
  if (source.online === true) extra.online = true;
  if (typeof source.status === "string" && source.status.trim()) extra.status = source.status.trim().slice(0, 40);
  if (Array.isArray(source.hours) && source.hours.length === 7) {
    extra.hours = source.hours.map((day) => {
      const value = day && typeof day === "object" ? day as Record<string, unknown> : {};
      const ranges = (Array.isArray(value.ranges) ? value.ranges : [])
        .filter((range): range is [string, string] => Array.isArray(range) && TIME.test(String(range[0])) && TIME.test(String(range[1])) && range[0] !== range[1])
        .slice(0, 2)
        .map(([from, to]) => [from, to] as HoursRange);
      return { closed: value.closed === true || !ranges.length, ranges };
    });
  }
  return extra;
}

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export const formatTime = (time: string) => time.replace(/^0(\d)/, "$1");

// Día de la semana (0 = lunes) y minutos desde la medianoche en la hora de Argentina.
export function localClock(now: Date, timeZone = "America/Argentina/Cordoba") {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus = { open: boolean; label: string };

// "Abierto ahora · cierra 19:00" o "Cerrado · abre mañana 9:00". Un turno que cierra antes de
// abrir (20:00 a 03:00) cruza la medianoche y sigue abierto la madrugada del día siguiente.
export function openStatus(hours: DayHours[] | undefined, now: Date = new Date(), timeZone?: string): OpenStatus | null {
  if (!hours || hours.length !== 7 || hours.every((day) => day.closed)) return null;
  const { day, minutes } = localClock(now, timeZone);
  if (day < 0) return null;
  const yesterday = hours[(day + 6) % 7];
  if (!yesterday.closed) {
    for (const [from, to] of yesterday.ranges) {
      if (toMinutes(to) < toMinutes(from) && minutes < toMinutes(to)) return { open: true, label: `Abierto ahora · cierra ${formatTime(to)}` };
    }
  }
  const today = hours[day];
  if (!today.closed) {
    for (const [from, to] of today.ranges) {
      const start = toMinutes(from);
      const end = toMinutes(to);
      const overnight = end < start;
      if (minutes >= start && (overnight || minutes < end)) return { open: true, label: `Abierto ahora · cierra ${formatTime(to)}` };
    }
    const later = today.ranges.map(([from]) => from).filter((from) => toMinutes(from) > minutes).sort()[0];
    if (later) return { open: false, label: `Cerrado · abre hoy ${formatTime(later)}` };
  }
  for (let offset = 1; offset <= 7; offset++) {
    const next = hours[(day + offset) % 7];
    if (next.closed || !next.ranges.length) continue;
    const from = [...next.ranges].map(([start]) => start).sort()[0];
    const when = offset === 1 ? "mañana" : `el ${DAY_NAMES[(day + offset) % 7]}`;
    return { open: false, label: `Cerrado · abre ${when} ${formatTime(from)}` };
  }
  return null;
}

// "4,9" con coma decimal, como se escribe en Argentina.
export const formatRating = (rating: number) => rating.toFixed(1).replace(".", ",");
export const formatReviews = (count: number) => `${count.toLocaleString("es-AR")} ${count === 1 ? "reseña" : "reseñas"}`;
