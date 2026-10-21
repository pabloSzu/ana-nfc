"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="icon-text-button danger" type="submit" disabled={pending}>
    {pending ? "Cambiando…" : "Cambiar código"}
  </button>;
}

export default function RegenerateCodeButton({ action, landingId, batchId }: {
  action: (formData: FormData) => void | Promise<void>;
  landingId: string;
  batchId: string;
}) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("El código impreso anterior dejará de funcionar inmediatamente. ¿Generar uno nuevo?")) event.preventDefault();
  }}>
    <input type="hidden" name="landingId" value={landingId} />
    <input type="hidden" name="batchId" value={batchId} />
    <SubmitButton />
  </form>;
}
