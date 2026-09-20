"use client";

import { useState } from "react";
import { FiArrowRight, FiArrowUpRight, FiCalendar, FiCheck, FiFileText, FiMapPin, FiMessageCircle, FiShoppingBag, FiStar, FiUsers, FiGlobe, FiMusic } from "react-icons/fi";
import { FaWhatsapp, FaInstagram } from "react-icons/fa6";

const GOALS = [
  { id: "contact", label: "Que me contacten", icon: FiMessageCircle, title: "De “me interesa” a “hablemos”.", description: "Dales un camino directo para consultarte, conocerte y encontrar tu negocio.", brand: "ESTUDIO NORTE", subtitle: "Diseño que acerca ideas.", monogram: "n.", links: [{ icon: FaWhatsapp, title: "Hablemos por WhatsApp", note: "Empezá una conversación" }, { icon: FiFileText, title: "Conocé nuestros proyectos", note: "Tu portfolio, siempre a mano" }, { icon: FiMapPin, title: "Visitá el estudio", note: "Tu ubicación en Google Maps" }], result: "Menos búsquedas. Más conversaciones." },
  { id: "booking", label: "Que reserven", icon: FiCalendar, title: "El próximo turno, más cerca.", description: "Conectá tu agenda o tu WhatsApp para que tus clientes encuentren cómo reservar sin dar vueltas.", brand: "LUNA STUDIO", subtitle: "Un momento para vos.", monogram: "lu", links: [{ icon: FiCalendar, title: "Reservá tu próximo turno", note: "Acceso a tu agenda de reservas" }, { icon: FaInstagram, title: "Inspirate con nuestros trabajos", note: "Tu Instagram, a un toque" }, { icon: FaWhatsapp, title: "Consultanos lo que necesites", note: "Respuestas por WhatsApp" }], result: "De descubrirte a reservarte." },
  { id: "sales", label: "Que compren", icon: FiShoppingBag, title: "Todo listo para elegirte.", description: "Reuní tu catálogo, tu menú o tus links de pago. Acercá a tus clientes a lo que estás vendiendo.", brand: "CASA OLIVA", subtitle: "Objetos para vivir bonito.", monogram: "o.", links: [{ icon: FiShoppingBag, title: "Explorá nuestro catálogo", note: "Productos, fotos y precios" }, { icon: FiGlobe, title: "Comprá en nuestra tienda", note: "Tu tienda o link de pago" }, { icon: FaWhatsapp, title: "Pedinos una recomendación", note: "Asesoramiento por WhatsApp" }], result: "Más fácil de ver. Más fácil de comprar." },
  { id: "community", label: "Que me sigan", icon: FiUsers, title: "Que el encuentro siga después.", description: "Hacé crecer tu comunidad y facilitá que compartan su experiencia. Tus redes y contenido, juntos.", brand: "CAFÉ NUBE", subtitle: "Nos une el buen café.", monogram: "nu", links: [{ icon: FaInstagram, title: "Sigamos en Instagram", note: "Novedades y próximos encuentros" }, { icon: FiStar, title: "Contanos tu experiencia", note: "Reseñas en Google" }, { icon: FiMusic, title: "Escuchá nuestra playlist", note: "Tu contenido de Spotify" }], result: "Un encuentro. Muchas formas de seguir." },
];

export default function Connections({ whatsappNumber }: { whatsappNumber: string }) {
  const [active, setActive] = useState(0);
  const goal = GOALS[active];
  return <section id="posibilidades" className="bx-connect-section"><div className="bx-section">
    <div className="bx-editorial-head"><div><p className="bx-section-kicker">CONEXIONES CON PROPÓSITO</p><h2 className="bx-h2">Un toque.<br /><span>¿Qué querés que pase?</span></h2></div><p>Tu página puede hacer mucho. Empezá por lo que más importa para tu negocio.</p></div>
    <div className="bx-goal-picker" role="group" aria-label="Elegí qué querés lograr">{GOALS.map(({ id, icon: Icon, label }, index) => <button key={id} type="button" aria-pressed={active === index} aria-controls="connection-example" onClick={() => setActive(index)}><Icon aria-hidden="true" />{label}<FiArrowUpRight aria-hidden="true" /></button>)}</div>
    <div className="bx-goal-panel" id="connection-example" data-goal={goal.id}>
      <div className="bx-goal-copy" aria-live="polite" aria-atomic="true"><span className="bx-goal-counter">0{active + 1} / 04</span><h3>{goal.title}</h3><p>{goal.description}</p><span className="bx-goal-result"><FiCheck aria-hidden="true" />{goal.result}</span><a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola BioNFC, quiero una página para mi negocio. Mi objetivo es: ${goal.label.toLowerCase()}.`)}`} target="_blank" rel="noreferrer">Quiero esto para mi negocio <FiArrowUpRight aria-hidden="true" /></a></div>
      <div className="bx-goal-preview"><span className="bx-goal-preview-label">ASÍ PODRÍAS ORGANIZAR TU PÁGINA</span><div className="bx-goal-sheet" key={goal.id}><div className="bx-goal-brand"><span>{goal.monogram}</span><div><b>{goal.brand}</b><p>{goal.subtitle}</p></div></div><div className="bx-goal-links">{goal.links.map(({ icon: Icon, title, note }, index) => <div key={title} className={index === 0 ? "is-main" : ""}><span className="bx-goal-link-icon"><Icon aria-hidden="true" /></span><div><b>{title}</b><small>{note}</small></div><FiArrowRight aria-hidden="true" /></div>)}</div><span className="bx-goal-example-note">Ejemplo ilustrativo · Lo adaptamos a tu marca</span></div></div>
    </div>
    <p className="bx-connect-note">Tus links pueden cambiar. <strong>Tu NFC te sigue conectando.</strong></p>
  </div></section>;
}
