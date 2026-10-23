"use client";

// "Compartir" la chapita desde el panel del dueño. En el celular abre el menú nativo (WhatsApp,
// Instagram…); en la compu, o si el navegador no lo tiene, copia el texto con el link. Si está
// perdida comparte el pedido de ayuda: el link se ve con la imagen de "¡ESTOY PERDIDO!".
import { useState } from "react";
import { FiShare2 } from "react-icons/fi";

export default function PetShareButton({ path, petName, lost, lostZone = "", female = false, className = "" }: { path: string; petName: string; lost: boolean; lostZone?: string; female?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  // Si el navegador no deja copiar: el link a la vista para copiarlo a mano (sin ventanitas).
  const [manual, setManual] = useState("");
  const name = petName.trim() || "mi mascota";

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    const text = lost
      ? `¡${name} se perdió${lostZone.trim() ? ` en ${lostZone.trim()}` : ""}! Si ${female ? "la" : "lo"} ves, avisá a su familia desde acá 🙏`
      : `Esta es la chapita de ${name} 🐾`;
    if (navigator.share) {
      try { await navigator.share({ title: name, text, url }); return; } catch (error) { if ((error as Error).name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setManual(url);
    }
  }

  return <>
    <button type="button" className={className} onClick={share}>
      <FiShare2 aria-hidden="true" />{copied ? "¡Link copiado!" : lost ? "Compartir que se perdió" : "Compartir"}
    </button>
    {manual && <label className="pet-share-manual"><span>Copiá este link:</span><input readOnly value={manual} onFocus={(event) => event.currentTarget.select()} autoFocus /></label>}
  </>;
}
