"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { FiArrowDown, FiArrowLeft, FiArrowRight, FiMessageCircle, FiPause, FiPlay, FiRadio } from "react-icons/fi";
import "./destinations.css";

const EXPERIENCES = [
  { id: "reviews", brand: "Tu Marca", productName: "Mostrador chico", product: "/marketing/interactive/chico-qr-nfc-v3.webp", hitInset: "0% 13% 18% 16%", screen: "/marketing/interactive/screen-resenas-v3.webp", eyebrow: "RESEÑAS DE GOOGLE", inquiry: "Hola BioNFC, quiero un QR o NFC que lleve directo a las reseñas de Google de mi negocio." },
  { id: "contact", brand: "Ana Duarte", productName: "Tarjeta NFC", product: "/marketing/interactive/tarjeta-v3.webp", hitInset: "10% 3% 29% 3%", screen: "/marketing/interactive/screen-contacto-v3.webp", eyebrow: "CONTACTO PROFESIONAL", inquiry: "Hola BioNFC, quiero una tarjeta NFC para compartir mi contacto profesional." },
  { id: "barber", brand: "Barber Club", productName: "Llavero NFC", product: "/marketing/interactive/llavero-v3.webp", hitInset: "0% 31% 18% 31%", screen: "/marketing/interactive/screen-barber-v3.webp", eyebrow: "PÁGINA DE NEGOCIO", inquiry: "Hola BioNFC, quiero un llavero NFC con una página para mi negocio." },
  { id: "cafe", brand: "Café Nube", productName: "Mostrador grande", product: "/marketing/interactive/grande-qr-nfc-v3.webp", hitInset: "0% 23% 18% 24%", screen: "/marketing/interactive/screen-cafe-v3.webp", eyebrow: "MENÚ Y RESERVAS", inquiry: "Hola BioNFC, quiero un soporte NFC para compartir el menú de mi negocio." },
  { id: "beauty", brand: "Luna Studio", productName: "Mostrador chico", product: "/marketing/interactive/belleza-nfc-v3.webp", hitInset: "0% 18% 18% 18%", screen: "/marketing/interactive/screen-belleza-v3.webp", eyebrow: "TURNOS Y SERVICIOS", inquiry: "Hola BioNFC, quiero un soporte NFC para mostrar los servicios de mi estudio." },
  { id: "shop", brand: "Casa Objeto", productName: "Tarjeta NFC", product: "/marketing/interactive/tienda-v3.webp", hitInset: "10% 4% 28% 4%", screen: "/marketing/interactive/screen-tienda-v3.webp", eyebrow: "TIENDA Y CATÁLOGO", inquiry: "Hola BioNFC, quiero una tarjeta NFC que lleve a mi tienda o catálogo." },
  { id: "custom", brand: "Tu idea", productName: "Objetos a medida", product: "/marketing/interactive/custom-objects-v1.webp", hitInset: "6% 1% 26% 8%", screen: null, eyebrow: "SOLUCIÓN NFC A MEDIDA", inquiry: "Hola BioNFC, tengo una idea para integrar NFC en un producto o desarrollar una experiencia personalizada." },
] as const;

