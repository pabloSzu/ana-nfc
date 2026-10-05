"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCheck, FiPause, FiPlay, FiRadio } from "react-icons/fi";
import "./destinations.css";

const EXPERIENCES = [
  { id: "reviews", brand: "Tu Marca", productName: "Mostrador chico", product: "/marketing/interactive/chico-v3.webp", screen: "/marketing/interactive/screen-resenas-v3.webp", eyebrow: "RESEÑAS DE GOOGLE", title: "Una opinión empieza con un toque.", description: "Tu cliente acerca el celular y llega directo al lugar donde puede compartir su experiencia.", benefit: "Menos pasos para dejar una reseña", inquiry: "Hola BioNFC, quiero un QR o NFC que lleve directo a las reseñas de Google de mi negocio." },
  { id: "contact", brand: "Ana Duarte", productName: "Tarjeta NFC", product: "/marketing/interactive/tarjeta-v3.webp", screen: "/marketing/interactive/screen-contacto-v3.webp", eyebrow: "CONTACTO PROFESIONAL", title: "Tu contacto, listo para guardar.", description: "Compartí tu presentación y hacé fácil que guarden tus datos después de cada encuentro.", benefit: "Tu información siempre actualizada", inquiry: "Hola BioNFC, quiero una tarjeta NFC para compartir mi contacto profesional." },
  { id: "barber", brand: "Barber Club", productName: "Llavero NFC", product: "/marketing/interactive/llavero-v3.webp", screen: "/marketing/interactive/screen-barber-v3.webp", eyebrow: "PÁGINA DE NEGOCIO", title: "Tu marca también sale con vos.", description: "Reservas, redes, ubicación y contacto reunidos en una experiencia con tu identidad.", benefit: "Ideal para compartir donde estés", inquiry: "Hola BioNFC, quiero un llavero NFC con una página para mi negocio." },
  { id: "cafe", brand: "Café Nube", productName: "Mostrador grande", product: "/marketing/interactive/grande-v3.webp", screen: "/marketing/interactive/screen-cafe-v3.webp", eyebrow: "MENÚ Y RESERVAS", title: "Tu menú, a un toque de distancia.", description: "Desde la mesa o el mostrador, tus clientes descubren el menú y encuentran cómo reservar.", benefit: "Siempre visible en tu local", inquiry: "Hola BioNFC, quiero un soporte NFC para compartir el menú de mi negocio." },
  { id: "beauty", brand: "Luna Studio", productName: "Mostrador chico", product: "/marketing/interactive/belleza-v3.webp", screen: "/marketing/interactive/screen-belleza-v3.webp", eyebrow: "TURNOS Y SERVICIOS", title: "Una nueva reserva empieza acá.", description: "Mostrá tus servicios, trabajos y canales de contacto con el estilo de tu estudio.", benefit: "Convertí una visita en un nuevo turno", inquiry: "Hola BioNFC, quiero un soporte NFC para mostrar los servicios de mi estudio." },
  { id: "shop", brand: "Casa Objeto", productName: "Tarjeta NFC", product: "/marketing/interactive/tienda-v3.webp", screen: "/marketing/interactive/screen-tienda-v3.webp", eyebrow: "TIENDA Y CATÁLOGO", title: "Tu colección, siempre a mano.", description: "Abrí tu tienda, catálogo o producto destacado sin pedirle al cliente que busque nada.", benefit: "Del producto físico a tu tienda online", inquiry: "Hola BioNFC, quiero una tarjeta NFC que lleve a mi tienda o catálogo." },
] as const;

