import { login } from "./actions";
import Toast from "@/components/toast";
import { Suspense } from "react";

export default async function Page() {
  return (
    <main className="auth-shell">
      <Suspense fallback={null}><Toast /></Suspense>
      <div className="auth-card">
        <div className="auth-mark">M</div>
        <h1>Ingresar</h1>
        <p className="muted">Accedé a tu panel de Mi Landing Web Fácil.</p>
        <form action={login} className="stack">
          <label className="label">
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label className="label">
            Contraseña
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button className="btn full" type="submit">Entrar</button>
        </form>
      </div>
    </main>
  );
}
