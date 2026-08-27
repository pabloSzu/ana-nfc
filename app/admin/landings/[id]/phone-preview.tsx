"use client";

import { useDraft } from "./draft-context";
import { getAllActions, AUTO_COLORS, backgroundStyle, resolveTextColor, getFontFamily, panelBackground } from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";

type CustomAction = { id: string; type: string; title: string; url?: string | null; message?: string | null; icon?: string | null; background_color?: string | null; text_color?: string | null; icon_color?: string | null; use_auto_color?: boolean | null };

export default function PhonePreview({ customActions }: { customActions: CustomAction[] }) {
  const { draft } = useDraft();
  const visibleTemplateActions = getAllActions().filter((item) => draft.enabledActions[item.sourceField]);
  const textColor = resolveTextColor(draft);
  const headingFont = getFontFamily(draft.font_pair);
  const buttonFont = getFontFamily(draft.button_font);

  return (
    <div className="phone-preview" style={backgroundStyle(draft)}>
      <div className="phone-notch" />
      <div className="avatar" style={{ background: draft.primary_color || "#1f2937" }}>
        {draft.logo_url ? <img src={draft.logo_url} alt="" /> : draft.business_name.slice(0, 1) || "?"}
      </div>
      {draft.text_panel ? (
        <div style={{ background: panelBackground(textColor, draft.text_panel_color), borderRadius: "var(--radius-md)", padding: "12px 16px", margin: "0 0 22px" }}>
          <h2 style={{ color: textColor, fontFamily: headingFont, margin: 0 }}>{draft.business_name || "Nombre de tu landing"}</h2>
          {draft.description && <p style={{ color: textColor, opacity: 0.75, fontFamily: headingFont, margin: "6px 0 0" }}>{draft.description}</p>}
        </div>
      ) : (
        <>
          <h2 style={{ color: textColor, fontFamily: headingFont }}>{draft.business_name || "Nombre de tu landing"}</h2>
          {draft.description && <p style={{ color: textColor, opacity: 0.75, fontFamily: headingFont }}>{draft.description}</p>}
        </>
      )}
      {visibleTemplateActions.map((item) => {
        const override = draft.actionColors[item.sourceField];
        return (
          <a className="preview-action" key={item.sourceField} href="#" onClick={(event) => event.preventDefault()} style={{ background: override?.bg || AUTO_COLORS[item.type] || draft.primary_color, color: override?.text || "#fff", fontFamily: buttonFont }}>
            <ActionTypeIcon type={item.type} /> {item.label}
          </a>
        );
      })}
      {customActions.map((action) => (
        <a
          className="preview-action"
          key={action.id}
          href="#"
          onClick={(event) => event.preventDefault()}
          style={{ background: action.use_auto_color ? AUTO_COLORS[action.type] || draft.primary_color : action.background_color || draft.primary_color, color: action.text_color || "#fff", fontFamily: buttonFont }}
        >
          <ActionTypeIcon type={action.type} icon={action.icon} /> {action.title}
        </a>
      ))}
    </div>
  );
}
