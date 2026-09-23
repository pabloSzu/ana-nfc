import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Toast from "@/components/toast";
import { IconEye } from "@/components/icons";
import QrDesigner from "./qr-designer";

// El logo se embebe como data URI en el propio SVG. No alcanza con referenciar la URL de
// Storage: un SVG con un <image href="https://..."> se abre sin logo en la computadora de la
// imprenta, o en cualquier visor sin internet. Se trae una sola vez acá, en el servidor, y
// así no hay problemas de CORS ni una segunda descarga desde el navegador.
const MAX_LOGO_BYTES = 500 * 1024;

async function logoAsDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "image/png";
    if (!type.startsWith("image/")) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    // Un logo enorme haría un SVG enorme, y el SVG es lo que se manda a imprimir por mail.
    if (buffer.byteLength > MAX_LOGO_BYTES) return null;
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function QR({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).maybeSingle();
  if (!landing) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${base}/${landing.slug}`;
  // El QR apunta a la URL marcada, para poder separar después los escaneos del código
  // impreso de los del chip. Solo funciona si se decide antes de imprimir.
  const qrUrl = `${url}?s=qr`;

  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  const isLocal = /^(localhost|127\.|0\.0\.0\.0$|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);

  const logoDataUri = await logoAsDataUri(landing.logo_url);

  return (
    <main className="shell">
      <Suspense fallback={null}><Toast /></Suspense>
      <header className="builder-header">
        <Link className="back-link" href={`/admin/landings/${id}/editor-v2`}>← Volver</Link>
        <div>
          <p className="eyebrow">Código QR</p>
          <h1>{landing.business_name}</h1>
        </div>
      </header>

      <QrDesigner
        landingId={id}
        url={qrUrl}
        saved={landing.qr_style}
        logoDataUri={logoDataUri}
        hasLogo={Boolean(logoDataUri)}
        primaryColor={landing.primary_color}
        isLocal={isLocal}
        host={host}
      />

      <div className="card qr-footnote">
        <p className="muted">
          En la tag NFC grabá <code>{url}?s=nfc</code> — es la misma página, pero así el panel te separa
          los escaneos del chip de los del QR.
        </p>
        <a className="btn secondary" href={url} target="_blank" rel="noreferrer"><IconEye /> Ver landing</a>
      </div>
    </main>
  );
}
