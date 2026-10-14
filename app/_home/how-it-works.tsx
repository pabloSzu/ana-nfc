import HowItWorksStories from "./how-it-works-stories";
import { FaWhatsapp } from "react-icons/fa6";
import { FiArrowUpRight, FiMessageCircle, FiRefreshCw, FiStar, FiAward } from "react-icons/fi";
import "./how-it-works.css";

// "Cómo funciona": la segunda sección de la home. Responde de un vistazo qué es, cómo lo usan tus
// clientes, qué recibís y qué ganás: tres cuadros con imagen (el producto, el momento de acercar el
// celular y la página que se abre), una franja de beneficios y un solo botón. En la compu los
// cuadros van en tres columnas; en el celular se deslizan de costado, así la sección entra en una
// pantalla. Los cuadros y sus historias (cafetería, reseñas, profesional) están en
// how-it-works-stories.tsx.
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
        <header className="bx-journey-intro">
          <p className="bx-journey-eyebrow">CÓMO FUNCIONA</p>
          <h2 id="how-title">Acercan el celular.<span> Y pasa la magia.</span></h2>
          <p className="bx-journey-lead">Un producto con tu marca que abre tu página al instante. Sin apps y en cualquier celular.</p>
        </header>

        <HowItWorksStories />
        <p className="bx-journey-swipe" aria-hidden="true">Deslizá para ver los 3 pasos →</p>

        <ul className="bx-journey-benefits" aria-label="Lo que ganás">
          {BENEFITS.map(({ icon: Icon, text }) => <li key={text}><Icon aria-hidden="true" />{text}</li>)}
        </ul>

        <div className="bx-journey-cta">
          <a className="bx-btn bx-journey-btn" href={whatsappUrl} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Quiero el mío<FiArrowUpRight aria-hidden="true" /></a>
          <span>Te asesoramos sin compromiso</span>
        </div>
      </div>
    </section>
  );
}
