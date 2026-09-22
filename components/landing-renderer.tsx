import LandingSeparator from "@/components/landing-separator";
import { FiTrash2, FiSliders } from "react-icons/fi";
import BioNFCLogo from "@/components/bionfc-logo";
import {
  QUICK_SOCIALS, quickSocialHref, buildActionLink, buttonZoneShadow, resolveBackgroundTint, contrastTextColor,
  parseDistribution, readableInk, parseTitleStyle, parseSubtitleStyle, parseLogoStyle, parseBackgroundPosition, parseButtonZone, parseCoverStyle, headerCardOn, COVER_SIZE_EXTRA, hexToRgba, logoBorderRadius, logoFrameStyle, logoInitials, logoLetterSize,
} from "@/lib/landing-catalog";
import { getFontFamily, resolveFontWeight, resolveTextFont, FontLinks } from "@/lib/fonts";
import { buttonCollectionStyle, buttonCollectionWidth, buttonIconStyle, hasAuthenticLook, resolveButtonColors } from "@/lib/design-presets";
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
  cover_image_url?: string | null;
  cover_style?: unknown;
};

// What's "selected" right now, for the highlight outline — mirrors editor-v2's own Panel
// type structurally (kept independent here, not imported, to avoid a circular dependency
// between the admin editor and this shared public-facing component).
export type LandingEditSelection = "templates" | "buttons" | "background" | "cover" | "settings" | "socials" | "distribution" | "title" | "subtitle" | "logo" | "add" | { buttonId: string } | null;

// Everything the editor needs to turn this same real render into a live, click-to-edit
// canvas — no separate mock. Every hook here only ever *adds* non-layout-affecting behavior
// (onClick, outline, absolutely-positioned badges) on top of the exact real markup, so an
// edited landing and its published page can never silently drift apart again.
export type LandingEditControls = {
  selected: LandingEditSelection;
  draggingId: string | null;
  onSelectTemplates: () => void;
  onSelectSettings: () => void;
  onSelectSocials: () => void;
  onSelectDistribution: () => void;
  onSelectLogo: () => void;
  onSelectTitle: () => void;
  onSelectSubtitle: () => void;
  onSelectBackground: () => void;
  onSelectCover: () => void;
  onSelectZone: () => void;
  onSelectButton: (id: string) => void;
  onDeleteButton: (id: string) => void;
  onAddButton: () => void;
  onButtonRef: (id: string, el: HTMLDivElement | null) => void;
  onDragStart: (clientY: number, id: string) => void;
};

const noBlank = new Set(["whatsapp", "email", "phone"]);

