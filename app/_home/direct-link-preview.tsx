"use client";

import Image from "next/image";
import { FiArrowLeft, FiArrowUpRight, FiHeart, FiMapPin, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa6";
import reviewsImage from "../../public/marketing/showcase/direct-reviews-cafe.webp";
import instagramImage from "../../public/marketing/showcase/direct-instagram-tattoo.webp";
import whatsappImage from "../../public/marketing/showcase/direct-whatsapp-fuego-keyboard.webp";

export type DirectLinkExample = {
  id: "reviews" | "instagram" | "whatsapp";
  name: string;
};

function PhoneStatus() {
  return <div className="bx-direct-status" aria-hidden="true"><span>9:41</span><span>••• ▰</span></div>;
}

function ReviewsPreview({ eager }: { eager: boolean }) {
  return (
    <div className="bx-direct-view bx-direct-reviews">
      <PhoneStatus />
      <div className="bx-direct-topbar"><FiArrowLeft /><span>Reseñas</span><FiMoreHorizontal /></div>
      <div className="bx-direct-review-photo">
        <Image src={reviewsImage} alt="Fachada ficticia de Café Jacarandá" fill sizes="(max-width: 600px) 244px, 266px" loading={eager ? "eager" : "lazy"} placeholder="blur" />
      </div>
      <div className="bx-direct-review-card">
        <span className="bx-direct-google" aria-hidden="true"><i>G</i></span>
        <p className="bx-direct-overline">RESEÑAS DE GOOGLE</p>
        <h3>Café Jacarandá</h3>
        <div className="bx-direct-rating"><strong>4,9</strong><span aria-label="5 estrellas">★★★★★</span><small>128 reseñas</small></div>
        <p className="bx-direct-address"><FiMapPin /> Palermo, Buenos Aires</p>
        <div className="bx-direct-quote"><span>“</span><p>El café es excelente y el lugar tiene una energía hermosa. Volvería sin dudar.</p><small>— Martina R. · hace 2 semanas</small></div>
        <button type="button">Escribir una reseña <FiArrowUpRight /></button>
      </div>
    </div>
  );
}

function InstagramPreview({ eager }: { eager: boolean }) {
  return (
    <div className="bx-direct-view bx-direct-instagram">
      <PhoneStatus />
      <div className="bx-direct-ig-title"><FaInstagram /><b>lineanegra.tattoo</b><FiMoreHorizontal /></div>
      <div className="bx-direct-ig-profile">
        <div className="bx-direct-ig-avatar"><span>LN</span></div>
        <div><strong>86</strong><small>publicaciones</small></div>
        <div><strong>4,8 mil</strong><small>seguidores</small></div>
        <div><strong>312</strong><small>seguidos</small></div>
      </div>
      <div className="bx-direct-ig-bio"><b>Línea Negra · Tattoo Studio</b><p>Fine line · Botánica · Diseños únicos<br />Turnos en Buenos Aires ↓</p></div>
      <button className="bx-direct-follow" type="button">Seguir</button>
      <div className="bx-direct-ig-tabs"><span>▦</span><span>♙</span></div>
      <div className="bx-direct-ig-grid">
        <div className="is-photo"><Image src={instagramImage} alt="Trabajo ficticio del estudio Línea Negra" fill sizes="90px" loading={eager ? "eager" : "lazy"} placeholder="blur" /></div>
        <div className="is-flash is-one"><span>✦</span></div>
        <div className="is-photo is-crop"><Image src={instagramImage} alt="" fill sizes="90px" placeholder="blur" /></div>
        <div className="is-flash is-two"><span>☾</span></div>
        <div className="is-photo is-detail"><Image src={instagramImage} alt="" fill sizes="90px" placeholder="blur" /></div>
        <div className="is-flash is-three"><span>❋</span></div>
        <div className="is-photo is-soft"><Image src={instagramImage} alt="" fill sizes="90px" placeholder="blur" /></div>
        <div className="is-flash is-four"><span>⌁</span></div>
        <div className="is-photo is-wide"><Image src={instagramImage} alt="" fill sizes="90px" placeholder="blur" /></div>
      </div>
      <div className="bx-direct-ig-actions" aria-hidden="true"><FiHeart /><FiMessageCircle /><span>⌁</span></div>
    </div>
  );
}

function WhatsAppPreview({ eager }: { eager: boolean }) {
  return (
    <div className="bx-direct-view bx-direct-whatsapp">
      <PhoneStatus />
      <div className="bx-direct-whatsapp-app">
        <Image className="bx-direct-whatsapp-screen" src={whatsappImage} alt="Chat ficticio con Fuego Burger, un mensaje de reserva predefinido y el teclado abierto" fill sizes="(max-width: 600px) 188px, 266px" loading={eager ? "eager" : "lazy"} placeholder="blur" />
      </div>
    </div>
  );
}

export default function DirectLinkPreview({ example, eager = false }: { example: DirectLinkExample; eager?: boolean }) {
  return (
    <div className="bx-sample bx-direct-sample" data-direct={example.id}>
      <div className="bx-sample-screen">
        {example.id === "reviews" ? <ReviewsPreview eager={eager} /> : example.id === "instagram" ? <InstagramPreview eager={eager} /> : <WhatsAppPreview eager={eager} />}
      </div>
    </div>
  );
}
