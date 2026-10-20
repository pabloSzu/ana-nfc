"use client";

import { useState } from "react";

// Botón chico de "Copiar" para direcciones (página pública, QR, chip NFC, link directo). Muestra
// "Copiado" un momento como confirmación. Si el navegador no deja usar el portapapeles (por
// ejemplo, fuera de https), cae al método viejo con un campo de texto oculto.
export default function CopyButton({ text, label = "Copiar", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    // Una dirección relativa ("/mi-pagina") se completa con el dominio actual al copiar.
    const value = text.startsWith("/") ? window.location.origin + text : text;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return <button type="button" className={`copy-button${copied ? " is-copied" : ""} ${className}`.trim()} onClick={copy} aria-label={copied ? "Copiado" : `${label}: ${text}`} title={text}>
    {copied ? <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Copiado</> : <><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></svg>{label}</>}
  </button>;
}
