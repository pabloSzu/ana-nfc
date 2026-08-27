"use client";

import { useState, type CSSProperties } from "react";
import { useDraft } from "./draft-context";
import { autoTextColor, FONT_PAIRS } from "@/lib/landing-catalog";
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
const hint: CSSProperties = { fontSize: "0.75rem", marginTop: "-8px" };

export default function IdentityForm({
  landing,
  action,
  uploadAction,
  removeLogoAction,
  uploadBackgroundAction,
  removeBackgroundAction,
}: {
  landing: Landing;
  action: (formData: FormData) => void | Promise<void>;
  uploadAction: (formData: FormData) => void | Promise<void>;
  removeLogoAction: (formData: FormData) => void | Promise<void>;
  uploadBackgroundAction: (formData: FormData) => void | Promise<void>;
  removeBackgroundAction: (formData: FormData) => void | Promise<void>;
}) {
  const { draft, update } = useDraft();
  const [customText, setCustomText] = useState(Boolean(landing.text_color));
  const [showLogoUrl, setShowLogoUrl] = useState(false);

  return (
    <div className="stack">
      <form id={FORM_ID} action={action}><input type="hidden" name="id" value={landing.id} /></form>

      <div className="name-row">
        <label className="label" style={{ flex: 1 }}>
          Nombre del negocio
          <input form={FORM_ID} name="business_name" defaultValue={landing.business_name} onChange={(event) => update({ business_name: event.target.value })} />
        </label>
        <label className="label">
          Color del texto
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
      <p className="muted" style={hint}>El color del texto se elige solo según el fondo. Tocá el cuadrito de arriba si querés forzar otro.</p>
      <label className="check-label">
        <input type="checkbox" form={FORM_ID} name="text_panel" checked={draft.text_panel} onChange={(event) => update({ text_panel: event.target.checked })} />
        Ponerle un fondo al texto (ayuda a que se lea sobre fotos)
      </label>

      <label className="label">Descripción<textarea form={FORM_ID} name="description" defaultValue={landing.description || ""} onChange={(event) => update({ description: event.target.value })} placeholder="Una frase corta que aparece debajo del nombre" /></label>

      <div className="label">
        Tipografía
        <div className="font-presets">
          {FONT_PAIRS.map((pair) => (
            <button
              type="button"
              key={pair.id}
              className={draft.font_pair === pair.id ? "font-swatch active" : "font-swatch"}
              style={{ fontFamily: pair.heading }}
              onClick={() => update({ font_pair: pair.id })}
            >
              Aa
              <small style={{ fontFamily: pair.body }}>{pair.label}</small>
            </button>
          ))}
        </div>
        <input type="hidden" form={FORM_ID} name="font_pair" value={draft.font_pair} />
      </div>

      <div className="label">
        Logo o foto
        <LogoUpload action={uploadAction} removeAction={removeLogoAction} landingId={landing.id} currentUrl={landing.logo_url} />
        {showLogoUrl ? (
          <input form={FORM_ID} name="logo_url" defaultValue={landing.logo_url || ""} placeholder="https://..." onChange={(event) => update({ logo_url: event.target.value })} style={{ marginTop: 7 }} />
        ) : (
          <button type="button" className="text-button" style={{ marginTop: 7 }} onClick={() => setShowLogoUrl(true)}>o pegar una URL en vez de subir</button>
        )}
        <p className="muted" style={{ ...hint, marginTop: 7 }}>Se muestra en un círculo redondo arriba del nombre. Si no subís nada, se ve la inicial del nombre.</p>
      </div>

      <label className="label">
        WhatsApp del botón principal
        <input form={FORM_ID} name="whatsapp" defaultValue={landing.whatsapp || ""} placeholder="5493511234567" />
      </label>
      <p className="muted" style={hint}>Con código de país y de área, sin espacios ni el signo +. Ejemplo: 5493511234567.</p>

      <label className="label">
        Color de fondo del logo
        <input form={FORM_ID} name="primary_color" type="color" defaultValue={landing.primary_color || "#1f2937"} onChange={(event) => update({ primary_color: event.target.value })} />
      </label>
      <p className="muted" style={hint}>Se ve detrás del círculo del logo (si no subiste foto, es el color de fondo de la inicial) y como reserva en botones sin color propio.</p>

      <BackgroundPicker landing={landing} formId={FORM_ID} />
      {draft.background_type === "image" && <BackgroundImageUpload action={uploadBackgroundAction} removeAction={removeBackgroundAction} landingId={landing.id} currentUrl={landing.background_image_url} />}

      <label className="label">¿A dónde apunta el NFC? (opcional)<input form={FORM_ID} name="redirect_url" type="url" defaultValue={landing.redirect_url || ""} placeholder="https://instagram.com/tunegocio" /></label>
      <p className="muted" style={hint}>Dejalo vacío para usar esta landing. Si pegás un link (Instagram, tu web, Linktree...), el tag NFC va a llevar directo ahí en vez de mostrar esta página.</p>

      <button form={FORM_ID} className="btn full" type="submit">Guardar identidad</button>
    </div>
  );
}
