import type { CSSProperties } from "react";

export type PhoneMode = "minimal" | "color" | "dark";

export type PhoneProps = {
  brand: string;
  handle: string;
  slug: string;
  tagline: string;
  /** oklch hue (0–360) the whole mock landing is tinted with. */
  hue: number;
  mode: PhoneMode;
  buttons: string[];
};

// A small stand-in for a real BioNFC landing, drawn entirely in container-query units (cqw) so it
// scales as one picture to whatever box it's dropped into. The three `mode`s only swap the color
// variables in marketing.css (.bx-phone[data-mode=…]) — no per-mode markup.
export default function Phone({ brand, handle, slug, tagline, hue, mode, buttons }: PhoneProps) {
  return (
    <div className="bx-phone" data-mode={mode} style={{ "--h": hue } as CSSProperties}>
      <div className="bx-phone-frame">
        <div className="bx-phone-screen">
          <div className="bx-phone-cover" />
          <div className="bx-phone-notch" />
          <div className="bx-phone-status">
            <span>14:32</span>
            <span className="bx-phone-signal"><b /><b /><b /></span>
          </div>
          <div className="bx-phone-id">
            <div className="bx-phone-avatar">{brand.trim().charAt(0)}</div>
            <div className="bx-phone-name">{brand}</div>
            <div className="bx-phone-handle">{handle}</div>
            <div className="bx-phone-tagline">{tagline}</div>
          </div>
          <div className="bx-phone-btns">
            {buttons.map((label, index) => (
              <div key={label} className={`bx-phone-btn${index === 0 ? " is-primary" : ""}`}>
                <span className="bx-phone-ico" />
                <span className="bx-phone-label">{label}</span>
                <span className="bx-phone-chev">›</span>
              </div>
            ))}
          </div>
          <div className="bx-phone-spacer" />
          <div className="bx-phone-foot">
            <div className="bx-phone-social"><span /><span /><span /><span /></div>
            <div className="bx-phone-url">bionfc.com/{slug}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
