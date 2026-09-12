import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { parseBackgroundPosition, parseButtonZone, parseLogoStyle, parseSubtitleStyle, parseTitleStyle } from "@/lib/landing-catalog";
import { saveDesignStyle } from "../visual/actions";
import EditorV2 from "./editor-v2";
import Toast from "@/components/toast";
import { Suspense } from "react";
import "./editor-v2.css";
import "./logo-editor.css";
import "./collections.css";
import "./phone-first.css";

export default async function EditorV2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: landing }, { data: actions }] = await Promise.all([
    supabase.from("landings").select("*").eq("id", id).maybeSingle(),
    supabase.from("actions").select("*").eq("landing_id", id).eq("enabled", true).order("position"),
  ]);
  if (!landing) notFound();

  const buttonZone = parseButtonZone(landing.button_style);
  if (!landing.button_style || !Object.keys(landing.button_style).length) buttonZone.oneColor = landing.primary_color || "#1f2937";

  return (<>
    <Suspense fallback={null}><Toast /></Suspense>
    <EditorV2
      landing={{
        ...landing,
        buttonZone,
        titleStyle: parseTitleStyle(landing),
        subtitleStyle: parseSubtitleStyle(landing),
        logoStyle: parseLogoStyle(landing.logo_style),
        bgPosition: parseBackgroundPosition(landing.background_style),
      }}
      initialButtons={(actions || []).map((action) => ({
        id: action.id, type: action.type, title: action.title || "", subtitle: action.subtitle || "",
        url: action.url || "", message: action.message || "", icon: action.icon || "",
        background_color: action.background_color || "", text_color: action.text_color || "#ffffff",
        use_auto_color: action.use_auto_color !== false, position: action.position || 0,
      }))}
      saveAction={saveDesignStyle}
    />
  </>);
}
