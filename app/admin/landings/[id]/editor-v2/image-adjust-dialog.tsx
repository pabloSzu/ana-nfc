"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

export type ImagePlacement = { zoom: number; x: number; y: number };
export type ImageKind = "logo" | "cover" | "background";

const titles: Record<ImageKind, string> = {
  logo: "Ajustar logo",
  cover: "Ajustar portada",
  background: "Ajustar fondo",
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export default function ImageAdjustDialog({ kind, src, shape, coverMode, initial, onApply, onCancel }: {
  kind: ImageKind;
  src: string;
  shape?: "round" | "square" | "sharp";
  coverMode?: "fade" | "banner";
  initial: ImagePlacement;
  onApply: (placement: ImagePlacement) => void;
  onCancel: () => void;
}) {
  const [placement, setPlacement] = useState(initial);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);
  const dragRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);
  const maxZoom = kind === "background" ? 2.2 : 2.5;

  useEffect(() => { cancelRef.current = onCancel; }, [onCancel]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.stopPropagation(); cancelRef.current(); }
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button, input");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, []);

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setPlacement((current) => ({
      ...current,
      x: clamp(drag.initialX - (event.clientX - drag.x) / bounds.width * 100),
      y: clamp(drag.initialY - (event.clientY - drag.y) / bounds.height * 100),
    }));
  }

  const imageStyle: CSSProperties = {
    backgroundImage: `url(${JSON.stringify(src)})`,
    backgroundPosition: `${placement.x}% ${placement.y}%`,
    backgroundSize: kind === "logo" ? `${placement.zoom * 100}%` : "cover",
    transform: kind === "logo" ? undefined : `scale(${placement.zoom})`,
    transformOrigin: `${placement.x}% ${placement.y}%`,
  };

  return <div className="image-adjust-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <div ref={dialogRef} className="image-adjust-dialog" role="dialog" aria-modal="true" aria-labelledby="image-adjust-title">
      <div className="image-adjust-heading">
        <div><h2 id="image-adjust-title">{titles[kind]}</h2><p>Arrastrá la imagen dentro del recuadro y ajustá el zoom.</p></div>
        <button ref={closeRef} type="button" aria-label="Cerrar sin aplicar" onClick={onCancel}>×</button>
      </div>
      <div
        className={`image-adjust-preview image-adjust-preview-${kind} image-adjust-shape-${shape || "square"} ${kind === "cover" && coverMode === "banner" ? "image-adjust-preview-banner" : ""}`}
        role="img"
        aria-label={`Vista del encuadre de ${kind === "logo" ? "logo" : kind === "cover" ? "portada" : "fondo"}`}
        onPointerDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY, initialX: placement.x, initialY: placement.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerCancel={() => { dragRef.current = null; }}
      ><div className="image-adjust-photo" style={imageStyle} /></div>
      <label className="image-adjust-slider">Zoom <span>{Math.round(placement.zoom * 100)}%</span>
        <input type="range" min={1} max={maxZoom} step={.01} value={placement.zoom} onChange={(event) => setPlacement((current) => ({ ...current, zoom: Number(event.target.value) }))} />
      </label>
      <div className="image-adjust-position">
        <label>Horizontal<input type="range" min={0} max={100} value={placement.x} onChange={(event) => setPlacement((current) => ({ ...current, x: Number(event.target.value) }))} /></label>
        <label>Vertical<input type="range" min={0} max={100} value={placement.y} onChange={(event) => setPlacement((current) => ({ ...current, y: Number(event.target.value) }))} /></label>
      </div>
      {kind === "background" && <p className="image-adjust-note">El alto visible cambia entre teléfonos. La vista previa del editor muestra el resultado final para cada tamaño.</p>}
      <div className="image-adjust-actions">
        <button type="button" className="v2-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="v2-save" onClick={() => onApply(placement)}>Aplicar encuadre</button>
      </div>
    </div>
  </div>;
}
