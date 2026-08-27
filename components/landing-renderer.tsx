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
};

const autoColors: Record<string, string> = { whatsapp: "#25d366", instagram: "#c13584", tiktok: "#111111", facebook: "#1877f2", maps: "#db4437", youtube: "#ff0033", spotify: "#1db954", telegram: "#229ed9", email: "#334155", phone: "#475569", calendar: "#e05252", website: "#1f2937", url: "#1f2937", mercadopago: "#009ee3" };

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
  return (
    <main className="public" style={{ background: landing.background_color || "#f7f5f0" }}>
      <div className="public-inner">
        {preview && <span className="preview-badge">Vista previa</span>}
        <div className="avatar" style={{ background: primary, marginBottom: 18 }}>
          {landing.logo_url ? <img src={landing.logo_url} alt={landing.business_name} /> : landing.business_name.slice(0, 1)}
        </div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, margin: "0 0 10px" }}>{landing.business_name}</h1>
        {landing.description && <p className="landing-desc muted">{landing.description}</p>}
        <div>
          {actions.map((action) => (
            <a
              key={action.id}
              className="action"
              href={actionHref(action, landing.whatsapp)}
              target={noBlank.has(action.type) ? undefined : "_blank"}
              rel="noreferrer"
              style={{
                background: action.use_auto_color ? autoColors[action.type] || primary : action.background_color || primary,
                color: action.text_color || "#ffffff",
              }}
            >
              <span style={{ color: action.icon_color || "inherit" }}>{action.icon || "→"}</span> {action.title}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
