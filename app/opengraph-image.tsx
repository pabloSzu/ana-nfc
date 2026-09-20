import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The image shown when someone shares the homepage link — WhatsApp, Instagram DMs, iMessage,
// Slack, etc. Next wires this up automatically (og:image + twitter:image) just from this file's
// existing at app/opengraph-image.tsx; nothing to register in metadata by hand.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// ImageResponse needs real filesystem access to embed the local photo below, which the default
// edge runtime doesn't have.
export const runtime = "nodejs";

export default async function Image() {
  const photo = await readFile(join(process.cwd(), "public/marketing/hero/og-photo.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#060a14" }}>
        <img src={photoSrc} width={1100} height={619} style={{ position: "absolute", right: 0, top: 0, width: 1100, height: 619, objectFit: "cover", objectPosition: "right center" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, #060a14 0%, #060a14 46%, rgba(6,10,20,.35) 62%, transparent 78%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "72px 0 72px 76px", width: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width={34} height={34} viewBox="0 0 64 64">
              <rect width="64" height="64" rx="15" fill="#0e1730" />
              <g fill="none" stroke="#3b82f6" strokeWidth={6.2} strokeLinecap="round" transform="translate(0.4 -5.7)">
                <path d="M13 30.6a11.6 11.6 0 0 1 0 14.2" />
                <path d="M26.6 22.6a21.6 21.6 0 0 1 0 30.2" />
                <path d="M40.2 14.6a31.6 31.6 0 0 1 0 46.2" />
              </g>
            </svg>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: -1, color: "#fff" }}>
              BIO<span style={{ color: "#3b82f6" }}>NFC</span>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 44, fontSize: 68, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, color: "#fff" }}>
            Tu negocio,
          </div>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, color: "#3b82f6" }}>
            a un toque.
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 25, lineHeight: 1.5, color: "rgba(214,224,250,.82)", maxWidth: 460 }}>
            QR y NFC personalizados para tu negocio.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
