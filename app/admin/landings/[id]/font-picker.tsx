"use client";

import { useState } from "react";
import { FiSearch, FiCheck } from "react-icons/fi";
import { FONT_OPTIONS, FontLinks, resolveFontWeight } from "@/lib/fonts";

const CATEGORIES = ["Todas", "Modernas", "Elegantes", "Expresivas", "Manuscritas", "Técnicas"] as const;
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const BUTTON_FONT_IDS = new Set(["modern", "minimal", "manrope", "fustat", "ibm-plex-sans", "friendly", "mono", "domine"]);

export default function FontPicker({ label, value, onChange, previewText = "Tu marca, tu estilo", recommended, usage = "title", previewWeight, previewLetterSpacing, previewLegacy = false }: {
  label: string; value: string; onChange: (id: string) => void; previewText?: string; recommended?: string; usage?: "title" | "body" | "buttons"; previewWeight?: number; previewLetterSpacing?: number; previewLegacy?: boolean;
}) {
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("Todas");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const selected = FONT_OPTIONS.find(font => font.id === value || font.family === value);
  const choices = FONT_OPTIONS.filter(font => (usage !== "buttons" || showAll || query.trim() || BUTTON_FONT_IDS.has(font.id) || font.id === selected?.id || font.id === recommended) && (category === "Todas" || font.category === category) && normalize(font.label).includes(normalize(query.trim())));
  const sample = previewText.trim() || "Tu marca, tu estilo";
  return <div className="font-picker font-picker-live">
    <div className="font-live-heading"><span className="font-picker-label">{label}</span><span>{selected?.label || "Fuente personalizada"} <FiCheck aria-hidden="true"/></span></div>
    <FontLinks ids={[...choices.map(font => font.id), selected?.id]} />
    <div className="font-live-filters">
      <label className="font-picker-search"><FiSearch aria-hidden="true"/><input type="search" placeholder="Buscar fuente…" aria-label="Buscar fuente" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <select aria-label="Filtrar fuentes por estilo" value={category} onChange={event=>setCategory(event.target.value as typeof category)}>{CATEGORIES.map(item=><option key={item}>{item}</option>)}</select>
    </div>
    <p className="font-picker-hint">{usage === "buttons" ? "Fuentes legibles para botones. La muestra usa el grosor y espacio que elegiste; mirá el resultado final en tu landing." : "Tocá una fuente y mirá el cambio en tu página."}</p>
    <div className="font-picker-options" aria-label="Fuentes disponibles">{choices.map(font => <button key={font.id} type="button" className="font-picker-option" aria-pressed={selected?.id === font.id} aria-label={`Usar ${font.label}`} onClick={() => onChange(font.id)}>
      <span className="font-picker-option-meta"><span>{font.label}</span>{selected?.id === font.id ? <FiCheck aria-label="Seleccionada"/> : font.id === recommended ? <small>Plantilla</small> : null}</span>
      <span className="font-picker-sample" style={{fontFamily:font.family,fontWeight:usage === "buttons" ? (font.id === selected?.id ? previewWeight ?? 700 : resolveFontWeight(font.id, previewWeight ?? 700)) : font.google?.weights.includes(600) ? 600 : 400, letterSpacing: usage === "buttons" ? `${previewLetterSpacing ?? 0}em` : undefined, fontSize: usage === "buttons" ? 17 : undefined, fontSynthesis: usage === "buttons" && previewLegacy && font.id === selected?.id ? "auto" : undefined}}>{sample}</span>
      {font.displayOnly && usage !== "title" && <small className="font-picker-use">Ideal para títulos</small>}
    </button>)}</div>
    {choices.length === 0 && <p className="font-picker-empty" role="status">No encontramos esa fuente. Probá otro nombre o elegí Todas.</p>}
    {usage === "buttons" && <button type="button" className="font-picker-more" onClick={() => setShowAll((current) => !current)}>{showAll ? "Ver solo fuentes recomendadas" : "Ver todas las fuentes"}</button>}
    <p className="font-picker-count">{choices.length} de {FONT_OPTIONS.length} fuentes · cambios en vivo</p>
  </div>;
}
