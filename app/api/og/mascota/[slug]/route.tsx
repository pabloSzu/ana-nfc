import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { parsePet, petGendered, petLook, type PetData, type PetLook, type PetPhotoPlacement } from "@/lib/pet";
import { getSiteOrigin } from "@/lib/site-url";

// Imágenes de una chapita para compartir, con los colores del diseño elegido:
//  · (sin ?formato) 1200×630: la que se ve al mandar el link por WhatsApp. La usa la metadata de
//    app/[slug]/page.tsx.
//  · ?formato=historia 1080×1920: para historias, estados de WhatsApp y reels.
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

// Poppins en negrita para los títulos (sin esto la imagen sale con letra fina). Se baja una vez
// de Google Fonts y queda en memoria; si falla, la imagen sale igual con la letra por defecto.
let poppins: Promise<ArrayBuffer | null> | null = null;
function loadPoppins() {
  poppins ??= (async () => {
    try {
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Poppins:wght@800", { headers: { "User-Agent": "Mozilla/5.0" } })).text();
      const url = css.match(/src: url\(([^)]+\.ttf)\)/)?.[1];
      return url ? await (await fetch(url)).arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  return poppins;
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
  const photoSize = format === "historia" ? (pet.lost ? 440 : 540) : format === "publicacion" ? (pet.lost ? 400 : 460) : pet.lost ? 300 : 360;
  const [photo, font] = await Promise.all([
    landing.logo_url ? framedPhoto(landing.logo_url, photoSize * 2, pet.photo) : null,
    loadPoppins(),
  ]);
  const options = (width: number, height: number) => ({ width, height, fonts: font ? [{ name: "Poppins", data: font, weight: 800 as const, style: "normal" as const }] : undefined, headers: { "Cache-Control": cacheControl } });
  const background = `linear-gradient(160deg, ${look.background}, ${look.backgroundTo})`;
  const lostTitle = petGendered(pet, "¡ESTOY PERDIDO!", "¡ESTOY PERDIDA!");
  const zone = pet.lostZone.trim() && clip(`Me perdí en ${pet.lostZone.trim()}`, 64);
  const reward = pet.reward.trim() && clip(`Recompensa: ${pet.reward.trim()}`, 36);
  const greeting = clip(pet.greeting.trim(), 30);

  // Las de compartir, en JPG: se ven igual y pesan un quinto (Instagram las recomprime igual).
  const asJpeg = async (image: ImageResponse) => new Response(new Uint8Array(await sharp(Buffer.from(await image.arrayBuffer())).jpeg({ quality: 86, mozjpeg: true }).toBuffer()), { headers: { "Content-Type": "image/jpeg", "Cache-Control": cacheControl } });
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

// Historia (1080×1920), armada dentro de la "zona segura" de Instagram: arriba (~250 px) van el
// nombre de la cuenta y la barra de progreso, y abajo (~340 px) la caja de respuesta y, en un reel,
// los botones. Ahí no va nada importante, así sirve igual para historias, estados y reels.
// Perdida: el cartel rojo, la foto, el nombre y la dirección para avisar. Normal: la foto grande y
// "Ya tengo mi chapita inteligente", para que la compartan con orgullo.
function Story({ pet, look, name, photo, photoSize, address, background, lostTitle, zone, reward, greeting }: ShareProps) {
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background, color: look.ink, fontFamily: "Poppins, sans-serif", textAlign: "center" }}>
    {pet.lost
      ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "270px 60px 50px", background: "#d92d20", color: "#fff" }}>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>{lostTitle}</div>
          {zone && <div style={{ display: "flex", justifyContent: "center", marginTop: 22, fontSize: fitSize(zone, 50, 940, 2), fontWeight: 800, lineHeight: 1.2 }}>{zone}</div>}
          {reward && <div style={{ display: "flex", marginTop: 22, padding: "10px 32px", borderRadius: 999, background: "#fff", color: "#b42318", fontSize: fitSize(reward, 42, 860), fontWeight: 900 }}>{reward}</div>}
        </div>
      : <div style={{ display: "flex", marginTop: 290, fontSize: greetingFit(greeting || "¡Hola! Soy", 44, 900), fontWeight: 800, letterSpacing: 6, textTransform: "uppercase", color: look.accent }}>{greeting || "¡Hola! Soy"}</div>}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 34, padding: "0 70px 360px" }}>
      {!pet.lost && <div style={{ display: "flex", fontSize: nameFit(name, 160, 900), fontWeight: 900, letterSpacing: -4, lineHeight: 1.02, justifyContent: "center" }}>{name}</div>}
      <Photo photo={photo} size={photoSize} look={look} border={18} />
      {pet.lost
        ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", fontSize: nameFit(name, 124, 900), fontWeight: 900, letterSpacing: -3, lineHeight: 1.02, justifyContent: "center" }}>{name}</div>
            <div style={{ display: "flex", fontSize: 46, fontWeight: 800, opacity: 0.85 }}>Si me ves, avisale a mi familia</div>
          </div>
        : <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 900, lineHeight: 1.15 }}>Ya tengo mi chapita inteligente</div>
            <div style={{ display: "flex", marginTop: 12, fontSize: 36, fontWeight: 800, opacity: 0.7 }}>Si me encontrás, me escaneás y avisás a mi familia</div>
          </div>}
      <Address address={address} size={pet.lost ? 46 : 40} caption={pet.lost ? "Entrá acá para avisar a mi familia" : "Conocé mi chapita en"} />
    </div>
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
