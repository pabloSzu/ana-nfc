import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";
import { FiAlertTriangle, FiArrowRight, FiEdit3, FiHeart, FiMapPin, FiMessageCircle, FiPrinter, FiRadio, FiShare2, FiShield } from "react-icons/fi";
import Logo from "@/app/_home/logo";
import { body, display } from "@/app/_home/fonts";
import PetProductVisual, { PET_TAGS } from "@/components/pet-product-visual";
import "@/app/marketing.css";
import "@/components/pet-product-visual.css";
import "./mascotas.css";

const WHATSAPP_NUMBER = "5493517873628";
const WA = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola BioNFC, quiero una chapita inteligente para mi mascota.")}`;

export const metadata: Metadata = {
  title: "Chapitas inteligentes para mascotas | BioNFC",
  description: "Chapitas personalizadas con NFC y QR. Si tu mascota se pierde, quien la encuentra ve su ficha y te avisa por WhatsApp al instante.",
  alternates: { canonical: "/mascotas" },
  openGraph: { title: "Chapita inteligente BioNFC para mascotas", description: "NFC + QR, ficha editable y aviso por WhatsApp a su familia.", type: "website", locale: "es_AR", siteName: "BioNFC", url: "/mascotas" },
};

const FAQS = [
  ["¿Necesita una aplicación?", "No. Se escanea el QR con la cámara del celular. En los celulares con NFC, también alcanza con acercarlo a la chapita."],
  ["¿Qué datos quedan públicos?", "Solo los que vos cargues en la ficha. Podés mostrar únicamente el nombre y tu WhatsApp, o sumar datos de salud y de carácter que ayuden a cuidarla."],
  ["¿Puedo cambiar los datos después?", "Sí, cuando quieras y desde tu celular, en Mis chapitas. La chapita sigue siendo la misma: no hay que reemplazarla."],
  ["¿Qué pasa si se pierde?", "Desde Mis chapitas activás el aviso de perdida con un toque: su ficha muestra un cartel rojo con la zona, la compartís en tus redes y podés imprimir un cartel con su foto."],
  ["¿La ubicación se comparte sola?", "No. Quien la encuentra decide si te manda dónde está, con el botón de la ficha."],
  ["¿Cuánto tarda en llegar?", "Te contamos el plazo y el precio por WhatsApp antes de confirmar. Cuando llega, la activás en dos minutos con el código de su tarjeta."],
];

