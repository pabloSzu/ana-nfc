import { createClient } from "@/lib/supabase/server";
import { parseButtonZone, parseTitleStyle, parseSubtitleStyle, parseLogoStyle, parseBackgroundPosition } from "@/lib/landing-catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import ActionForm from "./action-form";
import ActionCard from "./action-card";
import ProfileActionsForm, { PROFILE_ACTIONS_FORM_ID } from "./profile-actions-form";
import IdentityForm from "./identity-form";
import PhonePreview from "./phone-preview";
import BuilderTabs from "./builder-tabs";
import { DraftProvider, type Draft } from "./draft-context";
import { save, addAction, updateAction, removeAction, moveAction, uploadLogo, removeLogo, uploadBackgroundImage, removeBackgroundImage, saveProfileActions } from "./actions";
import { publish, deleteLanding } from "../../actions";
import DeleteLandingButton from "../../delete-landing-button";
import { IconQrCode, IconEye, IconPlus } from "@/components/icons";
import Toast from "@/components/toast";
import { Suspense } from "react";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).maybeSingle();
  if (!landing) notFound();
  const { data: actions } = await supabase.from("actions").select("*").eq("landing_id", id).order("position");
  const customActions = actions?.filter((action) => !action.is_generated) || [];
  const enabledCustomActions = customActions.filter((action) => action.enabled);

  const enabledActions: Record<string, boolean> = {};
  const actionColors: Record<string, { bg: string; text: string } | undefined> = {};
  actions?.forEach((action) => {
    if (action.is_generated && action.source_field) {
      enabledActions[action.source_field] = action.enabled === true;
      if (action.use_auto_color === false) actionColors[action.source_field] = { bg: action.background_color || "#1f2937", text: action.text_color || "#ffffff" };
    }
  });

  const initialDraft: Draft = {
    business_name: landing.business_name || "",
    description: landing.description || "",
    logo_url: landing.logo_url || "",
    primary_color: landing.primary_color || "#1f2937",
    background_color: landing.background_color || "#f7f5f0",
    background_type: landing.background_type || "color",
    background_gradient_to: landing.background_gradient_to || "#a6c1ee",
    background_image_url: landing.background_image_url || "",
    text_color: landing.text_color || "",
    text_panel: landing.text_panel === true,
    text_panel_color: landing.text_panel_color || "",
    font_pair: landing.font_pair || "modern",
    button_font: landing.button_font || "modern",
    button_shape: landing.button_shape || "rounded",
    button_fill: landing.button_fill || "solid",
    buttonZone: parseButtonZone(landing.button_style),
    titleStyle: parseTitleStyle(landing),
    subtitleStyle: parseSubtitleStyle(landing),
    logoStyle: parseLogoStyle(landing.logo_style),
    bgPosition: parseBackgroundPosition(landing.background_style),
    enabledActions,
    actionColors,
  };

  const identityPanel = (
    <section className="builder-block">
      <div className="section-heading">
        <div><h2>Identidad</h2><p className="muted">La primera impresión de tu landing: nombre, foto y colores.</p></div>
      </div>
      <IdentityForm landing={landing} action={save} uploadAction={uploadLogo} removeLogoAction={removeLogo} uploadBackgroundAction={uploadBackgroundImage} removeBackgroundAction={removeBackgroundImage} />
    </section>
  );

  const actionsPanel = (
    <section className="builder-block">
      <div className="section-heading">
        <div><h2>Botones de la landing</h2><p className="muted">Activá los que necesites y completá el enlace de cada uno.</p></div>
      </div>
      <ProfileActionsForm action={saveProfileActions} landingId={id} initial={actions || []} />
      <details className="advanced-actions">
        <summary className="custom-action-trigger">
          <span className="plus-badge"><IconPlus /></span>
          <span className="custom-action-trigger-text">
            <b>Botón personalizado</b>
            <small>¿Necesitás algo que no está en la lista de arriba? Agregá cualquier link.</small>
          </span>
        </summary>
        <ActionForm action={addAction} landingId={id} />
        <div className="action-list">
          {customActions.map((action, index) => (
            <ActionCard key={action.id} action={action} landingId={id} update={updateAction} remove={removeAction} move={moveAction} first={index === 0} last={index === customActions.length - 1} />
          ))}
        </div>
      </details>
      <button form={PROFILE_ACTIONS_FORM_ID} className="btn full" type="submit" style={{ marginTop: "var(--space-6)" }}>Guardar todos los cambios</button>
    </section>
  );

  const publishPanel = (
    <section className="builder-block publish-block">
      <div>
        <h2>{landing.published ? "Tu landing está online" : "Tu landing está en borrador"}</h2>
        <p className="muted">{landing.published ? "Cualquiera con el link o el tag NFC puede verla." : "Todavía no es visible para el público."}</p>
        <span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span>
      </div>
      <form action={publish}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="published" value={String(!landing.published)} />
        <input type="hidden" name="return_to" value={`/admin/landings/${id}`} />
        <button className="btn full" type="submit">{landing.published ? "Despublicar" : "Publicar landing"}</button>
      </form>
      {landing.published && <Link className="btn secondary full" href={`/admin/landings/${id}/qr`}><IconQrCode /> Generar código QR para el tag NFC</Link>}
    </section>
  );

  return (
    <main className="shell builder-shell">
      <header className="builder-header">
        <Link className="back-link" href="/admin">← Volver</Link>
        <div><p className="eyebrow">Constructor</p><h1>{landing.business_name}</h1><p className="muted">/{landing.slug}</p></div>
        <div className="row-actions">
          <Link className="btn secondary" href={`/admin/landings/${id}/qr`}><IconQrCode /> Código QR</Link>
          <Link className="btn secondary" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconEye /> Vista previa</Link>
          <DeleteLandingButton action={deleteLanding} landingId={id} />
        </div>
      </header>
      <Suspense fallback={null}><Toast /></Suspense>
      <DraftProvider initial={initialDraft}>
        <div className="builder-layout">
          <div className="builder-content card">
            <BuilderTabs identity={identityPanel} actions={actionsPanel} publish={publishPanel} />
          </div>
          <aside className="phone-wrap">
            <p className="eyebrow">Vista previa en vivo</p>
            <PhonePreview customActions={enabledCustomActions} />
          </aside>
        </div>
      </DraftProvider>
    </main>
  );
}
