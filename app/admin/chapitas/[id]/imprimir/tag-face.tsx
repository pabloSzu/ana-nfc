// Las dos caras de la chapita física. El frente es visual y puede llevar un nombre; el dorso
// conserva el diseño original con el enlace público permanente, NFC e instrucciones. El código privado de activación nunca
// aparece acá: va únicamente en la tarjeta del paquete.
export const TAG_COLORS = [
  { id: "mix", label: "Mezcla de colores", value: "conic-gradient(#36aef0, #7652f0, #ef6681, #ef8a3d, #65cf58, #36aef0)" },
  { id: "rainbow", label: "Arcoíris", value: "linear-gradient(135deg, #ff4f6d, #ff9a3c, #ffd23f, #3ecf8e, #3aa0ff, #8a5cf7)" },
  { id: "rainbow-v", label: "Arcoíris vertical", value: "linear-gradient(180deg, #ff1f3d, #ff7a00, #ffd000, #19c35a, #1f8bff, #6a3cff, #9b2cff)" },
  { id: "blue", label: "Azul BIONFC", value: "#36aef0" },
  { id: "violet", label: "Violeta", value: "#7652f0" },
  { id: "pink", label: "Rosa", value: "#ef6681" },
  { id: "orange", label: "Naranja", value: "#ef8a3d" },
  { id: "green", label: "Verde", value: "#65cf58" },
  { id: "black", label: "Negro", value: "#1d2130" },
];

export const TAG_CHARACTERS = [
  { id: "golden", label: "Golden", src: "/pet-tags/characters/golden.png", faceSrc: "/pet-tags/faces/golden.png" },
  { id: "dachshund", label: "Salchicha", src: "/pet-tags/characters/dachshund.png", faceSrc: "/pet-tags/faces/dachshund.png" },
  { id: "french-bulldog", label: "Bulldog francés", src: "/pet-tags/characters/french-bulldog.png", faceSrc: "/pet-tags/faces/french-bulldog.png" },
  { id: "poodle", label: "Caniche", src: "/pet-tags/characters/poodle.png", faceSrc: "/pet-tags/faces/poodle.png" },
  { id: "husky", label: "Husky", src: "/pet-tags/characters/husky.png", faceSrc: "/pet-tags/faces/husky.png" },
  { id: "corgi", label: "Corgi", src: "/pet-tags/characters/corgi.png", faceSrc: "/pet-tags/faces/corgi.png" },
  { id: "tabby-cat", label: "Gato atigrado", src: "/pet-tags/characters/tabby-cat.png", faceSrc: "/pet-tags/faces/tabby-cat.png" },
  { id: "black-cat", label: "Gato negro", src: "/pet-tags/characters/black-cat.png", faceSrc: "/pet-tags/faces/black-cat.png" },
] as const;

export type TagCharacterId = (typeof TAG_CHARACTERS)[number]["id"];
export type TagCharacterChoice = TagCharacterId | "mix";
export const tagCharacterFor = (choice: TagCharacterChoice, index: number): TagCharacterId =>
  choice === "mix" ? TAG_CHARACTERS[index % TAG_CHARACTERS.length].id : choice;
export type TagBackStyle = "classic" | "cat" | "dog" | "paws";
export type TagBackChoice = TagBackStyle | "mix";
export const TAG_BACK_STYLES: { id: TagBackChoice; label: string }[] = [
  { id: "mix", label: "Mezcla" },
  { id: "classic", label: "Clásico" },
  { id: "cat", label: "Gatito" },
  { id: "dog", label: "Perrito" },
  { id: "paws", label: "Patitas" },
];
export const tagBackStyleFor = (choice: TagBackChoice, index: number): TagBackStyle =>
  choice === "mix" ? (["cat", "dog", "paws", "classic"] as TagBackStyle[])[index % 4] : choice;

const RAINBOWS: Record<string, { stops: string[]; vertical: boolean }> = {
  rainbow: { stops: ["#ff4f6d", "#ff9a3c", "#ffd23f", "#3ecf8e", "#3aa0ff", "#8a5cf7"], vertical: false },
  "rainbow-v": { stops: ["#ff1f3d", "#ff7a00", "#ffd000", "#19c35a", "#1f8bff", "#6a3cff", "#9b2cff"], vertical: true },
};

function Background({ id, color }: { id: string; color: string }) {
  const rainbow = RAINBOWS[color];
  const solid = color.startsWith("#") ? color : (TAG_COLORS.find((item) => item.id === color) || TAG_COLORS[2]).value;
  return <>
    {rainbow && <defs><linearGradient id={id} x1="0" y1="0" x2={rainbow.vertical ? "0" : "1"} y2="1">{rainbow.stops.map((stop, index) => <stop key={stop} offset={`${(index / (rainbow.stops.length - 1)) * 100}%`} stopColor={stop} />)}</linearGradient></defs>}
    <circle cx="50" cy="50" r="50" fill={rainbow ? `url(#${id})` : solid} />
  </>;
}

const nameSize = (name: string) => Math.max(6.5, Math.min(10, 52 / Math.max(5, name.length * .56)));
const PAW = "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z";

