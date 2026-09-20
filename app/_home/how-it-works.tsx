"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";
import "./how-it-works.css";

const STEPS = [
  { number: "1", title: "Elegís el formato",
    description: "Tarjeta, llavero o mostrador: elegís el formato NFC que mejor se adapta a tu negocio.",
    image: "/marketing/how-it-works/01-formatos.webp",
    alt: "Tarjeta, llavero y soporte NFC de mostrador personalizados con TU MARCA" },
  { number: "2", title: "Acercás el celular",
    description: "Tu cliente acerca su celular al NFC y recibe el acceso al instante.",
    image: "/marketing/how-it-works/02-acercar.webp",
    alt: "Un celular junto a una tarjeta TU MARCA muestra el aviso de etiqueta NFC detectada" },
  { number: "3", title: "Se abre tu página",
    description: "Aparece tu landing o botonera con WhatsApp, turnos, servicios, ubicación y redes.",
    image: "/marketing/how-it-works/03-pagina.webp",
    alt: "Página personalizada TU MARCA con accesos a WhatsApp, turnos, servicios, ubicación e Instagram" },
  { number: "4", title: "La conexión sucede",
    description: "Tus clientes te escriben, reservan, llegan a tu negocio o siguen tus redes.",
    image: "/marketing/how-it-works/04-conexion.webp",
    alt: "Ejemplos de una consulta por WhatsApp, un turno reservado, indicaciones y un nuevo seguidor" },
];

export default function HowItWorks() {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!listRef.current || !window.IntersectionObserver || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(listRef.current.children) as HTMLElement[];
    // Progressive enhancement: server HTML remains visible without JavaScript.
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "visible";
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    for (const card of cards) {
      card.dataset.reveal = "pending";
      observer.observe(card);
    }
    return () => {
      observer.disconnect();
      for (const card of cards) delete card.dataset.reveal;
    };
  }, []);

  return (
    <section id="como-funciona" className="bx-process" aria-labelledby="how-title">
      <div className="bx-process-container">
        <header className="bx-process-heading">
          <p className="bx-process-eyebrow">TECNOLOGÍA QUE CONECTA</p>
          <h2 id="how-title">Así funciona <span>BIONFC</span></h2>
          <p className="bx-process-subtitle">Elegí el formato, acercá el celular y compartí tu negocio en segundos.</p>
        </header>
        <ol className="bx-process-steps" ref={listRef}>
          {STEPS.map((step, index) => (
            <li className="bx-process-step" key={step.number} style={{ "--step-index": index } as CSSProperties}>
              <article className="bx-process-card" aria-labelledby={`how-step-${step.number}`}>
                <div className="bx-process-image">
                  <Image src={step.image} alt={step.alt} fill sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1099px) calc((100vw - 96px) / 2), (max-width: 1439px) calc((100vw - 160px) / 4), 312px" />
                  <span className="bx-process-number" aria-hidden="true">{step.number}</span>
                </div>
                <div className="bx-process-copy">
                  <span className="bx-process-step-label">PASO {step.number} DE 4</span>
                  <h3 id={`how-step-${step.number}`}>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
              {index < STEPS.length - 1 && <span className="bx-process-arrow" aria-hidden="true"><FiArrowRight /></span>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
