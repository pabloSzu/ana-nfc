import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { parsePet, petGendered, petLook, type PetData, type PetLook, type PetPhotoPlacement } from "@/lib/pet";
import { getSiteOrigin } from "@/lib/site-url";

// Imágenes de una chapita para compartir, con los colores del diseño elegido:
//  · (sin ?formato) 1200×630: la que se ve al mandar el link por WhatsApp. La usa la metadata de
//    app/[slug]/page.tsx.
//  · ?formato=historia 1080×1920: para historias, estados de WhatsApp y reels. Si no está perdida,
//    una polaroid (StoryPolaroid).
//  · ?formato=publicacion 1080×1350: para el feed de Instagram y grupos de Facebook.
// Si está perdida, todas llevan "¡ESTOY PERDIDO/A!" con la zona y la recompensa. La historia y la
// publicación llevan la dirección de su página, corta y bien legible: se miran en el mismo celular
// (un QR no se puede escanear) y, desde una página web, Instagram no deja poner el link solo; el
// dueño lo agrega con el sticker "Enlace" (el menú de compartir se lo deja copiado).
export const runtime = "nodejs";

const publicSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
);

// Las letras (sin esto la imagen sale con letra fina): Poppins en negrita para todo, Caveat para lo
// escrito a mano de la polaroid y Plus Jakarta Sans para el logo. Se bajan una vez de Google Fonts
// y quedan en memoria; si alguna falla, la imagen sale igual con la letra por defecto.
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
function loadFont(family: string, weight: number) {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) fontCache.set(key, (async () => {
    try {
      const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
      const url = css.match(/src: url\(([^)]+\.ttf)\)/)?.[1];
      return url ? await (await fetch(url)).arrayBuffer() : null;
    } catch {
      return null;
    }
  })());
  return fontCache.get(key)!;
}
async function loadFonts() {
  const fonts = [["Poppins", 800], ["Poppins", 600], ["Caveat", 700], ["Plus Jakarta Sans", 800]] as const;
  const data = await Promise.all(fonts.map(([family, weight]) => loadFont(family, weight)));
  return fonts.flatMap(([name, weight], index) => data[index] ? [{ name, data: data[index]!, weight, style: "normal" as const }] : []);
}

// La foto ya encuadrada, cuadrada y en PNG. El generador de la imagen no lee WEBP (el formato en
// que el editor guarda las fotos) ni respeta bien el zoom, así que el recorte se hace acá con
// sharp, con la misma cuenta que el navegador (ver petPhotoStyle en lib/pet.ts). Si algo falla,
// la imagen sale con la huella.
async function framedPhoto(url: string, size: number, { x, y, zoom }: PetPhotoPlacement): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const source = sharp(Buffer.from(await response.arrayBuffer())).rotate();
    const { width = 0, height = 0, orientation = 1 } = await source.metadata();
    const [w, h] = orientation >= 5 ? [height, width] : [width, height];
    if (!w || !h) return null;
    // Lado del cuadrado visible, en píxeles de la foto: "cover" muestra el lado corto entero y el
    // zoom lo achica. Se ubica igual que en el navegador (el punto x%, y% queda fijo).
    const side = Math.min(w, h) / zoom;
    const left = Math.round(Math.min(Math.max(((w - Math.min(w, h)) * x / 100) + (Math.min(w, h) - side) * x / 100, 0), w - side));
    const top = Math.round(Math.min(Math.max(((h - Math.min(w, h)) * y / 100) + (Math.min(w, h) - side) * y / 100, 0), h - side));
    const png = await source.extract({ left, top, width: Math.floor(side), height: Math.floor(side) }).resize(size, size).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (error) {
    console.error("Imagen para compartir: no se pudo preparar la foto", error);
    return null;
  }
}

// Huella dibujada para cuando la chapita no tiene foto.
function Paw({ color, size }: { color: string; size: number }) {
  return <svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
    <ellipse cx="50" cy="66" rx="22" ry="18" />
    <ellipse cx="24" cy="40" rx="9" ry="12" />
    <ellipse cx="41" cy="26" rx="9" ry="12" />
    <ellipse cx="59" cy="26" rx="9" ry="12" />
    <ellipse cx="76" cy="40" rx="9" ry="12" />
  </svg>;
}

// Foto redonda con borde. El círculo se le pone a la foto misma: el generador no recorta lo de
// adentro de un marco redondo.
function Photo({ photo, size, look, border }: { photo: string | null; size: number; look: PetLook; border: number }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "none", width: size, height: size, border: `${border}px solid ${look.card}`, borderRadius: 999, background: look.card, boxShadow: "0 24px 60px rgba(0,0,0,.2)" }}>
    {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo acepta <img> */}
    {photo ? <img src={photo} width={size - border * 2} height={size - border * 2} style={{ borderRadius: 999 }} alt="" /> : <Paw color={look.accent} size={size / 2} />}
  </div>;
}

