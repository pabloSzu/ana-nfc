import {
  buildActionLink, buttonFillStyle, buttonZoneShadow, resolveBackgroundTint,
  parseTitleStyle, parseSubtitleStyle, parseLogoStyle, parseBackgroundPosition, parseButtonZone, hexToRgba,
} from "@/lib/landing-catalog";
import { buttonCollectionStyle, buttonCollectionWidth, resolveButtonColors } from "@/lib/design-presets";
import { ActionTypeIcon } from "@/components/action-icons";
import type { CSSProperties } from "react";

type LandingAction = {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  message?: string | null;
  url?: string | null;
  icon?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  icon_color?: string | null;
  use_auto_color?: boolean | null;
};

type Landing = {
  business_name: string;
  description?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  background_color?: string | null;
  background_type?: string | null;
  background_gradient_to?: string | null;
  background_image_url?: string | null;
  text_color?: string | null;
  text_panel?: boolean | null;
  text_panel_color?: string | null;
  font_pair?: string | null;
  button_font?: string | null;
  button_style?: unknown;
  title_style?: unknown;
  subtitle_style?: unknown;
  logo_style?: unknown;
  background_style?: unknown;
};

const noBlank = new Set(["whatsapp", "email", "phone"]);
const BUTTON_FONT_FAMILY: Record<string, string> = {
  modern: "'Space Grotesk', sans-serif", classic: "'Playfair Display', serif", friendly: "'Poppins', sans-serif", minimal: "'Inter', sans-serif",
};

function actionHref(action: LandingAction) {
  if (action.type === "whatsapp") {
    const phone = (action.url || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(action.message || "Hola, quiero hacer una consulta.")}`;
  }
  if (action.type === "email") return `mailto:${action.url || ""}`;
  if (action.type === "phone") return `tel:${action.url || ""}`;
  return buildActionLink(action.type, action.url || "") || "#";
}

export default function LandingRenderer({ landing, actions, preview = false }: { landing: Landing; actions: LandingAction[]; preview?: boolean }) {
  const primary = landing.primary_color || "#1f2937";
  const title = parseTitleStyle(landing);
  const subtitle = parseSubtitleStyle(landing);
  const logo = parseLogoStyle(landing.logo_style);
  const bgPos = parseBackgroundPosition(landing.background_style);
  const zone = parseButtonZone(landing.button_style);
  const hasSavedButtonStyle = Boolean(landing.button_style && typeof landing.button_style === "object" && Object.keys(landing.button_style).length);
  if (!hasSavedButtonStyle) zone.oneColor = primary;
  const buttonFont = BUTTON_FONT_FAMILY[landing.button_font || "modern"] || BUTTON_FONT_FAMILY.modern;

  const bgLayerStyle: CSSProperties =
    landing.background_type === "image" && landing.background_image_url
      ? {
          backgroundColor: landing.background_color || "#f7f5f0",
          backgroundImage: `url(${landing.background_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
          transform: `scale(${bgPos.zoom})`,
          transformOrigin: `${bgPos.x}% ${bgPos.y}%`,
        }
      : landing.background_type === "gradient" && landing.background_gradient_to
        ? { background: `linear-gradient(135deg, ${landing.background_color || "#f7f5f0"}, ${landing.background_gradient_to})` }
        : { background: landing.background_color || "#f7f5f0" };

  const heading = (
    <h1 style={{ fontFamily: title.font, fontWeight: title.weight, fontSize: title.size, color: title.color, background: title.bgMode === "solid" ? hexToRgba(title.bg, 0.55) : "transparent", textAlign: title.align, borderRadius: 12, padding: title.bgMode === "solid" ? "4px 10px" : 0, margin: "0 0 7px", display: "inline-block" }}>
      {landing.business_name}
    </h1>
  );
  const description = landing.description && (
    <p className="landing-desc" style={{ fontFamily: subtitle.font, fontWeight: subtitle.weight, fontSize: subtitle.size, color: subtitle.color, background: subtitle.bgMode === "solid" ? hexToRgba(subtitle.bg, 0.55) : "transparent", borderRadius: 10, padding: subtitle.bgMode === "solid" ? "4px 9px" : 0, display: "inline-block" }}>
      {landing.description}
    </p>
  );

  return (
    <main className="public" style={{ position: "relative", overflow: "hidden", background: landing.background_color || "#f7f5f0" }}>
      <div className="public-bg-layer" style={{ position: "absolute", inset: 0, zIndex: 0, backgroundRepeat: "no-repeat", ...bgLayerStyle }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `linear-gradient(180deg, rgba(4,8,10,.03), rgba(5,8,11,${resolveBackgroundTint(landing.background_type, bgPos.tint)}))` }} />
      <div className={`public-inner layout-${zone.layout}`} style={{ position: "relative", zIndex: 2 }}>
        {preview && <span className="preview-badge">Vista previa</span>}
        <div className="landing-identity-block">
        <div className="avatar" style={{ background: primary, width: logo.size, height: logo.size, borderRadius: logo.shape === "round" ? "50%" : "28px", margin: "0 auto 18px", overflow: "hidden" }}>
          {landing.logo_url ? <div style={{ width: "100%", height: "100%", backgroundImage: `url(${landing.logo_url})`, backgroundSize: `${logo.zoom * 100}%`, backgroundPosition: `${logo.x}% ${logo.y}%` }} /> : landing.business_name.slice(0, 1)}
        </div>
        {heading}
        <br />
        {description}
        </div>
        <div className="public-actions" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: zone.gap }}>
          {actions.map((action, index) => {
            const { background: bg, text } = resolveButtonColors({
              zone, type: action.type, position: index, primary,
              customColor: action.background_color, useAutoColor: action.use_auto_color,
            });
            return (
              <a
                key={action.id}
                className={`action button-collection-${zone.collection}`}
                href={actionHref(action)}
                target={noBlank.has(action.type) ? undefined : "_blank"}
                rel="noreferrer"
                style={{
                  ...buttonFillStyle(zone.finish, bg, text),
                  ...buttonCollectionStyle(zone.collection, bg, text, index),
                  width: buttonCollectionWidth(zone, index),
                  minHeight: zone.height,
                  margin: "0 auto",
                  borderRadius: zone.radius,
                  boxShadow: buttonCollectionStyle(zone.collection, bg, text, index).boxShadow || buttonZoneShadow(zone.shadow),
                  fontFamily: buttonFont,
                  fontSize: zone.textSize,
                  flexDirection: "column",
                  gap: action.subtitle ? 2 : 9,
                }}
              >
                <span className="action-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><span style={{ fontSize: zone.iconSize * 0.52, flex: "none", display: "inline-flex" }}><ActionTypeIcon type={action.type} icon={action.icon} /></span> {action.title}</span>
                {action.subtitle && <small style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>{action.subtitle}</small>}
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
