"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconFileText, IconRocket, IconUsers } from "@/components/icons";

const items = [
  { href: "/admin", label: "Resumen", icon: IconRocket },
  { href: "/admin/clientes", label: "Clientes", icon: IconUsers },
  { href: "/admin/paginas", label: "Páginas", icon: IconFileText },
];

export default function AdminNavLinks() {
  const pathname = usePathname();
  return <div className="global-nav-links" aria-label="Secciones del panel">{items.map(({ href, label, icon: Icon }) => {
    const active = href === "/admin" ? pathname === href : pathname.startsWith(href) || href === "/admin/paginas" && pathname.startsWith("/admin/landings");
    return <Link key={href} href={href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}><Icon /><span>{label}</span></Link>;
  })}</div>;
}
