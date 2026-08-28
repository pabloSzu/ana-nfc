import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ActionForm from "../action-form";
import ActionCard from "../action-card";
import ProfileActionsForm, { PROFILE_ACTIONS_FORM_ID } from "../profile-actions-form";
import { DraftProvider, type Draft } from "../draft-context";
import { save, addAction, updateAction, removeAction, moveAction, uploadLogo, removeLogo, uploadBackgroundImage, removeBackgroundImage, saveProfileActions } from "../actions";
import { publish, deleteLanding } from "../../../actions";
import DeleteLandingButton from "../../../delete-landing-button";
import { IconQrCode, IconEye } from "@/components/icons";
import Toast from "@/components/toast";
import { Suspense } from "react";
import VisualEditor from "./visual-editor";
import "./visual-editor.css";

export default async function VisualPage({ params }: { params: Promise<{ id: string }> }) {
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
    enabledActions,
    actionColors,
  };

  return (
    <main className="shell visual-shell">
      <header className="builder-header">
        <Link className="back-link" href="/admin">← Volver</Link>
        <div><p className="eyebrow">Editor visual (prueba)</p><h1>{landing.business_name}</h1><p className="muted">/{landing.slug}</p></div>
        <div className="row-actions">
          <Link className="btn secondary" href={`/admin/landings/${id}`}>Ir al editor clásico</Link>
          <Link className="btn secondary" href={`/admin/landings/${id}/qr`}><IconQrCode /> Código QR</Link>
          <Link className="btn secondary" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconEye /> Vista previa</Link>
          <DeleteLandingButton action={deleteLanding} />
        </div>
      </header>
      <Suspense fallback={null}><Toast /></Suspense>
      <DraftProvider initial={initialDraft}>
        <div className="visual-page-layout">
          <VisualEditor
            landing={landing}
            saveAction={save}
            uploadLogoAction={uploadLogo}
            removeLogoAction={removeLogo}
            uploadBackgroundAction={uploadBackgroundImage}
            removeBackgroundAction={removeBackgroundImage}
            publishAction={publish}
            customActions={enabledCustomActions}
            buttonsPanel={
              <div className="stack">
                <p className="muted" style={{ marginTop: 0 }}>Activá los que necesites y completá el enlace de cada uno.</p>
                <ProfileActionsForm action={saveProfileActions} landingId={id} initial={actions || []} />
                <div className="visual-custom-actions">
                  <h4>+ Botón personalizado</h4>
                  <p className="muted" style={{ marginTop: -6 }}>¿Necesitás algo que no está en la lista de arriba? Agregá cualquier link.</p>
                  <ActionForm action={addAction} landingId={id} />
                  <div className="action-list">
                    {customActions.map((action, index) => (
                      <ActionCard key={action.id} action={action} landingId={id} update={updateAction} remove={removeAction} move={moveAction} first={index === 0} last={index === customActions.length - 1} />
                    ))}
                  </div>
                </div>
                <button form={PROFILE_ACTIONS_FORM_ID} className="btn full" type="submit" style={{ marginTop: "var(--space-5)" }}>Guardar todos los cambios</button>
              </div>
            }
          />
        </div>
      </DraftProvider>
    </main>
  );
}
