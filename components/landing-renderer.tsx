import {
  buildActionLink, buttonZoneShadow, resolveBackgroundTint, getFontFamily,
  parseTitleStyle, parseSubtitleStyle, parseLogoStyle, parseBackgroundPosition, parseButtonZone, hexToRgba, logoBorderRadius, logoFrameStyle, logoInitials, logoLetterSize,
} from "@/lib/landing-catalog";
import { buttonCollectionStyle, buttonCollectionWidth, buttonIconStyle, resolveButtonColors } from "@/lib/design-presets";
import { ActionTypeIcon } from "@/components/action-icons";
import { IconEdit, IconImage } from "@/components/icons";
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

// What's "selected" right now, for the highlight outline — mirrors editor-v2's own Panel
// type structurally (kept independent here, not imported, to avoid a circular dependency
// between the admin editor and this shared public-facing component).
export type LandingEditSelection = "templates" | "buttons" | "background" | "profile" | "title" | "subtitle" | "logo" | "add" | { buttonId: string } | null;

// Everything the editor needs to turn this same real render into a live, click-to-edit
// canvas — no separate mock. Every hook here only ever *adds* non-layout-affecting behavior
// (onClick, outline, absolutely-positioned badges) on top of the exact real markup, so an
// edited landing and its published page can never silently drift apart again.
export type LandingEditControls = {
  selected: LandingEditSelection;
  draggingId: string | null;
  onSelectTemplates: () => void;
  onSelectLogo: () => void;
  onSelectTitle: () => void;
  onSelectSubtitle: () => void;
  onSelectBackground: () => void;
  onSelectZone: () => void;
  onSelectButton: (id: string) => void;
  onAddButton: () => void;
  onButtonRef: (id: string, el: HTMLAnchorElement | null) => void;
  onDragStart: (clientY: number, id: string) => void;
};

const noBlank = new Set(["whatsapp", "email", "phone"]);

