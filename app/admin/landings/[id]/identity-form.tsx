"use client";

import { useState, type CSSProperties } from "react";
import { useDraft } from "./draft-context";
import { autoTextColor, panelBackground, resolveTextColor } from "@/lib/landing-catalog";
import LogoUpload from "./logo-upload";
import BackgroundPicker from "./background-picker";
import BackgroundImageUpload from "./background-image-upload";
import FontPicker from "./font-picker";
import { IconEdit, IconImage, IconDroplet } from "@/components/icons";

type Landing = {
  id: string;
  business_name: string;
  description?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  background_color?: string | null;
  background_type?: string | null;
  background_gradient_to?: string | null;
  background_image_url?: string | null;
  text_color?: string | null;
  text_panel_color?: string | null;
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
  const [customPanel, setCustomPanel] = useState(Boolean(landing.text_panel_color));
  const [showLogoUrl, setShowLogoUrl] = useState(false);
  const resolvedTextColor = resolveTextColor(draft);

  return (
    <div className="stack">
      <form id={FORM_ID} action={action}><input type="hidden" name="id" value={landing.id} /></form>

      <p className="subsection-title" style={{ marginTop: 0 }}><IconEdit /> Título</p>

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

      <FontPicker label="Fuente del título" value={draft.font_pair} onChange={(id) => update({ font_pair: id })} />
      <input type="hidden" form={FORM_ID} name="font_pair" value={draft.font_pair} />

      <label className="label">Descripción<textarea form={FORM_ID} name="description" defaultValue={landing.description || ""} onChange={(event) => update({ description: event.target.value })} placeholder="Una frase corta que aparece debajo del nombre" /></label>

      <label className="check-label">
        <input type="checkbox" form={FORM_ID} name="text_panel" checked={draft.text_panel} onChange={(event) => update({ text_panel: event.target.checked })} />
        Ponerle un fondo al texto (ayuda a que se lea sobre fotos)
      </label>
      {draft.text_panel && (
        <div className="profile-action-color" style={{ marginTop: -6 }}>
          <input type="hidden" form={FORM_ID} name="custom_panel_color" value={customPanel ? "on" : "off"} />
          <label className="check-label">
            <input
              type="checkbox"
              checked={customPanel}
              onChange={(event) => { setCustomPanel(event.target.checked); update({ text_panel_color: event.target.checked ? (resolvedTextColor === "#ffffff" ? "#000000" : "#ffffff") : "" }); }}
            />
            Color del fondo personalizado
          </label>
          {customPanel && (
            <input
              type="color"
              form={FORM_ID}
              name="text_panel_color"
              value={draft.text_panel_color || (resolvedTextColor === "#ffffff" ? "#000000" : "#ffffff")}
              onChange={(event) => update({ text_panel_color: event.target.value })}
              title="Se aplica con transparencia"
            />
          )}
        </div>
      )}

      <p className="subsection-title"><IconImage /> Logo</p>

      <label className="label">
        Color de fondo del logo
        <input form={FORM_ID} name="primary_color" type="color" defaultValue={landing.primary_color || "#1f2937"} onChange={(event) => update({ primary_color: event.target.value })} />
      </label>
      <p className="muted" style={hint}>Se ve detrás del círculo del logo (si no subiste foto, es el color de fondo de la inicial) y como reserva en botones sin color propio.</p>

      <LogoUpload action={uploadAction} removeAction={removeLogoAction} landingId={landing.id} currentUrl={landing.logo_url} />
      {showLogoUrl ? (
        <input form={FORM_ID} name="logo_url" defaultValue={landing.logo_url || ""} placeholder="https://..." onChange={(event) => update({ logo_url: event.target.value })} />
      ) : (
        <>
          <input type="hidden" form={FORM_ID} name="logo_url" value={landing.logo_url || ""} />
          <button type="button" className="text-button" onClick={() => setShowLogoUrl(true)}>o pegar una URL en vez de subir</button>
        </>
      )}
      <p className="muted" style={hint}>Se muestra en un círculo redondo arriba del nombre. Si no subís nada, se ve la inicial del nombre.</p>

      <p className="subsection-title"><IconDroplet /> Fondo de la landing</p>

      <BackgroundPicker landing={landing} formId={FORM_ID} />
      {draft.background_type === "image" && <BackgroundImageUpload action={uploadBackgroundAction} removeAction={removeBackgroundAction} landingId={landing.id} currentUrl={landing.background_image_url} />}

      <input type="hidden" form={FORM_ID} name="redirect_url" value={landing.redirect_url || ""} />

      <button form={FORM_ID} className="btn full" type="submit">Guardar identidad</button>
    </div>
  );
}
