import type { Metadata } from "next";
import "./base.css";
import { getSiteOrigin } from "@/lib/site-url";

// metadataBase turns every relative URL in metadata (the OG/Twitter image this app serves from
// app/opengraph-image.tsx, mainly) into an absolute one — without it, link previews on WhatsApp,
// iMessage, Slack, etc. silently fail to resolve the image. Same env var the QR codes already use
// for their target URL (see README), so both stay in sync with whatever domain is actually live.
const siteUrl = getSiteOrigin();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Plain fallback, not a template — the home page (app/page.tsx) and each published landing
  // ([slug]/page.tsx) already set their own complete title, so a "%s · BioNFC" template here
  // would just tack a redundant suffix onto those instead of only applying to routes with none.
  title: "Productos QR y NFC personalizados | BioNFC",
  description: "Productos QR y NFC personalizados para conectar tu negocio con reseñas de Google, contacto, menús, páginas y experiencias digitales a medida.",
  applicationName: "BioNFC",
  creator: "BioNFC",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
