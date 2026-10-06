import Image from "next/image";
import { FiArrowUpRight, FiCheck, FiMessageCircle } from "react-icons/fi";
import "./how-it-works.css";

const STEPS = [
  {
    number: "01",
    title: "Contanos qué querés lograr",
    description: "No necesitás saber qué formato elegir. Te escuchamos y te asesoramos según tu negocio.",
  },
  {
    number: "02",
    title: "Elegimos qué se va a abrir",
    description: "Una landing hecha por nosotros, una tarjeta personal, un enlace que ya tengas o una experiencia a medida.",
    options: ["Landing", "Tarjeta personal", "Tu enlace", "A medida"],
  },
  {
    number: "03",
    title: "Lo llevamos al producto ideal",
    description: "Personalizamos una tarjeta, un llavero, un mostrador u otro objeto con NFC, QR o ambos.",
    options: ["NFC", "QR", "O ambos"],
  },
  {
    number: "04",
    title: "Lo recibís listo para usar",
    description: "Lo colocás en tu negocio o lo llevás con vos. Tus clientes acercan, escanean y encuentran todo al instante.",
  },
] as const;

export default function HowItWorks({ whatsappNumber }: { whatsappNumber: string }) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola BioNFC, tengo una idea y quiero saber qué solución me conviene.")}`;

  return (
    <section id="como-funciona" className="bx-journey" aria-labelledby="how-title">
      <div className="bx-journey-container">
        <div className="bx-journey-intro">
          <p className="bx-journey-eyebrow">DE TU IDEA AL PRIMER TOQUE</p>
          <h2 id="how-title">Lo pensamos con vos.<br /><span>Te lo entregamos listo.</span></h2>
          <p className="bx-journey-lead">Podés venir con un enlace, elegir una página o simplemente contarnos tu idea. Nosotros te ayudamos a convertirla en una experiencia lista para compartir.</p>

          <figure className="bx-journey-visual">
            <div className="bx-journey-image">
              <Image src="/marketing/how-it-works/qr-nfc-unified-v1.webp" alt="Un código QR y un llavero NFC conectan con la misma experiencia en un celular" width={1280} height={853} sizes="(max-width: 760px) 88vw, 430px" />
            </div>
            <figcaption><b>Un producto. Tu identidad.</b><span>NFC, QR o ambos, según lo que necesites.</span></figcaption>
          </figure>
        </div>

        <div className="bx-journey-flow">
          <ol>
            {STEPS.map((step) => (
              <li key={step.number}>
                <span className="bx-journey-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {"options" in step && <ul>{step.options.map((option) => <li key={option}>{option}</li>)}</ul>}
                </div>
              </li>
            ))}
          </ol>

          <div className="bx-journey-support">
            <span><FiMessageCircle aria-hidden="true" /></span>
            <div><b>Te acompañamos en todo.</b><p>Antes, durante y después de elegir tu BioNFC.</p></div>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">Contanos tu idea <FiArrowUpRight aria-hidden="true" /></a>
          </div>
          <p className="bx-journey-ready"><FiCheck aria-hidden="true" />Configurado y listo para empezar a compartir.</p>
        </div>
      </div>
    </section>
  );
}
