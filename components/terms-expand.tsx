"use client";

// En /terminos: "Abrir todo" / "Cerrar todo" para los puntos del documento (son acordeones), y si
// se llega con un link a un punto (/terminos#tus-datos) ese punto se abre solo.
import { useEffect, useState } from "react";

export default function TermsExpandAll() {
  const [allOpen, setAllOpen] = useState(false);
  const sections = () => Array.from(document.querySelectorAll<HTMLDetailsElement>(".terms-document details.terms-section"));

  useEffect(() => {
    const openFromHash = () => {
      const target = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (target instanceof HTMLDetailsElement) { target.open = true; target.scrollIntoView({ block: "start" }); }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return <button type="button" className="terms-expand" onClick={() => { const next = !allOpen; sections().forEach((section) => { section.open = next; }); setAllOpen(next); }}>
    {allOpen ? "Cerrar todo" : "Abrir todo"}
  </button>;
}