export default function Destinations({ whatsappNumber }: { whatsappNumber: string }) {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<"settle" | "approach" | "open">("settle");
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const experience = EXPERIENCES[active];

  useEffect(() => {
    if (paused) {
      setPhase("open");
      return;
    }
    setPhase("settle");
    const approachTimer = window.setTimeout(() => setPhase("approach"), 750);
    const openTimer = window.setTimeout(() => setPhase("open"), 1950);
    const nextTimer = window.setTimeout(() => {
      setActive((current) => (current + 1) % EXPERIENCES.length);
      setCycle((current) => current + 1);
    }, 6500);
    return () => {
      window.clearTimeout(approachTimer);
      window.clearTimeout(openTimer);
      window.clearTimeout(nextTimer);
    };
  }, [active, cycle, paused]);

  const selectExperience = (index: number) => {
    setActive(index);
    setCycle((current) => current + 1);
  };
  const move = (direction: number) => {
    setActive((current) => (current + direction + EXPERIENCES.length) % EXPERIENCES.length);
    setCycle((current) => current + 1);
  };
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    pointerStart.current = event.clientX;
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) > 42) move(distance < 0 ? 1 : -1);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowRight" ? 1 : -1);
  };
  const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(experience.inquiry)}`;

  return (
    <section id="elegi-tu-uso" className="bx-experience" aria-labelledby="experience-title">
      <div className="bx-section">
        <div className="bx-experience-heading">
          <p className="bx-section-kicker">DEL OBJETO A TU MUNDO DIGITAL</p>
          <h2 className="bx-h2" id="experience-title">Mirá lo que pasa<br /><span>con un solo toque.</span></h2>
          <p>Elegí un ejemplo. El producto se conecta con el celular y abre la experiencia que vos quieras compartir.</p>
        </div>

        <div className="bx-experience-panel" id="experience-demo" role="tabpanel" aria-live="polite">
          <div className="bx-experience-copy">
            <div className={`bx-experience-status is-${phase}`}><i /><span>{phase === "open" ? "Experiencia abierta" : phase === "approach" ? "Acercando el celular" : "Producto seleccionado"}</span></div>
            <p className="bx-experience-eyebrow">{experience.eyebrow}</p>
            <h3>{experience.title}</h3>
            <p>{experience.description}</p>
            <span className="bx-experience-benefit"><FiCheck aria-hidden="true" />{experience.benefit}</span>
            <a href={waUrl} target="_blank" rel="noreferrer">Quiero algo así <FiArrowUpRight aria-hidden="true" /></a>
            <div className="bx-experience-controls">
              <button className="bx-experience-arrow" type="button" onClick={() => move(-1)} aria-label="Producto anterior"><FiArrowLeft /></button>
              <div aria-hidden="true">{EXPERIENCES.map((item, index) => <i key={item.id} className={active === index ? "is-active" : undefined} />)}</div>
              <button className="bx-experience-arrow" type="button" onClick={() => move(1)} aria-label="Producto siguiente"><FiArrowRight /></button>
              <button type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Reanudar demostración" : "Pausar demostración"}>{paused ? <FiPlay /> : <FiPause />}{paused ? "Reanudar" : "Pausar"}</button>
            </div>
          </div>

          <div className={`bx-experience-scene is-${phase}`} role="group" tabIndex={0} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; }} aria-label={`Carrusel: ${experience.productName} de ${experience.brand}. Deslizá o usá las flechas para cambiar.`}>
            <div className="bx-experience-halo" aria-hidden="true" />
            <div className="bx-product-carousel">
              {EXPERIENCES.map((item, index) => {
                const rawPosition = (index - active + EXPERIENCES.length) % EXPERIENCES.length;
                const position = rawPosition > EXPERIENCES.length / 2 ? rawPosition - EXPERIENCES.length : rawPosition;
                return <button type="button" key={item.id} data-position={position} aria-pressed={position === 0} aria-hidden={Math.abs(position) > 1} tabIndex={Math.abs(position) <= 1 ? 0 : -1} onClick={() => selectExperience(index)} aria-label={`${item.brand}, ${item.productName}`}>
                  <Image src={item.product} alt="" width={960} height={720} sizes="(max-width: 760px) 230px, 330px" />
                  <span><b>{item.brand}</b><small>{item.productName}</small></span>
                </button>;
              })}
            </div>
            <div className="bx-experience-signal" aria-hidden="true"><i /><i /><FiRadio /></div>
            <div className="bx-experience-phone">
              <div className="bx-experience-screen">
                <Image className="bx-screen-home" src="/marketing/interactive/screen-home-v3.webp" alt="" fill sizes="(max-width: 760px) 145px, 198px" />
                <Image className="bx-screen-result" src={experience.screen} alt={`Pantalla digital de ${experience.brand}`} fill sizes="(max-width: 760px) 145px, 198px" />
              </div>
              <span className="bx-experience-phone-notch" aria-hidden="true" />
            </div>
            <span className="bx-experience-scene-note">DESLIZÁ PARA EXPLORAR · QR + NFC</span>
          </div>
        </div>
        <p className="bx-experience-disclaimer">Ejemplos visuales con marcas ficticias. Adaptamos el producto y el destino a cada negocio.</p>
      </div>
    </section>
  );
}