function actionHref(action: LandingAction) {
  if (action.type === "whatsapp") {
    const phone = (action.url || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(action.message || "Hola, quiero hacer una consulta.")}`;
  }
  if (action.type === "email") return `mailto:${action.url || ""}`;
  if (action.type === "phone") return `tel:${action.url || ""}`;
  return buildActionLink(action.type, action.url || "") || "#";
}

export default function LandingRenderer({ landing, actions, edit }: { landing: Landing; actions: LandingAction[]; edit?: LandingEditControls }) {
  const primary = landing.primary_color || "#1f2937";
  const title = parseTitleStyle(landing);
  const subtitle = parseSubtitleStyle(landing);
  const logo = parseLogoStyle(landing.logo_style);
  const bgPos = parseBackgroundPosition(landing.background_style);
  const zone = parseButtonZone(landing.button_style);
  const hasSavedButtonStyle = Boolean(landing.button_style && typeof landing.button_style === "object" && Object.keys(landing.button_style).length);
  if (!hasSavedButtonStyle) zone.oneColor = primary;
  const buttonFont = getFontFamily(landing.button_font || "modern");

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
        ? { background: `linear-gradient(145deg, ${landing.background_color || "#f7f5f0"}, ${landing.background_gradient_to})` }
        : { background: landing.background_color || "#f7f5f0" };

  const showDescription = Boolean(landing.description) || Boolean(edit);
  const heading = (
    <h1
      className={edit ? "editor-hit" : undefined}
      data-tag="Título"
      onClick={edit?.onSelectTitle}
      style={{ fontFamily: title.font, fontWeight: title.weight, fontSize: title.size, color: title.color, background: title.bgMode === "solid" ? hexToRgba(title.bg, 0.55) : "transparent", textAlign: title.align, borderRadius: 12, padding: title.bgMode === "solid" ? "4px 10px" : 0, margin: "0 0 7px", display: "inline-block", position: edit ? "relative" : undefined }}
    >
      {landing.business_name}
    </h1>
  );
  const description = showDescription && (
    <p
      className={`landing-desc${edit ? " editor-hit" : ""}${edit?.selected === "subtitle" ? " is-selected" : ""}`}
      data-tag="Subtítulo"
      onClick={edit?.onSelectSubtitle}
      style={{ fontFamily: subtitle.font, fontWeight: subtitle.weight, fontSize: subtitle.size, color: subtitle.color, background: subtitle.bgMode === "solid" ? hexToRgba(subtitle.bg, 0.55) : "transparent", borderRadius: 10, padding: subtitle.bgMode === "solid" ? "4px 9px" : 0, display: "inline-block", position: edit ? "relative" : undefined }}
    >
      {landing.description || (edit ? "Tocá para agregar una descripción" : "")}
    </p>
  );

  return (
    <main className="public" style={{ position: "relative", overflow: "hidden", background: landing.background_color || "#f7f5f0" }}>
      <div className="public-bg-layer" style={{ position: "absolute", inset: 0, zIndex: 0, backgroundRepeat: "no-repeat", ...bgLayerStyle }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `linear-gradient(180deg, rgba(4,8,10,.03), rgba(5,8,11,${resolveBackgroundTint(landing.background_type, bgPos.tint)}))` }} />
      {edit && (
        <>
          <button type="button" className="editor-bg-hit" onClick={edit.onSelectBackground} aria-label="Editar fondo" />
          <div className="editor-quick-tools">
            <button type="button" className={edit.selected === "templates" ? "active" : ""} onClick={edit.onSelectTemplates}>✦ Plantillas</button>
            <button type="button" className={edit.selected === "background" ? "active" : ""} onClick={edit.onSelectBackground}><IconImage /> Fondo</button>
          </div>
        </>
      )}
      <div className={`public-inner layout-${zone.layout}`} style={{ position: "relative", zIndex: 2 }}>
        <div className="landing-identity-block">
        <div
          className={edit ? "avatar editor-hit" : "avatar"}
          data-tag="Logo"
          onClick={edit?.onSelectLogo}
          style={{ ...logoFrameStyle(logo, primary), width: logo.size, height: logo.size, borderRadius: logoBorderRadius(logo.shape, logo.size), margin: "0 auto 18px", fontSize: logoLetterSize(logo.size, logo.initials), position: edit ? "relative" : undefined }}
        >
          {landing.logo_url ? (
            <div style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden", backgroundImage: `url(${landing.logo_url})`, backgroundSize: `${logo.zoom * 100}%`, backgroundPosition: `${logo.x}% ${logo.y}%` }} />
          ) : (
            <div style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>{logoInitials(landing.business_name, logo.initials)}</div>
          )}
        </div>
        {heading}
        <br />
        {description}
        </div>
        <div className={`public-actions${edit?.selected === "buttons" ? " editor-zone-selected" : ""}`} style={{ position: edit ? "relative" : undefined, marginTop: edit ? 44 : 10, display: "flex", flexDirection: "column", gap: zone.gap }}>
          {edit && <button type="button" className="editor-zone-tag" onClick={edit.onSelectZone}>✦ Editar todos los botones</button>}
          {actions.map((action, index) => {
            const { background: bg, text } = resolveButtonColors({
              zone, type: action.type, position: index, primary,
              customColor: action.background_color, useAutoColor: action.use_auto_color,
            });
            const isSelected = Boolean(edit && typeof edit.selected === "object" && edit.selected?.buttonId === action.id);
            const isDragging = edit?.draggingId === action.id;
            return (
              <a
                key={action.id}
                ref={edit ? (el) => edit.onButtonRef(action.id, el) : undefined}
                data-button-id={edit ? action.id : undefined}
                className={`action button-collection-${zone.collection}${edit ? " editor-hit" : ""}${isSelected ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}`}
                href={actionHref(action)}
                target={edit ? undefined : (noBlank.has(action.type) ? undefined : "_blank")}
                rel="noreferrer"
                onClick={edit ? (event) => { event.preventDefault(); edit.onSelectButton(action.id); } : undefined}
                style={{
                  ...buttonCollectionStyle(zone.collection, bg, text, index),
                  width: buttonCollectionWidth(zone, index),
                  minHeight: zone.height,
                  margin: "0 auto",
                  borderRadius: zone.radius,
                  boxShadow: buttonCollectionStyle(zone.collection, bg, text, index).boxShadow || buttonZoneShadow(zone.shadow),
                  fontFamily: buttonFont,
                  fontSize: zone.textSize,
                  flexDirection: "column",
                  alignItems: zone.contentAlign === "left" ? "flex-start" : "center",
                  gap: 0,
                  position: edit ? "relative" : undefined,
                }}
              >
                <span className={`action-main action-main-${zone.contentAlign}`} style={zone.contentAlign === "center" ? { width: "100%", display: "grid", gridTemplateColumns: `${zone.iconSize}px minmax(0,1fr) ${zone.iconSize}px`, alignItems: "center", columnGap: 10 } : { width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10 }}>
                  <span className="action-brand-icon" style={buttonIconStyle(zone.collection, bg, zone.iconSize)}><ActionTypeIcon type={action.type} icon={action.icon} /></span>
                  <span className="action-copy" style={{ textAlign: zone.contentAlign === "center" ? "center" : "left" }}>
                    <span className="action-title">{action.title}</span>
                    {action.subtitle && <small style={{ fontSize: 11, opacity: 0.82, fontWeight: 600 }}>{action.subtitle}</small>}
                  </span>
                  {zone.contentAlign === "center" && <span className="action-icon-balance" aria-hidden="true" />}
                </span>
                {edit && !action.use_auto_color && <span className="editor-own-badge">Propio</span>}
                {edit && <span className="editor-pencil" title="Editar botón"><IconEdit /></span>}
                {edit && (
                  <span
                    className="editor-drag"
                    title="Arrastrar para cambiar el orden"
                    aria-label="Mover botón"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => { event.preventDefault(); edit.onDragStart(event.clientY, action.id); }}
                  >⠿</span>
                )}
              </a>
            );
          })}
          {edit && <button type="button" className="editor-add-link" onClick={edit.onAddButton}><span className="editor-add-icon">＋</span> Agregar botón</button>}
        </div>
      </div>
    </main>
  );
}
