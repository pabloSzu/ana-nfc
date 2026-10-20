import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BioNFCLogo from "@/components/bionfc-logo";
import { createClient } from "@/lib/supabase/server";
import PendingSubmitButton from "@/components/pending-submit-button";
import { sendReport } from "./actions";
import "../../globals.css";
import "../../mi/mi.css";

export const metadata: Metadata = { title: "Denunciar una página · BIONFC", robots: { index: false, follow: false } };

export default async function ReportPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ enviada?: string; error?: string }> }) {
  const { slug } = await params;
  const { enviada, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_landing", { p_slug: slug });
  const landing = data as { id: string; business_name: string } | null;
  if (!landing) notFound();
  return <div className="mi-shell">
    <header className="mi-top"><Link href="/" className="mi-brand" aria-label="BIONFC"><BioNFCLogo /></Link></header>
    <main className="mi-main mi-narrow">
      <h1>Denunciar</h1>
      {enviada ? <div className="mi-card"><p>Gracias. Recibimos tu denuncia sobre <strong>{landing.business_name}</strong> y la vamos a revisar.</p><Link className="mi-link" href={`/${slug}`}>Volver a la página</Link></div>
        : <form action={sendReport} className="mi-card mi-form">
          <input type="hidden" name="slug" value={slug} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }} />
          <p className="mi-hint">Contanos qué está mal en la página <strong>{landing.business_name}</strong>: contenido ofensivo, datos de otra persona, una estafa…</p>
          <label className="mi-field"><span>Qué pasa</span><textarea name="reason" required maxLength={1000} rows={5} /></label>
          <label className="mi-field"><span>Tu email o teléfono (opcional)</span><input name="contact" maxLength={200} placeholder="Por si necesitamos consultarte" /></label>
          {error && <p className="mi-error" role="alert">{error}</p>}
          <PendingSubmitButton className="mi-button" pendingText="Enviando…">Enviar denuncia</PendingSubmitButton>
        </form>}
    </main>
  </div>;
}
