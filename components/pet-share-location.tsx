"use client";

// "Mandar mi ubicación": quien encuentra a la mascota toca, el celular pide permiso y se abre
// WhatsApp con un mensaje ya escrito y un link de Google Maps al lugar donde está. Si no da
// permiso o el celular no puede ubicarse, igual se abre WhatsApp, sin el mapa.
import { useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { petWhatsappHref } from "@/lib/pet";

export default function PetShareLocation({ phone, petName, urgent = false, preview = false }: { phone: string; petName: string; urgent?: boolean; preview?: boolean }) {
  const [state, setState] = useState<"idle" | "locating" | "denied">("idle");
  const name = petName.trim() || "tu mascota";

  function open(location: string) {
    const base = petWhatsappHref(phone, name);
    if (!base) return;
    const text = location
      ? `¡Hola! Encontré a ${name} 🐾 Estoy acá: ${location}`
      : `¡Hola! Encontré a ${name} 🐾`;
    window.open(base.replace(/text=[^&]*/, `text=${encodeURIComponent(text)}`), "_blank", "noopener");
  }

  function share() {
    if (preview) return;
    if (!navigator.geolocation) { open(""); return; }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setState("idle"); open(`https://maps.google.com/?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`); },
      () => { setState("denied"); open(""); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  return <div className={`pet-location${urgent ? " is-urgent" : ""}`}>
    <button type="button" className="pet-location-button" onClick={share} disabled={state === "locating"}>
      <FiMapPin aria-hidden="true" />
      <span>{state === "locating" ? "Buscando tu ubicación…" : "Mandar mi ubicación a la familia"}</span>
    </button>
    {state === "denied"
      ? <small>No pudimos ver tu ubicación. Contales por WhatsApp dónde estás.</small>
      : <small>Abre WhatsApp con un mapa de dónde estás. Solo se manda si vos lo enviás.</small>}
  </div>;
}
