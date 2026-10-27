import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";
import { parsePet, petAge, petGendered, petKindWord, petPhotoStyle, phoneForInput } from "@/lib/pet";
import PrintPosterButton from "./print-button";
import "./cartel.css";

// El cartel de mascota perdida para imprimir en A4 (diseño "C3": la foto grande, "¡PERDIDO!" en
// rojo de lado a lado, el nombre y los datos con el WhatsApp y el QR de su página). Para pegar
// en veterinarias, kioscos y postes. Solo blanco, negro y un rojo: sale bien en cualquier
// impresora. Lo que no está cargado no aparece. Solo lo ve quien es de la familia de la chapita.
const clip = (text: string, max: number) => text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export default async function LostPoster({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect(`/mi/entrar?next=${encodeURIComponent(`/mi/chapita/${id}/cartel`)}`);
  const { data: landing } = await supabase.from("landings").select("id,slug,pet_slug,business_name,business_type,logo_url,button_style,client_id").eq("id", id).maybeSingle();
  if (!landing || landing.business_type !== "pet") notFound();
  const { data: member } = await supabase.from("client_members").select("client_id").eq("client_id", landing.client_id).eq("user_id", userId).maybeSingle();
  if (!member) notFound();

  const pet = parsePet(landing.button_style);
  const name = clip((landing.business_name || "").trim() || "Mi mascota", 22);
  const zone = pet.lostZone.trim();
  const reward = pet.reward.trim();
  // "Perro, mestizo, 4 años, mediano, marrón." y, si hay, cómo acercarse o su carácter.
  const kindWord = petKindWord(pet);
  const age = pet.birth ? petAge(pet.birth, pet.birthApprox) : pet.about.age;
  const traits = [kindWord, pet.about.breed, age, pet.about.size, pet.about.color].map((value) => value.trim()).filter(Boolean);
  if (traits[0]) traits[0] = traits[0].charAt(0).toUpperCase() + traits[0].slice(1);
  const looks = traits.length ? `${traits.map((value, index) => index ? value.toLowerCase() : value).join(", ")}.` : "";
  const tip = pet.finder.trim() ? clip(pet.finder.trim().replace(/\s+/g, " "), 140) : pet.about.character.trim() ? `Es ${pet.about.character.trim().toLowerCase()}.` : "";
  const phone = pet.family.find((member) => member.phone)?.phone || "";
  const link = `${getSiteOrigin()}/${landing.pet_slug || landing.slug}`;
  const qr = await QRCode.toDataURL(`${link}?s=qr`, { width: 520, margin: 1, errorCorrectionLevel: "M", color: { dark: "#1d1410", light: "#ffffff" } });
  // "¡PERRO PERDIDO!", "¡GATA PERDIDA!" o, si no se sabe qué es, "¡PERDIDO!".
  const lostWord = `¡${kindWord ? `${kindWord.toUpperCase()} ` : ""}${petGendered(pet, "PERDIDO", "PERDIDA")}!`;

  return <div className="poster-page">
    <div className="poster-toolbar">
      <Link href={`/mi/chapita/${landing.id}?seccion=lost`}>← Volver</Link>
      <div>
        <strong>Cartel para imprimir</strong>
        <small>{pet.lost ? "Hoja A4. Pegalo en veterinarias, kioscos y postes de la zona." : "El aviso de perdido no está activo, pero igual podés imprimirlo."}</small>
      </div>
      <PrintPosterButton />
      <p className="poster-hint">En la ventana de impresión elegí tamaño <b>A4</b>, márgenes <b>Ninguno</b> y activá <b>Gráficos de fondo</b>. También podés <b>guardarlo como PDF</b> y llevarlo a imprimir.</p>
    </div>

    <article className="poster" aria-label={`Cartel de ${name} perdido`}>
      <div className="poster-photo">
        {/* eslint-disable-next-line @next/next/no-img-element -- la foto de la mascota, con su encuadre */}
        {landing.logo_url ? <img src={landing.logo_url} alt="" style={petPhotoStyle(pet.photo)} /> : <span aria-hidden="true">🐾</span>}
      </div>
      <div className={`poster-red${kindWord ? " is-long" : ""}`}>{lostWord}</div>
      <div className="poster-name"><small>Se llama</small><b>{name}</b></div>
      <div className="poster-info">
        <div>
          {zone && <p className="poster-lead">Se perdió en {clip(zone, 90)}.</p>}
          {(looks || tip) && <p>{[looks, tip].filter(Boolean).join(" ")}</p>}
          {reward && <p className="poster-reward">Recompensa {clip(reward, 30)}</p>}
          {phone && <p className="poster-wa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .3-3.4-.7a11.6 11.6 0 0 1-4.5-4c-.4-.6-1.1-1.8-1.1-3s.7-1.8.9-2.1c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.3.7-.2l1.9.9c.3.1.5.2.5.3.1.2.1.8-.2 1.5Z" /></svg>{phoneForInput(phone)}</p>}
        </div>
        <div className="poster-qr">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR generado en el servidor */}
          <img src={qr} alt="" />
          <small>Escaneá para ver su ficha y avisar</small>
        </div>
      </div>
    </article>
  </div>;
}
