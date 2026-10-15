"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCalendar, FiCoffee, FiGrid, FiMapPin, FiScissors } from "react-icons/fi";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { DESIGN_PRESETS_V2 } from "@/lib/design-presets";
import DirectLinkPreview from "./direct-link-preview";
import ContactPreview from "./contact-preview";
import coffeeImage from "../../public/marketing/showcase/coffee.jpg";
import interiorImage from "../../public/marketing/showcase/interior.jpg";
import contactExecutiveImage from "../../public/marketing/showcase/contact-executive.webp";
import contactEditorialImage from "../../public/marketing/showcase/contact-editorial.webp";

const LANDING_EXAMPLES = [
  { kind: "landing", id: "cafe", category: "Cafetería", name: "Café Nube", line: "Un buen café. Un lindo momento.", monogram: "nube", preset: "glass", style: "Glass + fotografía", image: coffeeImage, detail: "Una foto que invita a entrar. Botones de vidrio que dejan ver tu esencia.", actions: ["Explorá nuestro menú", "Reservá tu mesa", "Cómo llegar"], icons: [FiCoffee, FiCalendar, FiMapPin] },
  { kind: "landing", id: "beauty", category: "Belleza", name: "Blueberry Nails", line: "Un pequeño ritual para vos.", monogram: "b.", preset: "pastel", style: "Pastel + logo", detail: "Tonos suaves, un logo protagonista y todos tus turnos a un toque.", actions: ["Agendá tu próximo turno", "Nuestros trabajos", "Hablemos por WhatsApp"], icons: [FiCalendar, FaInstagram, FaWhatsapp] },
  { kind: "landing", id: "barber", category: "Barbería", name: "BARBER CLUB", line: "Tu estilo. Nuestro oficio.", monogram: "BC", preset: "brutalism", style: "Brutalismo + carácter", detail: "Tipografía con presencia, contraste y botones con personalidad.", actions: ["Reservá tu corte", "Conocé el estudio", "Cómo llegar"], icons: [FiScissors, FaInstagram, FiMapPin] },
  { kind: "landing", id: "architecture", category: "Arquitectura", name: "ana estudio", line: "Espacios para habitar distinto.", monogram: "a /", preset: "elegant", style: "Elegante + fotografía", image: interiorImage, detail: "Una composición editorial, tonos cálidos y espacio para mostrar lo que hacés.", actions: ["Nuestros proyectos", "Hablemos de tu idea", "Instagram"], icons: [FiGrid, FaWhatsapp, FaInstagram] },
] as const;

const CONTACT_EXAMPLES = [
  { kind: "contact", id: "essential", category: "Ejecutivo", name: "Ricardo Ferrer", role: "Fundador & Director", company: "Ferrer & Asociados", style: "Ejecutivo + retrato", detail: "Un perfil sobrio y cercano, con una imagen profesional y toda la información importante bien ordenada.", accent: "#24334f", backdrop: "#e9edf2", font: "modern", layout: "card", pattern: "original", photo: contactExecutiveImage },
  { kind: "contact", id: "editorial", category: "Editorial", name: "Ana Duarte", role: "Arquitecta", company: "Ana Duarte Estudio", style: "Editorial + retrato", detail: "Foto, tipografía con carácter y una presentación más personal.", accent: "#46372f", backdrop: "#e9e3dc", font: "domine", layout: "card", pattern: "original", photo: contactEditorialImage },
  { kind: "contact", id: "professional", category: "Profesional", name: "Marcos Vidal", role: "Consultor de negocios", company: "Vidal Consultoría", style: "Profesional + ficha", detail: "Información ordenada en formato de ficha, ideal para compartir en reuniones.", accent: "#163b49", backdrop: "#e8eff0", font: "manrope", layout: "document", pattern: "grid" },
] as const;

