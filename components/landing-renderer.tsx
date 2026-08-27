import { AUTO_COLORS, backgroundStyle, resolveTextColor, getFontPair, panelBackground } from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";

type LandingAction = {
  id: string;
  type: string;
  title: string;
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
  whatsapp?: string | null;
  primary_color?: string | null;
  background_color?: string | null;
  background_type?: string | null;
  background_gradient_to?: string | null;
  background_image_url?: string | null;
  text_color?: string | null;
  text_panel?: boolean | null;
  font_pair?: string | null;
};

const noBlank = new Set(["whatsapp", "email", "phone"]);

function actionHref(action: LandingAction, whatsapp?: string | null) {
  if (action.type === "whatsapp") {
    const phone = (whatsapp || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodeURIComponent(action.message || "Hola, quiero hacer una consulta.")}`;
  }
  if (action.type === "email") return `mailto:${action.url || ""}`;
  if (action.type === "phone") return `tel:${action.url || ""}`;
  return action.url || "#";
}

export default function LandingRenderer({ landing, actions, preview = false }: { landing: Landing; actions: LandingAction[]; preview?: boolean }) {
  const primary = landing.primary_color || "#1f2937";
  const textColor = resolveTextColor(landing);
  const fonts = getFontPair(landing.font_pair || "modern");
  const heading = <h1 style={{ fontFamily: fonts.heading, fontSize: 28, fontWeight: 700, margin: landing.text_panel ? 0 : "0 0 10px", color: textColor }}>{landing.business_name}</h1>;
  const description = landing.description && <p className="landing-desc" style={{ fontFamily: fonts.body, color: textColor, opacity: 0.75, margin: landing.text_panel ? "6px 0 0" : undefined }}>{landing.description}</p>;
  return (
    <main className="public" style={backgroundStyle(landing)}>
      <div className="public-inner">
        {preview && <span className="preview-badge">Vista previa</span>}
        <div className="avatar" style={{ background: primary, marginBottom: 18 }}>
          {landing.logo_url ? <img src={landing.logo_url} alt={landing.business_name} /> : landing.business_name.slice(0, 1)}
        </div>
        {landing.text_panel ? (
          <div style={{ background: panelBackground(textColor), borderRadius: "var(--radius-md)", padding: "12px 16px", margin: "0 0 22px", display: "inline-block" }}>
            {heading}
            {description}
          </div>
        ) : (
          <>
            {heading}
            {description}
          </>
        )}
        <div>
          {actions.map((action) => (
            <a
              key={action.id}
              className="action"
              href={actionHref(action, landing.whatsapp)}
              target={noBlank.has(action.type) ? undefined : "_blank"}
              rel="noreferrer"
              style={{
                background: action.use_auto_color ? AUTO_COLORS[action.type] || primary : action.background_color || primary,
                color: action.text_color || "#ffffff",
                fontFamily: fonts.body,
              }}
            >
              <ActionTypeIcon type={action.type} /> {action.title}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
