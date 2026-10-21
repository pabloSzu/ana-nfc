import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import BioNFCSignature from "@/components/bionfc-signature";
import { createClient } from "@/lib/supabase/server";
import { logoutOwner } from "./auth-actions";
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
      {email && <form action={logoutOwner} className="mi-top-user"><span>{email}</span><button type="submit" className="mi-link">Salir</button></form>}
    </header>
    <div className="mi-content">{children}</div>
    <BioNFCSignature className="mi-signature" />
  </div>;
}
