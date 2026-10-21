import type { Metadata } from "next";
import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import BioNFCSignature from "@/components/bionfc-signature";
import { createClient } from "@/lib/supabase/server";
import ActivateFlow from "./activate-flow";
import "../globals.css";
import "../mi/mi.css";

export const metadata: Metadata = { title: "Activá tu chapita · BIONFC", robots: { index: false, follow: false } };

// Adonde llega quien escanea una chapita sin activar (/go/[id] la manda acá) o entra a
// bionfc.com/activar con la tarjetita en la mano.
export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims as { email?: string } | undefined)?.email || "";
  // Si el que tiene la sesión abierta es el staff (Pablo vendiendo en la calle), la chapita
  // quedaría a su nombre: la tiene que activar el comprador desde su celular.
  const isStaff = email ? Boolean((await supabase.rpc("is_staff")).data) : false;
  return <div className="mi-shell">
    <header className="mi-top"><Link href="/" className="mi-brand" aria-label="BIONFC"><BioNFCLogo /></Link></header>
    <main className="mi-main mi-narrow">
      <div className="mi-hero-mark" aria-hidden="true"><span>🐾</span></div>
      <h1>Activá tu chapita</h1>
      <p className="mi-lead">En dos minutos queda lista para ayudar a tu mascota a volver a casa.</p>
      {isStaff
        ? <p className="mi-error">Estás con tu cuenta de administrador ({email}): si activás acá, la chapita queda a tu nombre. Que la active el comprador desde su celular, o abrí esta página en una ventana de incógnito.</p>
        : <ActivateFlow initialCode={c || ""} signedInEmail={email} />}
    </main>
    <BioNFCSignature className="mi-signature" />
  </div>;
}
