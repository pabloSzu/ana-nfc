import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiEdit3, FiMessageCircle, FiRadio } from "react-icons/fi";
import PetProductVisual, { PET_TAGS } from "@/components/pet-product-visual";
import "@/components/pet-product-visual.css";
import "./pets.css";

// La sección de mascotas de la home: lleva a /mascotas. Usa la chapita y la ficha de verdad.
export default function Pets() {
  return <section id="mascotas" className="bx-pets" aria-labelledby="pets-home-title">
    <div className="bx-section bx-pets-grid">
      <div className="bx-pets-copy">
        <span className="bx-pill">🐾 CHAPITAS PARA MASCOTAS</span>
        <h2 id="pets-home-title" className="bx-h2">Si se pierde,<br /><span className="bx-grad">que puedan avisarte.</span></h2>
        <p className="bx-pets-lead">Una chapita con su nombre, NFC y QR. Quien la encuentra acerca el celular y ve su ficha, con tu WhatsApp a un toque.</p>
        <ul className="bx-pets-points">
          <li><FiRadio aria-hidden="true" /><span><b>Sin app.</b> Acercan el celular o escanean el QR.</span></li>
          <li><FiMessageCircle aria-hidden="true" /><span><b>Te avisan al instante</b> por WhatsApp o llamada.</span></li>
          <li><FiEdit3 aria-hidden="true" /><span><b>La editás cuando quieras</b>, sin cambiar la chapita.</span></li>
        </ul>
        <div className="bx-pets-actions">
          <Link className="bx-btn bx-btn-hero" href="/mascotas">Conocer las chapitas <FiArrowRight aria-hidden="true" /></Link>
          <Link className="bx-btn bx-btn-outline" href="/activar">Ya tengo una · Activarla</Link>
        </div>
        <div className="bx-pets-tags">
          <div className="bx-pets-tags-row">{PET_TAGS.slice(1, 6).map((tag) => <Image key={tag.src} src={tag.src} alt={`Chapita de ${tag.name}: ${tag.label}`} width={560} height={560} sizes="52px" />)}</div>
          <small>Con su nombre, el color que quieras y más de 40 animalitos.</small>
        </div>
      </div>
      <PetProductVisual />
    </div>
  </section>;
}
