import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { parseButtonZone, parseTitleStyle, parseSubtitleStyle, parseLogoStyle, parseBackgroundPosition } from "@/lib/landing-catalog";
import { DraftProvider, type Draft } from "../draft-context";
import { publish, deleteLanding } from "../../../actions";
import {
  uploadLogoVisual, removeLogoVisual, uploadBackgroundImageVisual, removeBackgroundImageVisual,
  saveDesignStyle,
} from "./actions";
import VisualEditor from "./visual-editor";
import Toast from "@/components/toast";
import { Suspense } from "react";
import "./visual-editor.css";

export default async function VisualPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: landing }, { data: actions }] = await Promise.all([
    supabase.from("landings").select("*").eq("id", id).maybeSingle(),
    supabase.from("actions").select("*").eq("landing_id", id).order("position"),
  ]);
  if (!landing) notFound();

  const enabledActions: Record<string, boolean> = {};
  const actionColors: Record<string, { bg: string; text: string } | undefined> = {};
  actions?.forEach((action) => {
    if (action.is_generated && action.source_field) {
      enabledActions[action.source_field] = action.enabled === true;
      if (action.use_auto_color === false) actionColors[action.source_field] = { bg: action.background_color || "#1f2937", text: action.text_color || "#ffffff" };
    }
  });

  const buttons = (actions || [])
    .filter((action) => action.enabled !== false)
    .map((action) => ({
      id: action.id,
      type: action.type,
      title: action.title || "",
      subtitle: action.subtitle || "",
      url: action.url || "",
      message: action.message || "",
      icon: action.icon || "",
      background_color: action.background_color || "",
      text_color: action.text_color || "",
      use_auto_color: action.use_auto_color !== false,
      position: action.position ?? 0,
    }));

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

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/" + landing.slug;

  return (
    <DraftProvider initial={initialDraft}>
      <Suspense fallback={null}><Toast /></Suspense>
      <VisualEditor
        landing={landing}
        siteUrl={siteUrl}
        uploadLogoAction={uploadLogoVisual}
        removeLogoAction={removeLogoVisual}
        uploadBackgroundAction={uploadBackgroundImageVisual}
        removeBackgroundAction={removeBackgroundImageVisual}
        publishAction={publish}
        deleteLandingAction={deleteLanding}
        saveDesignStyleAction={saveDesignStyle}
        buttons={buttons}
      />
    </DraftProvider>
  );
}
