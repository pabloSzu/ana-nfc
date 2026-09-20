import { FaGoogle, FaWhatsapp, FaInstagram } from "react-icons/fa6";
import { FiArrowRight, FiArrowUpRight, FiCalendar, FiCheck, FiFileText, FiLink, FiMapPin, FiStar } from "react-icons/fi";
import { IconQrCode } from "@/components/icons";
import "./destinations.css";

export default function Destinations({ whatsappNumber }: { whatsappNumber: string }) {
  const inquiry = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  return (
    <section id="elegi-tu-uso" className="bx-destinations" aria-labelledby="destinations-title">
      <div className="bx-section">
        <div className="bx-destinations-heading">
          <p className="bx-destinations-eyebrow"><span>NFC + QR</span> VOS ELEGÍS EL DESTINO</p>
          <h2 className="bx-h2" id="destinations-title">¿A dónde querés llevar<br /><span>a tus clientes?</span></h2>
          <p>Con QR, NFC o ambos. Elegí qué pasa cuando te escanean o acercan el celular.</p>
        </div>

        <div className="bx-destination-grid">
          <article className="bx-destination bx-destination-reviews">
            <div className="bx-destination-art" aria-hidden="true">
              <span className="bx-destination-art-tag">UNA OPINIÓN QUE SUMA</span>
              <div className="bx-review-example"><FaGoogle className="bx-review-google" /><span>Tu negocio</span><b>¿Cómo fue tu experiencia?</b><div className="bx-review-stars">{[0, 1, 2, 3, 4].map((star) => <FiStar key={star} />)}</div><span className="bx-review-action">Dejá tu reseña <FiArrowUpRight /></span></div>
              <span className="bx-destination-sticker"><FiStar /> Directo a Google</span>
            </div>
            <div className="bx-destination-copy"><span className="bx-destination-type">PARA QUE TE RECOMIENDEN</span><h3>Directo a tus reseñas.</h3><p>Facilitá que tus clientes dejen su opinión en Google. Escanean o acercan el celular y llegan al enlace para escribir su reseña.</p><span className="bx-destination-benefit"><FiCheck aria-hidden="true" /> Sin una página intermedia</span><a href={inquiry("Hola BioNFC, quiero un QR o NFC que lleve directo a las reseñas de Google de mi negocio.")} target="_blank" rel="noreferrer">Quiero más reseñas <FiArrowUpRight aria-hidden="true" /></a></div>
          </article>

          <article className="bx-destination bx-destination-link">
            <div className="bx-destination-art" aria-hidden="true">
              <span className="bx-destination-art-tag">UN ACCESO. CERO VUELTAS.</span>
              <div className="bx-direct-example"><span className="bx-direct-origin"><IconQrCode /><span>TU QR / NFC</span></span><FiArrowRight className="bx-direct-arrow" /><div className="bx-direct-targets"><span><FaWhatsapp /> WhatsApp</span><span><FiFileText /> Tu menú</span><span><FiCalendar /> Reservas</span></div></div>
              <span className="bx-destination-sticker"><FiLink /> Al link que vos elijas</span>
            </div>
            <div className="bx-destination-copy"><span className="bx-destination-type">PARA UNA ACCIÓN CONCRETA</span><h3>Directo a tu link.</h3><p>¿Ya tenés lo que querés compartir? Llevá a tus clientes a tu WhatsApp, menú, Instagram, catálogo o sistema de reservas.</p><span className="bx-destination-benefit"><FiCheck aria-hidden="true" /> Usá el enlace que ya tenés</span><a href={inquiry("Hola BioNFC, quiero un QR o NFC que abra directamente un enlace que ya tengo.")} target="_blank" rel="noreferrer">Quiero compartir mi link <FiArrowUpRight aria-hidden="true" /></a></div>
          </article>

          <article className="bx-destination bx-destination-page">
            <div className="bx-destination-art" aria-hidden="true">
              <span className="bx-destination-art-tag">TODO TU NEGOCIO, JUNTO</span>
              <div className="bx-page-example"><span className="bx-page-example-logo">tm.</span><b>TU MARCA</b><small>Un lugar para todo lo tuyo.</small><div><span><FaWhatsapp /> WhatsApp <FiArrowUpRight /></span><span><FiMapPin /> Cómo llegar <FiArrowUpRight /></span><span><FaInstagram /> Instagram <FiArrowUpRight /></span></div></div>
              <span className="bx-destination-sticker"><FiCheck /> Diseñada para vos</span>
            </div>
            <div className="bx-destination-copy"><span className="bx-destination-type">PARA REUNIR TODO EN UN LUGAR</span><h3>A tu página completa.</h3><p>Tu logo, tus fotos y todos tus accesos en una página personalizada. Cada cliente elige si escribirte, reservar o conocer más.</p><span className="bx-destination-benefit"><FiCheck aria-hidden="true" /> Una página con tu identidad</span><a href="#tu-pagina">Explorá los diseños <FiArrowRight aria-hidden="true" /></a></div>
          </article>
        </div>
        <div className="bx-destinations-footer"><span><FiCheck aria-hidden="true" /> Con tu logo y tu identidad</span><p>¿Solo necesitás un QR? <a href={inquiry("Hola BioNFC, necesito solo un QR personalizado para mi negocio. Quiero conocer las opciones.")} target="_blank" rel="noreferrer">También lo armamos para vos <FiArrowUpRight aria-hidden="true" /></a></p></div>
      </div>
    </section>
  );
}
