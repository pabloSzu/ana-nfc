import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import sharp from "sharp";
import { parsePet, petGendered, petLook, type PetData, type PetLook, type PetPhotoPlacement } from "@/lib/pet";
import { getSiteOrigin } from "@/lib/site-url";

// Imágenes de una chapita para compartir, con los colores del diseño elegido:
//  · (sin ?formato) 1200×630: la que se ve al mandar el link por WhatsApp. La usa la metadata de
//    app/[slug]/page.tsx.
//  · ?formato=historia 1080×1920: para historias de Instagram y estados de WhatsApp.
//  · ?formato=cuadrado 1080×1080: para grupos de Facebook y el feed.
// Si está perdida, todas llevan "¡ESTOY PERDIDO/A!" con la zona y la recompensa. La historia y la
// cuadrada llevan además un QR a su página: desde una página web, Instagram no deja agregar el
// link solo, así que quien la ve escanea o entra a la dirección escrita.
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

// QR a la página, en una tarjeta blanca con la dirección escrita debajo.
function QrCard({ qr, address, size, caption }: { qr: string; address: string; size: number; caption: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: size * 0.16, padding: size * 0.12, borderRadius: size * 0.16, background: "#fff", color: "#1d2130", boxShadow: "0 16px 40px rgba(0,0,0,.14)" }}>
    {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo acepta <img> */}
    <img src={qr} width={size} height={size} alt="" />
    <div style={{ display: "flex", flexDirection: "column", maxWidth: size * 2.2 }}>
      <div style={{ display: "flex", fontSize: size * 0.17, fontWeight: 800, lineHeight: 1.15 }}>{caption}</div>
      <div style={{ display: "flex", marginTop: size * 0.06, fontSize: size * 0.11, fontWeight: 800, color: "#6b7080" }}>{address}</div>
    </div>
  </div>;
}

const nameSize = (name: string, big: number) => name.length > 16 ? big * 0.62 : name.length > 10 ? big * 0.8 : big;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const format = new URL(request.url).searchParams.get("formato");
  const { data } = await publicSupabase.rpc("public_landing", { p_slug: slug });
  const landing = data as { business_type?: string; business_name?: string; logo_url?: string; button_style?: unknown } | null;
  if (!landing || landing.business_type !== "pet") return new Response("No encontrada", { status: 404 });

  const pet = parsePet(landing.button_style);
  const look = petLook(pet.look);
  const name = (landing.business_name || "").trim() || "Mi mascota";
  const pageUrl = `${getSiteOrigin()}/mascota/${encodeURIComponent(slug)}`;
  const address = pageUrl.replace(/^https?:\/\//, "");
  const photoSize = format === "historia" ? (pet.lost ? 520 : 620) : format === "cuadrado" ? 420 : pet.lost ? 300 : 360;
  const [photo, font, qr] = await Promise.all([
    landing.logo_url ? framedPhoto(landing.logo_url, photoSize * 2, pet.photo) : null,
    loadPoppins(),
    format ? QRCode.toDataURL(pageUrl, { width: 480, margin: 1, errorCorrectionLevel: "M" }) : null,
  ]);
  const options = (width: number, height: number) => ({ width, height, fonts: font ? [{ name: "Poppins", data: font, weight: 800 as const, style: "normal" as const }] : undefined, headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } });
  const background = `linear-gradient(160deg, ${look.background}, ${look.backgroundTo})`;
  const lostTitle = petGendered(pet, "¡ESTOY PERDIDO!", "¡ESTOY PERDIDA!");
  const zone = pet.lostZone.trim() && `Me perdí en ${pet.lostZone.trim()}`;
  const reward = pet.reward.trim() && `Recompensa: ${pet.reward.trim()}`;

  if (format === "historia" && qr) return new ImageResponse(<Story pet={pet} look={look} name={name} photo={photo} photoSize={photoSize} qr={qr} address={address} background={background} lostTitle={lostTitle} zone={zone} reward={reward} />, options(1080, 1920));
  if (format === "cuadrado" && qr) return new ImageResponse(<Square pet={pet} look={look} name={name} photo={photo} photoSize={photoSize} qr={qr} address={address} background={background} lostTitle={lostTitle} zone={zone} reward={reward} />, options(1080, 1080));

  const lostDetails = [zone, reward].filter(Boolean).join("  ·  ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background, color: look.ink, fontFamily: "Poppins, sans-serif" }}>
        {pet.lost && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 40px", background: "#d92d20", color: "#fff" }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 900, letterSpacing: -1 }}>{lostTitle}</div>
          {lostDetails && <div style={{ display: "flex", marginTop: 6, fontSize: 30, fontWeight: 700 }}>{lostDetails}</div>}
        </div>}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56, padding: "0 80px" }}>
          <Photo photo={photo} size={photoSize} look={look} border={12} />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {pet.greeting.trim() && <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: look.accent }}>{pet.greeting.trim()}</div>}
            <div style={{ display: "flex", fontSize: name.length > 12 ? 82 : 110, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>{name}</div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 32, fontWeight: 600, opacity: 0.8 }}>{pet.lost ? "Si me ves, avisale a mi familia" : "Si me encontrás, avisale a mi familia"}</div>
            <div style={{ display: "flex", marginTop: 34, fontSize: 24, fontWeight: 800, opacity: 0.55 }}>BIONFC · chapita de mascota</div>
          </div>
        </div>
      </div>
    ),
    options(1200, 630),
  );
}

