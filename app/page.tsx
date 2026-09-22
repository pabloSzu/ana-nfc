import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./marketing.css";
import "./_home/sections.css";
import { IconMessageCircle, IconZap, IconShieldCheck, IconTruck, IconChefHat, IconShoppingBag, IconBriefcase, IconPartyPopper, IconUserRound } from "@/components/icons";
import { FiArrowUpRight, FiArrowDown, FiCheck, FiSend } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa6";
import { body, display, hand } from "./_home/fonts";
import Logo from "./_home/logo";
import { StyleShowcase } from "./_home/showcase";
import { Faq, HomeNav } from "./_home/interactive";
import HowItWorks from "./_home/how-it-works";
import Products from "./_home/products";
import Makers from "./_home/makers";
import "./_home/makers.css";
import Destinations from "./_home/destinations";

const title = "BioNFC — tu negocio, a un toque";
const description = "QR y NFC personalizados para tu negocio. Conectá a tus clientes con tus reseñas de Google, un link directo o una página con todos tus accesos.";

export const metadata: Metadata = {
  title,
  description,
  // The image itself comes from app/opengraph-image.tsx (Next wires it up by file convention);
  // this just fills in the surrounding card fields link previews read.
  openGraph: { title, description, type: "website", locale: "es_AR", siteName: "BioNFC" },
  twitter: { card: "summary_large_image", title, description },
};

