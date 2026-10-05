"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { FiArrowUpRight, FiDownload, FiGlobe, FiMail, FiPhone } from "react-icons/fi";

export type ContactPreviewExample = {
  id: "essential" | "editorial" | "professional";
  name: string;
  role: string;
  company: string;
  accent: string;
  backdrop: string;
  font: string;
  layout: "card" | "document";
  pattern: "original" | "grid";
  photo?: string;
};

export default function ContactPreview({ example }: { example: ContactPreviewExample }) {
  const initials = example.name.split(" ").map((part) => part[0]).join("");

  return (
    <div className="bx-sample bx-contact-sample" data-contact-design={example.id} style={{ "--contact-accent": example.accent, "--contact-bg": example.backdrop } as CSSProperties}>
      <div className="bx-sample-screen">
        <div className="bx-contact-status" aria-hidden="true"><span>9:41</span><span>••• ▰</span></div>
        <div className="bx-contact-card">
          <div className="bx-contact-cover">
            {example.photo && example.id !== "essential" ? <Image src={example.photo} alt="" fill sizes="280px" /> : <span aria-hidden="true">{initials}</span>}
          </div>
          <div className="bx-contact-identity">
            <div className="bx-contact-avatar">{example.photo ? <Image src={example.photo} alt="" fill sizes="90px" /> : initials}</div>
            <p>{example.role}</p><h3>{example.name}</h3><span>{example.company}</span>
          </div>
          <div className="bx-contact-actions">
            <div className="bx-contact-save"><FiDownload aria-hidden="true" /> Guardar contacto</div>
            <div className="bx-contact-quick">
              <div><span><FiPhone /></span><b>Llamar</b></div><div><span><FiMail /></span><b>Email</b></div><div><span><FiGlobe /></span><b>Web</b></div>
            </div>
          </div>
          <div className="bx-contact-details">
            <div><FiPhone /><span><small>Teléfono</small><b>+54 351 000 0000</b></span><FiArrowUpRight /></div>
            <div><FiMail /><span><small>Email</small><b>hola@ejemplo.com</b></span><FiArrowUpRight /></div>
          </div>
        </div>
        <div className="bx-contact-brand">HECHO CON <b>BIONFC</b></div>
      </div>
    </div>
  );
}
