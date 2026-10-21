import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";
import { AdminThemeButton } from "@/components/admin-theme";
import { IconLogOut } from "@/components/icons";
import BioNFCLogo from "@/components/bionfc-logo";
import AdminNavLinks from "./admin-nav-links";
import "../globals.css";

export const metadata: Metadata = {
  title: "Panel de BioNFC",
  robots: { index: false, follow: false, nocache: true },
};

// Wraps every /admin/* route (the dashboard, the editor, QR, clientes, login) — deliberately
// NOT the root layout, which also covers the public /[slug] landing pages. Those are the
// client's own branded page; they must never carry this app's own chrome.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims as { email?: string } | undefined)?.email;
  // El Admin es solo del staff. Un dueño de chapita que entra acá va a su panel (/mi). La base
  // igual lo frena (RLS): esto es para que no vea un Admin vacío.
  if (email) {
    // Si la función no existe o falla (por ejemplo, el código llegó a producción antes que la
    // migración), no se echa a nadie: la base igual protege los datos.
    const { data: isStaff, error } = await supabase.rpc("is_staff");
    if (error) console.error("is_staff falló", error.message);
    else if (!isStaff) redirect("/mi");
  }

  return (
    <div className="admin-shell-frame">
      <nav className="global-nav">
        <Link href="/admin" className="global-nav-brand" aria-label="BIONFC · Inicio del administrador"><BioNFCLogo /></Link>
        {email && <AdminNavLinks />}
        <div className="global-nav-right">
          <AdminThemeButton />
          {email && <span className="global-nav-user">{email}</span>}
          {email && <form action={logout}><button className="global-nav-logout" type="submit" title="Salir" aria-label="Salir"><IconLogOut /></button></form>}
        </div>
      </nav>
      {children}
    </div>
  );
}
