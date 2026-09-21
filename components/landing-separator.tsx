import type { CSSProperties } from "react";
import type { DistributionStyle } from "@/lib/landing-catalog";

// The picker and public landing render the same artwork.
export default function LandingSeparator({ variant, color, weight }: { variant: DistributionStyle["separatorStyle"]; color: string; weight: number }) {
  const ornaments = {
    bolt: <path d="m14 2-10 12h7l-1 8L20 10h-7Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    diamond: <path d="M12 4 20 12 12 20 4 12Z" />,
    sparkle: <path d="M12 2c0 7-3 10-10 10 7 0 10 3 10 10 0-7 3-10 10-10-7 0-10-3-10-10Z" />,
    circle: <circle cx="12" cy="12" r="5" />,
    heart: <path d="M12 20 4 12C-2 5 7 0 12 7c5-7 14-2 8 5Z" />,
    leaf: <><path d="M5 19C0 8 10 3 20 4c1 10-4 19-15 15Z" /><path d="m5 19 10-10" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" />,
    flower: <><path d="M12 8C5-4 0 7 8 12c-12 7-1 12 4 4 7 12 12 1 4-4 12-7 1-12-4-4Z" /><circle cx="12" cy="12" r="2" /></>,
    trio: <g fill="currentColor" stroke="none"><circle cx="4" cy="12" r="1.5" /><circle cx="12" cy="12" r="2.5" /><circle cx="20" cy="12" r="1.5" /></g>,
  };
  const ornament = variant in ornaments ? ornaments[variant as keyof typeof ornaments] : null;
  return <span className="landing-separator-art" data-variant={variant} data-ornament={ornament ? "true" : undefined} aria-hidden="true" style={{ color, "--separator-weight": `${weight}px` } as CSSProperties}>
    <span className="separator-line" />
    {ornament && <><svg className="separator-ornament" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={Math.max(1, weight)} strokeLinejoin="round" strokeLinecap="round">{ornament}</svg><span className="separator-line" /></>}
  </span>;
}
