"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="icon-text-button" type="submit" disabled={pending}>
    {pending ? "Cambiando…" : "Cambiar código"}
  </button>;
}

// Para cuando una tarjeta se perdió o se filtró su código. Avisa lo que implica: la tarjeta impresa
// deja de servir y hay que imprimir otra.
export default function RegenerateCodeButton({ action, landingId, batchId, unit }: {
  action: (formData: FormData) => void | Promise<void>;
  landingId: string;
  batchId: string;
  unit: string;
}) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm(`La tarjeta impresa de la unidad ${unit} deja de servir al instante: vas a tener que imprimir una nueva. Usalo sólo si se perdió o se filtró el código. ¿Cambiar el código?`)) event.preventDefault();
  }}>
    <input type="hidden" name="landingId" value={landingId} />
    <input type="hidden" name="batchId" value={batchId} />
    <SubmitButton />
  </form>;
}