// La dirección de su página en una pastilla blanca, con lo que hay que hacer arriba. Siempre en
// una línea: si es larga (nombres largos), la letra se achica.
function Address({ address, caption, size }: { address: string; caption: string; size: number }) {
  const fontSize = Math.min(size, Math.floor(1500 / address.length));
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.3 }}>
    <div style={{ display: "flex", fontSize: size * 0.85, fontWeight: 800, opacity: 0.8 }}>{caption}</div>
    <div style={{ display: "flex", padding: `${size * 0.45}px ${size * 0.9}px`, borderRadius: 999, background: "#fff", color: "#1d2130", fontSize, fontWeight: 900, letterSpacing: -0.5, whiteSpace: "nowrap", boxShadow: "0 14px 34px rgba(0,0,0,.14)" }}>{address}</div>
  </div>;
}

// Textos largos (el nombre admite 60 letras, la zona 120, la recompensa 60): se cortan con "…" y
// la letra se achica para que entren en `lines` renglones de `width` px. Poppins en negrita
// ocupa unas 0,66 veces su tamaño por letra (más con mayúsculas y espaciado: `perChar`).
const clip = (text: string, max: number) => text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
const fitSize = (text: string, big: number, width: number, lines = 1, perChar = 0.66) =>
  Math.round(Math.min(big, (width * lines) / (Math.max(text.length, 1) * perChar)));
const NAME_MAX = 34;
// El nombre: en un renglón si entra con la letra grande; si no, en dos.
const nameFit = (name: string, big: number, width: number) => {
  const oneLine = fitSize(name, big, width);
  return oneLine >= big * 0.7 ? oneLine : fitSize(name, big * 0.8, width, 2);
};
// Saludo en mayúsculas y con espaciado: un renglón.
const greetingFit = (text: string, big: number, width: number) => fitSize(text, big, width, 1, 0.92);

