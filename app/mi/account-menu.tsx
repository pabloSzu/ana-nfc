"use client";

// El menú de la cuenta, arriba a la derecha de Mis chapitas: un botón con la inicial del email
// (en el celular el email entero no entra) que abre el email, activar otra chapita, ayuda,
// BIONFC y salir. Se cierra al tocar afuera o con Escape.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { FiChevronDown, FiExternalLink, FiLogOut, FiMessageCircle, FiPlus } from "react-icons/fi";
import { CONTACT_WHATSAPP } from "@/lib/terms";
import { logoutOwner } from "./auth-actions";

const HELP_URL = `${CONTACT_WHATSAPP}?text=${encodeURIComponent("Hola, necesito ayuda con mi chapita BIONFC")}`;

export default function AccountMenu({ email }: { email: string }) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      if (!menu.current?.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  const closeMenu = () => { if (menu.current) menu.current.open = false; };

  return <details ref={menu} className="mi-account">
    <summary aria-label="Tu cuenta"><span className="mi-account-avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</span><FiChevronDown aria-hidden="true" /></summary>
    <div className="mi-account-menu">
      <p><small>Entraste como</small><span>{email}</span></p>
      <Link href="/activar" onClick={closeMenu}><FiPlus aria-hidden="true" />Activar otra chapita</Link>
      <a href={HELP_URL} target="_blank" rel="noopener noreferrer" onClick={closeMenu}><FiMessageCircle aria-hidden="true" />Ayuda por WhatsApp</a>
      <Link href="/" onClick={closeMenu}><FiExternalLink aria-hidden="true" />Conocé BIONFC</Link>
      <form action={logoutOwner}><button type="submit"><FiLogOut aria-hidden="true" />Salir</button></form>
    </div>
  </details>;
}
