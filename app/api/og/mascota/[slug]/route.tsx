import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { parsePet, petGendered, petLook, type PetPhotoPlacement } from "@/lib/pet";

// Imagen que se ve al compartir el link de una chapita (WhatsApp, Instagram, etc.): la foto, el
// nombre y, si está perdida, un cartel rojo bien visible con la zona y la recompensa. La usa la
// metadata de app/[slug]/page.tsx solo para chapitas de mascota.
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
// sharp, con la misma cuenta que el navegador: object-fit cover + object-position x% y% +
// scale(zoom) desde ese mismo punto. Si algo falla, la imagen sale con la huella.
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

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await publicSupabase.rpc("public_landing", { p_slug: slug });
  const landing = data as { business_type?: string; business_name?: string; logo_url?: string; button_style?: unknown } | null;
  if (!landing || landing.business_type !== "pet") return new Response("No encontrada", { status: 404 });

  const pet = parsePet(landing.button_style);
  const look = petLook(pet.look);
  const name = (landing.business_name || "").trim() || "Mi mascota";
  const photoSize = pet.lost ? 300 : 360;
  const [photo, font] = await Promise.all([landing.logo_url ? framedPhoto(landing.logo_url, photoSize * 2, pet.photo) : null, loadPoppins()]);
  const lostDetails = [pet.lostZone.trim() && `Me perdí en ${pet.lostZone.trim()}`, pet.reward.trim() && `Recompensa: ${pet.reward.trim()}`].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: `linear-gradient(160deg, ${look.background}, ${look.backgroundTo})`, color: look.ink, fontFamily: "Poppins, sans-serif" }}>
        {pet.lost && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 40px", background: "#d92d20", color: "#fff" }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 900, letterSpacing: -1 }}>{petGendered(pet, "¡ESTOY PERDIDO!", "¡ESTOY PERDIDA!")}</div>
          {lostDetails && <div style={{ display: "flex", marginTop: 6, fontSize: 30, fontWeight: 700 }}>{lostDetails}</div>}
        </div>}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56, padding: "0 80px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "none", width: photoSize, height: photoSize, overflow: "hidden", border: `12px solid ${look.card}`, borderRadius: 999, background: look.card, boxShadow: "0 20px 50px rgba(0,0,0,.18)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse solo acepta <img> */}
            {/* El círculo se le pone a la foto misma: el generador no recorta lo de adentro. */}
            {photo ? <img src={photo} width={photoSize - 24} height={photoSize - 24} style={{ borderRadius: 999 }} alt="" /> : <Paw color={look.accent} size={photoSize / 2} />}
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {pet.greeting.trim() && <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: look.accent }}>{pet.greeting.trim()}</div>}
            <div style={{ display: "flex", fontSize: name.length > 12 ? 82 : 110, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>{name}</div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 32, fontWeight: 600, opacity: 0.8 }}>{pet.lost ? "Si me ves, avisale a mi familia" : "Si me encontrás, avisale a mi familia"}</div>
            <div style={{ display: "flex", marginTop: 34, fontSize: 24, fontWeight: 800, opacity: 0.55 }}>BIONFC · chapita de mascota</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: font ? [{ name: "Poppins", data: font, weight: 800, style: "normal" }] : undefined, headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
  );
}
