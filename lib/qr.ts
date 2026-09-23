import QRCode from "qrcode";

// Estilo del QR. Se guarda en landings.qr_style, igual que button_style o cover_style.
// Todo es opcional: lo que falte sale de los colores y el logo de la propia landing.
export type QrStyle = {
  foreground: string;
  background: string;
  dots: "square" | "rounded" | "circle";
  eyes: "square" | "rounded" | "circle";
  logo: boolean;
  logoScale: number;
};

export const QR_DOT_STYLES: { id: QrStyle["dots"]; label: string }[] = [
  { id: "square", label: "Cuadrado" },
  { id: "rounded", label: "Redondeado" },
  { id: "circle", label: "Puntos" },
];

export const QR_EYE_STYLES: { id: QrStyle["eyes"]; label: string }[] = [
  { id: "square", label: "Cuadradas" },
  { id: "rounded", label: "Redondeadas" },
  { id: "circle", label: "Circulares" },
];

const HEX = /^#[0-9a-f]{6}$/i;

// Un QR se lee por contraste entre módulo y fondo, no por color: el lector ve claro/oscuro.
// Por eso esto mide luminancia relativa (WCAG) y no "qué tan distintos se ven" los colores.
// Dos colores muy diferentes al ojo pero de luminancia parecida — un rojo y un azul fuertes —
// dan un QR precioso que ningún teléfono lee.
function relativeLuminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 1;
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Umbral propio, no un estándar: por debajo de 7:1 los lectores empiezan a fallar con luz
// pobre o con la cámara en ángulo, que es exactamente cómo se escanea un QR pegado en una
// pared. Un QR impreso no se corrige después, así que el corte va alto a propósito.
export const QR_MIN_CONTRAST = 7;

export function qrWarnings(style: QrStyle): string[] {
  const out: string[] = [];
  const ratio = contrastRatio(style.foreground, style.background);
  if (ratio < QR_MIN_CONTRAST) {
    out.push(`Poco contraste (${ratio.toFixed(1)}:1). Puede fallar con poca luz o en ángulo; conviene 7:1 o más.`);
  }
  // Los módulos oscuros tienen que ser los oscuros. Invertir (claro sobre oscuro) es válido
  // según la norma, pero muchos lectores viejos y varias cámaras de Android no lo soportan.
  if (relativeLuminance(style.foreground) > relativeLuminance(style.background)) {
    out.push("Los puntos son más claros que el fondo. Muchos lectores no leen QR invertidos.");
  }
  if (style.logo && style.logoScale > 0.24) {
    out.push("El logo tapa demasiado. Por encima del 24% hay teléfonos que no lo reconstruyen.");
  }
  return out;
}

// Oscurece un color hasta que tenga contraste suficiente contra el fondo, conservando el tono.
//
// Existe porque el default es "usá el color principal de la landing", y eso produce un QR
// ILEGIBLE cuando ese color es claro: un celeste #55eaff sobre blanco da 1.8:1 y no lo lee
// ningún lector (verificado decodificando, no estimado). Bajarle la luminosidad mantiene la
// identidad de la marca — sigue siendo el mismo celeste, más oscuro — en vez de caer a un gris
// genérico, que es lo que haría un simple "si no contrasta, usá negro".
export function darkenUntilReadable(hex: string, background: string): string {
  if (!HEX.test(hex)) return "#1f2937";
  if (contrastRatio(hex, background) >= QR_MIN_CONTRAST) return hex;
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  for (let factor = 0.92; factor > 0; factor -= 0.04) {
    const candidate =
      "#" + [r, g, b].map((channel) => Math.round(channel * factor).toString(16).padStart(2, "0")).join("");
    if (contrastRatio(candidate, background) >= QR_MIN_CONTRAST) return candidate;
  }
  return "#111111";
}

export function parseQrStyle(raw: unknown, fallback: { foreground?: string | null }): QrStyle {
  const p = raw && typeof raw === "object" ? (raw as Partial<QrStyle>) : {};
  const color = (value: unknown, alt: string) => (typeof value === "string" && HEX.test(value) ? value : alt);
  const background = color(p.background, "#ffffff");
  return {
    // Por defecto los puntos toman el color principal de la landing. El fondo NO hereda
    // background_color a propósito: suele ser un tono claro pero no blanco, y sobre papel
    // resta contraste sin aportar nada.
    // Un color elegido a mano se respeta tal cual (y si no contrasta, qrWarnings avisa). El
    // que se DERIVA de la landing se oscurece hasta ser legible: nadie lo eligió, así que no
    // hay nada que respetar, y un default que genera QR rotos no es un default.
    foreground: HEX.test(String(p.foreground)) ? (p.foreground as string) : darkenUntilReadable(color(fallback.foreground, "#1f2937"), background),
    background,
    dots: QR_DOT_STYLES.some((d) => d.id === p.dots) ? (p.dots as QrStyle["dots"]) : "rounded",
    eyes: QR_EYE_STYLES.some((e) => e.id === p.eyes) ? (p.eyes as QrStyle["eyes"]) : "rounded",
    logo: typeof p.logo === "boolean" ? p.logo : true,
    logoScale: typeof p.logoScale === "number" && p.logoScale >= 0.1 && p.logoScale <= 0.24 ? p.logoScale : 0.2,
  };
}

