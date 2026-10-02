"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { CONTACT_COVER_HEIGHT, type CoverStyle } from "@/lib/landing-catalog";

export type ImagePlacement = { zoom: number; x: number; y: number };
export type ImageKind = "logo" | "cover" | "background";

const titles: Record<ImageKind, string> = {
  logo: "Ajustar logo",
  cover: "Ajustar portada",
  background: "Ajustar fondo",
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export default function ImageAdjustDialog({ kind, src, shape, contactLogo = false, coverMode, contactCoverSize, contactFrameWidth, contactCoverOverlay, initial, onApply, onCancel }: {
  kind: ImageKind;
  src: string;
  shape?: "round" | "square" | "sharp";
  contactLogo?: boolean;
  coverMode?: "fade" | "banner";
  contactCoverSize?: CoverStyle["size"];
  contactFrameWidth?: number;
  contactCoverOverlay?: number;
  initial: ImagePlacement;
  onApply: (placement: ImagePlacement) => void;
  onCancel: () => void;
}) {
  const [placement, setPlacement] = useState(initial);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);
  const dragRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const maxZoom = kind === "background" ? 2.2 : 2.5;
  const fillLogo = kind === "logo" && contactLogo;
  const contactCover = kind === "cover" && contactCoverSize !== undefined;
  const coverHeight = contactCover ? CONTACT_COVER_HEIGHT[contactCoverSize] : 0;
  const qualityScale = contactCover && imageSize ? Math.max((contactFrameWidth || 402) / imageSize.width, CONTACT_COVER_HEIGHT.large / imageSize.height) * placement.zoom : 0;
  const cropSize = previewSize && contactCover
    ? { width: previewSize.width, height: previewSize.width * CONTACT_COVER_HEIGHT.large / (contactFrameWidth || 402) }
    : previewSize;

  useEffect(() => { cancelRef.current = onCancel; }, [onCancel]);

  useEffect(() => {
    const image = new window.Image();
    image.onload = () => setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = src;
    return () => { image.onload = null; };
  }, [src]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const observer = new ResizeObserver(() => setPreviewSize({ width: preview.clientWidth, height: preview.clientHeight }));
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

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

  const canMove = (() => {
    if (!imageSize || !cropSize || !imageSize.width || !imageSize.height || !cropSize.width || !cropSize.height) return { x: true, y: true };
    const scale = (kind === "logo" && !fillLogo ? cropSize.width / imageSize.width : Math.max(cropSize.width / imageSize.width, cropSize.height / imageSize.height)) * placement.zoom;
    return {
      x: imageSize.width * scale > cropSize.width + 0.5,
      y: imageSize.height * scale > cropSize.height + 0.5,
    };
  })();

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const coverScale = imageSize && cropSize && (kind !== "logo" || fillLogo)
      ? Math.max(cropSize.width / imageSize.width, cropSize.height / imageSize.height) * placement.zoom
      : null;
    const horizontalTravel = coverScale && imageSize && cropSize ? imageSize.width * coverScale - cropSize.width : bounds.width;
    const verticalTravel = coverScale && imageSize && cropSize ? imageSize.height * coverScale - cropSize.height : bounds.height;
    setPlacement((current) => ({
      ...current,
      x: canMove.x ? clamp(drag.initialX - (event.clientX - drag.x) / Math.max(horizontalTravel, 1) * 100) : current.x,
      y: canMove.y ? clamp(drag.initialY - (event.clientY - drag.y) / Math.max(verticalTravel, 1) * 100) : current.y,
    }));
  }

  const imageStyle: CSSProperties = {
    backgroundImage: `url(${JSON.stringify(src)})`,
    backgroundPosition: `${placement.x}% ${placement.y}%`,
    backgroundSize: kind === "logo" && !fillLogo ? `${placement.zoom * 100}%` : "cover",
    transform: kind === "logo" && !fillLogo ? undefined : `scale(${placement.zoom})`,
    transformOrigin: `${placement.x}% ${placement.y}%`,
  };

  return <div className="image-adjust-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <div ref={dialogRef} className="image-adjust-dialog" role="dialog" aria-modal="true" aria-labelledby="image-adjust-title">
      <div className="image-adjust-heading">
        <div><h2 id="image-adjust-title">{titles[kind]}</h2><p>Arrastrá la imagen dentro del recuadro y ajustá el zoom.</p></div>
        <button ref={closeRef} type="button" aria-label="Cerrar sin aplicar" onClick={onCancel}>×</button>
      </div>
      <div
        ref={previewRef}
        className={`image-adjust-preview image-adjust-preview-${kind} image-adjust-shape-${shape || "square"} ${kind === "cover" && coverMode === "banner" ? "image-adjust-preview-banner" : ""}${contactCover ? " is-contact-cover" : ""}`}
        style={contactCover ? { aspectRatio: `${contactFrameWidth || 402} / ${coverHeight}` } : undefined}
        role="img"
        aria-label={`Vista del encuadre de ${kind === "logo" ? "logo" : kind === "cover" ? "portada" : "fondo"}`}
        onPointerDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY, initialX: placement.x, initialY: placement.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerCancel={() => { dragRef.current = null; }}
      >{contactCover ? <div className="image-adjust-contact-canvas" style={{ aspectRatio: `${contactFrameWidth || 402} / ${CONTACT_COVER_HEIGHT.large}` }}><div className="image-adjust-photo" style={imageStyle} /></div> : <div className="image-adjust-photo" style={imageStyle} />}{contactCover && <><span className="image-adjust-cover-veil" style={{ background: `rgba(0,0,0,${contactCoverOverlay || 0})` }} /><span className="image-adjust-visible-label">Área visible en tu tarjeta</span></>}</div>
      {contactCover && <p className="image-adjust-note">El borde punteado muestra exactamente qué parte se verá en la portada {contactCoverSize === "small" ? "chica" : contactCoverSize === "medium" ? "mediana" : "grande"}. El tamaño cambia el área visible, no la escala de la foto.</p>}
      {qualityScale > .5 && <p className="image-adjust-quality" role="status">{qualityScale > 1 ? "La foto es demasiado pequeña para este zoom: puede verse pixelada." : "En pantallas de alta resolución esta foto podría verse poco nítida con este zoom."} Probá una imagen de mayor resolución o reducí el zoom.</p>}
      <label className="image-adjust-slider">Zoom <span>{Math.round(placement.zoom * 100)}%</span>
        <input type="range" min={1} max={maxZoom} step={.01} value={placement.zoom} onChange={(event) => setPlacement((current) => ({ ...current, zoom: Number(event.target.value) }))} />
      </label>
      <div className="image-adjust-position">
        <label>Horizontal<input type="range" min={0} max={100} value={placement.x} disabled={!canMove.x} onChange={(event) => setPlacement((current) => ({ ...current, x: Number(event.target.value) }))} /></label>
        <label>Vertical<input type="range" min={0} max={100} value={placement.y} disabled={!canMove.y} onChange={(event) => setPlacement((current) => ({ ...current, y: Number(event.target.value) }))} /></label>
      </div>
      {(!canMove.x || !canMove.y) && <p className="image-adjust-note" role="status">{!canMove.x && !canMove.y ? "A este zoom la imagen no tiene margen para desplazarse." : `No hay margen para moverla en ${!canMove.x ? "horizontal" : "vertical"} a este zoom.`}{placement.zoom < maxZoom ? " Probá aumentar el zoom." : ""}</p>}
      {kind === "background" && <p className="image-adjust-note">El alto visible cambia entre teléfonos. La vista previa del editor muestra el resultado final para cada tamaño.</p>}
      <div className="image-adjust-actions">
        <button type="button" className="v2-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="v2-save" onClick={() => onApply(placement)}>Aplicar encuadre</button>
      </div>
    </div>
  </div>;
}
