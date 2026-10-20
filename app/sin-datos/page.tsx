import type { Metadata } from "next";
import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/terms";
import "../globals.css";
import "../mi/mi.css";

export const metadata: Metadata = { title: "Esta chapita todavía no tiene datos · BIONFC", robots: { index: false, follow: false } };

// Adonde llega quien escanea una chapita que no está publicada: el dueño la activó pero todavía
// no cargó el WhatsApp, o BIONFC la pausó. Ver app/go/[id]/route.ts.
export default function NoDataPage() {
  return <div className="mi-shell">
    <header className="mi-top"><Link href="/" className="mi-brand" aria-label="BIONFC"><BioNFCLogo /></Link></header>
    <main className="mi-main mi-narrow">
      <p className="mi-emoji" aria-hidden="true">🐾</p>
      <h1>Esta chapita todavía no tiene datos</h1>
      <div className="mi-card mi-form">
        <p><strong>¿Es tuya?</strong> Entrá con tu email y cargá el WhatsApp de la familia: desde ese momento, quien la escanee puede avisarte.</p>
        <Link className="mi-button" href="/mi">Cargar los datos</Link>
      </div>
      <div className="mi-card mi-form">
        <p><strong>¿Encontraste a una mascota con esta chapita?</strong> Escribinos y tratamos de ubicar a su familia.</p>
        <a className="mi-button mi-button-secondary" href={CONTACT_WHATSAPP} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
        <p className="mi-hint mi-center">o a {CONTACT_EMAIL}</p>
      </div>
    </main>
  </div>;
}