export default function Destinations({ whatsappNumber }: { whatsappNumber: string }) {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<"settle" | "approach" | "open">("settle");
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const experience = EXPERIENCES[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused) {
      setPhase("open");
      return;
    }
    setPhase("settle");
    const approachTimer = window.setTimeout(() => setPhase("approach"), 750);
    const openTimer = window.setTimeout(() => setPhase("open"), 1950);
    const nextTimer = window.setTimeout(() => {
      setPhase("settle");
      setActive((current) => (current + 1) % EXPERIENCES.length);
      setCycle((current) => current + 1);
    }, 5200);
    return () => {
      window.clearTimeout(approachTimer);
      window.clearTimeout(openTimer);
      window.clearTimeout(nextTimer);
    };
  }, [active, cycle, paused]);

  const selectExperience = (index: number) => {
    setPhase("settle");
    setActive(index);
    setCycle((current) => current + 1);
  };
  const move = (direction: number) => {
    setPhase("settle");
    setActive((current) => (current + direction + EXPERIENCES.length) % EXPERIENCES.length);
    setCycle((current) => current + 1);
  };
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.pointerType === "mouse") return;
    pointerStart.current = event.clientX;
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) > 42) {
      move(distance < 0 ? 1 : -1);
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowRight" ? 1 : -1);
  };
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(experience.inquiry)}`;

  return (
    <div id="elegi-tu-uso" className="bx-hero-demo">
      <div className="bx-hero-copy">
        <span className="bx-pill">QR + NFC PERSONALIZADOS</span>
        <h1 className="bx-h1" id="hero-title">Todo tu negocio,<br /><span className="bx-grad">a un toque.</span></h1>
        <p className="bx-hero-lead">Reseñas, contacto, menú, turnos o tu página. Tus clientes acercan el celular o escanean el QR y llegan directo.</p>

        <div className="bx-hero-cta">
          <a className="bx-btn bx-btn-hero" href={waUrl} target="_blank" rel="noreferrer"><FiMessageCircle aria-hidden="true" />Escribinos por WhatsApp</a>
          <a className="bx-btn bx-btn-outline" href="#como-funciona"><FiArrowDown aria-hidden="true" />Ver cómo funciona</a>
        </div>
      </div>

      <div className="bx-hero-demo-visual">
        <div className={`bx-experience-scene is-${phase}`} data-experience={experience.id} role="group" tabIndex={0} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; }} aria-label={`Carrusel: ${experience.productName} de ${experience.brand}. Elegí un objeto lateral, deslizá o usá las flechas para cambiar.`}>
          <div className="bx-experience-halo" aria-hidden="true" />
          <div className="bx-demo-visual-label"><em><FiRadio aria-hidden="true" />SOLO ACERCÁ TU CELULAR</em><span>{experience.eyebrow}</span><b>{experience.brand}</b></div>
          <div className="bx-product-carousel">
            {EXPERIENCES.map((item, index) => {
              const rawPosition = (index - active + EXPERIENCES.length) % EXPERIENCES.length;
              const position = rawPosition > EXPERIENCES.length / 2 ? rawPosition - EXPERIENCES.length : rawPosition;
              return <button type="button" key={item.id} data-item={item.id} data-position={position} aria-pressed={position === 0} aria-disabled={position === 0} aria-hidden={Math.abs(position) > 1} tabIndex={position === 0 || Math.abs(position) > 1 ? -1 : 0} onClick={(event) => { event.stopPropagation(); if (position !== 0) selectExperience(index); }} aria-label={`${item.brand}, ${item.productName}`}>
                <span className="bx-product-hit" style={{ inset: item.hitInset }} aria-hidden="true" />
                <Image src={item.product} alt="" width={960} height={720} sizes="(max-width: 760px) 230px, 330px" priority={index === 0} loading={index === 0 ? undefined : Math.abs(position) <= 1 ? "eager" : "lazy"} fetchPriority={position === 0 ? "high" : Math.abs(position) === 1 ? "auto" : "low"} />
                <span className="bx-product-caption"><b>{item.brand}</b><small>{item.productName}</small></span>
              </button>;
            })}
          </div>
          <div className="bx-experience-signal" aria-hidden="true"><i /><i /><FiRadio /></div>
          <div className="bx-experience-phone">
            <div className="bx-experience-screen">
              <Image className="bx-screen-home" src="/marketing/interactive/screen-home-v3.webp" alt="" fill sizes="(max-width: 760px) 145px, 198px" priority />
              {experience.screen
                ? <Image className="bx-screen-result" src={experience.screen} alt={`Pantalla digital de ${experience.brand}`} fill sizes="(max-width: 760px) 145px, 198px" />
                : <div className="bx-screen-result bx-screen-custom" aria-label="Ejemplo de solución NFC a medida">
                    <span>DE TU IDEA A UNA ACCIÓN</span>
                    <FiRadio aria-hidden="true" />
                    <strong>Una solución<br />a medida.</strong>
                    <p>Producto, diseño y experiencia pensados para tu negocio.</p>
                    <div><i>Accesos</i><i>Registros</i><i>Identidad</i><i>Procesos</i></div>
                  </div>}
            </div>
          </div>
          <div className="bx-experience-controls">
            <div className="bx-experience-pagination">
              <button className="bx-experience-arrow" type="button" onClick={() => move(-1)} aria-label="Producto anterior"><FiArrowLeft /></button>
              <div className="bx-experience-dots" aria-hidden="true">{EXPERIENCES.map((item, index) => <i key={item.id} className={active === index ? "is-active" : undefined} />)}</div>
              <button className="bx-experience-arrow" type="button" onClick={() => move(1)} aria-label="Producto siguiente"><FiArrowRight /></button>
            </div>
            <button className="bx-experience-pause" type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Reanudar demostración" : "Pausar demostración"}>{paused ? <FiPlay /> : <FiPause />}{paused ? "Reanudar" : "Pausar"}</button>
          </div>
        </div>
        <p className="bx-experience-disclaimer"><span className="is-desktop">Elegí un objeto o usá las flechas</span><span className="is-mobile">Deslizá para explorar</span><i aria-hidden="true">·</i> Ejemplos ilustrativos, personalizados para tu marca.</p>
      </div>
    </div>
  );
}
