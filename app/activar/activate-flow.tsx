"use client";

// Activar en tres pasos: el código de la tarjetita (y aceptar los términos), el email con su
// código de 6 números (si no entró antes) y listo: activateTag lleva al editor de la chapita.
import { useState, type FormEvent } from "react";
import Link from "next/link";
import EmailCodeLogin from "../mi/email-code-login";
import { activateTag, checkTagCode, switchAccount } from "../mi/auth-actions";
import { formatCode, normalizeCode } from "@/lib/pet-tags";

export default function ActivateFlow({ initialCode, signedInEmail }: { initialCode: string; signedInEmail: string }) {
  const cameFromPackagingQr = Boolean(initialCode);
  const [code, setCode] = useState(initialCode ? formatCode(initialCode) : "");
  const [terms, setTerms] = useState(false);
  const [step, setStep] = useState<"code" | "login" | "confirm">("code");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Si ya entró con su email y la activación falló, al reintentar no se le vuelve a pedir el mail.
  const [signedIn, setSignedIn] = useState(Boolean(signedInEmail));
  const progress = <ol className="mi-progress" aria-label="Pasos para activar la chapita">
    <li className={step === "code" ? "is-current" : "is-done"}><span>{step === "code" ? "1" : "✓"}</span>Código</li>
    <li className={step !== "code" ? "is-current" : ""}><span>2</span>Tu email</li>
    <li><span>3</span>Datos</li>
  </ol>;

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
    // Una sesión vieja puede pertenecer a otra persona o al dueño de otra chapita. No activamos
    // con un solo toque: mostramos el email en grande y exigimos una confirmación explícita.
    if (signedInEmail) setStep("confirm");
    else if (signedIn) await activate();
    else setStep("login");
  }

  if (step === "confirm") return <>{progress}<div className="mi-card">
    <p className="mi-step">Paso 2 de 3 · Confirmá tu cuenta</p>
    <p className="mi-success">Esta chapita quedará a nombre de <strong>{signedInEmail}</strong>.</p>
    <p className="mi-hint">Después vas a usar ese email para editar los datos de tu mascota.</p>
    {error && <p className="mi-error" role="alert">{error}</p>}
    <button className="mi-button" type="button" disabled={busy} onClick={activate}>{busy ? "Activando…" : "Sí, activar con este email"}</button>
    <button className="mi-link" type="button" disabled={busy} onClick={() => switchAccount(code)}>No es mi email · usar otro</button>
  </div></>;

  if (step === "login") return <>{progress}<div className="mi-card">
    <p className="mi-step">Paso 2 de 3 · Tu email</p>
    <p className="mi-hint">Con este email vas a entrar después para editar los datos o avisar si se pierde.</p>
    <EmailCodeLogin tagCode={code} submitLabel="Activar mi chapita" onDone={async () => { setSignedIn(true); await activate(); }} />
    {error && <p className="mi-error" role="alert">{error}</p>}
  </div></>;

  return <>{progress}<form className="mi-card mi-form" onSubmit={submitCode}>
    <p className="mi-step">Paso 1 de 3 · {cameFromPackagingQr ? "Chapita encontrada" : "El código"}</p>
    {cameFromPackagingQr && <p className="mi-success" role="status">✓ Leímos el código del packaging. Solo falta confirmar que esta chapita es tuya.</p>}
    <label className="mi-field"><span>{cameFromPackagingQr ? "Código detectado" : "Código de la tarjetita"}</span><input className="mi-code-input" required autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={12} value={code} placeholder="ABCD-2346" onChange={(event) => setCode(event.target.value.toUpperCase())} /></label>
    <label className="mi-check"><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} required /><span>Acepto los <Link href={`/terminos?volver=${encodeURIComponent(`/activar${normalizeCode(code) ? `?c=${normalizeCode(code)}` : ""}`)}`}>términos y condiciones</Link> y entiendo que los datos que cargue en la chapita (como el WhatsApp de la familia) se muestran a quien la escanee.</span></label>
    {error && <p className="mi-error" role="alert">{error}</p>}
    <button className="mi-button" type="submit" disabled={busy || !terms}>{busy ? "Revisando…" : "Seguir"}</button>
    {signedInEmail && <p className="mi-hint">Vas a activarla con <strong>{signedInEmail}</strong>. <button type="button" className="mi-link" onClick={() => switchAccount(code)}>No soy yo, usar otro email</button></p>}
  </form></>;
}
