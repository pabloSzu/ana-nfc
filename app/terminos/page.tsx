import type { Metadata } from "next";
import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import { TermsSections, TermsSummary } from "@/components/terms-content";
import { CONTACT_EMAIL, TERMS_UPDATED } from "@/lib/terms";
import "../globals.css";
import "../mi/mi.css";

export const metadata: Metadata = { title: "Términos y privacidad · BIONFC" };

// Términos de uso y privacidad (el texto está en components/terms-content.tsx). Al activar se
// leen en una hoja sin salir de la pantalla; esta página queda para los links (footer, emails).
// ?volver=/activar?c=… : si se llega desde un link viejo de "Activar", la barra de arriba vuelve
// ahí con el código ya cargado. Solo se aceptan rutas propias (nunca otro sitio).
const safeBack = (value: string | undefined) => value && /^\/(activar|mi)([/?][\w\-/=?&]*)?$/.test(value) ? value : "";

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const back = safeBack((await searchParams).volver);
  return <div className="mi-shell">
    <header className="mi-top terms-top">
      {back
        ? <Link className="terms-back" href={back}>← Volver {back.startsWith("/activar") ? "a activar" : ""}</Link>
        : <Link href="/" className="mi-brand" aria-label="BIONFC"><BioNFCLogo /></Link>}
    </header>
    <main className="mi-main terms terms-page">
      <header className="terms-hero">
        <span className="terms-eyebrow">Información legal</span>
        <h1>Términos y privacidad</h1>
        <p>Te contamos de forma clara cómo funciona BIONFC y qué pasa con la información de tu chapita.</p>
        <small>Actualizados el {TERMS_UPDATED}</small>
      </header>
      <div className="terms-page-grid">
        <aside><TermsSummary /></aside>
        <article className="terms-document">
          <div className="terms-document-title">
            <div><span>Documento completo</span><h2>Todo el detalle, punto por punto</h2></div>
            <span className="terms-read-time">Lectura: 4 min</span>
          </div>
          <TermsSections />
          <footer className="terms-contact">
            <strong>¿Te quedó alguna duda?</strong>
            <p>Escribinos y te ayudamos a entender cualquier punto.</p>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </footer>
        </article>
      </div>
    </main>
  </div>;
}
