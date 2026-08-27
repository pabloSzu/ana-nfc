"use client";

import { CUSTOM_ICON_OPTIONS, ActionTypeIcon } from "@/components/action-icons";

export default function IconPicker({ type, value, onChange }: { type: string; value: string; onChange: (id: string) => void }) {
  return (
    <div className="label">
      Ícono del botón
      <div className="icon-presets">
        <button type="button" className={!value ? "font-swatch active" : "font-swatch"} title="Automático según el tipo" onClick={() => onChange("")}>
          <ActionTypeIcon type={type} />
          <small>Automático</small>
        </button>
        {CUSTOM_ICON_OPTIONS.map((option) => (
          <button type="button" key={option.id} className={value === option.id ? "font-swatch active" : "font-swatch"} title={option.label} onClick={() => onChange(option.id)}>
            <ActionTypeIcon type={type} icon={option.id} />
            <small>{option.label}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
