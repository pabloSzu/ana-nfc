"use client";

import { useRef } from "react";
import { IconEdit } from "@/components/icons";

export default function RenameLandingButton({ action, landingId, currentName }: { action: (formData: FormData) => void | Promise<void>; landingId: string; currentName: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const next = window.prompt("Nuevo nombre de la landing", currentName)?.trim();
        if (!next || next === currentName) { event.preventDefault(); return; }
        if (inputRef.current) inputRef.current.value = next;
      }}
    >
      <input type="hidden" name="id" value={landingId} />
      <input ref={inputRef} type="hidden" name="business_name" defaultValue={currentName} />
      <button className="icon-text-button" type="submit"><IconEdit /> Renombrar</button>
    </form>
  );
}
