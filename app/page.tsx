import type { Metadata } from "next";
import Link from "next/link";
import "./marketing.css";
import "./_home/sections.css";
import { IconMessageCircle, IconTruck } from "@/components/icons";
import { FiArrowUpRight } from "react-icons/fi";
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
import { getSiteOrigin } from "@/lib/site-url";

const title = "Productos QR y NFC personalizados | BioNFC";
const description = "Productos QR y NFC personalizados para conectar tu negocio con reseñas de Google, contacto, menús, páginas y experiencias digitales a medida.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  // The image itself comes from app/opengraph-image.tsx (Next wires it up by file convention);
  // this just fills in the surrounding card fields link previews read.
  openGraph: { title, description, type: "website", locale: "es_AR", siteName: "BioNFC", url: "/" },
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
  { href: "#para-talleres", label: "Para fabricantes" },
];

const FAQS = [
  { q: "¿Qué es BioNFC?", a: "Creamos QR y productos NFC personalizados para conectar a tus clientes con tu negocio. Pueden llevar a tus reseñas de Google, a un enlace que ya tengas o a una página con todos tus accesos." },
  { q: "¿Puedo pedir solo un QR o NFC, sin página?", a: "Sí. Puede abrir tus reseñas de Google o un enlace que ya tengas. También podés elegir una página personalizada; antes de avanzar te contamos qué incluye y cuánto cuesta." },
  { q: "¿Necesitan una app o un celular con NFC?", a: "No hace falta una app especial. Tus clientes pueden escanear el QR; si su celular tiene NFC, también pueden acercarlo y tocar el aviso. El destino puede pedirles iniciar sesión, como Google para publicar una reseña." },
  { q: "¿Puedo personalizar y actualizar mi página?", a: "Sí. Podés editar colores, imágenes, botones y contenido. Si elegís una página personalizada, actualizás sus enlaces desde el panel sin cambiar tu QR ni tu NFC. Para un enlace directo, consultanos cómo se actualiza según el formato." },
  { q: "¿Qué puedo compartir en mi página?", a: "WhatsApp, redes sociales, ubicación, menú, catálogo, portfolio, turnos y otros enlaces útiles para tu negocio." },
  { q: "¿Los productos son iguales a las imágenes?", a: "Las imágenes son referencias de uso y diseño. Consultanos por materiales, medidas, terminaciones y disponibilidad. Confirmamos esos detalles con vos antes de avanzar." },
  { q: "¿Cuánto cuesta y cuánto tarda?", a: "Depende del formato, la personalización y la entrega. Antes de confirmar tu pedido, te detallamos el precio, qué incluye, el plazo de preparación y cómo recibirlo." },
];

const siteUrl = getSiteOrigin();
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "BioNFC",
      url: siteUrl,
      logo: `${siteUrl}/icon.svg`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+54 9 351 787 3628",
        contactType: "sales",
        availableLanguage: "Spanish",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "BioNFC",
      url: siteUrl,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "es-AR",
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      name: "Productos QR y NFC personalizados",
      description,
      provider: { "@id": `${siteUrl}/#organization` },
      url: siteUrl,
      serviceType: ["Productos NFC personalizados", "Códigos QR personalizados", "Páginas digitales para negocios"],
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#preguntas-frecuentes`,
      mainEntity: FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function Home() {
  return (
    <div className={`bx ${display.variable} ${body.variable} ${hand.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
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

      <header id="top" className="bx-hero" aria-labelledby="hero-title">
        <div className="bx-hero-main">
          <Destinations whatsappNumber={WHATSAPP_NUMBER} />
        </div>

      </header>

      <HowItWorks whatsappNumber={WHATSAPP_NUMBER} />

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
        <div className="bx-start-copy">
          <p className="bx-section-kicker">HABLEMOS DE TU IDEA</p>
          <h2 id="start-title">Contanos qué querés lograr.<span>Nosotros te ayudamos a hacerlo realidad.</span></h2>
          <p>No necesitás saber qué formato elegir. Te asesoramos y preparamos la solución con QR, NFC o ambos.</p>
        </div>
        <div className="bx-start-action">
          <a className="bx-btn" href={WA} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Escribinos por WhatsApp<FiArrowUpRight aria-hidden="true" /></a>
          <span>Sin compromiso. Te ayudamos a encontrar la opción indicada.</span>
        </div>
      </div></div></section>

      <footer className="bx-footer bx-footer-redesign">
        <div className="bx-footer-main"><div><a className="bx-brand" href="#top" aria-label="BioNFC, volver al inicio"><Logo /></a><p>Tu mundo, más cerca.<br />Una conexión a la vez.</p></div><nav aria-label="Explorá BioNFC"><span>EXPLORÁ</span><a href="#como-funciona">Cómo funciona</a><a href="#tu-pagina">Tu página</a><a href="#productos">Formatos NFC</a><a href="#para-talleres">Para fabricantes</a></nav><nav aria-label="Ayuda y contacto"><span>SEGUIMOS EN CONTACTO</span><a href={WA} target="_blank" rel="noreferrer">Hablemos por WhatsApp ↗</a><a href="#preguntas">Preguntas frecuentes</a><Link href="/admin/login">Ingresar a mi panel ↗</Link></nav></div>
        <div className="bx-footer-bottom"><span>BioNFC · Hecho para conectar.</span><span>Entrega a coordinar <IconTruck /></span></div>
      </footer>

      <a className="bx-float-wa" href={WA} target="_blank" rel="noreferrer" aria-label="Escribinos por WhatsApp">
        <span className="bx-float-wa-dot"><IconMessageCircle /></span>
        <span className="bx-float-wa-text">¿Armamos el tuyo?</span>
      </a>
    </div>
  );
}
