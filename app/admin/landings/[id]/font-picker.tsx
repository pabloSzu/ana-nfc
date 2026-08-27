"use client";

import { FONT_OPTIONS } from "@/lib/landing-catalog";

export default function FontPicker({ label, value, onChange }: { label: string; value: string; onChange: (id: string) => void }) {
  return (
    <div className="label">
      {label}
      <div className="font-presets">
        {FONT_OPTIONS.map((option) => (
          <button type="button" key={option.id} className={value === option.id ? "font-swatch active" : "font-swatch"} style={{ fontFamily: option.family }} onClick={() => onChange(option.id)}>
            Aa
            <small>{option.label}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
