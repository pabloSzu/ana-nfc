import type { CSSProperties } from "react";
import { contrastTextColor, logoBackgroundColor, logoBorderRadius, logoInitials, parseLogoStyle } from "@/lib/landing-catalog";

export type AdminPageAvatarData = {
  business_name: string;
  business_type?: string | null;
  logo_url?: string | null;
  logo_style?: unknown;
  primary_color?: string | null;
};

export default function AdminPageAvatar({ page }: { page: AdminPageAvatarData }) {
  const logo = parseLogoStyle(page.logo_style);
  const primary = page.primary_color || "#1f2937";
  const background = logoBackgroundColor(logo, primary);
  const imageStyle: CSSProperties = {
    backgroundImage: `url(${JSON.stringify(page.logo_url || "")})`,
    backgroundPosition: `${logo.x}% ${logo.y}%`,
    backgroundRepeat: "no-repeat",
    backgroundSize: page.business_type === "contact" ? "cover" : `${logo.zoom * 100}%`,
    transform: page.business_type === "contact" ? `scale(${logo.zoom})` : undefined,
    transformOrigin: `${logo.x}% ${logo.y}%`,
  };

  return <div className="avatar small colorful admin-page-avatar" aria-hidden="true" style={{ background, color: contrastTextColor(background), borderRadius: logoBorderRadius(logo.shape, 44) }}>
    {page.logo_url ? <span className="admin-page-avatar-image" style={imageStyle} /> : logoInitials(page.business_name, logo.initials)}
  </div>;
}
