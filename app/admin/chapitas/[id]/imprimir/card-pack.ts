// Acomoda tarjetitas en la hoja para que entren las más posibles, girando algunas si conviene.
//
// Prueba todas horizontales, todas verticales y las combinaciones de dos bloques (unas filas de
// una orientación arriba y el resto de la otra abajo, o unas columnas a un lado y el resto al
// otro). Cada bloque es una grilla y entre bloques queda una separación recta: se corta con
// guillotina, de lado a lado. A igual cantidad gana la que gira menos tarjetas.
// Medidas en mm. "rotated": la tarjeta va girada 90° (ocupa alto × ancho).

export type CardSlot = { x: number; y: number; rotated: boolean };

// Un centésimo de tolerancia: un encaje exacto al milímetro no deja margen real de corte.
const EDGE = .01;

function grid(x0: number, y0: number, width: number, height: number, w: number, h: number, gap: number, rotated: boolean): CardSlot[] {
  const cols = Math.floor((width + gap) / (w + gap));
  const rows = Math.floor((height + gap - EDGE) / (h + gap));
  if (cols < 1 || rows < 1) return [];
  // Cada bloque centrado a lo ancho de su espacio.
  const left = x0 + (width - (cols * (w + gap) - gap)) / 2;
  const slots: CardSlot[] = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) slots.push({ x: left + col * (w + gap), y: y0 + row * (h + gap), rotated });
  return slots;
}

export function packCards(areaWidth: number, areaHeight: number, cardWidth: number, cardHeight: number, gap: number): CardSlot[] {
  const options: CardSlot[][] = [
    grid(0, 0, areaWidth, areaHeight, cardWidth, cardHeight, gap, false),
    grid(0, 0, areaWidth, areaHeight, cardHeight, cardWidth, gap, true),
  ];
  for (const firstRotated of [false, true]) {
    const [w1, h1] = firstRotated ? [cardHeight, cardWidth] : [cardWidth, cardHeight];
    const [w2, h2] = firstRotated ? [cardWidth, cardHeight] : [cardHeight, cardWidth];
    // Arriba k filas de una orientación, abajo el resto de la otra.
    for (let k = 1; k * (h1 + gap) <= areaHeight + gap; k++) {
      const used = k * (h1 + gap);
      // El bloque de arriba recibe justo el alto de sus k filas (más la tolerancia, para que entren).
      options.push([...grid(0, 0, areaWidth, used - gap + EDGE, w1, h1, gap, firstRotated), ...grid(0, used, areaWidth, areaHeight - used, w2, h2, gap, !firstRotated)]);
    }
    // A un lado k columnas de una orientación, al otro el resto de la otra.
    for (let k = 1; k * (w1 + gap) <= areaWidth + gap; k++) {
      const used = k * (w1 + gap);
      const side = grid(0, 0, used - gap, areaHeight, w1, h1, gap, firstRotated);
      const rest = grid(used, 0, areaWidth - used, areaHeight, w2, h2, gap, !firstRotated);
      options.push([...side, ...rest]);
    }
  }
  const rotations = (slots: CardSlot[]) => slots.filter((slot) => slot.rotated).length;
  const best = options.reduce((a, b) => b.length > a.length || (b.length === a.length && rotations(b) < rotations(a)) ? b : a);
  // Centrado a lo ancho de la hoja (los bloques de los costados se mueven juntos).
  if (!best.length) return best;
  const right = Math.max(...best.map((slot) => slot.x + (slot.rotated ? cardHeight : cardWidth)));
  const left = Math.min(...best.map((slot) => slot.x));
  const shift = (areaWidth - (right - left)) / 2 - left;
  return best.map((slot) => ({ ...slot, x: slot.x + shift }));
}

// Para un tamaño elegido a mano: hasta dónde se puede agrandar sin perder ninguna por hoja, y el
// tamaño más grande con el que entra al menos una más (null si no hay). Pasos de medio punto.
export function sizeHints(areaWidth: number, areaHeight: number, baseWidth: number, baseHeight: number, gap: number, percent: number, min = 65, max = 100) {
  const count = (p: number) => packCards(areaWidth, areaHeight, baseWidth * p / 100, baseHeight * p / 100, gap).length;
  const current = count(percent);
  let grow = percent;
  for (let p = Math.floor(percent * 2) / 2 + .5; p <= max; p += .5) { if (count(p) >= current) grow = p; else break; }
  let more: { percent: number; count: number } | null = null;
  for (let p = Math.ceil(percent * 2) / 2 - .5; p >= min; p -= .5) { const n = count(p); if (n > current) { more = { percent: p, count: n }; break; } }
  return { count: current, grow: grow > percent ? grow : null, more };
}

// Para cada cantidad por hoja, el tamaño más grande (en % de la tarjeta base) con el que entra.
// Se saltean las que casi no cambian el tamaño respecto de la anterior (menos de 2,5 puntos), salvo
// la que más mete.
export function cardSizeOptions(areaWidth: number, areaHeight: number, baseWidth: number, baseHeight: number, gap: number, min = 65, max = 100) {
  const found: { count: number; percent: number }[] = [];
  for (let percent = max; percent >= min; percent -= .5) {
    const count = packCards(areaWidth, areaHeight, baseWidth * percent / 100, baseHeight * percent / 100, gap).length;
    if (!found.some((option) => option.count >= count)) found.push({ count, percent });
  }
  const kept: typeof found = [];
  found.forEach((option, index) => {
    const last = kept.at(-1);
    if (!last || index === found.length - 1 || last.percent - option.percent >= 2.5) kept.push(option);
  });
  return kept;
}
