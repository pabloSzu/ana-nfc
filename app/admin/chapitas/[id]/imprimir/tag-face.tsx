// Las dos caras de la chapita física. El frente es visual y puede llevar un nombre; el dorso
// conserva el diseño original con el enlace público permanente, NFC e instrucciones. El código privado de activación nunca
// aparece acá: va únicamente en la tarjeta del paquete.
// Los colores lisos son lo bastante oscuros para que el texto blanco chico se lea impreso
// (contraste de 4,5:1 o más). En los arcoíris, las letras se leen por su borde oscuro (EDGE).
export const TAG_COLORS = [
  { id: "mix", label: "Mezcla de colores", value: "conic-gradient(#1673b8, #6a45e0, #c93a62, #c4501a, #2a7f36, #1673b8)" },
  { id: "rainbow", label: "Arcoíris", value: "linear-gradient(135deg, #ff4f6d, #ff9a3c, #ffd23f, #3ecf8e, #3aa0ff, #8a5cf7)" },
  { id: "rainbow-v", label: "Arcoíris vertical", value: "linear-gradient(180deg, #ff1f3d, #ff7a00, #ffd000, #19c35a, #1f8bff, #6a3cff, #9b2cff)" },
  { id: "blue", label: "Azul BIONFC", value: "#1673b8" },
  { id: "violet", label: "Violeta", value: "#6a45e0" },
  { id: "pink", label: "Rosa", value: "#c93a62" },
  { id: "orange", label: "Naranja", value: "#c4501a" },
  { id: "green", label: "Verde", value: "#2a7f36" },
  { id: "black", label: "Negro", value: "#1d2130" },
];

