"use client";

import { useEffect, useState } from "react";

// La primera vez que llega a Mis chapitas (desde el final del recorrido, con ?nueva=): qué es
// este lugar y dónde está el botón para cuando se pierda. Se saca ?nueva de la dirección para
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
    <p><b>Esta es tu página.</b> Acá editás a {petName}. Si algún día se pierde, tocá este botón: su página muestra el aviso de perdido y lo compartís con un toque.</p>
    <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
  </div>;
}
