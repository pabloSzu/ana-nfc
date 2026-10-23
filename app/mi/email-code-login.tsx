"use client";

// Los dos pasos de la entrada sin contraseña: email y después el código de 6 números que llega
// por mail. Lo usan "Entrar" (/mi/entrar) y "Activar" (/activar).
import { useEffect, useState, type FormEvent } from "react";
import { sendLoginCode, verifyLoginCode } from "./auth-actions";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/terms";

const OFFLINE = "No pudimos conectarnos. Revisá tu internet y probá de nuevo.";

export default function EmailCodeLogin({ tagCode = "", submitLabel = "Entrar", onDone }: { tagCode?: string; submitLabel?: string; onDone: () => void | Promise<void> }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sends, setSends] = useState(0);
  // Espera antes de "Mandar otro código": el mail tarda unos segundos y apretarlo de nervios solo
  // gasta envíos (hay un máximo por hora).
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true); setError("");
    // Si se corta internet o el servidor no responde, mejor un aviso que "Mandando…" para siempre.
    const result = await sendLoginCode(email, tagCode).catch(() => ({ ok: false as const, error: OFFLINE }));
    setBusy(false);
    if (result.ok) { setSent(true); setSends((count) => count + 1); setWait(60); } else setError(result.error);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const result = await verifyLoginCode(email, code).catch(() => ({ ok: false as const, error: OFFLINE }));
    if (!result.ok) { setBusy(false); setError(result.error); return; }
    await onDone();
    setBusy(false);
  }

  return !sent
    ? <form className="mi-form" onSubmit={send}>
        <label className="mi-field"><span>Tu email</span><input type="email" inputMode="email" autoComplete="email" required value={email} placeholder="nombre@email.com" onChange={(event) => setEmail(event.target.value)} /></label>
        {error && <p className="mi-error" role="alert">{error}</p>}
        <button className="mi-button" type="submit" disabled={busy}>{busy ? <><i className="spin" aria-hidden="true" />Mandando…</> : "Mandarme el código"}</button>
        <p className="mi-hint">Te llega un código de 6 números. No hace falta contraseña.</p>
      </form>
    : <form className="mi-form" onSubmit={verify}>
        <p className="mi-hint">Te mandamos un código a <strong>{email}</strong>. Si no lo ves, fijate en spam o promociones.</p>
        <label className="mi-field"><span>Código</span><input className="mi-code-input" inputMode="numeric" autoComplete="one-time-code" required maxLength={8} value={code} placeholder="123456" onChange={(event) => setCode(event.target.value)} autoFocus /></label>
        {error && <p className="mi-error" role="alert">{error}</p>}
        <button className="mi-button" type="submit" disabled={busy || code.replace(/\D/g, "").length < 6}>{busy ? <><i className="spin" aria-hidden="true" />{submitLabel === "Entrar" ? "Entrando…" : "Activando…"}</> : submitLabel}</button>
        <p className="mi-hint">{wait > 0 ? <span>Podés pedir otro en {wait}s</span> : <button type="button" className="mi-link" onClick={() => send()} disabled={busy}>Mandar otro código</button>} · <button type="button" className="mi-link" onClick={() => { setSent(false); setCode(""); setError(""); }}>Cambiar email</button></p>
        {sends >= 2 && <p className="mi-hint">¿Sigue sin llegar? Revisá que el email esté bien escrito y la carpeta de spam. Si no, escribinos por <a className="mi-link" href={CONTACT_WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a> o a {CONTACT_EMAIL} y te ayudamos.</p>}
      </form>;
}
