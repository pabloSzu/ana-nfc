// Página pública de la chapita de mascota (business_type "pet"). Es propia, no una landing con
// botones: se arma entera con los datos de lib/pet.ts. El editor de la chapita usa este mismo
// componente con `edit`, así lo que se ve al editar es lo que se publica.
import { FaWhatsapp } from "react-icons/fa6";
import { FiPhone } from "react-icons/fi";
import BioNFCLogo from "@/components/bionfc-logo";
import { FontLinks, getFontFamily } from "@/lib/fonts";
import { landingImageUrl } from "@/lib/landing-image";
import { PET_ABOUT_FIELDS, PET_HEALTH_FIELDS, parsePet, petCallHref, petLook, petRows, petWhatsappHref, type PetData } from "@/lib/pet";
import type { CSSProperties, ReactNode } from "react";

export type PetSection = "design" | "pet" | "family" | "about" | "health" | "finder" | "lost";

export type PetEditControls = { selected: PetSection; onSelect: (section: PetSection) => void };

type PetLanding = { slug?: string | null; business_name?: string | null; logo_url?: string | null; button_style?: unknown };

export default function PetRenderer({ landing, pet: draft, photoUrl, edit }: { landing: PetLanding; pet?: PetData; photoUrl?: string; edit?: PetEditControls }) {
  const pet = draft || parsePet(landing.button_style);
  const look = petLook(pet.look);
  const name = (landing.business_name || "").trim() || "Tu mascota";
  const photo = photoUrl ?? landingImageUrl(landing.logo_url, 384);
  const about = petRows(pet.about, PET_ABOUT_FIELDS);
  const health = petRows(pet.health, PET_HEALTH_FIELDS);
  const contacts = pet.family.filter((member) => petWhatsappHref(member.phone, name));
  // En el editor, cada parte se toca para editarla; en la página pública no hace nada.
  const part = (section: PetSection, className: string) => ({
    className: `${className}${edit ? " pet-editable" : ""}${edit?.selected === section ? " is-selected" : ""}`,
    onClick: edit ? () => edit.onSelect(section) : undefined,
  });
  const style = {
    "--pet-bg": look.background, "--pet-bg-to": look.backgroundTo, "--pet-accent": look.accent, "--pet-accent-ink": look.accentInk,
    "--pet-ink": look.ink, "--pet-card": look.card, "--pet-title-font": getFontFamily(look.titleFont), "--pet-body-font": getFontFamily(look.bodyFont),
  } as CSSProperties;
  const card = (section: PetSection, title: string, body: ReactNode) => <section {...part(section, "pet-card")}><h2>{title}</h2>{body}</section>;

  return (
    <main className={`pet-page${look.dark ? " is-dark" : ""}`} style={style}>
      <FontLinks ids={[look.titleFont, look.bodyFont]} />
      {pet.lost && <section {...part("lost", "pet-lost")} role="alert">
        <strong>¡Estoy perdido!</strong>
        {pet.lostZone.trim() && <span>Me perdí en {pet.lostZone.trim()}</span>}
        {pet.reward.trim() && <em>Recompensa: {pet.reward.trim()}</em>}
      </section>}

      <header {...part("pet", "pet-hero")}>
        <div className="pet-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- foto subida por el usuario, ya optimizada por landingImageUrl */}
          {photo ? <img src={photo} alt={name} /> : <span aria-hidden="true">🐾</span>}
        </div>
        {pet.greeting.trim() && <p className="pet-greeting">{pet.greeting.trim()}</p>}
        <h1 className="pet-name">{name}</h1>
        {pet.message.trim() && <p className="pet-message">{pet.message.trim()}</p>}
      </header>

      <section {...part("family", "pet-family")}>
        {contacts.map((member, index) => <div className="pet-contact" key={index}>
          <a className="pet-whatsapp" href={petWhatsappHref(member.phone, name)} target="_blank" rel="noopener noreferrer" onClick={edit ? (event) => event.preventDefault() : undefined}>
            <FaWhatsapp aria-hidden="true" /><span>{member.name.trim() ? `Avisale a ${member.name.trim()}` : "Avisale a mi familia"}</span>
          </a>
          <a className="pet-call" href={petCallHref(member.phone)} aria-label={`Llamar${member.name.trim() ? ` a ${member.name.trim()}` : ""}`} onClick={edit ? (event) => event.preventDefault() : undefined}><FiPhone aria-hidden="true" /></a>
        </div>)}
        {!contacts.length && edit && <p className="pet-empty">Tocá acá para cargar el WhatsApp de la familia.</p>}
      </section>

      {about.length > 0 && card("about", "Sobre mí", <dl>{about.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>)}
      {pet.finder.trim() && card("finder", "Si me encontrás", <p>{pet.finder.trim()}</p>)}
      {health.length > 0 && card("health", "Mi salud", <dl>{health.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>)}
      {edit && !about.length && !health.length && !pet.finder.trim() && <p {...part("about", "pet-empty")}>Sumá raza, edad, salud o lo que quieras contar.</p>}

      <footer className="landing-branding pet-branding" data-tone={look.dark ? "dark" : undefined}>
        <a href="/?utm_source=bionfc_pet&utm_medium=referral&utm_campaign=footer" target="_blank" rel="noopener noreferrer" aria-label="Creado con BioNFC. Conocé BioNFC (abre en otra pestaña)" onClick={edit ? (event) => event.preventDefault() : undefined}>
          <span className="landing-branding-label">Creado con</span><BioNFCLogo />
        </a>
      </footer>
      {landing.slug && !edit && <a className="pet-report" href={`/denunciar/${encodeURIComponent(landing.slug)}`}>Denunciar esta página</a>}
    </main>
  );
}
