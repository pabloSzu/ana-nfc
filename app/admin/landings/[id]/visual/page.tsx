import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DraftProvider, type Draft } from "../draft-context";
import { save, uploadLogo, removeLogo, uploadBackgroundImage, removeBackgroundImage } from "../actions";
import { publish, deleteLanding } from "../../../actions";
import { saveTemplateAction, removeTemplateAction, saveButtonStyle, moveVisualAction, addCustomActionVisual, updateCustomActionVisual, removeCustomActionVisual } from "./actions";
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
  const templateValues: Record<string, { id: string; title: string; url: string; message: string; useAutoColor: boolean; backgroundColor: string; textColor: string }> = {};
  actions?.forEach((action) => {
    if (action.is_generated && action.source_field) {
      enabledActions[action.source_field] = action.enabled === true;
      if (action.use_auto_color === false) actionColors[action.source_field] = { bg: action.background_color || "#1f2937", text: action.text_color || "#ffffff" };
      templateValues[action.source_field] = {
        id: action.id,
        title: action.title || "",
        url: action.url || "",
        message: action.message || "",
        useAutoColor: action.use_auto_color !== false,
        backgroundColor: action.background_color || "#1f2937",
        textColor: action.text_color || "#ffffff",
      };
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
          <DeleteLandingButton action={deleteLanding} landingId={id} />
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
            saveTemplateAction={saveTemplateAction}
            removeTemplateAction={removeTemplateAction}
            saveButtonStyle={saveButtonStyle}
            addCustomAction={addCustomActionVisual}
            updateCustomAction={updateCustomActionVisual}
            removeCustomAction={removeCustomActionVisual}
            moveAction={moveVisualAction}
            customActions={enabledCustomActions}
            templateValues={templateValues}
          />
        </div>
      </DraftProvider>
    </main>
  );
}