export default function MascotasPage() {
  return <main className={`bx pet-sale ${display.variable} ${body.variable}`}>
    <nav className="ps-nav" aria-label="Chapitas para mascotas">
      <Link href="/" className="bx-brand" aria-label="BioNFC, volver al inicio"><Logo /></Link>
      <div className="ps-nav-links"><a href="#como-funciona">Cómo funciona</a><a href="#ficha">La ficha</a><a href="#disenos">Diseños</a><a href="#preguntas">Preguntas</a></div>
      <a className="bx-btn bx-btn-nav" href={WA} target="_blank" rel="noreferrer">Quiero una</a>
    </nav>

    <header className="ps-hero">
      <div className="bx-section ps-hero-grid">
        <div className="ps-hero-copy">
          <span className="bx-pill">🐾 CHAPITAS INTELIGENTES BIONFC</span>
          <h1 className="bx-h1">Si se pierde,<br /><span className="bx-grad">te avisan al toque.</span></h1>
          <p className="ps-lead">Una chapita con su nombre, NFC y QR. Quien la encuentra acerca el celular, ve su ficha y te escribe por WhatsApp. Sin apps, sin vueltas.</p>
          <div className="ps-actions">
            <a className="bx-btn bx-btn-hero" href={WA} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Quiero una para mi mascota</a>
            <a className="bx-btn bx-btn-outline" href="#como-funciona">Ver cómo funciona</a>
          </div>
          <ul className="ps-assure"><li><FiRadio aria-hidden="true" />NFC + QR</li><li><FiEdit3 aria-hidden="true" />Ficha editable</li><li><FiShield aria-hidden="true" />Vos elegís qué mostrar</li></ul>
        </div>
        <PetProductVisual priority />
      </div>
    </header>

    <section id="como-funciona" className="bx-section ps-how" aria-labelledby="ps-how-title">
      <div className="ps-head">
        <p className="bx-section-kicker">CUANDO ALGUIEN LA ENCUENTRA</p>
        <h2 id="ps-how-title" className="bx-h2">Tres pasos.<br /><span className="bx-grad">Ninguno es instalar algo.</span></h2>
      </div>
      <ol className="ps-steps">
        <li><span className="ps-step-n">1</span><FiRadio aria-hidden="true" /><h3>Acerca el celular o escanea el QR</h3><p>El NFC abre su ficha con un toque. Si el celular no tiene NFC, la cámara lee el QR de atrás.</p></li>
        <li><span className="ps-step-n">2</span><FiHeart aria-hidden="true" /><h3>Ve quién es y a quién avisar</h3><p>Su foto, su nombre y lo que necesita saber para cuidarla mientras tanto.</p></li>
        <li><span className="ps-step-n">3</span><FaWhatsapp aria-hidden="true" /><h3>Te escribe al instante</h3><p>Por WhatsApp o llamada, y si quiere, te manda dónde está con un botón.</p></li>
      </ol>
    </section>

    {/* Un solo celular (el mismo del hero) y un selector: se lee grande en cualquier pantalla. Sin
        JavaScript: dos radios hermanos y CSS (~) eligen qué pantalla y qué lista se ven. */}
    <section id="ficha" className="ps-ficha" aria-labelledby="ps-ficha-title">
      <div className="bx-section ps-ficha-grid">
        <input type="radio" name="ps-mode" id="ps-mode-day" className="ps-mode-input" aria-label="Ver la ficha del día a día" defaultChecked />
        <input type="radio" name="ps-mode" id="ps-mode-lost" className="ps-mode-input" aria-label="Ver la ficha si se pierde" />
        <div className="ps-head is-dark">
          <p className="bx-section-kicker">SU FICHA</p>
          <h2 id="ps-ficha-title" className="bx-h2">La misma página,<br /><span>para todos los días y para cuando más te necesita.</span></h2>
          <p>Así se ve en el celular de quien la encuentra. Si se pierde, activás el aviso con un toque y su ficha cambia.</p>
        </div>
        <div className="ps-switch" aria-hidden="true">
          <label htmlFor="ps-mode-day"><FiHeart />Día a día</label>
          <label htmlFor="ps-mode-lost"><FiAlertTriangle />Si se pierde</label>
        </div>
        <div className="ps-device-wrap">
          <span className="ps-device-glow" />
          <div className="ps-device">
            <div className="ps-device-screen">
              <Image className="is-day" src="/marketing/pets/ficha-luna.webp" alt="Ficha de Luna: su foto, botones para avisar a Sofi y a Martín por WhatsApp y mandar dónde está" width={780} height={1688} sizes="(max-width: 560px) 78vw, 340px" />
              <Image className="is-lost" src="/marketing/pets/ficha-luna-perdida.webp" alt="Ficha de Luna en modo perdida: cartel rojo con la zona donde se perdió y la recompensa" width={780} height={1688} sizes="(max-width: 560px) 78vw, 340px" />
            </div>
            <span className="ps-device-island" />
          </div>
        </div>
        <ul className="ps-mode-list is-day">
          <li><FiMessageCircle aria-hidden="true" /><span><b>WhatsApp y llamada</b>a cada persona de su familia</span></li>
          <li><FiMapPin aria-hidden="true" /><span><b>Mandar dónde está</b>con un botón, si quien la encuentra quiere</span></li>
          <li><FiHeart aria-hidden="true" /><span><b>Salud y carácter</b>para cuidarla mientras tanto</span></li>
        </ul>
        <ul className="ps-mode-list is-lost">
          <li><FiAlertTriangle aria-hidden="true" /><span><b>Cartel rojo arriba de todo</b>con la zona y la recompensa</span></li>
          <li><FiShare2 aria-hidden="true" /><span><b>Lista para compartir</b>en historias y grupos, con un toque</span></li>
          <li><FiPrinter aria-hidden="true" /><span><b>Cartel para imprimir</b>con su foto</span></li>
        </ul>
      </div>
    </section>

    <section id="disenos" className="bx-section ps-designs" aria-labelledby="ps-designs-title">
      <div className="ps-head">
        <p className="bx-section-kicker">HECHA PARA ELLA</p>
        <h2 id="ps-designs-title" className="bx-h2">Con su nombre<br /><span className="bx-grad">y su cara.</span></h2>
        <p>Elegí entre más de 40 animalitos y el color que quieras. Adelante, su nombre; atrás, el QR.</p>
      </div>
      <ul className="ps-tags">{PET_TAGS.map((tag) => <li key={tag.src}><Image src={tag.src} alt={`Chapita de ${tag.name}: ${tag.label}`} width={560} height={560} sizes="(max-width: 760px) 40vw, 190px" /><b>{tag.name}</b><small>{tag.label}</small></li>)}</ul>
      <p className="ps-note">Diseños reales, tal como salen de la impresión. Consultanos por medidas y terminaciones.</p>
    </section>

    <section className="bx-section ps-ready" aria-labelledby="ps-ready-title">
      <div className="ps-ready-card">
        <div className="ps-ready-time"><b>2</b><span>minutos</span></div>
        <div className="ps-ready-copy">
          <p className="bx-section-kicker">CUANDO LLEGA</p>
          <h2 id="ps-ready-title">La activás y ya es suya.</h2>
          <ol><li>Escaneás el código de su tarjeta.</li><li>Confirmás tu email.</li><li>Cargás su nombre, foto y tu WhatsApp.</li></ol>
        </div>
        <div className="ps-ready-links"><Link className="bx-btn bx-btn-white" href="/activar">Ya tengo una · Activarla <FiArrowRight aria-hidden="true" /></Link><Link href="/mi/entrar">Entrar a Mis chapitas</Link></div>
      </div>
    </section>

    <section id="preguntas" className="bx-section ps-faq" aria-labelledby="ps-faq-title">
      <div className="ps-head"><p className="bx-section-kicker">PREGUNTAS FRECUENTES</p><h2 id="ps-faq-title" className="bx-h2">Todo claro<br />antes de elegirla.</h2></div>
      <div className="ps-faq-list">{FAQS.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className="ps-final">
      <div className="bx-section ps-final-inner">
        <div className="ps-final-tags" aria-hidden="true">{PET_TAGS.slice(0, 5).map((tag) => <Image key={tag.src} src={tag.src} alt="" width={560} height={560} sizes="72px" />)}</div>
        <h2 className="bx-h2">Una forma más de cuidarla.<br /><span>Todos los días.</span></h2>
        <a className="bx-btn bx-btn-white" href={WA} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Quiero una para mi mascota</a>
      </div>
    </section>

    <footer className="ps-footer"><Link href="/" aria-label="BioNFC, inicio"><Logo /></Link><p>BioNFC · Tecnología para acercar lo que importa.</p><div><Link href="/activar">Activar chapita</Link><Link href="/mi/entrar">Mis chapitas</Link><Link href="/terminos">Términos y privacidad</Link></div></footer>
  </main>;
}
