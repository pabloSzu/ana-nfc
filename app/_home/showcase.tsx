"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import { FiArrowLeft, FiArrowRight, FiArrowUpRight, FiCalendar, FiCoffee, FiGrid, FiMapPin, FiScissors } from "react-icons/fi";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { DESIGN_PRESETS_V2 } from "@/lib/design-presets";
import DirectLinkPreview from "./direct-link-preview";
import ContactPreview from "./contact-preview";

const LANDING_EXAMPLES = [
  { kind: "landing", id: "cafe", category: "Cafetería", name: "Café Nube", line: "Un buen café. Un lindo momento.", monogram: "nube", preset: "glass", style: "Glass + fotografía", image: "/marketing/showcase/coffee.jpg", detail: "Una foto que invita a entrar. Botones de vidrio que dejan ver tu esencia.", actions: ["Explorá nuestro menú", "Reservá tu mesa", "Cómo llegar"], icons: [FiCoffee, FiCalendar, FiMapPin] },
  { kind: "landing", id: "beauty", category: "Belleza", name: "Blueberry Nails", line: "Un pequeño ritual para vos.", monogram: "b.", preset: "pastel", style: "Pastel + logo", detail: "Tonos suaves, un logo protagonista y todos tus turnos a un toque.", actions: ["Agendá tu próximo turno", "Nuestros trabajos", "Hablemos por WhatsApp"], icons: [FiCalendar, FaInstagram, FaWhatsapp] },
  { kind: "landing", id: "barber", category: "Barbería", name: "BARBER CLUB", line: "Tu estilo. Nuestro oficio.", monogram: "BC", preset: "brutalism", style: "Brutalismo + carácter", detail: "Tipografía con presencia, contraste y botones con personalidad.", actions: ["Reservá tu corte", "Conocé el estudio", "Cómo llegar"], icons: [FiScissors, FaInstagram, FiMapPin] },
  { kind: "landing", id: "architecture", category: "Arquitectura", name: "ana estudio", line: "Espacios para habitar distinto.", monogram: "a /", preset: "elegant", style: "Elegante + fotografía", image: "/marketing/showcase/interior.jpg", detail: "Una composición editorial, tonos cálidos y espacio para mostrar lo que hacés.", actions: ["Nuestros proyectos", "Hablemos de tu idea", "Instagram"], icons: [FiGrid, FaWhatsapp, FaInstagram] },
] as const;

const CONTACT_EXAMPLES = [
  { kind: "contact", id: "essential", category: "Ejecutivo", name: "Ricardo Ferrer", role: "Fundador & Director", company: "Ferrer & Asociados", style: "Ejecutivo + retrato", detail: "Un perfil sobrio y cercano, con una imagen profesional y toda la información importante bien ordenada.", accent: "#24334f", backdrop: "#e9edf2", font: "modern", layout: "card", pattern: "original", photo: "/marketing/showcase/contact-executive.webp" },
  { kind: "contact", id: "editorial", category: "Editorial", name: "Ana Duarte", role: "Arquitecta", company: "Ana Duarte Estudio", style: "Editorial + retrato", detail: "Foto, tipografía con carácter y una presentación más personal.", accent: "#46372f", backdrop: "#e9e3dc", font: "domine", layout: "card", pattern: "original", photo: "/marketing/showcase/contact-editorial.webp" },
  { kind: "contact", id: "professional", category: "Profesional", name: "Marcos Vidal", role: "Consultor de negocios", company: "Vidal Consultoría", style: "Profesional + ficha", detail: "Información ordenada en formato de ficha, ideal para compartir en reuniones.", accent: "#163b49", backdrop: "#e8eff0", font: "manrope", layout: "document", pattern: "grid" },
] as const;

const DIRECT_LINK_EXAMPLES = [
  { kind: "direct", id: "reviews", category: "Reseñas de Google", name: "Café Jacarandá", style: "Reseñas + confianza", detail: "Llevá a tus clientes directo a calificarte y convertí una buena experiencia en reputación para tu negocio." },
  { kind: "direct", id: "instagram", category: "Instagram", name: "Línea Negra Tattoo", style: "Instagram + comunidad", detail: "Abrí tu perfil social con un toque para mostrar trabajos, novedades y todo lo que pasa en tu marca." },
  { kind: "direct", id: "website", category: "Sitio web", name: "Clara Méndez", style: "Web + portfolio", detail: "Conectá directamente con tu web, portfolio, tienda o cualquier página que ya tengas online." },
] as const;

type LandingExample = typeof LANDING_EXAMPLES[number];

