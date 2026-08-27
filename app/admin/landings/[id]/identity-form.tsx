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

export default function IdentityForm({ landing, action, uploadAction, uploadBackgroundAction }: { landing: Landing; action: (formData: FormData) => void | Promise<void>; uploadAction: (formData: FormData) => void | Promise<void>; uploadBackgroundAction: (formData: FormData) => void | Promise<void> }) {
  const { draft, update } = useDraft();
  const [customText, setCustomText] = useState(Boolean(landing.text_color));

  return (
    <>
      <form action={action} className="stack">
        <input type="hidden" name="id" value={landing.id} />
        <label className="label">Nombre<input name="business_name" defaultValue={landing.business_name} onChange={(event) => update({ business_name: event.target.value })} /></label>
        <label className="label">Descripción<textarea name="description" defaultValue={landing.description || ""} onChange={(event) => update({ description: event.target.value })} /></label>
        <label className="label">Logo URL<input name="logo_url" defaultValue={landing.logo_url || ""} placeholder="https://..." onChange={(event) => update({ logo_url: event.target.value })} /></label>
        <label className="label">WhatsApp principal<input name="whatsapp" defaultValue={landing.whatsapp || ""} placeholder="549351..." /></label>
        <label className="label">Color principal<input name="primary_color" type="color" defaultValue={landing.primary_color || "#1f2937"} onChange={(event) => update({ primary_color: event.target.value })} /></label>
        <BackgroundPicker landing={landing} />
        <div className="label">
          Color del texto principal
          <div className="profile-action-color" style={{ marginTop: 7 }}>
            <label className="check-label">
              <input
                type="checkbox"
                name="custom_text_color"
                checked={customText}
                onChange={(event) => { setCustomText(event.target.checked); update({ text_color: event.target.checked ? autoTextColor(draft) : "" }); }}
              />
              Personalizar (si no, se calcula solo según el fondo)
            </label>
            {customText && (
              <input type="color" name="text_color" defaultValue={landing.text_color || autoTextColor(draft)} onChange={(event) => update({ text_color: event.target.value })} />
            )}
          </div>
        </div>
        <label className="label">¿A dónde apunta el NFC? (opcional)<input name="redirect_url" type="url" defaultValue={landing.redirect_url || ""} placeholder="https://instagram.com/tunegocio" /></label>
        <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Dejalo vacío para usar esta landing. Si pegás un link (Instagram, tu web, Linktree...), el tag NFC va a llevar directo ahí en vez de mostrar esta página.</p>
        <button className="btn full" type="submit">Guardar identidad</button>
      </form>
      <LogoUpload action={uploadAction} landingId={landing.id} />
      {draft.background_type === "image" && <BackgroundImageUpload action={uploadBackgroundAction} landingId={landing.id} currentUrl={landing.background_image_url} />}
    </>
  );
}