// El tamaño de la foto según lo que se arma (en píxeles de la imagen final).
function photoSizeFor(format: string | null, lost: boolean) {
  if (format === "historia" && !lost) return 490;
  return format === "historia" ? 440 : format === "publicacion" ? (lost ? 400 : 460) : lost ? 300 : 360;
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get("formato");
  // Con ?v= (la versión: cambia con todo lo que se ve, ver petImageVersion) la imagen no cambia
  // nunca y se guarda para siempre; sin ?v=, unos minutos.
  const cacheControl = searchParams.has("v") ? "public, max-age=31536000, s-maxage=31536000, immutable" : "public, max-age=300, s-maxage=300";
  const { data } = await publicSupabase.rpc("public_landing", { p_slug: slug });
  const landing = data as { business_type?: string; business_name?: string; logo_url?: string; button_style?: unknown } | null;
  if (!landing || landing.business_type !== "pet") return new Response("No encontrada", { status: 404 });

  const pet = parsePet(landing.button_style);
  const look = petLook(pet.look);
  const name = clip((landing.business_name || "").trim() || "Mi mascota", NAME_MAX);
  // Su link actual (aunque se haya pedido por uno anterior), en la versión corta: /slug abre la
  // misma página que /mascota/slug.
  const landingSlug = (data as { slug?: string } | null)?.slug || slug;
  const address = `${new URL(getSiteOrigin()).host}/${landingSlug}`;
  const photoSize = photoSizeFor(format, pet.lost);
  const [photo, fonts] = await Promise.all([
    landing.logo_url ? framedPhoto(landing.logo_url, Math.min(photoSize * 2, 1080), pet.photo) : null,
    loadFonts(),
  ]);
  const options = (width: number, height: number) => ({ width, height, fonts: fonts.length ? fonts : undefined, headers: { "Cache-Control": cacheControl } });
  const background = `linear-gradient(160deg, ${look.background}, ${look.backgroundTo})`;
  const lostTitle = petGendered(pet, "¡ESTOY PERDIDO!", "¡ESTOY PERDIDA!");
  const zone = pet.lostZone.trim() && clip(`Me perdí en ${pet.lostZone.trim()}`, 64);
  const reward = pet.reward.trim() && clip(`Recompensa: ${pet.reward.trim()}`, 36);
  const greeting = clip(pet.greeting.trim(), 30);

  // Las de compartir, en JPG: se ven igual y pesan un quinto (Instagram las recomprime igual).
  const asJpeg = async (image: ImageResponse) => new Response(new Uint8Array(await sharp(Buffer.from(await image.arrayBuffer())).jpeg({ quality: 86, mozjpeg: true }).toBuffer()), { headers: { "Content-Type": "image/jpeg", "Cache-Control": cacheControl } });
  if (format === "historia" && !pet.lost) return asJpeg(new ImageResponse(<StoryPolaroid name={name} photo={photo} address={address} />, options(1080, 1920)));
  if (format === "historia") return asJpeg(new ImageResponse(<Story pet={pet} look={look} name={name} photo={photo} photoSize={photoSize} address={address} background={background} lostTitle={lostTitle} zone={zone} reward={reward} greeting={greeting} />, options(1080, 1920)));
  if (format === "publicacion") return asJpeg(new ImageResponse(<Post pet={pet} look={look} name={name} photo={photo} photoSize={photoSize} address={address} background={background} lostTitle={lostTitle} zone={zone} reward={reward} greeting={greeting} />, options(1080, 1350)));

  // Zona y recompensa en un renglón si entran; si no, uno cada una.
  const lostDetails = [zone, reward].filter(Boolean) as string[];
  const detailsInline = lostDetails.join("  ·  ").length <= 60;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background, color: look.ink, fontFamily: "Poppins, sans-serif" }}>
        {pet.lost && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "22px 40px", background: "#d92d20", color: "#fff" }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 900, letterSpacing: -1 }}>{lostTitle}</div>
          {(detailsInline ? [lostDetails.join("  ·  ")] : lostDetails).filter(Boolean).map((line) => <div key={line} style={{ display: "flex", marginTop: 4, fontSize: detailsInline ? 30 : 26, fontWeight: 700 }}>{line}</div>)}
        </div>}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56, padding: "0 70px" }}>
          <Photo photo={photo} size={photoSize} look={look} border={12} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {greeting && <div style={{ display: "flex", fontSize: fitSize(greeting, 30, 600, 1, 0.9), fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: look.accent }}>{greeting}</div>}
            <div style={{ display: "flex", fontSize: fitSize(name, 110, 640, name.length > 12 ? 2 : 1), fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>{name}</div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 32, fontWeight: 600, opacity: 0.8 }}>{pet.lost ? "Si me ves, avisale a mi familia" : "Si me encontrás, avisale a mi familia"}</div>
            <div style={{ display: "flex", marginTop: 34, fontSize: 24, fontWeight: 800, opacity: 0.55 }}>BIONFC · chapita de mascota</div>
          </div>
        </div>
      </div>
    ),
    options(1200, 630),
  );
}

type ShareProps = { pet: PetData; look: PetLook; name: string; photo: string | null; photoSize: number; address: string; background: string; lostTitle: string; zone: string | false; reward: string | false; greeting: string };

// Historia de perdido (1080×1920), armada dentro de la "zona segura" de Instagram: arriba (~270 px)
// van el nombre de la cuenta y la barra de progreso, y abajo (~360 px) la caja de respuesta y, en
// un reel, los botones. Ahí no va nada importante, así sirve igual para historias, estados y reels.
// El cartel rojo, la foto, el nombre y la dirección para avisar.
function Story({ pet, look, name, photo, photoSize, address, background, lostTitle, zone, reward }: ShareProps) {
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background, color: look.ink, fontFamily: "Poppins, sans-serif", textAlign: "center" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "270px 60px 50px", background: "#d92d20", color: "#fff" }}>
      <div style={{ display: "flex", fontSize: 108, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>{lostTitle}</div>
      {zone && <div style={{ display: "flex", justifyContent: "center", marginTop: 22, fontSize: fitSize(zone, 50, 940, 2), fontWeight: 800, lineHeight: 1.2 }}>{zone}</div>}
      {reward && <div style={{ display: "flex", marginTop: 22, padding: "10px 32px", borderRadius: 999, background: "#fff", color: "#b42318", fontSize: fitSize(reward, 42, 860), fontWeight: 900 }}>{reward}</div>}
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 34, padding: "0 70px 360px" }}>
      <Photo photo={photo} size={photoSize} look={look} border={18} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", fontSize: nameFit(name, 124, 900), fontWeight: 900, letterSpacing: -3, lineHeight: 1.02, justifyContent: "center" }}>{name}</div>
        <div style={{ display: "flex", fontSize: 46, fontWeight: 800, opacity: 0.85 }}>Si me ves, avisale a mi familia</div>
      </div>
      <Address address={address} size={46} caption="Entrá acá para avisar a mi familia" />
    </div>
  </div>;
}