export const TAG_CHARACTERS = [
  { id: "golden", label: "Golden", src: "/pet-tags/characters/golden.png", faceSrc: "/pet-tags/faces/golden.png" },
  { id: "dachshund", label: "Salchicha", src: "/pet-tags/characters/dachshund.png", faceSrc: "/pet-tags/faces/dachshund.png" },
  { id: "french-bulldog", label: "Bulldog francés", src: "/pet-tags/characters/french-bulldog.png", faceSrc: "/pet-tags/faces/french-bulldog.png" },
  { id: "poodle", label: "Caniche", src: "/pet-tags/characters/poodle.png", faceSrc: "/pet-tags/faces/poodle.png" },
  { id: "husky", label: "Husky", src: "/pet-tags/characters/husky.png", faceSrc: "/pet-tags/faces/husky.png" },
  { id: "corgi", label: "Corgi", src: "/pet-tags/characters/corgi.png", faceSrc: "/pet-tags/faces/corgi.png" },
  { id: "dalmatian", label: "Dálmata", src: "/pet-tags/characters/dalmatian.png", faceSrc: "/pet-tags/faces/dalmatian.png" },
  { id: "rottweiler", label: "Rottweiler", src: "/pet-tags/characters/rottweiler.png", faceSrc: "/pet-tags/faces/rottweiler.png" },
  { id: "beagle", label: "Beagle", src: "/pet-tags/characters/beagle.png", faceSrc: "/pet-tags/faces/beagle.png" },
  { id: "schnauzer", label: "Schnauzer", src: "/pet-tags/characters/schnauzer.png", faceSrc: "/pet-tags/faces/schnauzer.png" },
  { id: "maltese", label: "Maltés", src: "/pet-tags/characters/maltese.png", faceSrc: "/pet-tags/faces/maltese.png" },
  { id: "miniature-pinscher", label: "Pinscher", src: "/pet-tags/characters/miniature-pinscher.png", faceSrc: "/pet-tags/faces/miniature-pinscher.png" },
  { id: "yorkshire-terrier", label: "Yorkshire", src: "/pet-tags/characters/yorkshire-terrier.png", faceSrc: "/pet-tags/faces/yorkshire-terrier.png" },
  { id: "boston-terrier", label: "Boston terrier", src: "/pet-tags/characters/boston-terrier.png", faceSrc: "/pet-tags/faces/boston-terrier.png" },
  { id: "pomeranian", label: "Pomerania", src: "/pet-tags/characters/pomeranian.png", faceSrc: "/pet-tags/faces/pomeranian.png" },
  { id: "australian-shepherd", label: "Pastor australiano", src: "/pet-tags/characters/australian-shepherd.png", faceSrc: "/pet-tags/faces/australian-shepherd.png" },
  { id: "tabby-cat", label: "Gato atigrado", src: "/pet-tags/characters/tabby-cat.png", faceSrc: "/pet-tags/faces/tabby-cat.png" },
  { id: "black-cat", label: "Gato negro", src: "/pet-tags/characters/black-cat.png", faceSrc: "/pet-tags/faces/black-cat.png" },
  { id: "white-persian-cat", label: "Persa blanco", src: "/pet-tags/characters/white-persian-cat.png", faceSrc: "/pet-tags/faces/white-persian-cat.png" },
  { id: "siamese-cat", label: "Siamés", src: "/pet-tags/characters/siamese-cat.png", faceSrc: "/pet-tags/faces/siamese-cat.png" },
  { id: "orange-tabby-cat", label: "Atigrado naranja", src: "/pet-tags/characters/orange-tabby-cat.png", faceSrc: "/pet-tags/faces/orange-tabby-cat.png" },
  { id: "british-shorthair-cat", label: "British gris", src: "/pet-tags/characters/british-shorthair-cat.png", faceSrc: "/pet-tags/faces/british-shorthair-cat.png" },
  { id: "maine-coon-cat", label: "Maine Coon", src: "/pet-tags/characters/maine-coon-cat.png", faceSrc: "/pet-tags/faces/maine-coon-cat.png" },
  { id: "calico-cat", label: "Calicó", src: "/pet-tags/characters/calico-cat.png", faceSrc: "/pet-tags/faces/calico-cat.png" },
  { id: "sphynx-cat", label: "Sphynx", src: "/pet-tags/characters/sphynx-cat.png", faceSrc: "/pet-tags/faces/sphynx-cat.png" },
  { id: "white-longhair-cat", label: "Blanco de pelo largo", src: "/pet-tags/characters/white-longhair-cat.png", faceSrc: "/pet-tags/faces/white-longhair-cat.png" },
  { id: "tuxedo-cat", label: "Tuxedo", src: "/pet-tags/characters/tuxedo-cat.png", faceSrc: "/pet-tags/faces/tuxedo-cat.png" },
  { id: "cream-fold-cat", label: "Fold crema", src: "/pet-tags/characters/cream-fold-cat.png", faceSrc: "/pet-tags/faces/cream-fold-cat.png" },
  { id: "longhair-tabby-cat", label: "Atigrado de pelo largo", src: "/pet-tags/characters/longhair-tabby-cat.png", faceSrc: "/pet-tags/faces/longhair-tabby-cat.png" },
  { id: "himalayan-cat", label: "Himalayo", src: "/pet-tags/characters/himalayan-cat.png", faceSrc: "/pet-tags/faces/himalayan-cat.png" },
  { id: "silver-tabby-cat", label: "Atigrado plateado", src: "/pet-tags/characters/silver-tabby-cat.png", faceSrc: "/pet-tags/faces/silver-tabby-cat.png" },
  { id: "white-odd-eyed-cat", label: "Blanco ojos distintos", src: "/pet-tags/characters/white-odd-eyed-cat.png", faceSrc: "/pet-tags/faces/white-odd-eyed-cat.png" },
  { id: "black-persian-cat", label: "Persa negro", src: "/pet-tags/characters/black-persian-cat.png", faceSrc: "/pet-tags/faces/black-persian-cat.png" },
  { id: "bengal-cat", label: "Bengal", src: "/pet-tags/characters/bengal-cat.png", faceSrc: "/pet-tags/faces/bengal-cat.png" },
  { id: "ragdoll-cat", label: "Ragdoll", src: "/pet-tags/characters/ragdoll-cat.png", faceSrc: "/pet-tags/faces/ragdoll-cat.png" },
  { id: "russian-blue-cat", label: "Azul ruso", src: "/pet-tags/characters/russian-blue-cat.png", faceSrc: "/pet-tags/faces/russian-blue-cat.png" },
] as const;

