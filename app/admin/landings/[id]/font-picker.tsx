"use client";

import { useState } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";
import { FONT_OPTIONS, FontLinks } from "@/lib/fonts";

const CATEGORIES = ["Todas", "Modernas", "Elegantes", "Expresivas", "Manuscritas", "Técnicas"] as const;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function FontPicker({ label, value, onChange, previewText = "Tu marca, tu estilo", recommended, usage = "title" }: {
  label: string; value: string; onChange: (id: string) => void; previewText?: string; recommended?: string; usage?: "title" | "body" | "buttons";
}) {
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Todas");
  const [query, setQuery] = useState("");
  const selected = FONT_OPTIONS.find(font => font.id === value || font.family === value);
  const choices = FONT_OPTIONS.filter(font => (category === "Todas" || font.category === category) && normalize(font.label).includes(normalize(query.trim())));
  const sample = previewText.trim() || "Tu marca, tu estilo";
  return <div className="font-picker font-picker-live">
    <div className="font-live-heading"><span className="font-picker-label">{label}</span><span>{selected?.label || "Fuente personalizada"} <FiCheck aria-hidden="true"/></span></div>
    <FontLinks ids={[...choices.map(font => font.id), selected?.id]} />
    <div className="font-live-filters">
      <label className="font-picker-search"><FiSearch aria-hidden="true"/><input type="search" placeholder="Buscar fuente…" aria-label="Buscar fuente" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <select aria-label="Filtrar fuentes por estilo" value={category} onChange={event=>setCategory(event.target.value as typeof category)}>{CATEGORIES.map(item=><option key={item}>{item}</option>)}</select>
    </div>
    <p className="font-picker-hint">Tocá una fuente y mirá el cambio en tu página.</p>
    <div className="font-picker-options" aria-label="Fuentes disponibles">{choices.map(font => <button key={font.id} type="button" className="font-picker-option" aria-pressed={selected?.id === font.id} aria-label={`Usar ${font.label}`} onClick={() => onChange(font.id)}>
      <span className="font-picker-option-meta"><span>{font.label}</span>{selected?.id === font.id ? <FiCheck aria-label="Seleccionada"/> : font.id === recommended ? <small>Plantilla</small> : null}</span>
      <span className="font-picker-sample" style={{fontFamily:font.family,fontWeight:font.google?.weights.includes(600) ? 600 : 400}}>{sample}</span>
      {font.displayOnly && usage !== "title" && <small className="font-picker-use">Ideal para títulos</small>}
    </button>)}</div>
    {choices.length === 0 && <p className="font-picker-empty" role="status">No encontramos esa fuente. Probá otro nombre o elegí Todas.</p>}
    <p className="font-picker-count">{choices.length} de {FONT_OPTIONS.length} fuentes · cambios en vivo</p>
  </div>;
}
