"use client";

import { useEffect, useState } from "react";

// La primera vez que llega a Mis chapitas (desde el final del recorrido, con ?nueva=): qué es
// este lugar, dónde está el botón para cuando se pierda y cómo volver otro día. Se saca ?nueva de la dirección para
// que no vuelva a aparecer al recargar; se cierra con la ✕.
export default function MiWelcome({ petName }: { petName: string }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("nueva");
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }, []);
  if (!open) return null;
  return <div className="mi-welcome" role="status">
    <p><b>Esta es tu página.</b> Acá editás a {petName} y la compartís. Si algún día se pierde, tocá este botón: su página muestra el aviso y lo difundís con un toque. <b>Para volver otro día:</b> entrá a bionfc.com/mi con tu email.</p>
    <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
  </div>;
}

// Al volver de completar la ficha (?completa=id): un aviso que se va solo y no vuelve al recargar.
// Si salteó todo y todavía falta algo, no se le dice que está completa.
export function MiDone({ complete }: { complete: boolean }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("completa");
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
    const timer = setTimeout(() => setOpen(false), 4500);
    return () => clearTimeout(timer);
  }, []);
  if (!open) return null;
  return <p className="mi-done" role="status">{complete ? "✓ Ficha completa. Ya se ve en su página." : "✓ Guardado. Lo que falta lo completás cuando quieras."}</p>;
}