export type TagCharacterId = (typeof TAG_CHARACTERS)[number]["id"];
export type TagCharacterChoice = TagCharacterId | "mix" | "mix-dogs" | "mix-cats";
export type TagCharacter = (typeof TAG_CHARACTERS)[number];
export const isCat = (id: string) => id.endsWith("cat");
export const TAG_DOGS: TagCharacter[] = TAG_CHARACTERS.filter((character) => !isCat(character.id));
export const TAG_CATS: TagCharacter[] = TAG_CHARACTERS.filter((character) => isCat(character.id));
// Para la mezcla automática: perro, gato, perro, gato… (en orden de la lista, una raza distinta cada vez).
const MIXED = Array.from({ length: Math.max(TAG_DOGS.length, TAG_CATS.length) * 2 }, (_, index) => {
  const list = index % 2 ? TAG_CATS : TAG_DOGS;
  return list[Math.floor(index / 2) % list.length].id;
});
export const tagCharacterFor = (choice: TagCharacterChoice, index: number): TagCharacterId =>
  choice === "mix" ? MIXED[index % MIXED.length]
    : choice === "mix-dogs" ? TAG_DOGS[index % TAG_DOGS.length].id
    : choice === "mix-cats" ? TAG_CATS[index % TAG_CATS.length].id
    : choice;
// Lo que se eligió para imprimir cada unidad (nombre, animal y color). Se guarda en la chapita
// (button_style.print, ver actions.ts) para no depender del navegador. Vacío = automático.
export type TagPrint = { name?: string; character?: TagCharacterId; color?: string };

export function cleanTagPrint(value: unknown): TagPrint {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 14) : "";
  const character = TAG_CHARACTERS.find((item) => item.id === raw.character)?.id;
  const color = typeof raw.color === "string" && (/^#[0-9a-f]{6}$/i.test(raw.color) || TAG_COLORS.some((item) => item.id === raw.color && item.id !== "mix")) ? raw.color : "";
  return { ...(name ? { name } : {}), ...(character ? { character } : {}), ...(color ? { color } : {}) };
}

// El agujero (opcional): un puntito que marca el centro, en el mismo lugar en las dos caras, para
// perforar y para que frente y dorso queden alineados al pegarlos. Se imprime.
const HOLE = { cx: 50, cy: 10 };
const HoleMark = () => <circle cx={HOLE.cx} cy={HOLE.cy} r=".9" fill="#fff" stroke="#00000059" strokeWidth=".3" />;

export type TagBackStyle = "classic" | "v2" | "v3" | "v4" | "cat" | "dog" | "paws";
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

// El nombre va en mayúsculas, en Poppins 800. Ancho de cada letra medido en esa letra (en "em");
// así el tamaño se calcula de verdad y el nombre nunca se sale de la placa.
const LETTER_WIDTHS: Record<string, number> = {
  A: .76, B: .67, C: .76, D: .74, E: .55, F: .56, G: .76, H: .74, I: .31, J: .58, K: .73, L: .49, M: .94, N: .77, Ñ: .77, O: .79, P: .64, Q: .79,
  R: .66, S: .62, T: .6, U: .71, V: .75, W: 1.08, X: .74, Y: .7, Z: .61, Á: .76, É: .55, Í: .31, Ó: .79, Ú: .71, Ü: .71,
  0: .66, 1: .39, 2: .57, 3: .61, 4: .69, 5: .66, 6: .64, 7: .52, 8: .65, 9: .61, " ": .26, ".": .3, "-": .58, "'": .24, "&": .81,
};
const NAME_MAX_WIDTH = 50;
const NAME_MAX_SIZE = 9.5;
const NAME_MIN_SIZE = 5.8;
export const tagNameText = (name: string) => name.trim().slice(0, 14).toLocaleUpperCase("es-AR");
const nameWidth = (name: string) => [...name].reduce((sum, letter) => sum + (LETTER_WIDTHS[letter] ?? .8), 0);
const nameSize = (name: string) => Math.max(NAME_MIN_SIZE, Math.min(NAME_MAX_SIZE, NAME_MAX_WIDTH / nameWidth(name)));
const PAW = "M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z";

