import Link from "next/link";

const sections = [
  { href: "/admin/chapitas", label: "Chapitas y stock", key: "stock" },
  { href: "/admin/chapitas/fichas", label: "Fichas de mascotas", key: "fichas" },
  { href: "/admin/chapitas/tutorial", label: "Guía completa", key: "tutorial" },
] as const;

export default function MascotasNav({ active }: { active: typeof sections[number]["key"] }) {
  return <nav className="ch-section-nav" aria-label="Secciones de Mascotas">
    {sections.map((section) => <Link key={section.key} href={section.href} className={active === section.key ? "is-active" : ""} aria-current={active === section.key ? "page" : undefined}>{section.label}</Link>)}
  </nav>;
}
