import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import "./globals.css";
import "./mi/mi.css";

// 404 en castellano para todo el sitio (antes salía el de Next, en inglés).
export default function NotFound() {
  return <div className="mi-shell">
    <header className="mi-top"><Link href="/" className="mi-brand" aria-label="BIONFC"><BioNFCLogo /></Link></header>
    <main className="mi-main mi-narrow">
      <p className="mi-emoji" aria-hidden="true">🔎</p>
      <h1>Esta página no está disponible</h1>
      <p className="mi-lead">Puede que el link esté mal escrito o que la página ya no esté publicada.</p>
      <Link className="mi-button" href="/">Ir a BIONFC</Link>
    </main>
  </div>;
}
