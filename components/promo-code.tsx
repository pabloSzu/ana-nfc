"use client";

import { useState } from "react";

// Código de una promoción con botón para copiarlo. Es el único pedazo de la tarjeta de promo que
// necesita el navegador (el portapapeles); el resto se dibuja en el servidor.
export default function PromoCode({ code, disabled = false }: { code: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Sin permiso de portapapeles: el código queda seleccionable para copiarlo a mano.
      const range = document.createRange();
      const node = document.getElementById(`promo-code-${code}`);
      if (!node) return;
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }
  return <div className="promo-code">
    <span>Código</span>
    <b id={`promo-code-${code}`}>{code}</b>
    <button type="button" onClick={copy} aria-live="polite">{copied ? "¡Copiado!" : "Copiar"}</button>
  </div>;
}