const DIRECT_LINK_EXAMPLES = [
  { kind: "direct", id: "reviews", category: "Reseñas de Google", name: "Café Jacarandá", style: "Reseñas + confianza", detail: "Llevá a tus clientes directo a calificarte y convertí una buena experiencia en reputación para tu negocio." },
  { kind: "direct", id: "instagram", category: "Instagram", name: "Línea Negra Tattoo", style: "Instagram + comunidad", detail: "Abrí tu perfil social con un toque para mostrar trabajos, novedades y todo lo que pasa en tu marca." },
  { kind: "direct", id: "whatsapp", category: "WhatsApp directo", name: "Fuego Burger", style: "WhatsApp + reservas", detail: "Abrí una conversación con un mensaje ya escrito para que reservar una mesa sea rápido y simple." },
] as const;

type LandingExample = typeof LANDING_EXAMPLES[number];

function Preview({ example, eager = false }: { example: LandingExample; eager?: boolean }) {
  const preset = DESIGN_PRESETS_V2.find((item) => item.id === example.preset)!;
  return (
    <div className="bx-sample" data-design={example.id} style={{ "--sample-bg": preset.background, "--sample-ink": preset.foreground, "--sample-radius": `${preset.buttonZone.radius / 4}cqw` } as CSSProperties}>
      <div className="bx-sample-screen">
        {"image" in example && <Image className="bx-sample-photo" src={example.image} alt="" fill sizes="(max-width: 600px) 280px, 340px" loading={eager ? "eager" : "lazy"} placeholder="blur" />}
        <div className="bx-sample-shade" />
        <div className="bx-sample-status" aria-hidden="true"><span>9:41</span><span>••• ▰</span></div>
        <div className="bx-sample-content">
          <div className="bx-sample-logo" aria-hidden="true">{example.monogram}</div>
          <span className="bx-sample-eyebrow">{example.category === "Cafetería" ? "CAFÉ DE ESPECIALIDAD" : example.category === "Belleza" ? "NAIL ART & SELF CARE" : example.category === "Barbería" ? "EST. 2020 · BUENOS AIRES" : "ARQUITECTURA & INTERIORES"}</span>
          <h3>{example.name}</h3>
          <p>{example.line}</p>
          <div className="bx-sample-actions">
            {example.actions.map((label, index) => { const Icon = example.icons[index]; return <div className="bx-sample-link" key={label}><Icon aria-hidden="true" /><span>{label}</span><FiArrowUpRight aria-hidden="true" /></div>; })}
          </div>
          <div className="bx-sample-social" aria-hidden="true"><FaInstagram /><FaWhatsapp /></div>
        </div>
        <div className="bx-sample-footer">HECHO CON <b>BIONFC</b></div>
      </div>
    </div>
  );
}

type Kind = "landing" | "contact" | "direct";

const SLIDES = [...LANDING_EXAMPLES, ...CONTACT_EXAMPLES, ...DIRECT_LINK_EXAMPLES];

const GROUPS: { kind: Kind; label: string; note: string }[] = [
  { kind: "landing", label: "Landings", note: "Para tu negocio" },
  { kind: "contact", label: "Tarjetas personales", note: "Para vos o tu equipo" },
  { kind: "direct", label: "Links directos", note: "Reseñas, Instagram o WhatsApp" },
];

const TAG: Record<Kind, string> = { landing: "Página BIONFC", contact: "Tarjeta BIONFC", direct: "Link directo" };

// Una sola serie real con cuatro clones a cada lado alcanza para cubrir los celulares visibles y
// mantener el loop infinito. Antes se dibujaban tres series completas (30 teléfonos); ahora son 18.
const CLONE_BUFFER = 4;
const TOTAL = SLIDES.length;
const MAIN_START = CLONE_BUFFER;
const LOOPED = Array.from({ length: TOTAL + CLONE_BUFFER * 2 }, (_, index) => {
  const slideIndex = (index - CLONE_BUFFER + TOTAL) % TOTAL;
  return { example: SLIDES[slideIndex], slideIndex };
});

function offsetFor(track: HTMLDivElement, index: number) {
  const slide = track.children[index] as HTMLElement | undefined;
  return slide ? slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2 : track.scrollLeft;
}

