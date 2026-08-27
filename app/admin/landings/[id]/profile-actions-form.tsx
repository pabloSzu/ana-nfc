"use client";

import { getAllActions, AUTO_COLORS } from "@/lib/landing-catalog";
import { ActionTypeIcon } from "@/components/action-icons";
import { useDraft } from "./draft-context";

type SavedAction = { source_field?: string; is_generated?: boolean; enabled?: boolean; url?: string; message?: string; background_color?: string | null; use_auto_color?: boolean | null };

export default function ProfileActionsForm({ action, landingId, initial }: { action: (formData: FormData) => void | Promise<void>; landingId: string; initial: SavedAction[] }) {
  const { draft, setActionEnabled, setActionColor } = useDraft();
  const allActions = getAllActions();
  const initialBySource: Record<string, SavedAction> = Object.fromEntries(initial.filter((item) => item.is_generated && item.source_field).map((item) => [item.source_field, item]));

  return (
    <form action={action} className="profile-actions-form stack">
      <input type="hidden" name="landing_id" value={landingId} />
      <div className="profile-action-grid">
        {allActions.map((item) => {
          const on = draft.enabledActions[item.sourceField] ?? (initialBySource[item.sourceField]?.enabled === true);
          const saved = initialBySource[item.sourceField];
          return (
            <div className={on ? "profile-action-row active" : "profile-action-row"} key={item.sourceField}>
              <ActionTypeIcon type={item.type} className="profile-action-icon" />
              <div className="profile-action-name">
                <b>{item.label}</b>
                <small>{item.noValue ? "Usa el WhatsApp de Identidad" : item.input === "phone" ? "Número" : item.input === "email" ? "Correo electrónico" : "URL pública"}</small>
              </div>
              <label className="switch">
                <input type="checkbox" name={`enabled_${item.sourceField}`} checked={on} onChange={(event) => setActionEnabled(item.sourceField, event.target.checked)} />
                <span>{on ? "ON" : "OFF"}</span>
              </label>
              <div className="profile-action-fields">
                <div>
                  {!item.noValue && (
                    <input className="profile-action-value" name={`value_${item.sourceField}`} defaultValue={saved?.url || ""} placeholder={item.placeholder} disabled={!on} required={on} />
                  )}
                  {item.message && <input className="profile-action-message" name={`message_${item.sourceField}`} defaultValue={saved?.message || ""} placeholder="Mensaje opcional" disabled={!on} />}
                  <div className="profile-action-color">
                    <label className="check-label">
                      <input
                        type="checkbox"
                        name={`custom_color_${item.sourceField}`}
                        checked={draft.actionColors[item.sourceField] !== undefined}
                        onChange={(event) => setActionColor(item.sourceField, event.target.checked ? { bg: AUTO_COLORS[item.type] || "#1f2937", text: "#ffffff" } : undefined)}
                      />
                      Color personalizado
                    </label>
                    {draft.actionColors[item.sourceField] && (
                      <>
                        <span className="muted" style={{ fontSize: "0.6875rem" }}>Fondo</span>
                        <input
                          type="color"
                          name={`color_${item.sourceField}`}
                          value={draft.actionColors[item.sourceField]!.bg}
                          onChange={(event) => setActionColor(item.sourceField, { ...draft.actionColors[item.sourceField]!, bg: event.target.value })}
                        />
                        <span className="muted" style={{ fontSize: "0.6875rem" }}>Texto</span>
                        <input
                          type="color"
                          name={`text_${item.sourceField}`}
                          value={draft.actionColors[item.sourceField]!.text}
                          onChange={(event) => setActionColor(item.sourceField, { ...draft.actionColors[item.sourceField]!, text: event.target.value })}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button className="btn full" type="submit">Guardar todos los cambios</button>
    </form>
  );
}
