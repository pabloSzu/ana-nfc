"use client";

// Activar en tres pasos: el código de la tarjetita (y aceptar los términos), el email con su
// código de 6 números (si no entró antes) y listo: activateTag lleva al editor de la chapita.
import { useState, type FormEvent } from "react";
import Link from "next/link";
import EmailCodeLogin from "../mi/email-code-login";
import { activateTag, checkTagCode, switchAccount } from "../mi/auth-actions";
import { formatCode } from "@/lib/pet-tags";

export default function ActivateFlow({ initialCode, signedInEmail }: { initialCode: string; signedInEmail: string }) {
  const cameFromPackagingQr = Boolean(initialCode);
  const [code, setCode] = useState(initialCode ? formatCode(initialCode) : "");
  const [terms, setTerms] = useState(false);
  const [step, setStep] = useState<"code" | "login">("code");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Si ya entró con su email y la activación falló, al reintentar no se le vuelve a pedir el mail.
  const [signedIn, setSignedIn] = useState(Boolean(signedInEmail));

  async function activate() {
    setBusy(true); setError("");
    // Si sale bien, activateTag redirige al editor; si vuelve, es que falló.
    const result = await activateTag(code, terms);
    setBusy(false);
    if (!result.ok) { setError(result.error); setStep("code"); }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const result = await checkTagCode(code);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    if (signedIn) await activate();
    else setStep("login");
  }

  if (step === "login") return <div className="mi-card">
    <p className="mi-step">Paso 2 de 2 · Tu email</p>
    <p className="mi-hint">Con este email vas a entrar después para editar los datos o avisar si se pierde.</p>
    <EmailCodeLogin tagCode={code} submitLabel="Activar mi chapita" onDone={async () => { setSignedIn(true); await activate(); }} />
    {error && <p className="mi-error" role="alert">{error}</p>}
  </div>;

  return <form className="mi-card mi-form" onSubmit={submitCode}>
    <p className="mi-step">Paso 1 de 2 · {cameFromPackagingQr ? "Chapita encontrada" : "El código"}</p>
    {cameFromPackagingQr && <p className="mi-success" role="status">✓ Leímos el código del packaging. Solo falta confirmar que esta chapita es tuya.</p>}
    <label className="mi-field"><span>{cameFromPackagingQr ? "Código detectado" : "Código de la tarjetita"}</span><input className="mi-code-input" required autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={12} value={code} placeholder="ABCD-2346" onChange={(event) => setCode(event.target.value.toUpperCase())} /></label>
    <label className="mi-check"><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} required /><span>Acepto los <Link href="/terminos" target="_blank">términos y condiciones</Link> y entiendo que los datos que cargue en la chapita (como el WhatsApp de la familia) se muestran a quien la escanee.</span></label>
    {error && <p className="mi-error" role="alert">{error}</p>}
    <button className="mi-button" type="submit" disabled={busy || !terms}>{busy ? "Revisando…" : "Seguir"}</button>
    {signedInEmail && <p className="mi-hint">Vas a activarla con <strong>{signedInEmail}</strong>. <button type="button" className="mi-link" onClick={() => switchAccount(code)}>No soy yo, usar otro email</button></p>}
  </form>;
}
