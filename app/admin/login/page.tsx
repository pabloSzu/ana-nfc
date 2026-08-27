import { login } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-mark">M</div>
        <h1>Ingresar</h1>
        <p className="muted">Accedé a tu panel de Mi Landing Web Fácil.</p>
        {params.error && <div className="error">{params.error}</div>}
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