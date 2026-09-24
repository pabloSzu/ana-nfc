"use client";

import { useState } from "react";
import { CUSTOM_ICON_OPTIONS, ActionTypeIcon, type IconCategory } from "@/components/action-icons";

const categories: (IconCategory | "Todos")[] = ["Todos", "Popular", "Compras", "Contenido", "Servicios", "Otros"];
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function IconPicker({ type, value, onChange }: { type: string; value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IconCategory | "Todos">("Todos");
  const search = normalized(query.trim());
  const options = CUSTOM_ICON_OPTIONS.filter((option) =>
    (category === "Todos" || option.category === category) &&
    (!search || normalized(`${option.label} ${option.keywords || ""}`).includes(search))
  );

  return (
    <div className="icon-picker">
      <p className="icon-picker-title">Ícono del botón</p>
      <button type="button" className={`icon-picker-auto${!value ? " active" : ""}`} aria-pressed={!value} onClick={() => onChange("")}>
        <ActionTypeIcon type={type} />
        <span><strong>Automático</strong><small>El ícono correspondiente al tipo de botón</small></span>
        {!value && <span aria-hidden="true">✓</span>}
      </button>
      <label className="icon-picker-search">
        <span>Buscar en la galería</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej: calendario, tienda, música" />
      </label>
      <div className="icon-picker-categories" aria-label="Categorías de íconos">
        {categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <div className="icon-presets" aria-label="Íconos personalizados">
        {options.map((option) => (
          <button type="button" key={option.id} className={value === option.id ? "font-swatch active" : "font-swatch"} aria-pressed={value === option.id} title={option.label} onClick={() => onChange(option.id)}>
            <ActionTypeIcon type={type} icon={option.id} />
            <small>{option.label}</small>
          </button>
        ))}
      </div>
      {options.length === 0 && <p className="icon-picker-empty">No hay íconos con ese nombre.</p>}
    </div>
  );
}
