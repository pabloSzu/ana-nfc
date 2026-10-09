import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { parseBackgroundPosition, parseButtonZone, parseCoverStyle, parseLogoStyle, parseSubtitleStyle, parseTitleStyle } from "@/lib/landing-catalog";
import { saveDesignStyle } from "./actions";
import { publish, deleteLanding } from "@/app/admin/actions";
import EditorV2 from "./editor-v2";
import Toast from "@/components/toast";
import { Suspense } from "react";
import "./editor-v2.css";
import "./logo-editor.css";
import "./collections.css";
import "./phone-first.css";
import "./contact-editor.css";
import "./image-adjust-dialog.css";

export default async function EditorV2Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string | string[] }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const [{ data: landing }, { data: actions }] = await Promise.all([
    supabase.from("landings").select("*").eq("id", id).eq("owner_id", userId).maybeSingle(),
    supabase.from("actions").select("*").eq("landing_id", id).eq("enabled", true).order("position"),
  ]);
  if (!landing) notFound();

  const buttonZone = parseButtonZone(landing.button_style);
  if (!landing.button_style || !Object.keys(landing.button_style).length) buttonZone.oneColor = landing.primary_color || "#1f2937";

  return (<>
    <Suspense fallback={null}><Toast /></Suspense>
    <EditorV2
      newlyCreatedContact={landing.business_type === "contact" && (saved === "Tarjeta creada" || saved === "Landing creada")}
      landing={{
        ...landing,
        buttonZone,
        titleStyle: parseTitleStyle(landing),
        subtitleStyle: parseSubtitleStyle(landing),
        logoStyle: parseLogoStyle(landing.logo_style),
        bgPosition: parseBackgroundPosition(landing.background_style),
        coverStyle: parseCoverStyle(landing.cover_style),
      }}
      initialButtons={(actions || []).map((action) => ({
        id: action.id, type: action.type, title: action.title || "", subtitle: action.subtitle || "",
        url: action.url || "", message: action.message || "", icon: action.icon || "", icon_url: action.icon_url || "", icon_fit: action.icon_fit === "cover" ? "cover" : "contain", icon_scale: Number(action.icon_scale) || 1, icon_background_color: action.icon_background_color || "",
        background_color: action.background_color || "", background_gradient_to: action.background_gradient_to || "", text_color: action.text_color || "#ffffff",
        use_auto_color: action.use_auto_color !== false, position: action.position || 0,
      }))}
      saveAction={saveDesignStyle}
      publishAction={publish}
      deleteLandingAction={deleteLanding}
    />
  </>);
}
