"use client";

// Piezas que se repiten en las pantallas del editor de la chapita.
import type { ReactNode } from "react";
import PetRenderer from "@/components/pet-renderer";
import { PET_KINDS, PET_LOOKS, formatPhone, petAge, petPhoneProblem, type PetData } from "@/lib/pet";
import { useEditor } from "./pet-editor-context";

export function Field({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  return <label className="pet-field"><span>{label}</span>{children}{help && <small>{help}</small>}</label>;
}

// Opciones de un toque; tocar la elegida la desmarca.
// labels: cómo se muestra cada opción, si no es igual a lo que se guarda (por ejemplo, con emoji).
export function Choice({ label, options, value, onPick, labels }: { label: string; options: readonly string[]; value: string; onPick: (value: string) => void; labels?: Record<string, string> }) {
  return <div className="pet-field"><span>{label}</span><div className="pet-choice" role="group" aria-label={label}>
    {options.map((option) => <button type="button" key={option} className={value === option ? "active" : ""} aria-pressed={value === option} onClick={() => onPick(value === option ? "" : option)}>{labels?.[option] || option}</button>)}
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

// Perro, gato u otro.
export function KindChoice() {
  const { pet, change } = useEditor();
  return <Choice label="¿Qué es?" options={PET_KINDS} value={pet.kind} onPick={(kind) => change({ kind })} labels={{ Perro: "🐶 Perro", Gato: "🐱 Gato", Otro: "🐾 Otro" }} />;
}

// Cuándo nació (el año alcanza; el mes es opcional). Su página muestra la edad y se actualiza sola.
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export function BirthField() {
  const { pet, change } = useEditor();
  const [year = "", month = ""] = pet.birth ? pet.birth.split("-") : [];
  const today = new Date();
  const years = Array.from({ length: 26 }, (_, index) => String(today.getFullYear() - index));
  // Del año actual, solo los meses que ya pasaron.
  const months = MONTHS.map((label, index) => ({ label, value: String(index + 1).padStart(2, "0") })).filter((item) => year !== String(today.getFullYear()) || Number(item.value) <= today.getMonth() + 1);
  const setBirth = (nextYear: string, nextMonth: string) => {
    // Si el mes queda en el futuro (por ejemplo, al pasar al año actual), se saca.
    const future = nextYear === String(today.getFullYear()) && Number(nextMonth) > today.getMonth() + 1;
    change({ birth: nextYear ? (nextMonth && !future ? `${nextYear}-${nextMonth}` : nextYear) : "", ...(nextYear ? {} : { birthApprox: false }) });
  };
  const age = petAge(pet.birth, pet.birthApprox);
  const oldAge = pet.about.age.trim();
  return <div className="pet-field"><span>¿Cuándo nació?</span>
    <div className="pet-birth">
      <select aria-label="Año" value={year} onChange={(event) => setBirth(event.target.value, month)}><option value="">Año</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select aria-label="Mes" value={month} disabled={!year} onChange={(event) => setBirth(year, event.target.value)}><option value="">Mes (opcional)</option>{months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
    </div>
    {year && <label className="pet-birth-approx"><input type="checkbox" checked={pet.birthApprox} onChange={(event) => change({ birthApprox: event.target.checked })} />Es aproximado</label>}
    <small>{age ? `Su página va a decir “${age}” y se actualiza sola.` : oldAge ? `Ahora dice “${oldAge}”. Elegí el año y se va a actualizar sola.` : "Si no sabés la fecha exacta, alcanza con el año."}</small>
  </div>;
}
