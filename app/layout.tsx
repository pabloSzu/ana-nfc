import type { Metadata } from "next";
import "./globals.css";

// metadataBase turns every relative URL in metadata (the OG/Twitter image this app serves from
// app/opengraph-image.tsx, mainly) into an absolute one — without it, link previews on WhatsApp,
// iMessage, Slack, etc. silently fail to resolve the image. Same env var the QR codes already use
// for their target URL (see README), so both stay in sync with whatever domain is actually live.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Plain fallback, not a template — the home page (app/page.tsx) and each published landing
  // ([slug]/page.tsx) already set their own complete title, so a "%s · BioNFC" template here
  // would just tack a redundant suffix onto those instead of only applying to routes with none.
  title: "BioNFC — tu negocio, a un toque",
  description: "QR y NFC personalizados para tu negocio. Conectá a tus clientes con tus reseñas de Google, un link directo o una página con todos tus accesos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
      </head>
      <body>{children}</body>
    </html>
  );
}
