import Image from "next/image";
import { FaWhatsapp, FaInstagram, FaGoogle } from "react-icons/fa6";
import { FiArrowUpRight, FiAward, FiLayout, FiMessageCircle, FiRefreshCw, FiStar, FiUser } from "react-icons/fi";
import "./how-it-works.css";

// "Cómo funciona": la segunda sección de la home. Una foto protagonista (la mano acercando el
// celular: el momento que explica el NFC sin palabras, con varios objetos que se alternan) y, al
// lado, tres pasos cortos;
// el tercero muestra como etiquetas todo lo que se puede abrir. Debajo, los beneficios. En el
// celular: el título, la foto y los pasos en lista.
const OPTIONS = [
  { icon: FiLayout, label: "Tu página" },
  { icon: FiUser, label: "Tarjeta personal" },
  { icon: FaGoogle, label: "Reseñas de Google" },
  { icon: FaWhatsapp, label: "WhatsApp" },
  { icon: FaInstagram, label: "Instagram" },
];

// La misma escena con distintos objetos y, en la pantalla, lo que abre cada uno (página, reseñas,
// tarjeta personal), alternándose con un fundido suave: se ven varios usos sin agrandar la sección.
const PHOTOS = [
  { image: "/marketing/how-it-works/acercar-cafe.webp", label: "Tu página · Cafetería", alt: "Una clienta acerca su celular al mostrador NFC de Café Nube; en la pantalla se ve la página de Café Nube con opciones de menú, reserva y ubicación", position: "60% 55%" },
  { image: "/marketing/how-it-works/acercar-resenas.webp", label: "Reseñas · Barbería", alt: "Un cliente acerca su celular al mostrador NFC de Norte Barber; en la pantalla se ve el formulario de Google para calificar con cinco estrellas y escribir una reseña", position: "55% 55%" },
  { image: "/marketing/how-it-works/acercar-tarjeta.webp", label: "Tarjeta personal · Arquitecta", alt: "Una persona acerca su celular a la tarjeta NFC de Lucía Ferreyra; en la pantalla se ve su tarjeta digital con opciones para guardar el contacto, WhatsApp, Email e Instagram", position: "45% 50%" },
];

// Cada foto se ve 3,5 s y se funde con la siguiente. La animación se arma según cuántas fotos haya,
// así sumar una (WhatsApp, hotel…) es solo agregarla a PHOTOS.
const SLIDE_SECONDS = 3.5;
function fadeKeyframes(count: number) {
  const share = 100 / count;
  const fade = Math.min(4, share / 4);
  return `@keyframes bx-journey-fade { 0% { opacity:0; } ${fade.toFixed(2)}% { opacity:1; } ${share.toFixed(2)}% { opacity:1; } ${(share + fade).toFixed(2)}% { opacity:0; } 100% { opacity:0; } }`;
}

const BENEFITS = [
  { icon: FiStar, text: "Más reseñas en Google" },
  { icon: FiMessageCircle, text: "Más consultas por WhatsApp" },
  { icon: FiAward, text: "Imagen más profesional" },
  { icon: FiRefreshCw, text: "Cambiás el link sin reimprimir" },
];

export default function HowItWorks({ whatsappNumber }: { whatsappNumber: string }) {
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hola BioNFC, quiero saber cómo sería el mío.")}`;

  return (
    <section id="como-funciona" className="bx-journey" aria-labelledby="how-title">
      <div className="bx-journey-container">
        <figure className="bx-journey-photo">
          <style>{fadeKeyframes(PHOTOS.length)}</style>
          {PHOTOS.map((photo, index) => <div key={photo.image} className="bx-journey-slide" style={{ animationDuration: `${PHOTOS.length * SLIDE_SECONDS}s`, animationDelay: `${index * SLIDE_SECONDS}s` }}>
            <Image src={photo.image} alt={photo.alt} width={1000} height={1250} sizes="(max-width: 860px) 92vw, 480px" priority={index === 0} style={{ objectPosition: photo.position }} />
            <figcaption><span aria-hidden="true">)))</span> {photo.label}</figcaption>
          </div>)}
        </figure>

        <div className="bx-journey-body">
          <p className="bx-journey-eyebrow">CÓMO FUNCIONA</p>
          <h2 id="how-title">Acercan el celular.<span> Y pasa la magia.</span></h2>

          <ol className="bx-journey-steps">
            <li>
              <span className="bx-journey-number" aria-hidden="true">1</span>
              <div><h3>Tu producto, con tu marca</h3><p>Tarjeta, llavero o mostrador con NFC y QR, diseñado para tu negocio.</p></div>
            </li>
            <li>
              <span className="bx-journey-number" aria-hidden="true">2</span>
              <div><h3>Tus clientes acercan el celular</h3><p>Sin apps: es el mismo chip que usás para pagar con el celu. Si no tiene NFC, escanean el QR.</p></div>
            </li>
            <li>
              <span className="bx-journey-number" aria-hidden="true">3</span>
              <div>
                <h3>Se abre <mark>lo que vos elijas</mark></h3>
                <ul className="bx-journey-options" aria-label="Lo que se puede abrir">
                  {OPTIONS.map(({ icon: Icon, label }) => <li key={label}><Icon aria-hidden="true" />{label}</li>)}
                </ul>
              </div>
            </li>
          </ol>

          <div className="bx-journey-cta">
            <a className="bx-btn bx-journey-btn" href={whatsappUrl} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Quiero el mío<FiArrowUpRight aria-hidden="true" /></a>
            <span>Lo diseñamos con vos, a medida de tu negocio.</span>
          </div>
        </div>

        <ul className="bx-journey-benefits" aria-label="Lo que ganás">
          {BENEFITS.map(({ icon: Icon, text }) => <li key={text}><Icon aria-hidden="true" />{text}</li>)}
        </ul>
      </div>
    </section>
  );
}