// Las tres marcas de posición (los cuadrados grandes de las esquinas) ocupan 7x7 cada una.
// Se dibujan aparte para poder darles su propio estilo, así que hay que saltearlas en la
// pasada de datos o quedarían dibujadas dos veces, una encima de la otra.
function isFinder(row: number, col: number, size: number): boolean {
  const inBox = (r0: number, c0: number) => row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7;
  return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
}

function finderPath(x: number, y: number, unit: number, style: QrStyle["eyes"]): string {
  const outer = 7 * unit;
  const inner = 3 * unit;
  const ring = style === "circle" ? outer / 2 : style === "rounded" ? unit * 2 : 0;
  const core = style === "circle" ? inner / 2 : style === "rounded" ? unit * 0.9 : 0;
  // El anillo va como un rect con stroke y sin relleno, no como dos rects encimados: así el
  // hueco del medio deja ver el fondo real de la pieza y no un rectángulo de color pegado
  // encima, que se notaba al imprimir sobre papel que no fuera blanco puro.
  return (
    `<rect x="${(x + unit / 2).toFixed(2)}" y="${(y + unit / 2).toFixed(2)}" width="${(outer - unit).toFixed(2)}" height="${(outer - unit).toFixed(2)}" rx="${ring.toFixed(2)}" fill="none" stroke="currentColor" stroke-width="${unit.toFixed(2)}"/>` +
    `<rect x="${(x + 2 * unit).toFixed(2)}" y="${(y + 2 * unit).toFixed(2)}" width="${inner.toFixed(2)}" height="${inner.toFixed(2)}" rx="${core.toFixed(2)}" fill="currentColor"/>`
  );
}

export type QrRenderOptions = {
  text: string;
  style: QrStyle;
  /** El logo va embebido como data URI, nunca como URL: un SVG que referencia una imagen
   *  externa se abre sin logo en la computadora de la imprenta. */
  logoDataUri?: string | null;
  /** Ancho/alto real de la imagen del logo. La placa de fondo se adapta a esa forma: con una
   *  placa siempre cuadrada, un logo apaisado queda con dos franjas blancas arriba y abajo. */
  logoAspect?: number;
  size?: number;
};

export function renderQrSvg({ text, style, logoDataUri, logoAspect = 1, size = 1024 }: QrRenderOptions): string {
  // Nivel H (~30% de redundancia) siempre, no solo cuando hay logo: esto termina impreso y
  // pegado en un local, donde se raya, se moja y se despega una esquina.
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const count = qr.modules.size;
  const data = qr.modules.data;
  const QUIET = 4; // zona de silencio mínima que exige la norma
  const total = count + QUIET * 2;
  const unit = size / total;
  const off = QUIET * unit;

  const parts: string[] = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!data[row * count + col] || isFinder(row, col, count)) continue;
      const x = off + col * unit;
      const y = off + row * unit;
      if (style.dots === "circle") {
        parts.push(`<circle cx="${(x + unit / 2).toFixed(2)}" cy="${(y + unit / 2).toFixed(2)}" r="${(unit / 2).toFixed(2)}"/>`);
      } else {
        const rx = style.dots === "rounded" ? (unit * 0.3).toFixed(2) : "0";
        parts.push(`<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${unit.toFixed(2)}" height="${unit.toFixed(2)}" rx="${rx}"/>`);
      }
    }
  }

  const eyes = [
    finderPath(off, off, unit, style.eyes),
    finderPath(off + (count - 7) * unit, off, unit, style.eyes),
    finderPath(off, off + (count - 7) * unit, unit, style.eyes),
  ].join("");

  let logo = "";
  if (style.logo && logoDataUri) {
    const box = size * style.logoScale;
    // Cuánto ocupa realmente la imagen dentro de su caja, que con preserveAspectRatio="meet"
    // no es la caja entera salvo que sea cuadrada.
    const aspect = Number.isFinite(logoAspect) && logoAspect > 0 ? logoAspect : 1;
    const drawnW = aspect >= 1 ? box : box * aspect;
    const drawnH = aspect >= 1 ? box / aspect : box;
    const pad = Math.min(drawnW, drawnH) * 0.12;
    // La placa de fondo no es decorativa: si el logo es un PNG con transparencia, sin ella se
    // ven los módulos del QR a través del logo y el conjunto queda ilegible.
    const plateW = drawnW + pad * 2, plateH = drawnH + pad * 2;
    logo =
      `<rect x="${((size - plateW) / 2).toFixed(2)}" y="${((size - plateH) / 2).toFixed(2)}" width="${plateW.toFixed(2)}" height="${plateH.toFixed(2)}" rx="${(Math.min(plateW, plateH) * 0.18).toFixed(2)}" fill="${style.background}"/>` +
      `<image x="${((size - drawnW) / 2).toFixed(2)}" y="${((size - drawnH) / 2).toFixed(2)}" width="${drawnW.toFixed(2)}" height="${drawnH.toFixed(2)}" href="${logoDataUri}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${style.background}"/>` +
    `<g fill="${style.foreground}" color="${style.foreground}">${parts.join("")}${eyes}</g>` +
    logo +
    `</svg>`
  );
}
