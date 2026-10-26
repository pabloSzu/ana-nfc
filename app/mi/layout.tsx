import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/terms";
import { FiMessageCircle } from "react-icons/fi";
import AccountMenu from "./account-menu";
import "../globals.css";
import "./mi.css";

export const metadata: Metadata = {
  title: "Mi chapita · BIONFC",
  robots: { index: false, follow: false },
};

// Panel de los dueños de chapitas: aparte del Admin, sin nada de sus herramientas.
export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims as { email?: string } | undefined)?.email;
  return <div className="mi-shell">
    <header className="mi-top">
      <Link href="/mi" className="mi-brand" aria-label="Mis chapitas"><BioNFCLogo /></Link>
      {email && <AccountMenu email={email} />}
    </header>
    <div className="mi-content">{children}</div>
    {/* Abajo, lo que el dueño puede necesitar: dónde pedir ayuda. */}
    <footer className="mi-footer">
      <a className="mi-help" href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent("Hola, necesito ayuda con mi chapita BIONFC")}`} target="_blank" rel="noopener noreferrer">
        <span className="mi-help-icon" aria-hidden="true"><FiMessageCircle /></span>
        <span className="mi-help-copy"><strong>¿Necesitás ayuda?</strong><small>Te respondemos por WhatsApp</small></span>
        <b>Escribinos</b>
      </a>
      <p><Link href="/terminos">Términos y condiciones</Link><span aria-hidden="true">·</span><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
    </footer>
  </div>;
}
