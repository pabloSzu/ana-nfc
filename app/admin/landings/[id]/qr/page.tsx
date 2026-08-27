import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function QR({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).maybeSingle();
  if (!landing) notFound();
  const url = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/" + landing.slug;
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=" + encodeURIComponent(url);

  return (
    <main className="shell">
      <header className="builder-header">
        <Link className="back-link" href={`/admin/landings/${id}`}>← Volver</Link>
        <div>
          <p className="eyebrow">Código QR</p>
          <h1>{landing.business_name}</h1>
        </div>
      </header>
      <div className="card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <img
          src={qr}
          alt={`QR de ${landing.business_name}`}
          style={{ width: "min(320px, 100%)", margin: "0 auto var(--space-4)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}
        />
        <p className="muted" style={{ wordBreak: "break-all", fontSize: "0.8125rem" }}>{url}</p>
        <div className="row-actions" style={{ justifyContent: "center", marginTop: "var(--space-4)" }}>
          <a className="btn" href={qr} target="_blank" rel="noreferrer">Descargar QR</a>
          <a className="btn secondary" href={url} target="_blank" rel="noreferrer">Ver landing ↗</a>
        </div>
        <p className="muted" style={{ marginTop: "var(--space-5)", fontSize: "0.75rem" }}>Esta misma URL es la que grabás en la tag NFC.</p>
      </div>
    </main>
  );
}