function Preview({ example }: { example: LandingExample }) {
  const preset = DESIGN_PRESETS_V2.find((item) => item.id === example.preset)!;
  return (
    <div className="bx-sample" data-design={example.id} style={{ "--sample-bg": preset.background, "--sample-ink": preset.foreground, "--sample-radius": `${preset.buttonZone.radius / 4}cqw` } as CSSProperties}>
      <div className="bx-sample-screen">
        {"image" in example && <Image className="bx-sample-photo" src={example.image} alt="" fill sizes="(max-width: 600px) 280px, 340px" />}
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

export function StyleShowcase({ waUrl }: { waUrl: string }) {
  const [category, setCategory] = useState<"landing" | "contact" | "direct">("landing");
  const [active, setActive] = useState(0);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const examples = category === "landing" ? LANDING_EXAMPLES : category === "contact" ? CONTACT_EXAMPLES : DIRECT_LINK_EXAMPLES;
  const selected = examples[active];
  const changeCategory = (next: "landing" | "contact" | "direct") => { setCategory(next); setActive(0); };
  const move = (direction: number) => setActive((current) => (current + direction + examples.length) % examples.length);
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
  };
  return (
    <div className="bx-showcase">
      <div className="bx-showcase-copy">
        <p className="bx-showcase-kicker"><span /> UNA PRESENTACIÓN HECHA PARA VOS</p>
        <h2 className="bx-h2 bx-on-dark">{category === "landing" ? "¿Querés reunir todo en un lugar?" : category === "contact" ? "¿Querés presentarte mejor?" : "¿Querés llevarlos justo adonde importa?"}<br /><span className="bx-soft">{category === "landing" ? "Creamos tu página." : category === "contact" ? "Creamos tu tarjeta personal." : "Conectamos tu link directo."}</span></h2>
        <p className="bx-lead bx-on-dark-muted">{category === "landing" ? "Tu logo, tus fotos, tu estilo. Diseñamos una página que se sienta tan tuya como tu negocio." : category === "contact" ? "Tus datos, tu foto si querés y un diseño propio. Compartí tu presentación y hacé fácil que guarden tu contacto." : "Un toque puede abrir tus reseñas, tu Instagram, tu tienda o cualquier sitio que quieras compartir, sin pasos de más."}</p>
        <div className="bx-showcase-categories" role="group" aria-label="Tipo de diseño">
          <button type="button" aria-pressed={category === "landing"} onClick={() => changeCategory("landing")}>Landings</button>
          <button type="button" aria-pressed={category === "contact"} onClick={() => changeCategory("contact")}>Tarjetas personales</button>
          <button type="button" aria-pressed={category === "direct"} onClick={() => changeCategory("direct")}>Links directos</button>
        </div>
        <div className="bx-showcase-picker" data-count={examples.length} role="group" aria-label="Elegí un ejemplo de diseño">
          {examples.map((example, index) => <button type="button" key={example.id} aria-pressed={active === index} aria-controls="showcase-preview" onClick={() => setActive(index)}><span className={`bx-showcase-swatch is-${example.id}`} />{example.category}<FiArrowUpRight aria-hidden="true" /></button>)}
        </div>
        <p className="bx-showcase-hint">{category === "contact" ? "Son solo tres ejemplos. Tenemos muchísimos diseños más." : category === "landing" ? "Algunos estilos de muestra. Podemos crear muchísimos diseños más." : "Ejemplos visuales con marcas y datos ficticios."}</p>
        <a className="bx-btn bx-btn-white" href={waUrl} target="_blank" rel="noreferrer">Quiero algo así <FiArrowUpRight aria-hidden="true" /></a>
      </div>
      <div className="bx-showcase-gallery" id="showcase-preview" role="region" aria-label={`Vista de ejemplo: ${selected.name}`}>
        <div className="bx-showcase-orbit" aria-hidden="true" />
        <div className="bx-showcase-stage" data-count={examples.length} role="group" tabIndex={0} onKeyDown={handleKeyDown} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; }} aria-label="Deslizá o usá las flechas para ver otros ejemplos">
          {examples.map((example, index) => {
            const position = (index - active + examples.length) % examples.length;
            return <div key={example.id} className="bx-showcase-device" data-position={position} aria-hidden={true}>{example.kind === "landing" ? <Preview example={example} /> : example.kind === "contact" ? <ContactPreview example={example} /> : <DirectLinkPreview example={example} />}</div>;
          })}
          <span className="bx-showcase-tag">Tu marca.<br /><b>Tu universo.</b></span>
        </div>
        <div className="bx-showcase-caption" aria-live="polite" aria-atomic="true"><span>0{active + 1} / 0{examples.length} · {selected.style}</span><p>{selected.detail}</p></div>
        <div className="bx-showcase-controls"><button type="button" onClick={() => move(-1)} aria-label="Ejemplo anterior"><FiArrowLeft aria-hidden="true" /></button><span aria-hidden="true">{examples.map((example, index) => <i key={example.id} className={active === index ? "is-active" : undefined} />)}</span><button type="button" onClick={() => move(1)} aria-label="Ejemplo siguiente"><FiArrowRight aria-hidden="true" /></button></div>
      </div>
      <div className="bx-showcase-possibilities"><span className="bx-showcase-infinity" aria-hidden="true">∞</span><div><h3>Y hay muchísimos diseños más.</h3><p>Creamos una propuesta para tu marca, o conectamos directamente con el destino que más le sirva a tu negocio.</p></div><span className="bx-showcase-signature">Hecha para vos.<br /><b>Lista para compartir.</b></span></div>
    </div>
  );
}
