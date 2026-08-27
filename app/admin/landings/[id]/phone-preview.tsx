"use client";

import { useDraft } from "./draft-context";
import { getTemplateActions, AUTO_COLORS } from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";

type CustomAction = { id: string; type: string; title: string; url?: string | null; message?: string | null; background_color?: string | null; text_color?: string | null; icon_color?: string | null; use_auto_color?: boolean | null };

export default function PhonePreview({ customActions }: { customActions: CustomAction[] }) {
  const { draft } = useDraft();
  const visibleTemplateActions = getTemplateActions(draft.template).filter((item) => draft.enabledActions[item.sourceField]);

  return (
    <div className="phone-preview" style={{ background: draft.background_color || "#f7f5f0" }}>
      <div className="phone-notch" />
      <div className="avatar" style={{ background: draft.primary_color || "#1f2937" }}>
        {draft.logo_url ? <img src={draft.logo_url} alt="" /> : draft.business_name.slice(0, 1) || "?"}
      </div>
      <h2>{draft.business_name || "Nombre de tu landing"}</h2>
      {draft.description && <p>{draft.description}</p>}
      {visibleTemplateActions.map((item) => (
        <a className="preview-action" key={item.sourceField} href="#" onClick={(event) => event.preventDefault()} style={{ background: AUTO_COLORS[item.type] || draft.primary_color, color: "#fff" }}>
          <ActionTypeIcon type={item.type} /> {item.label}
        </a>
      ))}
      {customActions.map((action) => (
        <a
          className="preview-action"
          key={action.id}
          href="#"
          onClick={(event) => event.preventDefault()}
          style={{ background: action.use_auto_color ? AUTO_COLORS[action.type] || draft.primary_color : action.background_color || draft.primary_color, color: action.text_color || "#fff" }}
        >
          <ActionTypeIcon type={action.type} /> {action.title}
        </a>
      ))}
    </div>
  );
}
