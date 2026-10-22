"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { petPhotoStyle, type PetPhotoPlacement } from "@/lib/pet";

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const clampZoom = (value: number) => Math.max(1, Math.min(2.5, value));
type Point = { x: number; y: number };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const middle = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export default function PetPhotoAdjust({ src, initial, onApply, onCancel }: {
  src: string;
  initial: PetPhotoPlacement;
  onApply: (placement: PetPhotoPlacement) => void;
  onCancel: () => void;
}) {
  const [placement, setPlacement] = useState(initial);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Gestos sobre la foto: un dedo (o el mouse) la mueve; dos dedos la acercan o alejan
  // (pellizcar) y también la mueven. Cada vez que se apoya o levanta un dedo, el gesto vuelve a
  // empezar desde donde está la foto: así no salta al pasar de uno a dos dedos.
  const placementRef = useRef(initial);
  placementRef.current = placement;
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ start: PetPhotoPlacement; center: Point; spread: number } | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button, input");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, [onCancel]);

  // Safari en iPhone hace zoom de toda la página con dos dedos aunque el gesto empiece en la
  // foto: mientras esta ventana está abierta, ese zoom se bloquea.
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", block);
    document.addEventListener("gesturechange", block);
    return () => { document.removeEventListener("gesturestart", block); document.removeEventListener("gesturechange", block); };
  }, []);

  function restartGesture() {
    const points = [...pointers.current.values()];
    gesture.current = points.length ? {
      start: placementRef.current,
      center: points.length > 1 ? middle(points[0], points[1]) : points[0],
      spread: points.length > 1 ? distance(points[0], points[1]) : 0,
    } : null;
  }

  function down(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    restartGesture();
  }

  function up(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    restartGesture();
  }

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const { start, center: startCenter, spread } = gesture.current;
    const center = points.length > 1 ? middle(points[0], points[1]) : points[0];
    const zoom = points.length > 1 && spread > 0 ? clampZoom(start.zoom * distance(points[0], points[1]) / spread) : start.zoom;
    const bounds = event.currentTarget.getBoundingClientRect();
    const sensitivity = 100 / Math.max(zoom - .72, .4);
    setPlacement({
      zoom,
      x: clamp(start.x - (center.x - startCenter.x) / bounds.width * sensitivity),
      y: clamp(start.y - (center.y - startCenter.y) / bounds.height * sensitivity),
    });
  }

  // Compu: la ruedita del mouse acerca o aleja.
  function wheel(event: ReactWheelEvent<HTMLDivElement>) {
    setPlacement((current) => ({ ...current, zoom: clampZoom(current.zoom - event.deltaY / 500) }));
  }

  const imageStyle = petPhotoStyle(placement);

  return <div className="pet-photo-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <div ref={dialogRef} className="pet-photo-dialog" role="dialog" aria-modal="true" aria-labelledby="pet-photo-title">
      <header><div><h2 id="pet-photo-title">Ajustar foto</h2><p>Mové la foto con un dedo. Para acercarla, pellizcá con dos dedos o usá la barra de zoom.</p></div><button ref={closeRef} type="button" onClick={onCancel} aria-label="Cerrar sin aplicar">×</button></header>
      <div className="pet-photo-crop" role="img" aria-label="Vista previa del encuadre"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel}>
        {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local o imagen subida por el usuario */}
        <img src={src} alt="" draggable={false} style={imageStyle} />
      </div>
      <label className="pet-photo-zoom"><span>Zoom</span><strong>{Math.round(placement.zoom * 100)}%</strong><input type="range" min="1" max="2.5" step="0.01" value={placement.zoom} onChange={(event) => setPlacement((current) => ({ ...current, zoom: Number(event.target.value) }))} /></label>
      <p className="pet-photo-tip">La vista previa muestra exactamente cómo quedará en la ficha.</p>
      <div className="pet-photo-actions"><button type="button" className="pet-editor-ghost" onClick={() => setPlacement({ x: 50, y: 50, zoom: 1 })}>Restablecer</button><button type="button" className="pet-editor-save" onClick={() => onApply(placement)}>Listo</button></div>
    </div>
  </div>;
}
