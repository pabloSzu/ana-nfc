// La cara de la chapita para imprimir: un círculo de color (o arcoíris) con el QR a un costado en
// un cuadrado blanco y, del otro lado, "ESCANEÁ / O ACERCÁ / TU CELU" con un celular con ondas (se
// entiende que también funciona acercando el celu, por el NFC). Abajo, en curva, "Y AVISALE A MI
// FAMILIA" (lo mismo que dice el botón de su página). Arriba al medio no hay nada: ahí va el
// agujerito para enganchar (en pantalla se marca punteado; no se imprime). Hay diseños como los
// de las tarjetitas: clásico, gatito (orejas en el QR), perrito (orejas caídas) y patitas.
// El número de unidad NO va acá: va afuera del círculo (print-studio.tsx). Nunca el código de
// activación: con él, quien encuentra a la mascota podría quedarse con la chapita.
// Dibujada en SVG (0 a 100) y escalada al diámetro en mm.
export const TAG_COLORS = [
  { id: "rainbow", label: "Arcoíris", value: "linear-gradient(135deg, #ff4f6d, #ff9a3c, #ffd23f, #3ecf8e, #3aa0ff, #8a5cf7)" },
  { id: "rainbow-v", label: "Arcoíris vertical", value: "linear-gradient(180deg, #ff1f3d, #ff7a00, #ffd000, #19c35a, #1f8bff, #6a3cff, #9b2cff)" },
  { id: "blue", label: "Azul BIONFC", value: "#4b6bff" },
  { id: "violet", label: "Violeta", value: "#7652f0" },
  { id: "pink", label: "Rosa", value: "#e8457a" },
  { id: "orange", label: "Naranja", value: "#e9772f" },
  { id: "black", label: "Negro", value: "#1d2130" },
];
export type TagStyle = "classic" | "cat" | "dog" | "paws";
export const TAG_STYLES: { id: TagStyle | "mix"; label: string }[] = [
  { id: "mix", label: "Mezcla" },
  { id: "classic", label: "Clásico" },
  { id: "cat", label: "Gatito" },
  { id: "dog", label: "Perrito" },
  { id: "paws", label: "Patitas" },
];
export const tagStyleFor = (style: TagStyle | "mix", index: number): TagStyle => style === "mix" ? (["cat", "dog", "paws", "classic"] as TagStyle[])[index % 4] : style;

// Los arcoíris: en diagonal (suave) o de arriba hacia abajo, de rojo a violeta (más fuerte).
const RAINBOWS: Record<string, { stops: string[]; vertical: boolean }> = {
  rainbow: { stops: ["#ff4f6d", "#ff9a3c", "#ffd23f", "#3ecf8e", "#3aa0ff", "#8a5cf7"], vertical: false },
  "rainbow-v": { stops: ["#ff1f3d", "#ff7a00", "#ffd000", "#19c35a", "#1f8bff", "#6a3cff", "#9b2cff"], vertical: true },
};
const PAW = "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z";

function Paw({ x, y, size, rotate }: { x: number; y: number; size: number; rotate: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 24}) translate(-12 -12)`} fill="#fff" fillOpacity=".38">
    <path d={PAW} /><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" />
  </g>;
}

// color: el id de uno de TAG_COLORS o un color propio ("#3a7bd5").
export default function TagFace({ id, qr, diameter, color, design }: { id: string; qr: string; diameter: number; color: string; design: TagStyle }) {
  const bottom = `tag-bottom-${id}`;
  const fill = `tag-fill-${id}`;
  const rainbow = RAINBOWS[color];
  const solid = color.startsWith("#") ? color : (TAG_COLORS.find((item) => item.id === color) || TAG_COLORS[2]).value;
  // Texto blanco con un contorno oscuro suave: se lee sobre cualquier color, también en el arcoíris.
  const ink = { fill: "#fff", stroke: "#00000038", strokeWidth: 1.1, paintOrder: "stroke" as const, fontWeight: 800, fontFamily: "Poppins, Arial, sans-serif" };
  return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label="Chapita">
    <defs>
      {/* Abajo la letra va por dentro de la línea: se lee derecha. */}
      <path id={bottom} d="M 11.5,50 A 38.5,38.5 0 0 0 88.5,50" />
      {rainbow && <linearGradient id={fill} x1="0" y1="0" x2={rainbow.vertical ? "0" : "1"} y2="1">{rainbow.stops.map((stop, index) => <stop key={stop} offset={`${(index / (rainbow.stops.length - 1)) * 100}%`} stopColor={stop} />)}</linearGradient>}
    </defs>
    <circle cx="50" cy="50" r="50" fill={rainbow ? `url(#${fill})` : solid} />
    {/* El agujerito para enganchar: solo de guía en pantalla (al imprimir no sale). */}
    <circle className="ps-tag-hole" cx="50" cy="11" r="6" fill="none" stroke="#fff" strokeWidth=".8" strokeDasharray="2 1.6" />
    {design === "paws" && <>
      <Paw x={25} y={19} size={9} rotate={-20} /><Paw x={76} y={20} size={9} rotate={20} /><Paw x={87} y={63} size={7} rotate={-10} />
    </>}
    {/* Orejas: de gato (triángulos arriba del QR) o de perro (caídas a los costados). */}
    {design === "cat" && <>
      <path d="M 14.5,34 L 16.5,22.5 L 25.5,30.5 Z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 45.5,34 L 43.5,22.5 L 34.5,30.5 Z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 17.5,30 L 18.5,26 L 22,29 Z" fill="#ffb3c6" /><path d="M 42.5,30 L 41.5,26 L 38,29 Z" fill="#ffb3c6" />
    </>}
    {design === "dog" && <>
      <path d="M 15,31 C 7,29 3,38 5,48 C 6,53 10,54 13,50 Z" fill="#fff" />
      <path d="M 45,31 C 51,30 54,37 53,46 C 52.5,50 49.5,51 47.5,48 Z" fill="#fff" />
    </>}
    {/* El QR a un costado. */}
    <rect x="12" y="30" width="36" height="36" rx="5.5" fill="#fff" />
    <image href={qr} x="14" y="32" width="32" height="32" />
    {/* Una flechita del texto al QR (con orejas de perro, la oreja ocupa ese lugar). */}
    {design !== "dog" && <polygon points="55.5,44 50.5,47.5 55.5,51" fill="#fff" />}
    {/* Del otro lado: qué hacer, con el celular y sus ondas (NFC). */}
    <text x="57" y="39.5" fontSize="6.4" letterSpacing=".2" {...ink}>ESCANEÁ</text>
    <text x="57" y="47.3" fontSize="6.4" letterSpacing=".2" {...ink}>O ACERCÁ</text>
    <text x="57" y="55.1" fontSize="6.4" letterSpacing=".2" {...ink}>TU CELU</text>
    <g transform="translate(57.5 58.5)" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="0" y="0" width="4.6" height="7.6" rx="1.1" />
      <path d="M 6.7,2.3 A 2.1,2.1 0 0 1 6.7,5.3" /><path d="M 8.6,1.1 A 3.7,3.7 0 0 1 8.6,6.5" /><path d="M 10.5,0 A 5.3,5.3 0 0 1 10.5,7.6" />
    </g>
    <text fontSize="5.2" letterSpacing=".3" {...ink}>
      <textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">Y AVISALE A MI FAMILIA</textPath>
    </text>
  </svg>;
}
