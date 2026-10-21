"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconFileText, IconPaintRoller, IconPaw, IconRocket, IconUsers } from "@/components/icons";

const items = [
  { href: "/admin", label: "Resumen", icon: IconRocket },
  { href: "/admin/clientes", label: "Clientes", icon: IconUsers },
  { href: "/admin/paginas", label: "Páginas", icon: IconFileText },
  { href: "/admin/plantillas", label: "Plantillas", icon: IconPaintRoller },
  { href: "/admin/chapitas", label: "Mascotas", icon: IconPaw },
];

export default function AdminNavLinks() {
  const pathname = usePathname();
  return <div className="global-nav-links" aria-label="Secciones del panel">{items.map(({ href, label, icon: Icon }) => {
    const petEditor = /^\/admin\/landings\/[^/]+\/mascota(?:\/|$)/.test(pathname);
    const active = href === "/admin" ? pathname === href : href === "/admin/chapitas" ? pathname.startsWith(href) || petEditor : pathname.startsWith(href) || href === "/admin/paginas" && pathname.startsWith("/admin/landings") && !petEditor;
    return <Link key={href} href={href} className={[href === "/admin/chapitas" ? "is-pets" : "", active ? "is-active" : ""].filter(Boolean).join(" ")} aria-current={active ? "page" : undefined}><Icon /><span>{label}</span></Link>;
  })}</div>;
}
