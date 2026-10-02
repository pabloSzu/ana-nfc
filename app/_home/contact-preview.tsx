"use client";

import LandingRenderer from "@/components/landing-renderer";
import ScaledPhoneCanvas from "@/components/scaled-phone-canvas";

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
  const isEditorial = example.id === "editorial";
  const isProfessional = example.id === "professional";
  const ink = isEditorial ? "#433b35" : isProfessional ? "#202637" : "#243028";
  const secondaryInk = isEditorial ? "#665f59" : "#47505f";
  const landing = {
    slug: "ejemplo-visual",
    business_type: "contact",
    business_name: example.name,
    description: example.company,
    logo_url: example.photo,
    primary_color: example.accent,
    background_type: "color",
    background_color: example.backdrop,
    button_font: "minimal",
    button_style: {
      contactTheme: example.id,
      contactLayout: example.layout,
      contactDensity: "balanced",
      contactCoverPattern: example.pattern,
      contactSaveLabel: "Guardar contacto",
      showBranding: true,
    },
    title_style: { font: example.font, size: isEditorial ? 38 : 28, color: ink, weight: isEditorial ? 500 : 700, eyebrow: example.role, eyebrowFont: example.font, eyebrowSize: 14, eyebrowColor: secondaryInk },
    subtitle_style: { font: "minimal", size: 14, color: secondaryInk },
    logo_style: { shape: isEditorial ? "square" : "round", borderWidth: 0, shadow: "none", size: isProfessional ? 80 : 104 },
    cover_style: { mode: "banner" },
  };
  const actions = [
    { id: `${example.id}-phone`, type: "phone", title: "Teléfono", url: "+54 351 000 0000" },
    { id: `${example.id}-email`, type: "email", title: "Email", url: "hola@example.com" },
    { id: `${example.id}-site`, type: "custom", title: "Sitio web", url: "" },
  ];

  return (
    <div className="bx-sample bx-contact-sample">
      <div className="bx-sample-screen">
        <div className="bx-contact-sample-interior" inert aria-hidden="true">
          <ScaledPhoneCanvas className="scaled-phone-canvas bx-contact-sample-canvas" designWidth={390} measureUntransformed>
            <LandingRenderer landing={landing} actions={actions} editorPreview />
          </ScaledPhoneCanvas>
        </div>
      </div>
    </div>
  );
}