// `fade` (10–90) is "how much of the cover's own height, counting from the bottom, the fade
// covers" — 0% = crisp hard edge, 100% = fades starting right from the top.
function coverFadeGradient(fade: number): string {
  return `linear-gradient(#000 ${100 - fade}%, transparent 100%)`;
}

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
  const cover = parseCoverStyle(landing.cover_style);
  const showCover = Boolean(cover.enabled && landing.cover_image_url);
  const zone = parseButtonZone(landing.button_style);
  const isBanner = showCover && cover.mode === "banner";
  // Card and photo are exclusive choices in the editor; a photo wins if an older page has both.
  const hasHeaderCard = headerCardOn(zone) && !showCover;
  // "profile-card" is the old way the card was stored — it's otherwise the plain centered layout.
  const layoutClass = zone.layout === "profile-card" ? "center" : zone.layout;
  const distribution = parseDistribution(zone.distribution, zone.layout);
  const iconAppearance = zone.iconAppearance;
  const socialLinks = (zone.quickSocials || []).flatMap(link => { const href = quickSocialHref(link); return href ? [{ ...link, href }] : []; });
  const hasSavedButtonStyle = Boolean(landing.button_style && typeof landing.button_style === "object" && Object.keys(landing.button_style).length);
  if (!hasSavedButtonStyle) zone.oneColor = primary;
  const buttonFont = getFontFamily(landing.button_font || "modern");
  // In the editor, preload every font in the catalog so every option in every font picker
  // previews correctly and instantly. On the real page (and admin previews), load only the
  // 2-3 fonts this specific landing actually uses — visitors never download the other five.
  const fontIds = [title.font, subtitle.font, landing.button_font];

  // Always set the same longhand background properties (never the `background` shorthand)
  // so React never has to reconcile a shorthand against the sibling `backgroundRepeat` set
  // where this style is used — mixing the two across renders is what triggers React's
  // "removing a style property during rerender" warning when background_type changes.
  // "Oscurecer imagen" used to be a translucent black overlay that faded to almost nothing
  // at the top of the image — at low/medium slider values it barely read as darker at all.
  // A `brightness()` filter on the image itself scales evenly across the whole photo (a real
  // darkening "filter", not a veil on top of it), and pairs with the overlay below for extra
  // punch near the buttons at the bottom without needing to crank the slider to its max.
  const bgTint = resolveBackgroundTint(landing.background_type, bgPos.tint);
  const bgLayerStyle: CSSProperties =
    landing.background_type === "image" && landing.background_image_url
      ? {
          backgroundColor: landing.background_color || "#f7f5f0",
          backgroundImage: `url(${landing.background_image_url})`,
          backgroundSize: "cover",
          backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
          transform: `scale(${bgPos.zoom})`,
          transformOrigin: `${bgPos.x}% ${bgPos.y}%`,
          filter: bgTint > 0 ? `brightness(${(1 - bgTint * 0.72).toFixed(3)})` : undefined,
        }
      : landing.background_type === "gradient" && landing.background_gradient_to
        ? {
            backgroundColor: landing.background_color || "#f7f5f0",
            backgroundImage: `linear-gradient(145deg, ${landing.background_color || "#f7f5f0"}, ${landing.background_gradient_to})`,
          }
        : { backgroundColor: landing.background_color || "#f7f5f0", backgroundImage: "none" };

  const showDescription = Boolean(landing.description) || Boolean(edit);
  // How tall the cover photo needs to be to reach down to the button zone — driven by which
  // elements EXIST (logo, eyebrow, description), never by distribution or typography.
  // A version of this keyed off the identity block's own measured/rendered height used to make
  // the photo visibly resize every time someone dragged the title-size slider, which read as
  // broken — the photo and the type scale need to be fully independent of each other.
  // Spacing from Distribución (logo gap here, top spacing in the stylesheet) and how long the
  // description is do count — they change where the buttons actually start — but font sizes
  // still don't. Description lines are estimated at a nominal 14px (~48 chars per line in its
  // 340px column) for that same reason; the first two lines are what the fixed 58px always
  // covered, so short descriptions keep exactly the height they had.
  const descriptionLines = (landing.description || "").split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length / 48)), 0);
  const descriptionReserve = landing.description ? 58 + Math.max(0, descriptionLines - 2) * 21 : 14;
  const coverReserve = logo.size + distribution.logoGap + (title.eyebrow ? 28 : 0) + 54 + descriptionReserve + COVER_SIZE_EXTRA[cover.size];
  // The socials row and the credit footer sit at the very BOTTOM, so the color behind them is
  // the gradient's end color — not background_color, which is where the gradient starts. Keying
  // their tone off the start color is what left the credit in a washed-out grey on templates
  // like Glassmorfismo (dark purple at the top, hot pink down where the footer actually is).
  const bottomBackdrop = landing.background_type === "image"
    ? "#0a0a0a"
    : landing.background_type === "gradient" && landing.background_gradient_to
      ? landing.background_gradient_to
      : (landing.background_color || "#f7f5f0");
  const bottomTone = contrastTextColor(bottomBackdrop) === "#ffffff" ? "dark" : "light";
  // Same perceived weight on every template, instead of a fixed opacity that reads bold on a
  // black page and disappears on a bright one. Photo backgrounds can be any color at any point,
  // so those stay on plain white plus the halo the stylesheet adds.
  const brandingInk = landing.background_type === "image" ? "rgba(255, 255, 255, .92)" : readableInk(bottomBackdrop);
  const heading = (
    <h1
      className={edit ? "editor-hit" : undefined}
      data-tag="Título"
      onClick={edit?.onSelectTitle}
      style={{ fontFamily: resolveTextFont(title.font), letterSpacing: title.letterSpacing === undefined ? undefined : `${title.letterSpacing}em`, fontWeight: resolveFontWeight(title.font, title.weight), fontSynthesis: "none", fontSize: title.size, color: title.color, background: title.bgMode === "solid" ? hexToRgba(title.bg, 0.55) : "transparent", textAlign: title.align, borderRadius: 12, padding: title.bgMode === "solid" ? "4px 10px" : 0, margin: "0 0 7px", display: "inline-block", position: edit ? "relative" : undefined }}
    >
      {landing.business_name}
    </h1>
  );
  const description = showDescription && (
    <p
      className={`landing-desc${edit ? " editor-hit" : ""}${edit?.selected === "subtitle" ? " is-selected" : ""}`}
      data-tag="Subtítulo"
      onClick={edit?.onSelectSubtitle}
      style={{ fontFamily: resolveTextFont(subtitle.font), letterSpacing: subtitle.letterSpacing === undefined ? undefined : `${subtitle.letterSpacing}em`, fontWeight: resolveFontWeight(subtitle.font, subtitle.weight), fontSynthesis: "none", fontSize: subtitle.size, color: subtitle.color, background: subtitle.bgMode === "solid" ? hexToRgba(subtitle.bg, 0.55) : "transparent", borderRadius: 10, padding: subtitle.bgMode === "solid" ? "4px 9px" : 0, display: "inline-block", position: edit ? "relative" : undefined }}
    >
      {landing.description || (edit ? "Tocá para agregar una descripción" : "")}
    </p>
  );

  return (
    <main className={`public${zone.showBranding !== false ? " has-branding" : ""}${landing.background_type === "image" && landing.background_image_url ? " public-bg-image" : ""}`} style={{ position: "relative", overflow: "clip", background: landing.background_color || "#f7f5f0", paddingTop: distribution.top, "--landing-top": `${distribution.top}px`, "--landing-logo-gap": `${distribution.logoGap}px` } as CSSProperties}>
      <FontLinks ids={fontIds} />
      {landing.background_type === "image" ? <div className="public-bg-layer public-photo-track" aria-hidden="true"><div className="public-photo-viewport"><div className="public-photo-image" style={{ backgroundRepeat: "no-repeat", ...bgLayerStyle }} /></div></div> : <div className="public-bg-layer" style={{ position: "absolute", inset: 0, zIndex: 0, ...bgLayerStyle }} />}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", backgroundImage: `linear-gradient(180deg, rgba(4,8,10,${(bgTint * 0.55).toFixed(3)}), rgba(5,8,11,${bgTint}))` }} />
      {edit && (
        <>
          <button type="button" className="editor-bg-hit" onClick={edit.onSelectBackground} aria-label="Editar fondo" />
          <div className="editor-quick-tools">
            <button type="button" className={edit.selected === "templates" ? "active" : ""} onClick={edit.onSelectTemplates}>✦ Plantillas</button>
            <button type="button" className={edit.selected === "cover" ? "active" : ""} onClick={edit.onSelectCover}><IconImage /> Encabezado</button>
            <button type="button" className={edit.selected === "distribution" ? "active" : ""} onClick={edit.onSelectDistribution}><FiSliders aria-hidden="true" /> Distribución</button>
            <button type="button" className={edit.selected === "background" ? "active" : ""} onClick={edit.onSelectBackground}><IconImage /> Fondo</button>
          </div>
        </>
      )}
      <div className={`public-inner layout-${layoutClass}${hasHeaderCard ? " has-header-card" : ""}`} style={{ position: "relative", zIndex: 2 }}>
        <div className="landing-header-region" style={showCover ? ({ "--cover-h": `${coverReserve}px` } as CSSProperties) : undefined}>
        {showCover && (
          // The banner runs from the very top of the page down to the middle of the logo, with a
          // hard edge, so the logo sits half on the photo and half on the page.
          <div className={`landing-cover-bg${isBanner ? " is-banner" : ""}`} aria-hidden="true" style={isBanner ? { height: `calc(var(--landing-top) + ${logo.size / 2}px)` } : { maskImage: coverFadeGradient(cover.fade) }}>
            <div className="landing-cover-photo" style={{ backgroundImage: `url(${JSON.stringify(landing.cover_image_url)})`, backgroundPosition: `${cover.x}% ${cover.y}%`, transform: `scale(${cover.zoom})`, transformOrigin: `${cover.x}% ${cover.y}%` }} />
            <div className="landing-cover-veil" style={{ background: isBanner ? `rgba(0, 0, 0, ${cover.overlay})` : hexToRgba(contrastTextColor(title.color), cover.overlay) }} />
          </div>
        )}
        <div className="landing-identity-block">
        <div
          className={edit ? "avatar editor-hit" : "avatar"}
          data-tag="Logo"
          onClick={edit?.onSelectLogo}
          style={{ ...logoFrameStyle(logo, primary), width: logo.size, height: logo.size, borderRadius: logoBorderRadius(logo.shape, logo.size), margin: `0 auto ${distribution.logoGap}px`, fontSize: logoLetterSize(logo.size, logo.initials), position: edit ? "relative" : undefined }}
        >
          {landing.logo_url ? (
            <div style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden", backgroundImage: `url(${landing.logo_url})`, backgroundSize: `${logo.zoom * 100}%`, backgroundPosition: `${logo.x}% ${logo.y}%` }} />
          ) : (
            <div style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: resolveTextFont(title.font) }}>{logoInitials(landing.business_name, logo.initials)}</div>
          )}
        </div>
        {title.eyebrow && <p className={`landing-eyebrow${edit ? " editor-hit" : ""}`} data-tag="Rubro o frase breve" onClick={edit?.onSelectTitle} style={{ color: title.eyebrowColor || title.color, fontFamily: resolveTextFont(title.font), fontSize: title.eyebrowSize, fontWeight: resolveFontWeight(title.font, title.eyebrowWeight), fontSynthesis: "none" }}>{title.eyebrow}</p>}
        {heading}
        <br />
        {description}
        </div>
        </div>
        {distribution.separator && <div className={`landing-separator${edit ? " editor-hit" : ""}${edit?.selected === "distribution" ? " is-selected" : ""}`} data-tag={edit ? "Separador" : undefined} onClick={edit?.onSelectDistribution} style={{ paddingBlock: distribution.separatorSpace }}>
          <div style={{ width: `${distribution.separatorWidth}%` }}><LandingSeparator variant={distribution.separatorStyle} color={distribution.separatorColor} weight={distribution.separatorWeight} /></div>
          {edit && <button type="button" aria-label="Editar separador" onClick={edit.onSelectDistribution}><IconEdit aria-hidden="true" /></button>}
        </div>}
        <div className={`public-actions${edit?.selected === "buttons" ? " editor-zone-selected" : ""}`} style={{ position: "relative", marginTop: distribution.buttonsGap + (edit ? 34 : 0), display: "flex", flexDirection: "column", gap: zone.gap }}>
          {edit && <button type="button" className="editor-zone-tag" onClick={edit.onSelectZone}>✦ Editar todos los botones</button>}
          {actions.map((action, index) => {
            const { background: bg, text, isAuthentic, useNetworkAccent } = resolveButtonColors({
              zone, type: action.type, position: index, primary,
              customColor: action.background_color, useAutoColor: action.use_auto_color,
            });
            const isSelected = Boolean(edit && typeof edit.selected === "object" && edit.selected?.buttonId === action.id);
            const isDragging = edit?.draggingId === action.id;
            return (
              <div key={action.id} ref={edit ? (el) => edit.onButtonRef(action.id, el) : undefined} className={`landing-action-row${edit ? " editor-action-row" : ""}${isDragging ? " is-dragging" : ""}`} style={{ position: "relative", width: buttonCollectionWidth(zone, index), margin: "0 auto" }}>
              <a
                data-button-id={edit ? action.id : undefined}
                className={`action button-collection-${zone.collection} icon-appearance-${iconAppearance}${edit ? " editor-hit" : ""}${isSelected ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}`}
                href={actionHref(action)}
                target={edit ? undefined : (noBlank.has(action.type) ? undefined : "_blank")}
                rel="noreferrer"
                onClick={edit ? (event) => { event.preventDefault(); edit.onSelectButton(action.id); } : undefined}
                style={{
                  ...buttonCollectionStyle(zone.collection, bg, text, index, action.type, isAuthentic, useNetworkAccent),
                  width: "100%",
                  minHeight: zone.height,
                  margin: "0 auto",
                  borderRadius: zone.radius,
                  boxShadow: buttonCollectionStyle(zone.collection, bg, text, index, action.type, isAuthentic, useNetworkAccent).boxShadow || buttonZoneShadow(zone.shadow),
                  fontFamily: buttonFont,
                  fontSize: zone.textSize,
                  flexDirection: "column",
                  alignItems: zone.contentAlign === "left" ? "flex-start" : "center",
                  gap: 0,
                  position: edit ? "relative" : undefined,
                }}
              >
                <span className={`action-main action-main-${zone.contentAlign}`} style={zone.contentAlign === "center" ? { width: "100%", display: "grid", gridTemplateColumns: `${zone.iconSize}px minmax(0,1fr) ${zone.iconSize}px`, alignItems: "center", columnGap: 10 } : { width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10 }}>
                  <span className="action-brand-icon" style={buttonIconStyle(zone.collection, bg, zone.iconSize, action.type, iconAppearance, isAuthentic, useNetworkAccent)}><ActionTypeIcon type={action.type} icon={action.icon} brandMark={iconAppearance === "brand" && !(isAuthentic && hasAuthenticLook(action.type))} /></span>
                  <span className="action-copy" style={{ textAlign: zone.contentAlign === "center" ? "center" : "left" }}>
                    <span className="action-title">{action.title}</span>
                    {action.subtitle && <small style={{ fontSize: 11, opacity: 0.82, fontWeight: 600 }}>{action.subtitle}</small>}
                  </span>
                  {zone.contentAlign === "center" && <span className="action-icon-balance" aria-hidden="true" />}
                </span>
                {edit && !action.use_auto_color && <span className="editor-own-badge">Propio</span>}
                {edit && (
                  <span
                    className="editor-drag"
                    title="Arrastrar para cambiar el orden"
                    aria-label="Mover botón"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); edit.onDragStart(event.clientY, action.id); }}
                  >⠿</span>
                )}
              </a>
              {edit && <button type="button" className="editor-delete-action" aria-label={`Eliminar botón: ${action.title}`} title={`Eliminar ${action.title}`} disabled={Boolean(edit.draggingId)} onClick={() => edit.onDeleteButton(action.id)}><FiTrash2 aria-hidden="true" /></button>}
              </div>
            );
          })}
          {edit && <button type="button" className="editor-add-link" onClick={edit.onAddButton}><span className="editor-add-icon">＋</span> Agregar botón</button>}
        </div>
        {(socialLinks.length > 0 || edit) && <div className={`landing-socials-block${edit ? " editor-hit" : ""}${edit?.selected === "socials" ? " is-selected" : ""}`} data-tag={edit ? "Redes rápidas" : undefined} onClick={edit ? () => edit.onSelectSocials() : undefined} style={{ marginTop: distribution.socialsGap }}>
          {socialLinks.length > 0 && <nav className="landing-socials" aria-label="Redes sociales" data-tone={bottomTone} data-filled={zone.quickSocialsFilled === false ? "no" : "yes"}>
            {socialLinks.map(link => <a key={link.type} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={QUICK_SOCIALS.find(option => option.type === link.type)?.label} onClick={edit ? event => { event.preventDefault(); edit.onSelectSocials(); } : undefined}><ActionTypeIcon type={link.type} /></a>)}
          </nav>}
          {edit && <button type="button" className="editor-socials-entry" onClick={edit.onSelectSocials}><IconEdit aria-hidden="true" />{socialLinks.length ? "Editar redes rápidas" : "Agregar redes rápidas"}</button>}
        </div>}
        {zone.showBranding !== false && <footer className={`landing-branding${edit ? " is-editable" : ""}`} data-tone={bottomTone} style={{ "--branding-ink": brandingInk } as CSSProperties}>
          <a href="/?utm_source=bionfc_landing&utm_medium=referral&utm_campaign=footer" target="_blank" rel="noopener noreferrer" aria-label={edit ? "Editar firma de BioNFC" : "Hecho con BioNFC. Conocé BioNFC (abre en otra pestaña)"} onClick={edit ? (event) => { event.preventDefault(); edit.onSelectSettings(); } : undefined}>
            <span className="landing-branding-label">Hecho con</span><BioNFCLogo />
            {edit && <span className="editor-branding-hint"><IconEdit aria-hidden="true" /> Editar firma</span>}
          </a>
        </footer>}
      </div>
    </main>
  );
}
