"use client";

import Image from "next/image";
import { FiArrowLeft, FiArrowUpRight, FiGlobe, FiHeart, FiMapPin, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa6";

export type DirectLinkExample = {
  id: "reviews" | "instagram" | "website";
  name: string;
};

function PhoneStatus() {
  return <div className="bx-direct-status" aria-hidden="true"><span>9:41</span><span>••• ▰</span></div>;
}

function ReviewsPreview() {
  return (
    <div className="bx-direct-view bx-direct-reviews">
      <PhoneStatus />
      <div className="bx-direct-topbar"><FiArrowLeft /><span>Reseñas</span><FiMoreHorizontal /></div>
      <div className="bx-direct-review-photo">
        <Image src="/marketing/showcase/direct-reviews-cafe.webp" alt="Fachada ficticia de Café Jacarandá" fill sizes="(max-width: 600px) 244px, 266px" />
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

function InstagramPreview() {
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
        <div className="is-photo"><Image src="/marketing/showcase/direct-instagram-tattoo.webp" alt="Trabajo ficticio del estudio Línea Negra" fill sizes="90px" /></div>
        <div className="is-flash is-one"><span>✦</span></div>
        <div className="is-photo is-crop"><Image src="/marketing/showcase/direct-instagram-tattoo.webp" alt="" fill sizes="90px" /></div>
        <div className="is-flash is-two"><span>☾</span></div>
        <div className="is-photo is-detail"><Image src="/marketing/showcase/direct-instagram-tattoo.webp" alt="" fill sizes="90px" /></div>
        <div className="is-flash is-three"><span>❋</span></div>
        <div className="is-photo is-soft"><Image src="/marketing/showcase/direct-instagram-tattoo.webp" alt="" fill sizes="90px" /></div>
        <div className="is-flash is-four"><span>⌁</span></div>
        <div className="is-photo is-wide"><Image src="/marketing/showcase/direct-instagram-tattoo.webp" alt="" fill sizes="90px" /></div>
      </div>
      <div className="bx-direct-ig-actions" aria-hidden="true"><FiHeart /><FiMessageCircle /><span>⌁</span></div>
    </div>
  );
}

function WebsitePreview() {
  return (
    <div className="bx-direct-view bx-direct-website">
      <Image className="bx-direct-site-photo" src="/marketing/showcase/direct-portfolio-designer.webp" alt="Retrato ficticio de Clara Méndez" fill sizes="(max-width: 600px) 244px, 266px" />
      <div className="bx-direct-site-shade" />
      <PhoneStatus />
      <div className="bx-direct-site-nav"><b>CM.</b><span>Sobre mí&nbsp;&nbsp; Proyectos</span><FiMoreHorizontal /></div>
      <div className="bx-direct-site-copy">
        <p>INTERIORISMO · DIRECCIÓN CREATIVA</p>
        <h3>Clara<br />Méndez</h3>
        <span>Diseño espacios que se sienten propios, simples y llenos de intención.</span>
        <button type="button">Conocé mi trabajo <FiArrowUpRight /></button>
      </div>
      <div className="bx-direct-site-footer"><FiGlobe /><span>claramendez.com.ar</span></div>
    </div>
  );
}

export default function DirectLinkPreview({ example }: { example: DirectLinkExample }) {
  return (
    <div className="bx-sample bx-direct-sample" data-direct={example.id}>
      <div className="bx-sample-screen">
        {example.id === "reviews" ? <ReviewsPreview /> : example.id === "instagram" ? <InstagramPreview /> : <WebsitePreview />}
      </div>
    </div>
  );
}
