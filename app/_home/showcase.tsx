"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { FiArrowUpRight, FiCalendar, FiCoffee, FiGrid, FiMapPin, FiScissors } from "react-icons/fi";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { DESIGN_PRESETS_V2 } from "@/lib/design-presets";

const EXAMPLES = [
  { id: "cafe", category: "Cafetería", name: "Café Nube", line: "Un buen café. Un lindo momento.", monogram: "nube", preset: "glass", style: "Glass + fotografía", image: "/marketing/showcase/coffee.jpg", detail: "Una foto que invita a entrar. Botones de vidrio que dejan ver tu esencia.", actions: ["Explorá nuestro menú", "Reservá tu mesa", "Cómo llegar"], icons: [FiCoffee, FiCalendar, FiMapPin] },
  { id: "beauty", category: "Belleza", name: "Blueberry Nails", line: "Un pequeño ritual para vos.", monogram: "b.", preset: "pastel", style: "Pastel + logo", detail: "Tonos suaves, un logo protagonista y todos tus turnos a un toque.", actions: ["Agendá tu próximo turno", "Nuestros trabajos", "Hablemos por WhatsApp"], icons: [FiCalendar, FaInstagram, FaWhatsapp] },
  { id: "barber", category: "Barbería", name: "BARBER CLUB", line: "Tu estilo. Nuestro oficio.", monogram: "BC", preset: "brutalism", style: "Brutalismo + carácter", detail: "Tipografía con presencia, contraste y botones con personalidad.", actions: ["Reservá tu corte", "Conocé el estudio", "Cómo llegar"], icons: [FiScissors, FaInstagram, FiMapPin] },
  { id: "architecture", category: "Arquitectura", name: "ana estudio", line: "Espacios para habitar distinto.", monogram: "a /", preset: "elegant", style: "Elegante + fotografía", image: "/marketing/showcase/interior.jpg", detail: "Una composición editorial, tonos cálidos y espacio para mostrar lo que hacés.", actions: ["Nuestros proyectos", "Hablemos de tu idea", "Instagram"], icons: [FiGrid, FaWhatsapp, FaInstagram] },
] as const;

function Preview({ example }: { example: typeof EXAMPLES[number] }) {
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
  const [active, setActive] = useState(0);
  const selected = EXAMPLES[active];
  return (
    <div className="bx-showcase">
      <div className="bx-showcase-copy">
        <p className="bx-showcase-kicker"><span /> TU IDENTIDAD, EN UNA PÁGINA</p>
        <h2 className="bx-h2 bx-on-dark">No comprás solo un NFC.<br /><span className="bx-soft">Te llevás tu página lista para compartir.</span></h2>
        <p className="bx-lead bx-on-dark-muted">Tu logo, tus fotos, tu estilo. Diseñamos una página que se sienta tan tuya como tu negocio.</p>
        <div className="bx-showcase-picker" role="group" aria-label="Elegí un ejemplo de diseño">
          {EXAMPLES.map((example, index) => <button type="button" key={example.id} aria-pressed={active === index} aria-controls="showcase-preview" onClick={() => setActive(index)}><span className={`bx-showcase-swatch is-${example.id}`} />{example.category}<FiArrowUpRight aria-hidden="true" /></button>)}
        </div>
        <p className="bx-showcase-hint">Elegí un ejemplo y descubrí su estilo.</p>
        <a className="bx-btn bx-btn-white" href={waUrl} target="_blank" rel="noreferrer">Quiero mi página así <FiArrowUpRight aria-hidden="true" /></a>
      </div>
      <div className="bx-showcase-gallery" id="showcase-preview" role="region" aria-label={`Vista de ejemplo: ${selected.name}`}>
        <div className="bx-showcase-orbit" aria-hidden="true" />
        <div className="bx-showcase-stage">
          {EXAMPLES.map((example, index) => {
            const position = (index - active + EXAMPLES.length) % EXAMPLES.length;
            return <div key={example.id} className="bx-showcase-device" data-position={position} aria-hidden={position !== 0}><Preview example={example} /></div>;
          })}
          <span className="bx-showcase-tag">Tu marca.<br /><b>Tu universo.</b></span>
        </div>
        <div className="bx-showcase-caption" aria-live="polite" aria-atomic="true"><span>0{active + 1} / 04 · {selected.style}</span><p>{selected.detail}</p></div>
      </div>
      <div className="bx-showcase-possibilities"><span className="bx-showcase-infinity" aria-hidden="true">∞</span><div><h3>Estos son solo algunos ejemplos.</h3><p>Tenemos muchísimos estilos más para adaptar tu página a tu gusto y a la identidad de tu negocio.</p></div><span className="bx-showcase-signature">Hecha para vos.<br /><b>Lista para compartir.</b></span></div>
    </div>
  );
}
