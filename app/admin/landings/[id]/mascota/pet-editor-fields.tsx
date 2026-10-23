"use client";

// Piezas que se repiten en las pantallas del editor de la chapita.
import type { ReactNode } from "react";
import PetRenderer from "@/components/pet-renderer";
import { PET_LOOKS, formatPhone, petPhoneProblem, type PetData } from "@/lib/pet";
import { useEditor } from "./pet-editor-context";

export function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return <label className="pet-field"><span>{label}</span>{children}{help && <small>{help}</small>}</label>;
}

// Opciones de un toque; tocar la elegida la desmarca.
export function Choice({ label, options, value, onPick }: { label: string; options: string[]; value: string; onPick: (value: string) => void }) {
  return <div className="pet-field"><span>{label}</span><div className="pet-choice" role="group" aria-label={label}>
    {options.map((option) => <button type="button" key={option} className={value === option ? "active" : ""} aria-pressed={value === option} onClick={() => onPick(value === option ? "" : option)}>{option}</button>)}
  </div></div>;
}

// Debajo de un WhatsApp: qué le falta, o cómo va a quedar.
export function PhoneStatus({ phone }: { phone: string }) {
  if (!phone.trim()) return null;
  const problem = petPhoneProblem(phone);
  return problem ? <small className="pet-phone-warn">{problem}</small> : <small className="pet-phone-ok">✓ Va a quedar así: {formatPhone(phone)}</small>;
}

// La chapita en un celular chiquito, dentro de una pantalla (se ve en grande tocándola). preview:
// otra versión de los datos (por ejemplo, con el modo perdido prendido de muestra).
export function MiniPreview({ preview }: { preview?: PetData }) {
  const { pet, name, photoUrl, openBig } = useEditor();
  return <div className="pet-mini pet-celebrate-mini" role="button" tabIndex={0} aria-label="Ver la chapita en grande" onClick={openBig} onKeyDown={(event) => { if (event.key === "Enter") openBig(); }}>
    <div className="pet-mini-screen"><PetRenderer landing={{ business_name: name }} pet={preview || pet} photoUrl={photoUrl} /></div>
  </div>;
}

export function LookGrid() {
  const { pet, change } = useEditor();
  return <div className="pet-look-grid" role="group" aria-label="Diseño">{PET_LOOKS.map((item) => <button type="button" key={item.id} className={pet.look === item.id ? "active" : ""} aria-pressed={pet.look === item.id} onClick={() => change({ look: item.id })}><span style={{ background: `linear-gradient(135deg, ${item.background} 0 58%, ${item.accent} 58% 100%)` }} /><small>{item.label}</small></button>)}</div>;
}