// ---- La historia para mostrarla con orgullo (no perdida) ----
// Dice "¡Ya tengo mi chapita inteligente!" (lo de "inteligente" despierta curiosidad) y lleva "Mi
// chapita es de BIONFC" arriba de la dirección: la dirección la tapa el sticker "Enlace" de
// Instagram, la marca no. Todo entre los 280 px de arriba y los 360 de abajo, que Instagram tapa
// (ver Story). Siempre la misma: que en Instagram se reconozca de una ("otra chapita BIONFC").
type StoryProps = { name: string; photo: string | null; address: string };
const INK = "#2d1d12";

// El logo, como en components/bionfc-logo.tsx: "BIO", "NFC" en azul y las tres ondas.
function Logo({ size, color = INK, blue = "#4b6bff" }: { size: number; color?: string; blue?: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: size * 0.12, fontFamily: "Plus Jakarta Sans", fontWeight: 800, fontSize: size, letterSpacing: -size * 0.02, color }}>
    <div style={{ display: "flex" }}>BIO<span style={{ color: blue }}>NFC</span></div>
    <svg width={size * 0.95} height={size * 0.95} viewBox="0 0 24 24" fill="none" stroke={blue} strokeWidth="2.6" strokeLinecap="round">
      <path d="M3.5 9.2a4.6 4.6 0 0 1 0 5.6" /><path d="M8.6 6.4a8.6 8.6 0 0 1 0 11.2" /><path d="M13.9 3.6a12.6 12.6 0 0 1 0 16.8" />
    </svg>
  </div>;
}
function Brand() {
  return <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 45, fontWeight: 600, color: INK }}>Mi chapita es de<Logo size={68} /></div>;
}

// La cinta que sostiene la polaroid: tipo washi, medio transparente, con los extremos cortados a
// mano (en zigzag), rayitas y una sombra suave.
function Tape({ width, height }: { width: number; height: number }) {
  const teeth = 6;
  const step = height / teeth;
  const right = Array.from({ length: teeth + 1 }, (_, index) => `${width - (index % 2 ? 0 : 14)},${index * step}`);
  const left = Array.from({ length: teeth + 1 }, (_, index) => `${index % 2 ? 0 : 14},${(teeth - index) * step}`);
  const points = [...right, ...left].join(" ");
  const stripes = Array.from({ length: Math.ceil((width + height) / 30) }, (_, index) => index * 30 - height);
  return <svg width={width} height={height + 8} viewBox={`0 0 ${width} ${height + 8}`}>
    <defs>
      <clipPath id="tape"><polygon points={points} /></clipPath>
      <linearGradient id="tape-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe48f" /><stop offset="1" stopColor="#ffc94d" /></linearGradient>
    </defs>
    <polygon points={points} fill="#7a4a10" fillOpacity=".12" transform="translate(0 7)" />
    <polygon points={points} fill="url(#tape-fill)" fillOpacity=".88" />
    <g clipPath="url(#tape)">{stripes.map((x) => <line key={x} x1={x} y1={0} x2={x + height} y2={height} stroke="#fff" strokeOpacity=".38" strokeWidth="9" />)}</g>
    <polygon points={points} fill="none" stroke="#b07a1a" strokeOpacity=".22" strokeWidth="2" />
  </svg>;
}

