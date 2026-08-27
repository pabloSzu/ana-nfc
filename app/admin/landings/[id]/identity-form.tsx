"use client";

import { useState } from "react";
import { useDraft } from "./draft-context";
import { autoTextColor } from "@/lib/landing-catalog";
import LogoUpload from "./logo-upload";
import BackgroundPicker from "./background-picker";
import BackgroundImageUpload from "./background-image-upload";

type Landing = {
  id: string;
  business_name: string;
  description?: string | null;
  logo_url?: string | null;
  whatsapp?: string | null;
  primary_color?: string | null;
  background_color?: string | null;
  background_type?: string | null;
  background_gradient_to?: string | null;
  background_image_url?: string | null;
  text_color?: string | null;
  redirect_url?: string | null;
};

const FORM_ID = "identity-form";

export default function IdentityForm({ landing, action, uploadAction, uploadBackgroundAction }: { landing: Landing; action: (formData: FormData) => void | Promise<void>; uploadAction: (formData: FormData) => void | Promise<void>; uploadBackgroundAction: (formData: FormData) => void | Promise<void> }) {
  const { draft, update } = useDraft();
  const [customText, setCustomText] = useState(Boolean(landing.text_color));
  const [showLogoUrl, setShowLogoUrl] = useState(false);

  return (
    <div className="stack">
      <form id={FORM_ID} action={action}><input type="hidden" name="id" value={landing.id} /></form>

      <div className="name-row">
        <label className="label" style={{ flex: 1 }}>
          Nombre
          <input form={FORM_ID} name="business_name" defaultValue={landing.business_name} onChange={(event) => update({ business_name: event.target.value })} />
        </label>
        <label className="label">
          Color texto
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="hidden" form={FORM_ID} name="custom_text_color" value={customText ? "on" : "off"} />
            <input
              type="color"
              form={FORM_ID}
              name="text_color"
              value={draft.text_color || autoTextColor(draft)}
              title={customText ? "Color personalizado" : "Automático — cambialo para personalizar"}
              onChange={(event) => { setCustomText(true); update({ text_color: event.target.value }); }}
            />
            {customText && (
              <button type="button" className="icon-button" title="Volver a automático" onClick={() => { setCustomText(false); update({ text_color: "" }); }}>↺</button>
            )}
          </div>
        </label>
      </div>

      <label className="label">Descripción<textarea form={FORM_ID} name="description" defaultValue={landing.description || ""} onChange={(event) => update({ description: event.target.value })} /></label>

      <div className="label">
        Logo
        <LogoUpload action={uploadAction} landingId={landing.id} currentUrl={landing.logo_url} />
        {showLogoUrl ? (
          <input form={FORM_ID} name="logo_url" defaultValue={landing.logo_url || ""} placeholder="https://..." onChange={(event) => update({ logo_url: event.target.value })} style={{ marginTop: 7 }} />
        ) : (
          <button type="button" className="text-button" style={{ marginTop: 7 }} onClick={() => setShowLogoUrl(true)}>o pegar una URL en vez de subir</button>
        )}
      </div>

      <label className="label">WhatsApp principal<input form={FORM_ID} name="whatsapp" defaultValue={landing.whatsapp || ""} placeholder="549351..." /></label>
      <label className="label">Color principal<input form={FORM_ID} name="primary_color" type="color" defaultValue={landing.primary_color || "#1f2937"} onChange={(event) => update({ primary_color: event.target.value })} /></label>

      <BackgroundPicker landing={landing} formId={FORM_ID} />
      {draft.background_type === "image" && <BackgroundImageUpload action={uploadBackgroundAction} landingId={landing.id} currentUrl={landing.background_image_url} />}

      <label className="label">¿A dónde apunta el NFC? (opcional)<input form={FORM_ID} name="redirect_url" type="url" defaultValue={landing.redirect_url || ""} placeholder="https://instagram.com/tunegocio" /></label>
      <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Dejalo vacío para usar esta landing. Si pegás un link (Instagram, tu web, Linktree...), el tag NFC va a llevar directo ahí en vez de mostrar esta página.</p>

      <button form={FORM_ID} className="btn full" type="submit">Guardar identidad</button>
    </div>
  );
}