function Paw({ x, y, size, rotate }: { x: number; y: number; size: number; rotate: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 24}) translate(-12 -12)`} fill="#fff" fillOpacity=".38">
    <path d={PAW} /><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" />
  </g>;
}

export function TagFront({ id, diameter, color, character, name = "" }: { id: string; diameter: number; color: string; character: TagCharacterId; name?: string }) {
  const animal = TAG_CHARACTERS.find((item) => item.id === character) || TAG_CHARACTERS[0];
  const cleanName = name.trim().slice(0, 18);
  return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label={cleanName ? `Frente de la chapita de ${cleanName}` : `Frente de chapita con ${animal.label}`}>
    <Background id={`tag-front-${id}`} color={color} />
    <circle className="ps-tag-hole" cx="50" cy="9.5" r="5.7" fill="none" stroke="#fff" strokeWidth=".9" strokeDasharray="2 1.6" />
    <text x="50" y="21.5" textAnchor="middle" fill="#fff" stroke="#00000030" strokeWidth=".45" paintOrder="stroke" fontFamily="Poppins, Arial, sans-serif" fontSize="4.3" fontWeight="800" letterSpacing=".22">CHAPITA INTELIGENTE</text>
    {cleanName ? <>
      {/* Personaje y nombre forman un solo bloque compacto, con espacio real para explicar el NFC. */}
      <rect x="23" y="55" width="54" height="15" rx="6.5" fill="#fff" stroke="#171717" strokeWidth="1.1" />
      <image href={animal.src} x="32" y="28" width="36" height="31" preserveAspectRatio="xMidYMax meet" />
      <text x="50" y="65.6" textAnchor="middle" fill="#1d1a18" fontFamily="Poppins, Arial, sans-serif" fontSize={nameSize(cleanName)} fontWeight="800" textLength={cleanName.length > 8 ? 48 : undefined} lengthAdjust="spacingAndGlyphs">{cleanName}</text>
    </> : <>
      {/* Las de stock usan una ilustración creada como cabeza aislada: no es un recorte del personaje con patas. */}
      <image href={animal.faceSrc} x="18" y="22" width="64" height="54" preserveAspectRatio="xMidYMid meet" />
    </>}
    <g aria-label="BioNFC · Acercá tu celu" fill="#fff" stroke="#00000035" strokeWidth=".45" paintOrder="stroke">
      <text x="47" y="83.5" textAnchor="middle" fontFamily="Plus Jakarta Sans, Poppins, Arial, sans-serif" fontSize="7.2" fontWeight="800" letterSpacing="-.25">BIONFC</text>
      <g transform="translate(68.5 76.7)" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round">
        <path d="M 0,2.3 A 2.2,2.2 0 0 1 0,5.7" /><path d="M 2.2,1.1 A 4,4 0 0 1 2.2,6.9" /><path d="M 4.4,0 A 5.8,5.8 0 0 1 4.4,8" />
      </g>
      <text x="50" y="91.3" textAnchor="middle" fontFamily="Poppins, Arial, sans-serif" fontSize="4.2" fontWeight="800" letterSpacing=".2">ACERCÁ TU CELU</text>
    </g>
  </svg>;
}

export function TagBack({ id, qr, diameter, color, design }: { id: string; qr: string; diameter: number; color: string; design: TagBackStyle }) {
  const bottom = `tag-back-bottom-${id}`;
  const ink = { fill: "#fff", stroke: "#00000038", strokeWidth: 1.1, paintOrder: "stroke" as const, fontWeight: 800, fontFamily: "Poppins, Arial, sans-serif" };
  return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label="Dorso de la chapita con QR">
    <defs><path id={bottom} d="M 11.5,50 A 38.5,38.5 0 0 0 88.5,50" /></defs>
    <Background id={`tag-back-${id}`} color={color} />
    <circle className="ps-tag-hole" cx="50" cy="11" r="6" fill="none" stroke="#fff" strokeWidth=".8" strokeDasharray="2 1.6" />
    {design === "paws" && <><Paw x={25} y={19} size={9} rotate={-20} /><Paw x={76} y={20} size={9} rotate={20} /><Paw x={87} y={63} size={7} rotate={-10} /></>}
    {design === "cat" && <>
      <path d="M 14.5,34 L 16.5,22.5 L 25.5,30.5 Z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 45.5,34 L 43.5,22.5 L 34.5,30.5 Z" fill="#fff" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 17.5,30 L 18.5,26 L 22,29 Z" fill="#ffb3c6" /><path d="M 42.5,30 L 41.5,26 L 38,29 Z" fill="#ffb3c6" />
    </>}
    {design === "dog" && <>
      <path d="M 15,31 C 7,29 3,38 5,48 C 6,53 10,54 13,50 Z" fill="#fff" />
      <path d="M 45,31 C 51,30 54,37 53,46 C 52.5,50 49.5,51 47.5,48 Z" fill="#fff" />
    </>}
    <rect x="12" y="30" width="36" height="36" rx="5.5" fill="#fff" />
    <image href={qr} x="14" y="32" width="32" height="32" />
    {design !== "dog" && <polygon points="55.5,44 50.5,47.5 55.5,51" fill="#fff" />}
    <text x="57" y="39.5" fontSize="6.4" letterSpacing=".2" {...ink}>ESCANEÁ</text>
    <text x="57" y="47.3" fontSize="6.4" letterSpacing=".2" {...ink}>O ACERCÁ</text>
    <text x="57" y="55.1" fontSize="6.4" letterSpacing=".2" {...ink}>TU CELU</text>
    <g transform="translate(57.5 58.5)" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="0" y="0" width="4.6" height="7.6" rx="1.1" />
      <path d="M 6.7,2.3 A 2.1,2.1 0 0 1 6.7,5.3" /><path d="M 8.6,1.1 A 3.7,3.7 0 0 1 8.6,6.5" /><path d="M 10.5,0 A 5.3,5.3 0 0 1 10.5,7.6" />
    </g>
    <text fontSize="5.2" letterSpacing=".3" {...ink}><textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">Y AVISALE A MI FAMILIA</textPath></text>
  </svg>;
}
