"use client";

import LandingRenderer from "@/components/landing-renderer";
import ScaledPhoneCanvas from "@/components/scaled-phone-canvas";
import { FontLinks } from "@/lib/fonts";
import type { BusinessTemplate } from "@/lib/business-templates";

// Miniatura de una plantilla: la página real, achicada. La usan el panel del editor y
// Admin → Plantillas, así las dos muestran exactamente lo que va a quedar.
export default function TemplatePreview({ template, className = "" }: { template: BusinessTemplate; className?: string }) {
  const landing = { ...template.landing, id: template.id, slug: "", business_type: "custom", published: true };
  const actions = template.actions.map((action, index) => ({ use_auto_color: true, ...action, id: `${template.id}-${index}` }));
  const fonts = [template.landing.font_pair, template.landing.button_font, String(template.landing.title_style.font || ""), String(template.landing.title_style.eyebrowFont || ""), String(template.landing.subtitle_style.font || "")].filter(Boolean);
  return <div className={`template-preview ${className}`} aria-hidden="true">
    <FontLinks ids={fonts} />
    {/* En modo miniatura el lienzo no dibuja la foto de fondo aparte: la dibuja la propia página. */}
    <ScaledPhoneCanvas className="template-preview-canvas" fit="contain"><LandingRenderer landing={landing} actions={actions} editorPreview /></ScaledPhoneCanvas>
  </div>;
}