// El sello "¡NUEVA!": una estrella con puntas suaves en el degradé del logo de BIONFC (contrasta
// con el crema de la historia y suma marca).
function NewSeal({ size }: { size: number }) {
  const center = size / 2;
  const points = Array.from({ length: 32 }, (_, index) => {
    const radius = index % 2 ? center * 0.86 : center;
    const angle = (Math.PI * 2 * index) / 32;
    return `${(center + radius * Math.sin(angle)).toFixed(1)},${(center - radius * Math.cos(angle)).toFixed(1)}`;
  }).join(" ");
  return <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size + 10 }}>
    <svg width={size} height={size + 10} viewBox={`0 0 ${size} ${size + 10}`} style={{ position: "absolute", top: 0, left: 0 }}>
      <defs><linearGradient id="seal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#22c7e0" /><stop offset=".55" stopColor="#4b6bff" /><stop offset="1" stopColor="#8a5cf7" /></linearGradient></defs>
      <polygon points={points} fill="#4b6bff" fillOpacity=".25" transform="translate(0 10)" />
      <polygon points={points} fill="url(#seal)" />
    </svg>
    <div style={{ display: "flex", marginBottom: 10, color: "#fff", fontSize: size * 0.155, fontWeight: 800, letterSpacing: 1 }}>¡NUEVA!</div>
  </div>;
}
function Pill({ address }: { address: string }) {
  return <div style={{ display: "flex", padding: "24px 54px", borderRadius: 999, background: "#fff", color: INK, fontSize: Math.min(47, Math.floor(1500 / address.length)), fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 18px 40px rgba(0,0,0,.14)" }}>{address}</div>;
}
// La polaroid: la foto con su cinta, letra a mano y patitas de fondo. Queda linda con cualquier foto.
function StoryPolaroid({ name, photo, address }: StoryProps) {
  const paws = [[60, 120, -20, 150], [820, 210, 25, 130], [90, 1180, 15, 120], [860, 1060, -15, 150], [480, 1700, 10, 140], [60, 1640, -25, 110], [880, 1520, 20, 120], [500, 60, -10, 110]];
  return <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "280px 80px 0", background: "#fff4e6", color: INK, fontFamily: "Poppins", textAlign: "center" }}>
    {paws.map(([left, top, rotate, size], index) => <div key={index} style={{ position: "absolute", left, top, display: "flex", transform: `rotate(${rotate}deg)`, opacity: 0.13 }}><Paw color="#e9772f" size={size} /></div>)}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "Caveat", fontSize: 104, lineHeight: 0.95, color: "#e9772f", transform: "rotate(-3deg)" }}>
      <div style={{ display: "flex" }}>¡Ya tengo mi chapita</div><div style={{ display: "flex" }}>inteligente!</div>
    </div>
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", marginTop: 66, padding: "40px 40px 0", width: 570, height: 660, background: "#fff", boxShadow: "0 30px 70px rgba(45,29,18,.18)", transform: "rotate(3deg)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo acepta <img> */}
      {photo ? <img src={photo} width={490} height={490} alt="" /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 490, height: 490, background: "#f6e2d2" }}><Paw color="#e9772f" size={240} /></div>}
      <div style={{ display: "flex", marginTop: 14, fontFamily: "Caveat", fontSize: fitSize(name, 108, 480, 1, 0.45), lineHeight: 1 }}>{name}</div>
      <div style={{ position: "absolute", top: -34, left: 180, display: "flex", transform: "rotate(-5deg)" }}><Tape width={210} height={62} /></div>
      <div style={{ position: "absolute", top: -70, right: -86, display: "flex", transform: "rotate(14deg)" }}><NewSeal size={220} /></div>
    </div>
    <div style={{ display: "flex", marginTop: 50 }}><Brand /></div>
    <div style={{ display: "flex", marginTop: 22 }}><Pill address={address} /></div>
  </div>;
}

// Publicación (1080×1350, el 4:5 que Instagram no recorta en el feed). Sirve también para grupos
// de Facebook: lo mismo que la historia, más compacto.
function Post({ pet, look, name, photo, photoSize, address, background, lostTitle, zone, reward, greeting }: ShareProps) {
  const details = [zone, reward].filter(Boolean) as string[];
  const inline = details.join("  ·  ").length <= 44;
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background, color: look.ink, fontFamily: "Poppins, sans-serif", textAlign: "center" }}>
    {pet.lost
      ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "56px 40px 48px", background: "#d92d20", color: "#fff" }}>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{lostTitle}</div>
          {(inline ? [details.join("  ·  ")] : details).filter(Boolean).map((line) => <div key={line} style={{ display: "flex", justifyContent: "center", marginTop: 14, fontSize: fitSize(line, 40, 1000, 2), fontWeight: 800, lineHeight: 1.2 }}>{line}</div>)}
        </div>
      : <div style={{ display: "flex", marginTop: 80, fontSize: greetingFit(greeting || "¡Hola! Soy", 38, 940), fontWeight: 800, letterSpacing: 5, textTransform: "uppercase", color: look.accent }}>{greeting || "¡Hola! Soy"}</div>}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 28, padding: "0 60px 60px" }}>
      {!pet.lost && <div style={{ display: "flex", fontSize: nameFit(name, 120, 940), fontWeight: 900, letterSpacing: -3, lineHeight: 1.02, justifyContent: "center" }}>{name}</div>}
      <Photo photo={photo} size={photoSize} look={look} border={16} />
      {pet.lost && <div style={{ display: "flex", fontSize: nameFit(name, 110, 940), fontWeight: 900, letterSpacing: -3, lineHeight: 1.02, justifyContent: "center" }}>{name}</div>}
      <div style={{ display: "flex", fontSize: 40, fontWeight: 800, opacity: 0.85 }}>{pet.lost ? "Si me ves, avisale a mi familia" : "Ya tengo mi chapita inteligente"}</div>
      <Address address={address} size={36} caption={pet.lost ? "Entrá acá para avisar a mi familia" : "Conocé mi chapita en"} />
    </div>
  </div>;
}
