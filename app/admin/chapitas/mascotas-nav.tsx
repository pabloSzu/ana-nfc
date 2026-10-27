import Link from "next/link";

const sections = [
  { href: "/admin/chapitas", label: "Lotes", key: "stock" },
  { href: "/admin/chapitas/fichas", label: "Mascotas activadas", key: "fichas" },
  { href: "/admin/chapitas/tutorial", label: "¿Cómo funciona?", key: "tutorial" },
] as const;

export default function MascotasNav({ active }: { active: typeof sections[number]["key"] }) {
  return <nav className="ch-section-nav" aria-label="Secciones de Mascotas">
    {sections.map((section) => <Link key={section.key} href={section.href} className={`is-${section.key}${active === section.key ? " is-active" : ""}`} aria-current={active === section.key ? "page" : undefined}>{section.label}</Link>)}
  </nav>;
}
