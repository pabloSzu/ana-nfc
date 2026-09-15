import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";
import { AdminThemeButton } from "@/components/admin-theme";
import { IconLogOut, IconRocket } from "@/components/icons";

// Wraps every /admin/* route (the dashboard, the editor, QR, clientes, login) — deliberately
// NOT the root layout, which also covers the public /[slug] landing pages. Those are the
// client's own branded page; they must never carry this app's own chrome.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims as { email?: string } | undefined)?.email;

  return (
    <div className="admin-shell-frame">
      <nav className="global-nav">
        <Link href="/admin" className="global-nav-brand"><span className="global-nav-mark"><IconRocket /></span> Mi Landing Web Fácil</Link>
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