type ShareProps = { pet: PetData; look: PetLook; name: string; photo: string | null; photoSize: number; qr: string; address: string; background: string; lostTitle: string; zone: string | false; reward: string | false };

// Historia (1080×1920). Perdida: cartel rojo arriba, foto, nombre y el QR para avisar. Normal: la
// foto grande y "Ya tengo mi chapita inteligente", para que la compartan con orgullo.
function Story({ pet, look, name, photo, photoSize, qr, address, background, lostTitle, zone, reward }: ShareProps) {
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", background, color: look.ink, fontFamily: "Poppins, sans-serif" }}>
    {pet.lost
      ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: "120px 60px 60px", background: "#d92d20", color: "#fff", textAlign: "center" }}>
          <div style={{ display: "flex", fontSize: 112, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>{lostTitle}</div>
          {zone && <div style={{ display: "flex", marginTop: 26, fontSize: 52, fontWeight: 800 }}>{zone}</div>}
          {reward && <div style={{ display: "flex", marginTop: 26, padding: "12px 34px", borderRadius: 999, background: "#fff", color: "#b42318", fontSize: 44, fontWeight: 900 }}>{reward}</div>}
        </div>
      : <div style={{ display: "flex", marginTop: 170, fontSize: 46, fontWeight: 800, letterSpacing: 8, textTransform: "uppercase", color: look.accent }}>{pet.greeting.trim() || "¡Hola! Soy"}</div>}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 40, padding: "0 70px", textAlign: "center" }}>
      {!pet.lost && <div style={{ display: "flex", marginTop: -40, fontSize: nameSize(name, 170), fontWeight: 900, letterSpacing: -5, lineHeight: 1 }}>{name}</div>}
      <Photo photo={photo} size={photoSize} look={look} border={18} />
      {pet.lost
        ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", fontSize: nameSize(name, 140), fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 50, fontWeight: 800, opacity: 0.85 }}>Si me ves, avisale a mi familia</div>
          </div>
        : <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 58, fontWeight: 900, lineHeight: 1.15 }}>Ya tengo mi chapita inteligente</div>
            <div style={{ display: "flex", marginTop: 14, fontSize: 38, fontWeight: 800, opacity: 0.7 }}>Si me encontrás, me escaneás y avisás a mi familia</div>
          </div>}
    </div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, paddingBottom: 110 }}>
      <QrCard qr={qr} address={address} size={pet.lost ? 260 : 190} caption={pet.lost ? "Escaneá para avisar a mi familia" : "Escaneá y conocé mi chapita"} />
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800, opacity: 0.55 }}>BIONFC · chapita inteligente</div>
    </div>
  </div>;
}

// Cuadrada (1080×1080), para grupos de Facebook y el feed: lo mismo, más compacto.
function Square({ pet, look, name, photo, photoSize, qr, address, background, lostTitle, zone, reward }: ShareProps) {
  const details = [zone, reward].filter(Boolean).join("  ·  ");
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background, color: look.ink, fontFamily: "Poppins, sans-serif" }}>
    {pet.lost && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "46px 40px", background: "#d92d20", color: "#fff", textAlign: "center" }}>
      <div style={{ display: "flex", fontSize: 92, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>{lostTitle}</div>
      {details && <div style={{ display: "flex", marginTop: 16, fontSize: 38, fontWeight: 800 }}>{details}</div>}
    </div>}
    <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 50, padding: "0 60px" }}>
      <Photo photo={photo} size={photoSize} look={look} border={14} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 26 }}>
        {!pet.lost && <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: 5, textTransform: "uppercase", color: look.accent }}>{pet.greeting.trim() || "¡Hola! Soy"}</div>}
        <div style={{ display: "flex", fontSize: nameSize(name, 104), fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>{name}</div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 800, opacity: 0.8 }}>{pet.lost ? "Si me ves, avisale a mi familia" : "Ya tengo mi chapita inteligente"}</div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px 56px" }}>
      <QrCard qr={qr} address={address} size={170} caption={pet.lost ? "Escaneá para avisar" : "Escaneá y conocé mi chapita"} />
      <div style={{ display: "flex", fontSize: 28, fontWeight: 800, opacity: 0.55 }}>BIONFC</div>
    </div>
  </div>;
}
