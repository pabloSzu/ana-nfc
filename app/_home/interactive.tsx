"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

// ---------------------------------------------------------------- nav

/** Light navigation stays readable over the photograph and gains definition on scroll. */
export function HomeNav({ children, links }: { children: ReactNode; links: { href: string; label: string }[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); };
  }, []);
  return <nav className={`bx-nav${scrolled ? " is-scrolled" : ""}${menuOpen ? " has-menu" : ""}`} aria-label="Principal" onKeyDown={(event) => { if (event.key === "Escape") { setMenuOpen(false); document.getElementById("home-menu-toggle")?.focus(); } }}>
    {children}
    <button id="home-menu-toggle" className="bx-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="home-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Cerrar" : "Menú"}<span aria-hidden="true">{menuOpen ? "×" : "+"}</span></button>
    <div id="home-mobile-menu" className="bx-mobile-menu" hidden={!menuOpen}>{links.map((link, index) => <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span>{link.label}<span aria-hidden="true">↗</span></a>)}<a href="#preguntas" onClick={() => setMenuOpen(false)}><span>05</span>Preguntas frecuentes<span aria-hidden="true">↗</span></a></div>
  </nav>;
}

// ---------------------------------------------------------------- FAQ

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const id = useId();
  return (
    <div className="bx-faq">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q} className={`bx-faq-item${isOpen ? " is-open" : ""}`}>
            <h3><button type="button" className="bx-faq-q" id={`${id}-q-${index}`} aria-controls={`${id}-a-${index}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : index)}>
              <span className="bx-faq-number" aria-hidden="true">0{index + 1}</span>
              <span>{item.q}</span>
              <span className="bx-faq-icon" aria-hidden="true">+</span>
            </button></h3>
            <div className="bx-faq-a" id={`${id}-a-${index}`} role="region" aria-labelledby={`${id}-q-${index}`} aria-hidden={!isOpen}><div><p>{item.a}</p></div></div>
          </div>
        );
      })}
    </div>
  );
}
