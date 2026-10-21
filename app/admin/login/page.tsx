import { login } from "./actions";
import Toast from "@/components/toast";
import { Suspense } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";
import BioNFCLogo from "@/components/bionfc-logo";

export default async function Page() {
  return (
    <main className="auth-shell">
      <Suspense fallback={null}><Toast /></Suspense>
      <div className="auth-card">
        <div className="admin-login-brand"><BioNFCLogo /></div>
        <p className="eyebrow">Acceso del equipo</p>
        <h1>Administrador</h1>
        <p className="muted">Este ingreso es solo para vos y tu socia. Los compradores entran a “Mi chapita” con el código de 6 números que reciben por email.</p>
        <form action={login} className="stack">
          <label className="label">
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="label">
            Contraseña
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <PendingSubmitButton className="btn full" pendingText="Ingresando…">Entrar al administrador</PendingSubmitButton>
        </form>
        <p className="admin-login-note">¿Sos dueño de una mascota? Entrá desde <a href="/mi/entrar">Mi chapita</a>.</p>
      </div>
    </main>
  );
}
