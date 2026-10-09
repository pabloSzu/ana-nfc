"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { CUSTOM_ICON_OPTIONS, ActionTypeIcon, type IconCategory } from "@/components/action-icons";

const categories: (IconCategory | "Todos")[] = ["Todos", "Popular", "Compras", "Contenido", "Servicios", "Otros"];
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type IconMode = "auto" | "gallery" | "upload";

export default function IconPicker({ type, value, customImageUrl, customImageFit = "contain", customImageScale = 1, previewStyle, uploading = false, error = "", onChange, onUpload, onRemoveCustom, onImageFitChange, onImageScaleChange }: { type: string; value: string; customImageUrl?: string; customImageFit?: "contain" | "cover"; customImageScale?: number; previewStyle?: CSSProperties; uploading?: boolean; error?: string; onChange: (id: string) => void; onUpload?: (file: File) => void | Promise<void>; onRemoveCustom?: () => void; onImageFitChange?: (fit: "contain" | "cover") => void; onImageScaleChange?: (scale: number) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IconCategory | "Todos">("Todos");
  const [mode, setMode] = useState<IconMode>(customImageUrl ? "upload" : value ? "gallery" : "auto");
  useEffect(() => setMode(customImageUrl ? "upload" : value ? "gallery" : "auto"), [customImageUrl, value, type]);
  const search = normalized(query.trim());
  const options = CUSTOM_ICON_OPTIONS.filter((option) =>
    (category === "Todos" || option.category === category) &&
    (!search || normalized(`${option.label} ${option.keywords || ""}`).includes(search))
  );

  return (
    <div className="icon-picker">
      <p className="icon-picker-title">Ícono del botón</p>
      <div className="icon-picker-modes" role="group" aria-label="Origen del ícono">
        <button type="button" aria-pressed={mode === "auto"} className={mode === "auto" ? "active" : ""} onClick={() => { setMode("auto"); onChange(""); }}>Automático</button>
        <button type="button" aria-pressed={mode === "gallery"} className={mode === "gallery" ? "active" : ""} onClick={() => setMode("gallery")}>Galería</button>
        {onUpload && <button type="button" aria-pressed={mode === "upload"} className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}>Imagen</button>}
      </div>
      {mode === "auto" && <div className="icon-picker-auto active">
        <ActionTypeIcon type={type} />
        <span><strong>Ícono automático</strong><small>Usa el símbolo correspondiente a este tipo de botón.</small></span>
        <span aria-hidden="true">✓</span>
      </div>}
      {mode === "gallery" && <>
        <label className="icon-picker-search"><span>Buscar</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Calendario, tienda, música…" /></label>
        <div className="icon-picker-categories" aria-label="Categorías de íconos">{categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="icon-presets" aria-label="Íconos personalizados">{options.map((option) => <button type="button" key={option.id} className={value === option.id ? "font-swatch active" : "font-swatch"} aria-pressed={value === option.id} title={option.label} onClick={() => onChange(option.id)}><ActionTypeIcon type={type} icon={option.id} /><small>{option.label}</small></button>)}</div>
        {options.length === 0 && <p className="icon-picker-empty">No hay íconos con ese nombre.</p>}
      </>}
      {mode === "upload" && onUpload && <>
        {!customImageUrl ? <label className={`icon-picker-upload-simple${uploading ? " is-uploading" : ""}`}><span aria-hidden="true">↑</span>{uploading ? "Subiendo…" : "Subir imagen"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); event.target.value = ""; }} /></label> : <>
          <div className="icon-picker-image-preview-wrap">
            <span className="icon-picker-image-preview" style={previewStyle} aria-hidden="true"><ActionTypeIcon type={type} customImageUrl={customImageUrl} customImageFit={customImageFit} customImageScale={customImageScale} /></span>
            <small>Vista real del ícono</small>
          </div>
          <div className="icon-picker-upload-actions">
            <label className="icon-picker-upload-action">{uploading ? "Subiendo…" : "Reemplazar"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(file); event.target.value = ""; }} /></label>
            {onRemoveCustom && <button type="button" className="icon-picker-upload-remove" disabled={uploading} onClick={onRemoveCustom}>Quitar</button>}
          </div>
        </>}
        {customImageUrl && onImageFitChange && onImageScaleChange && <div className="icon-picker-framing">
          <span>Encuadre</span>
          <div className="icon-picker-fit" role="group" aria-label="Encuadre de la imagen"><button type="button" className={customImageFit === "contain" ? "active" : ""} aria-pressed={customImageFit === "contain"} onClick={() => onImageFitChange("contain")}>Completa</button><button type="button" className={customImageFit === "cover" ? "active" : ""} aria-pressed={customImageFit === "cover"} onClick={() => onImageFitChange("cover")}>Rellenar</button></div>
          <label><span>Zoom <b>{Math.round(customImageScale * 100)}%</b></span><input type="range" min="60" max="150" value={Math.round(customImageScale * 100)} onChange={(event) => onImageScaleChange(Number(event.target.value) / 100)} /></label>
        </div>}
      </>}
      {error && <p className="icon-picker-error" role="alert">{error}</p>}
    </div>
  );
}
