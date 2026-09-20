import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./marketing.css";
import "./_home/sections.css";
import { IconMessageCircle, IconZap, IconShieldCheck, IconTruck, IconChefHat, IconShoppingBag, IconBriefcase, IconPartyPopper, IconUserRound } from "@/components/icons";
import { FiArrowUpRight, FiArrowDown, FiCheck, FiSend } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { body, display } from "./_home/fonts";
import Logo from "./_home/logo";
import { StyleShowcase } from "./_home/showcase";
import { Faq, HomeNav } from "./_home/interactive";
import HowItWorks from "./_home/how-it-works";
import Products from "./_home/products";
import Connections from "./_home/connections";

export const metadata: Metadata = {
  title: "BioNFC — tu negocio, a un toque",
  description: "BioNFC crea tu página personalizada y la conecta a un producto NFC para que tus clientes accedan a todo lo importante de tu negocio en segundos.",
};

const WHATSAPP_NUMBER = "5493884208746";
const WHATSAPP_TEXT = encodeURIComponent("Hola BioNFC, quiero armar el mío 👋");
const WA = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`;

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#tu-pagina", label: "Tu página" },
  { href: "#productos", label: "Productos" },
  { href: "#posibilidades", label: "Qué conectás" },
];

// The three beats of what an NFC tag does — shown as a numbered list under the hero copy AND as
// matching numbered badges on the product art, so the pictures read as one flow instead of loose
// objects.
const HERO_STEPS = [
  { num: "1", title: "Acercá", body: "tu celular a un tag NFC" },
  { num: "2", title: "Se abre", body: "tu página al instante" },
  { num: "3", title: "Te contactan", body: "WhatsApp, reservas, reseñas" },
];

const HERO_AUDIENCES = [
  { icon: IconChefHat, label: "Gastronomía" },
  { icon: IconUserRound, label: "Belleza" },
  { icon: IconShoppingBag, label: "Tiendas" },
  { icon: IconBriefcase, label: "Profesionales" },
  { icon: IconPartyPopper, label: "Eventos" },
];

const TRUST = [
  { icon: IconShieldCheck, text: "Tu marca, tu página, tu estilo" },
  { icon: IconTruck, text: "Envíos a todo el país" },
  { icon: IconZap, text: "Sin apps para vos ni tus clientes" },
];

const FAQS = [
  { q: "¿Qué es BioNFC?", a: "BioNFC combina una página personalizada con un producto NFC para compartir toda tu información con un solo toque." },
  { q: "¿Necesitan instalar una app?", a: "No. Tus clientes acercan su celular desbloqueado al NFC y tocan el aviso para abrir tu página en el navegador. También pueden entrar escaneando el QR." },
  { q: "¿Y si el celular de mi cliente no tiene NFC?", a: "Cada producto incluye un código QR de respaldo con el mismo link, así que siempre hay una forma de entrar a tu página." },
  { q: "¿Puedo personalizar mi página?", a: "Sí. Colores, imágenes, botones, links y contenido, desde un panel simple." },
  { q: "¿Puedo cambiar mis links después?", a: "Sí, cuando quieras. Tu NFC sigue sirviendo aunque cambie tu contenido, sin pedir uno nuevo." },
  { q: "¿Qué puedo poner en mi página?", a: "WhatsApp, Instagram, TikTok, Spotify, Maps, menú, catálogo, portfolio, pagos, turnos y mucho más." },
  { q: "¿Sirve para cualquier negocio?", a: "Sí. La página y el NFC se adaptan al tipo de uso." },
  { q: "¿Cuánto tarda en llegarme?", a: "Coordinamos todo por WhatsApp: armamos tu página, te mostramos cómo queda y despachamos a todo el país." },
];

export default function Home() {
  return (
    <div className={`bx ${display.variable} ${body.variable}`}>
      <HomeNav links={NAV_LINKS}>
        <a href="#top" className="bx-brand" aria-label="BIONFC, inicio"><Logo /></a>
        <ul className="bx-nav-links">
          {NAV_LINKS.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}
        </ul>
        <div className="bx-nav-end">
          <Link className="bx-nav-login" href="/admin/login">Ingresar</Link>
          <a className="bx-btn bx-btn-nav" href={WA} target="_blank" rel="noreferrer">Quiero el mío</a>
        </div>
      </HomeNav>

      <header id="top" className="bx-hero">
        <div className="bx-hero-main">
          <div className="bx-hero-copy">
            <span className="bx-pill">TECNOLOGÍA QUE CONECTA</span>
            <h1 className="bx-h1">Tu negocio,<br /><span className="bx-grad">a un toque.</span></h1>
            <p className="bx-hero-lead">NFC personalizado + una página diseñada para tu negocio. Más contactos, más reseñas y una mejor presentación.</p>
            <div className="bx-hero-cta">
              <a className="bx-btn bx-btn-hero" href={WA} target="_blank" rel="noreferrer">Quiero mi BIONFC <span aria-hidden="true">→</span></a>
              <a className="bx-btn bx-btn-outline" href="#como-funciona"><FiArrowDown aria-hidden="true" />Ver cómo funciona</a>
            </div>
            <ol className="bx-feats" aria-label="Cómo funciona">
              {HERO_STEPS.map(({ num, title, body }) => (
                <li key={num}><span className="bx-feat-ico" aria-hidden="true">{num}</span><span><b>{title}</b><small>{body}</small></span></li>
              ))}
            </ol>
          </div>

          {/* The supplied image leaves a clear area for the desktop copy on the left.
              On smaller screens its products sit below the copy in their own crop. */}
          <div className="bx-scene">
            <div className="bx-scene-art">
              <Image className="bx-scene-img" src="/marketing/hero/scene-light.webp" alt="Página personalizada en un celular junto a un soporte, una tarjeta y un llavero NFC con la identidad TU MARCA" fill priority sizes="(max-width: 640px) 150vw, 100vw" />
            </div>
          </div>
        </div>

        <div className="bx-hero-bar">
          <div className="bx-hero-bar-inner">
            <span className="bx-bar-kicker">IDEAL PARA</span>
            <ul>{HERO_AUDIENCES.map(({ icon: Icon, label }) => <li key={label}><Icon />{label}</li>)}</ul>
            <span className="bx-bar-end">Un toque. Muchas oportunidades.</span>
          </div>
        </div>
      </header>

      <div className="bx-trust">
        {TRUST.map(({ icon: Icon, text }) => <span key={text}><Icon />{text}</span>)}
      </div>

      <HowItWorks />

      <section id="tu-pagina" className="bx-dark">
        <div className="bx-dark-glow bx-dark-glow-a" />
        <div className="bx-section bx-section-dark"><StyleShowcase waUrl={WA} /></div>
      </section>

      <Products whatsappNumber={WHATSAPP_NUMBER} />
      <Connections whatsappNumber={WHATSAPP_NUMBER} />

      <section id="preguntas" className="bx-section bx-questions">
        <div className="bx-questions-intro"><p className="bx-section-kicker">ANTES DEL PRIMER TOQUE</p><h2 className="bx-h2">Todo claro.<br /><span>Desde el inicio.</span></h2><p>Las dudas más comunes, sin letra chica.</p><a href={WA} target="_blank" rel="noreferrer"><IconMessageCircle />¿Tenés otra pregunta? <FiArrowUpRight aria-hidden="true" /></a></div>
        <Faq items={FAQS} />
      </section>

      <section className="bx-start" aria-labelledby="start-title"><div className="bx-section"><div className="bx-start-card">
        <div className="bx-start-copy"><p className="bx-section-kicker">DE TU IDEA AL PRIMER TOQUE</p><h2 id="start-title">Tu próximo<br />contacto empieza<br /><span>con vos.</span></h2><p>Contanos qué hacés. Diseñamos tu página y te ayudamos a elegir el NFC para compartirla.</p><a className="bx-btn" href={WA} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Armemos mi BioNFC<FiArrowUpRight aria-hidden="true" /></a><span className="bx-start-note">Hablamos por WhatsApp, sin compromiso.</span></div>
        <div className="bx-start-side"><div className="bx-start-message"><span>TODO EMPIEZA CON UN MENSAJE</span><p>“Hola, tengo un negocio<br />y quiero armar mi BioNFC.”</p><FiSend aria-hidden="true" /></div><ol><li><span>01</span><div><b>Nos contás tu idea</b><p>Tu negocio, tu estilo y qué querés compartir.</p></div></li><li><span>02</span><div><b>Le damos forma</b><p>Diseñamos tu página y te mostramos cómo queda.</p></div></li><li><span>03</span><div><b>Listo para conectar</b><p>Coordinamos tu NFC y el envío.</p></div><FiCheck aria-hidden="true" /></li></ol></div>
      </div></div></section>

      <footer className="bx-footer bx-footer-redesign">
        <div className="bx-footer-main"><div><a className="bx-brand" href="#top" aria-label="BioNFC, volver al inicio"><Logo /></a><p>Tu mundo, más cerca.<br />Una conexión a la vez.</p></div><nav aria-label="Explorá BioNFC"><span>EXPLORÁ</span><a href="#como-funciona">Cómo funciona</a><a href="#tu-pagina">Tu página</a><a href="#productos">Formatos NFC</a></nav><nav aria-label="Ayuda y contacto"><span>SEGUIMOS EN CONTACTO</span><a href={WA} target="_blank" rel="noreferrer">Hablemos por WhatsApp ↗</a><a href="#preguntas">Preguntas frecuentes</a><Link href="/admin/login">Ingresar a mi panel ↗</Link></nav></div>
        <div className="bx-footer-bottom"><span>BioNFC · Hecho para conectar.</span><span>Envíos a todo el país <IconTruck /></span></div>
      </footer>

      <a className="bx-float-wa" href={WA} target="_blank" rel="noreferrer" aria-label="Escribinos por WhatsApp">
        <span className="bx-float-wa-dot"><IconMessageCircle /></span>
        <span className="bx-float-wa-text">¿Armamos el tuyo?</span>
      </a>
    </div>
  );
}