// Carrusel a todo el ancho con todos los ejemplos juntos: landings, tarjetas personales y links
// directos. Es un scroll horizontal nativo con imán (scroll-snap), así que en el celular se desliza
// con el dedo como cualquier galería; en la computadora se usan las flechas, los botones de
// arriba o se toca el celular que se quiere ver. Avanza solo cada 3 segundos mientras está en
// pantalla, se pausa con el mouse sobre el celular del centro y, si la persona lo toca, se
// detiene y vuelve a avanzar solo a los 8 segundos.
export function StyleShowcase({ waUrl }: { waUrl: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Destino del desplazamiento en curso. Con clics rápidos en las flechas, el siguiente paso se
  // cuenta desde acá y no desde el celular que pasa por el centro a mitad de la animación.
  const targetRef = useRef<number | null>(null);
  const [active, setActive] = useState(MAIN_START + 1);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const currentSlideIndex = LOOPED[active]?.slideIndex ?? 1;
  const current = SLIDES[currentSlideIndex];
  const activeKind = current.kind as Kind;

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    index = Math.min(LOOPED.length - 1, Math.max(0, index));
    targetRef.current = index;
    track.scrollTo({ left: offsetFor(track, index), behavior: "smooth" });
  }, []);
  const userGoTo = (index: number) => { setAutoplay(false); goTo(index); };
  const step = (direction: number) => userGoTo((targetRef.current ?? active) + direction);
  // Lleva al primer diseño de un grupo, eligiendo la copia más cercana para no recorrer de más.
  const goToGroup = (kind: Kind) => {
    const first = SLIDES.findIndex((slide) => slide.kind === kind);
    const candidates = [MAIN_START + first];
    if (first < CLONE_BUFFER) candidates.push(MAIN_START + TOTAL + first);
    if (first >= TOTAL - CLONE_BUFFER) candidates.push(first - (TOTAL - CLONE_BUFFER));
    userGoTo(candidates.reduce((best, index) => Math.abs(index - active) < Math.abs(best - active) ? index : best));
  };

  // "ver ejemplos" en los precios lleva a #ejemplos: además de bajar hasta las pestañas, el
  // carrusel salta a las landings (lo que se compra "con página BIONFC").
  const goToGroupRef = useRef(goToGroup);
  goToGroupRef.current = goToGroup;
  useEffect(() => {
    const onHash = () => { if (window.location.hash === "#ejemplos") goToGroupRef.current("landing"); };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    let settle = 0;
    const nearestIndex = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let distance = Infinity;
      Array.from(track.children).forEach((child, index) => {
        const slide = child as HTMLElement;
        const gap = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
        if (gap < distance) { distance = gap; nearest = index; }
      });
      return nearest;
    };
    const recenter = () => {
      targetRef.current = null;
      const index = nearestIndex();
      if (index >= MAIN_START && index < MAIN_START + TOTAL) return;
      const target = MAIN_START + LOOPED[index].slideIndex;
      // Sin transiciones durante el salto: si no, el celular de destino se vería crecer.
      track.classList.add("is-jumping");
      track.scrollLeft += offsetFor(track, target) - offsetFor(track, index);
      setActive(target);
      requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove("is-jumping")));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; setActive(nearestIndex()); });
      window.clearTimeout(settle);
      settle = window.setTimeout(recenter, 160);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    track.scrollLeft = offsetFor(track, MAIN_START + 1);
    track.classList.add("is-ready");
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer?.observe(track);
    return () => { track.removeEventListener("scroll", onScroll); observer?.disconnect(); if (frame) cancelAnimationFrame(frame); window.clearTimeout(settle); };
  }, []);

  // Ritmo fijo de 3 segundos. Va con un intervalo y no con un temporizador atado a "active": ese
  // cambia también con el reacomodo invisible del bucle infinito, y reiniciaba la cuenta (el
  // carrusel quedaba lento e irregular, entre 4 y 6 segundos por diseño).
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    if (!autoplay || !inView || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => goTo((targetRef.current ?? activeRef.current) + 1), 3000);
    return () => window.clearInterval(timer);
  }, [autoplay, inView, paused, goTo]);

  // Al tocar el carrusel el autoplay se detiene para no sacarte lo que estás mirando, pero vuelve
  // solo después de 8 segundos sin interacción.
  useEffect(() => {
    if (autoplay || paused) return;
    const timer = window.setTimeout(() => setAutoplay(true), 8000);
    return () => window.clearTimeout(timer);
  }, [autoplay, paused, active]);

  return (
    <div className="bx-gallery">
      <div className="bx-gallery-head">
        <p className="bx-showcase-kicker"><span /> LO QUE SE ABRE AL ACERCAR EL CELULAR</p>
        <h2 className="bx-h2 bx-on-dark">Páginas NFC hermosas,<br /><span className="bx-soft">hechas a tu medida.</span></h2>
        <p className="bx-lead bx-on-dark-muted">Una landing para tu negocio, una tarjeta personal o un link directo a tus reseñas, tu Instagram o un WhatsApp con mensaje predefinido. Son solo algunos ejemplos: el tuyo lo diseñamos desde cero.</p>
      </div>
      <div id="ejemplos" className="bx-gallery-groups" role="group" aria-label="Tipos de diseño">
        {GROUPS.map((group) => <button key={group.kind} type="button" aria-pressed={activeKind === group.kind} onClick={() => goToGroup(group.kind)}>
          <strong>{group.label}</strong><small>{group.note}</small>
        </button>)}
      </div>
      <div className="bx-gallery-stage" onPointerMove={(event) => { if (event.pointerType === "mouse") setPaused(Boolean((event.target as HTMLElement).closest(".bx-gallery-slide.is-active"))); }} onPointerLeave={() => setPaused(false)}>
        <div className="bx-gallery-track" ref={trackRef} onPointerDown={() => setAutoplay(false)} onWheel={() => setAutoplay(false)} aria-label="Ejemplos de diseños" role="region" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); step(event.key === "ArrowRight" ? 1 : -1); } }}>
          {LOOPED.map(({ example, slideIndex }, index) => {
            const kind = example.kind as Kind;
            const directDistance = Math.abs(slideIndex - currentSlideIndex);
            // Estas son las tarjetas que ya se ven, aunque sea parcialmente, en el primer cuadro.
            // Marcarlas desde el HTML evita que el navegador espere a hidratar para pedir sus fotos.
            const eager = Math.min(directDistance, TOTAL - directDistance) <= 3;
            return <figure key={`${index}-${kind}-${example.id}`} className={`bx-gallery-slide is-${kind}${index === active ? " is-active" : ""}`} onClick={() => { if (index !== active) userGoTo(index); }} aria-hidden={index !== active}>
              <span className={`bx-gallery-tag is-${kind}`}>{TAG[kind]}</span>
              <div className="bx-gallery-phone">{example.kind === "landing" ? <Preview example={example} eager={eager} /> : example.kind === "contact" ? <ContactPreview example={example} eager={eager} /> : <DirectLinkPreview example={example} eager={eager} />}</div>
              <figcaption>{example.category}</figcaption>
            </figure>;
          })}
        </div>
        <button type="button" className="bx-gallery-side is-prev" onClick={() => step(-1)} aria-label="Diseño anterior"><FiArrowLeft aria-hidden="true" /></button>
        <button type="button" className="bx-gallery-side is-next" onClick={() => step(1)} aria-label="Diseño siguiente"><FiArrowRight aria-hidden="true" /></button>
      </div>
      <div className="bx-gallery-controls">
        <button type="button" className="bx-gallery-arrow" onClick={() => step(-1)} aria-hidden="true" tabIndex={-1}><FiArrowLeft aria-hidden="true" /></button>
        <span aria-hidden="true">{SLIDES.map((slide, index) => <i key={`${slide.kind}-${slide.id}`} className={index === currentSlideIndex ? "is-active" : undefined} />)}</span>
        <button type="button" className="bx-gallery-arrow" onClick={() => step(1)} aria-hidden="true" tabIndex={-1}><FiArrowRight aria-hidden="true" /></button>
      </div>
      <a className="bx-btn bx-btn-white" href={waUrl} target="_blank" rel="noreferrer">Quiero mi diseño <FiArrowUpRight aria-hidden="true" /></a>
    </div>
  );
}