function Paw({ x, y, size, rotate }: { x: number; y: number; size: number; rotate: number }) {
  return <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${size / 24}) translate(-12 -12)`} fill="#fff" fillOpacity=".38">
    <path d={PAW} /><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" />
  </g>;
}

// Letras blancas con un borde oscuro marcado (mismo tamaño y grosor). Probado simulando una
// impresora común (tinta que se corre, 150 ppp): sobre colores claros y arcoíris, sin borde no se
// leen; con borde, sí. Sobre colores oscuros no cambia nada.
const EDGE = { stroke: "#151826", strokeOpacity: .72, strokeLinejoin: "round" as const };
const WAVES = <><path d="M 0,2.3 A 2.2,2.2 0 0 1 0,5.7" /><path d="M 2.2,1.1 A 4,4 0 0 1 2.2,6.9" /><path d="M 4.4,0 A 5.8,5.8 0 0 1 4.4,8" /></>;

export function TagFront({ id, diameter, color, character, name = "", hole = false }: { id: string; diameter: number; color: string; character: TagCharacterId; name?: string; hole?: boolean }) {
  const animal = TAG_CHARACTERS.find((item) => item.id === character) || TAG_CHARACTERS[0];
  const cleanName = tagNameText(name);
  const size = nameSize(cleanName);
  // Si aun en el tamaño mínimo no entra (nombres muy anchos), se angosta para que quepa justo.
  const squeeze = nameWidth(cleanName) * size > NAME_MAX_WIDTH;
  return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label={cleanName ? `Frente de la chapita de ${cleanName}` : `Frente de chapita con ${animal.label}`}>
    <Background id={`tag-front-${id}`} color={color} />
    {hole && <HoleMark />}
    <text x="50" y="21.5" textAnchor="middle" fill="#fff" {...EDGE} strokeWidth="1" paintOrder="stroke" fontFamily="Poppins, Arial, sans-serif" fontSize="4.3" fontWeight="800" letterSpacing=".35">CHAPITA INTELIGENTE</text>
    {cleanName ? <>
      {/* Personaje y nombre forman un solo bloque compacto, con espacio real para explicar el NFC. */}
      {/* Las patitas apoyan sólo en el borde de arriba de la placa: el nombre queda libre debajo. */}
      <rect x="19" y="55" width="62" height="17" rx="7.5" fill="#fff" stroke="#171717" strokeWidth="1.1" />
      <image href={animal.src} x="31" y="26" width="38" height="32" preserveAspectRatio="xMidYMax meet" />
      <text x="50" y={65.4 + size * .35} textAnchor="middle" fill="#1d1a18" fontFamily="Poppins, Arial, sans-serif" fontSize={size} fontWeight="800" {...(squeeze ? { textLength: NAME_MAX_WIDTH, lengthAdjust: "spacingAndGlyphs" } : {})}>{cleanName}</text>
    </> : <>
      {/* Las de stock usan una ilustración creada como cabeza aislada: no es un recorte del personaje con patas. */}
      <image href={animal.faceSrc} x="18" y="22" width="64" height="54" preserveAspectRatio="xMidYMid meet" />
    </>}
    {/* Un poco más arriba que antes: "ACERCÁ TU CELU" quedaba fuera del margen de seguridad. */}
    <g aria-label="BioNFC · Acercá tu celu" fill="#fff" {...EDGE} paintOrder="stroke">
      <text x="45.8" y="80.5" textAnchor="middle" strokeWidth="1.4" fontFamily="Plus Jakarta Sans, Poppins, Arial, sans-serif" fontSize="7.2" fontWeight="800" letterSpacing="-.25">BIONFC</text>
      <g transform="translate(62.2 74.5) scale(.82)" fill="none" strokeLinecap="round">
        <g strokeWidth="2.4">{WAVES}</g>
        <g stroke="#fff" strokeOpacity="1" strokeWidth="1.2">{WAVES}</g>
      </g>
    </g>
    {/* "ACERCÁ TU CELU" (el texto más chico y la instrucción) en una pastilla blanca con letra
        oscura: se lee aunque la impresora corra la tinta. */}
    <rect x="28" y="82.6" width="44" height="6.4" rx="3.2" fill="#fff" />
    <text x="50" y="87.2" textAnchor="middle" fill="#1d2130" fontFamily="Poppins, Arial, sans-serif" fontSize="4.2" fontWeight="800" letterSpacing=".3">ACERCÁ TU CELU</text>
  </svg>;
}

export function TagBack({ id, qr, diameter, color, design, hole = false }: { id: string; qr: string; diameter: number; color: string; design: TagBackStyle; hole?: boolean }) {
  const bottom = `tag-back-bottom-${id}`;
  // El mismo borde que el frente (EDGE): también en el ícono y la flechita.
  const edge = EDGE;
  const ink = { fill: "#fff", ...edge, strokeWidth: 1.5, paintOrder: "stroke" as const, fontWeight: 800, fontFamily: "Poppins, Arial, sans-serif" };
  const phone = <>
    <rect x="0" y="0" width="4.6" height="7.6" rx="1.1" />
    <path d="M 6.7,2.3 A 2.1,2.1 0 0 1 6.7,5.3" /><path d="M 8.6,1.1 A 3.7,3.7 0 0 1 8.6,6.5" /><path d="M 10.5,0 A 5.3,5.3 0 0 1 10.5,7.6" />
  </>;
  // Diseño 3: instrucción conjunta arriba, QR a la izquierda y gesto NFC a la derecha.
  if (design === "v2") return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label="Dorso de la chapita con QR">
    <Background id={`tag-back-${id}`} color={color} />
    {hole && <HoleMark />}
    <text x="50" y="22" textAnchor="middle" fontSize="5.6" letterSpacing=".15" {...ink}>ESCANEÁ O ACERCÁ</text>
    <text x="50" y="28.6" textAnchor="middle" fontSize="5.6" letterSpacing=".15" {...ink}>TU CELU</text>
    <rect x="11" y="31.2" width="38" height="38" rx="5.5" fill="#fff" />
    <image href={qr} x="12.5" y="32.7" width="35" height="35" />
    <circle cx="69.5" cy="50.2" r="16" fill="#fff" />
    <image href="/pet-tags/tap-phone-bold.png" x="57.3" y="39.4" width="24.4" height="21.5" />
    <text x="50" y="80.4" textAnchor="middle" fontSize="5.2" letterSpacing=".1" {...ink}>Y AVISALE A MI FAMILIA</text>
  </svg>;
  // Diseño 1: cada acción sobre su elemento, gesto NFC primero y QR un poco más grande a la
  // derecha. La "O" central deja claro que son dos alternativas.
  if (design === "v3") return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label="Dorso de la chapita con QR y NFC separados">
    <Background id={`tag-back-${id}`} color={color} />
    {hole && <HoleMark />}
    <text x="29.5" y="24.1" textAnchor="middle" fontSize="5.1" letterSpacing=".12" {...ink}>ACERCÁ</text>
    <text x="29.5" y="30.1" textAnchor="middle" fontSize="5.1" letterSpacing=".12" {...ink}>TU CELU</text>
    <text x="50" y="27" textAnchor="middle" fontSize="5.1" {...ink}>O</text>
    <text x="71" y="27" textAnchor="middle" fontSize="5.4" letterSpacing=".15" {...ink}>ESCANEÁ</text>
    <circle cx="29.5" cy="50.2" r="16" fill="#fff" />
    <image href="/pet-tags/tap-phone-bold.png" x="17.3" y="39.4" width="24.4" height="21.5" />
    <rect x="50.5" y="29.7" width="41" height="41" rx="5.8" fill="#fff" />
    <image href={qr} x="51.9" y="31.1" width="38.2" height="38.2" />
    <text x="50" y="80.4" textAnchor="middle" fontSize="5.2" letterSpacing=".1" {...ink}>Y AVISALE A MI FAMILIA</text>
  </svg>;
  // Diseño 4: la composición del Diseño 3, con el QR más grande y "TU CELU" alineado sobre el
  // sector NFC para que la segunda línea complete visualmente la opción de la derecha.
  if (design === "v4") return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label="Dorso de la chapita con QR grande">
    <Background id={`tag-back-${id}`} color={color} />
    {hole && <HoleMark />}
    <text x="29.5" y="22.4" textAnchor="middle" fontSize="5.5" letterSpacing=".05" {...ink}>ESCANEÁ</text>
    <text x="49.5" y="22.4" textAnchor="middle" fontSize="5.3" {...ink}>O</text>
    <text x="69.5" y="22.4" textAnchor="middle" fontSize="5.5" letterSpacing=".05" {...ink}>ACERCÁ</text>
    <text x="69.5" y="28.8" textAnchor="middle" fontSize="5.4" letterSpacing=".08" {...ink}>TU CELU</text>
    <rect x="9" y="29.7" width="41" height="41" rx="5.8" fill="#fff" />
    <image href={qr} x="10.4" y="31.1" width="38.2" height="38.2" />
    <circle cx="69.5" cy="50.2" r="16" fill="#fff" />
    <image href="/pet-tags/tap-phone-bold.png" x="57.3" y="39.4" width="24.4" height="21.5" />
    <text x="50" y="80.4" textAnchor="middle" fontSize="5.2" letterSpacing=".1" {...ink}>Y AVISALE A MI FAMILIA</text>
  </svg>;
  return <svg className="ps-tag" viewBox="0 0 100 100" width={`${diameter}mm`} height={`${diameter}mm`} role="img" aria-label="Dorso de la chapita con QR">
    <defs><path id={bottom} d="M 11.5,50 A 38.5,38.5 0 0 0 88.5,50" /></defs>
    <Background id={`tag-back-${id}`} color={color} />
    {hole && <HoleMark />}
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
    {/* El QR lo más grande posible sin salir del margen de seguridad (2 mm del borde a 30 mm). */}
    <rect x="10" y="27" width="40" height="40" rx="5.5" fill="#fff" />
    <image href={qr} x="11.5" y="28.5" width="37" height="37" />
    {design !== "dog" && <polygon points="56,44 51.5,47.5 56,51" fill="#fff" {...edge} strokeWidth="1.2" paintOrder="stroke" />}
    <text x="58" y="39.5" fontSize="6.4" letterSpacing=".2" {...ink}>ESCANEÁ</text>
    <text x="58" y="47.3" fontSize="6.4" letterSpacing=".2" {...ink}>O ACERCÁ</text>
    <text x="58" y="55.1" fontSize="6.4" letterSpacing=".2" {...ink}>TU CELU</text>
    <g transform="translate(58.5 58.5)" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g {...edge} strokeWidth="2.6">{phone}</g>
      <g stroke="#fff" strokeWidth="1.2">{phone}</g>
    </g>
    <text fontSize="5.2" letterSpacing=".3" {...ink}><textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">Y AVISALE A MI FAMILIA</textPath></text>
  </svg>;
}
