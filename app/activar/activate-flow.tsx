"use client";

// Activar en tres pasos: el código de la tarjetita (y aceptar los términos), el email con su
// código de 6 números (si no entró antes) y listo: activateTag lleva al editor de la chapita.
import { useState, type FormEvent } from "react";
import EmailCodeLogin from "../mi/email-code-login";
import TermsSheet from "./terms-sheet";
import { activateTag, checkTagCode, switchAccount } from "../mi/auth-actions";
import { formatCode, normalizeCode } from "@/lib/pet-tags";

const OFFLINE = "No pudimos conectarnos. Revisá tu internet y probá de nuevo.";

export default function ActivateFlow({ initialCode, signedInEmail }: { initialCode: string; signedInEmail: string }) {
  const cameFromPackagingQr = Boolean(initialCode);
  const [code, setCode] = useState(initialCode ? formatCode(initialCode) : "");
  const [terms, setTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  // "Seguir" sin aceptar: se marca la casilla y se explica qué falta (el botón no se apaga).
  const [termsMissing, setTermsMissing] = useState(false);
  const [showPublic, setShowPublic] = useState(false);
  // Si el código vino del QR del packaging se muestra en una línea; "Cambiar" abre el campo.
  const [editingCode, setEditingCode] = useState(!cameFromPackagingQr);
  const acceptTerms = (value: boolean) => { setTerms(value); if (value) setTermsMissing(false); };
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
    // Si sale bien, activateTag redirige al editor; si vuelve, es que falló. Next avisa la
    // redirección como un error (NEXT_REDIRECT): ese se deja pasar, no es falta de conexión.
    const result = await activateTag(code, terms).catch((error) => {
      if (String((error as { digest?: string })?.digest).startsWith("NEXT_REDIRECT")) throw error;
      return { ok: false as const, error: OFFLINE };
    });
    setBusy(false);
    if (!result.ok) { setError(result.error); setStep("code"); }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (!terms) { setTermsMissing(true); return; }
    setBusy(true); setError("");
    // Si se corta internet o el servidor no responde, mejor un aviso que "Revisando…" para siempre.
    const result = await checkTagCode(code).catch(() => ({ ok: false as const, error: OFFLINE }));
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    // Una sesión vieja puede pertenecer a otra persona o al dueño de otra chapita. No activamos
    // con un solo toque: mostramos el email en grande y exigimos una confirmación explícita.
    if (signedInEmail) setStep("confirm");
    else if (signedIn) await activate();
    else setStep("login");
  }

  if (step === "confirm") return <>{progress}<div className="mi-card">
    <p className="mi-success">Esta chapita quedará a nombre de <strong>{signedInEmail}</strong>.</p>
    <p className="mi-hint">Después vas a usar ese email para editar los datos de tu mascota.</p>
    {error && <p className="mi-error" role="alert">{error}</p>}
    <button className="mi-button" type="button" disabled={busy} onClick={activate}>{busy ? <><i className="spin" aria-hidden="true" />Activando…</> : "Sí, activar con este email"}</button>
    <button className="mi-link" type="button" disabled={busy} onClick={() => switchAccount(code)}>No es mi email · usar otro</button>
  </div></>;

  if (step === "login") return <>{progress}<div className="mi-card">
    <p className="mi-hint">Con este email vas a entrar después en <strong>bionfc.com/mi</strong> para editar los datos o avisar si se pierde.</p>
    <EmailCodeLogin tagCode={code} submitLabel="Activar mi chapita" onDone={async () => { setSignedIn(true); await activate(); }} />
    {error && <p className="mi-error" role="alert">{error}</p>}
  </div></>;

  return <>{progress}<form className="mi-card mi-form" onSubmit={submitCode}>
    {editingCode
      ? <label className="mi-field"><span>Código de la tarjetita</span><input className="mi-code-input" required autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={12} value={code} placeholder="ABCD-2346" onChange={(event) => setCode(event.target.value.toUpperCase())} /></label>
      : <div className="mi-code-found" role="status"><span aria-hidden="true">✓</span><p><strong>Chapita encontrada</strong><small>Código <b>{code}</b> · <button type="button" className="mi-inline-link" onClick={() => setEditingCode(true)}>Cambiar</button></small></p></div>}
    <div className={`mi-check${termsMissing ? " is-missing" : ""}`}>
      <input id="activar-terminos" type="checkbox" checked={terms} onChange={(event) => acceptTerms(event.target.checked)} aria-describedby={termsMissing ? "activar-terminos-falta" : undefined} />
      <span><label htmlFor="activar-terminos">Acepto los </label><button type="button" className="mi-inline-link" onClick={() => setTermsOpen(true)}>términos</button><label htmlFor="activar-terminos"> y que la ficha será pública</label> · <button type="button" className="mi-inline-link is-soft" aria-expanded={showPublic} onClick={() => setShowPublic(!showPublic)}>Ver qué se muestra</button></span>
    </div>
    {showPublic && <p className="mi-public-note">Solo lo que cargues en la ficha: foto, nombre, información de la mascota y los teléfonos elegidos para que puedan avisarte. Tu email no se publica.</p>}
    {termsMissing && <p id="activar-terminos-falta" className="mi-check-error" role="alert">Necesitás aceptar los términos para continuar.</p>}
    <TermsSheet open={termsOpen} onClose={() => setTermsOpen(false)} onAccept={() => acceptTerms(true)} />
    {error && <p className="mi-error" role="alert">{error}</p>}
    <button className="mi-button" type="submit" disabled={busy}>{busy ? <><i className="spin" aria-hidden="true" />Revisando…</> : "Seguir"}</button>
    {signedInEmail && <p className="mi-hint">Vas a activarla con <strong>{signedInEmail}</strong>. <button type="button" className="mi-link" onClick={() => switchAccount(code)}>No soy yo, usar otro email</button></p>}
  </form></>;
}