const WHATSAPP_NUMBER = "5493517873628";
// No emoji: wa.me's redirect mangles them into "�" on WhatsApp Web/Desktop (and some phones).
const WHATSAPP_TEXT = encodeURIComponent("Hola BioNFC, me interesa un QR o NFC para mi negocio. ¿Me contás las opciones?");
const WA = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`;

const NAV_LINKS = [
  { href: "#elegi-tu-uso", label: "Para tu negocio" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#tu-pagina", label: "Tu página" },
  { href: "#productos", label: "Formatos" },
];

// The three beats of what an NFC tag does — shown as a numbered list under the hero copy AND as
// matching numbered badges on the product art, so the pictures read as one flow instead of loose
// objects.
const HERO_STEPS = [
  { num: "1", title: "Escaneá o acercá", body: "QR o NFC, vos elegís" },
  { num: "2", title: "Se abre", body: "el destino que elegiste" },
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
  { icon: IconShieldCheck, text: "Tu logo, tu identidad, tu estilo" },
  { icon: IconMessageCircle, text: "Te ayudamos a elegir" },
  { icon: IconZap, text: "QR o NFC, según lo que necesites" },
];

const FAQS = [
  { q: "¿Qué es BioNFC?", a: "Creamos QR y productos NFC personalizados para conectar a tus clientes con tu negocio. Pueden llevar a tus reseñas de Google, a un enlace que ya tengas o a una página con todos tus accesos." },
  { q: "¿Puedo pedir solo un QR para reseñas?", a: "Sí. Podés elegir un QR para que tus clientes lleguen directamente al enlace de reseñas de tu negocio en Google. No necesitás una página completa. También podés combinarlo con NFC." },
  { q: "¿Necesitan instalar una app?", a: "No necesitás una app especial para leer el QR o el NFC. Tus clientes escanean el QR o acercan su celular desbloqueado y tocan el aviso para abrir el enlace. El servicio de destino puede pedirles iniciar sesión; por ejemplo, Google para publicar una reseña." },
  { q: "¿Y si el celular de mi cliente no tiene NFC?", a: "Puede escanear el QR para abrir el mismo destino: tus reseñas, tu link o tu página." },
  { q: "¿Puedo personalizar mi página?", a: "Sí. Colores, imágenes, botones, links y contenido, desde un panel simple." },
  { q: "¿Puedo cambiar mis links después?", a: "Si elegís una página personalizada, podés actualizar sus links desde el panel sin cambiar tu NFC ni tu QR. Si elegís un enlace directo, consultanos cómo actualizarlo según el formato." },
  { q: "¿Qué puedo poner en mi página?", a: "WhatsApp, Instagram, TikTok, Spotify, Maps, menú, catálogo, portfolio, pagos, turnos y mucho más." },
  { q: "¿Sirve para cualquier negocio?", a: "Sí. Elegimos el destino y el formato según lo que necesites: recibir consultas, conseguir reseñas, compartir tu menú o reunir tus accesos en una página." },
  { q: "¿Los productos son iguales a las imágenes?", a: "Las imágenes son referencias de uso y diseño. Consultanos por materiales, medidas, terminaciones y disponibilidad. Confirmamos esos detalles con vos antes de avanzar." },
  { q: "¿Necesito contratar una página?", a: "No. Podés elegir un QR o NFC a tus reseñas o a un enlace que ya tengas. Si querés una página, te detallamos qué incluye, su costo y las condiciones del servicio antes de contratar." },
  { q: "¿Cuánto tarda en llegarme?", a: "Antes de confirmar tu pedido, te contamos las opciones disponibles, el precio, el plazo de preparación y cómo coordinar la entrega según tu ubicación." },
];

export default function Home() {
  return (
    <div className={`bx ${display.variable} ${body.variable} ${hand.variable}`}>
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
            <span className="bx-pill">QR Y NFC · CON TU IDENTIDAD</span>
            <h1 className="bx-h1">Tu negocio,<br /><span className="bx-grad">a un toque.</span></h1>
            <p className="bx-hero-lead">QR y NFC personalizados para que tus clientes te escriban, vean lo que ofrecés o te dejen una reseña. Te ayudamos a elegir y lo dejamos listo.</p>
            <div className="bx-hero-cta">
              <a className="bx-btn bx-btn-hero" href={WA} target="_blank" rel="noreferrer">Quiero uno para mi negocio <span aria-hidden="true">→</span></a>
              <a className="bx-btn bx-btn-outline" href="#elegi-tu-uso"><FiArrowDown aria-hidden="true" />Explorar opciones</a>
            </div>
            <ol className="bx-feats" aria-label="Cómo funciona">
              {HERO_STEPS.map(({ num, title, body }) => (
                <li key={num}><span className="bx-feat-ico" aria-hidden="true">{num}</span><span><b>{title}</b><small>{body}</small></span></li>
              ))}
            </ol>
          </div>

          {/* Moody, low-lit scene — dark almost everywhere in frame, so white copy stays readable
              over it without needing a synthetic scrim to fake contrast. */}
          <div className="bx-scene">
            <div className="bx-scene-art">
              <Image className="bx-scene-img" src="/marketing/hero/scene-night.webp" alt="Página personalizada en un celular junto a un soporte, una tarjeta y un llavero NFC con la identidad TU MARCA, sobre una mesa oscura" fill priority sizes="(max-width: 640px) 150vw, 100vw" />
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

      <Destinations whatsappNumber={WHATSAPP_NUMBER} />
      <HowItWorks />

      <section id="tu-pagina" className="bx-dark">
        <div className="bx-dark-glow bx-dark-glow-a" />
        <div className="bx-section bx-section-dark"><StyleShowcase waUrl={WA} /></div>
      </section>

      <Products whatsappNumber={WHATSAPP_NUMBER} />

      <Makers whatsappNumber={WHATSAPP_NUMBER} />

      <section id="preguntas" className="bx-section bx-questions">
        <div className="bx-questions-intro"><p className="bx-section-kicker">ANTES DEL PRIMER TOQUE</p><h2 className="bx-h2">Todo claro.<br /><span>Desde el inicio.</span></h2><p>Las dudas más comunes, sin letra chica.</p><a href={WA} target="_blank" rel="noreferrer"><IconMessageCircle />¿Tenés otra pregunta? <FiArrowUpRight aria-hidden="true" /></a></div>
        <Faq items={FAQS} />
      </section>

      <section className="bx-start" aria-labelledby="start-title"><div className="bx-section"><div className="bx-start-card">
        <div className="bx-start-copy"><p className="bx-section-kicker">DE TU IDEA AL PRIMER TOQUE</p><h2 id="start-title">Tu próximo<br />contacto empieza<br /><span>con vos.</span></h2><p>Contanos qué querés lograr. Te ayudamos a elegir el destino y el formato: QR, NFC o ambos.</p><a className="bx-btn" href={WA} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Armemos mi BioNFC<FiArrowUpRight aria-hidden="true" /></a><span className="bx-start-note">Hablamos por WhatsApp, sin compromiso.</span></div>
        <div className="bx-start-side"><div className="bx-start-message"><span>TODO EMPIEZA CON UN MENSAJE</span><p>“Hola, tengo un negocio<br />y quiero armar mi BioNFC.”</p><FiSend aria-hidden="true" /></div><ol><li><span>01</span><div><b>Elegís qué compartir</b><p>Reseñas, un enlace o tu página. Te ayudamos a elegir.</p></div></li><li><span>02</span><div><b>Personalizamos el diseño</b><p>Personalizamos el diseño y te mostramos cómo queda.</p></div></li><li><span>03</span><div><b>Lo configuramos</b><p>Preparamos el acceso al contenido que elegiste.</p></div></li><li><span>04</span><div><b>Recibís y compartís</b><p>Acordamos la entrega y te explicamos cómo usarlo.</p></div><FiCheck aria-hidden="true" /></li></ol></div>
      </div></div></section>

      <footer className="bx-footer bx-footer-redesign">
        <div className="bx-footer-main"><div><a className="bx-brand" href="#top" aria-label="BioNFC, volver al inicio"><Logo /></a><p>Tu mundo, más cerca.<br />Una conexión a la vez.</p></div><nav aria-label="Explorá BioNFC"><span>EXPLORÁ</span><a href="#como-funciona">Cómo funciona</a><a href="#tu-pagina">Tu página</a><a href="#productos">Formatos NFC</a></nav><nav aria-label="Ayuda y contacto"><span>SEGUIMOS EN CONTACTO</span><a href={WA} target="_blank" rel="noreferrer">Hablemos por WhatsApp ↗</a><a href="#preguntas">Preguntas frecuentes</a><Link href="/admin/login">Ingresar a mi panel ↗</Link></nav></div>
        <div className="bx-footer-bottom"><span>BioNFC · Hecho para conectar.</span><span>Entrega a coordinar <IconTruck /></span></div>
      </footer>

      <a className="bx-float-wa" href={WA} target="_blank" rel="noreferrer" aria-label="Escribinos por WhatsApp">
        <span className="bx-float-wa-dot"><IconMessageCircle /></span>
        <span className="bx-float-wa-text">¿Armamos el tuyo?</span>
      </a>
    </div>
  );
}
