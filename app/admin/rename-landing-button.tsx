"use client";

import { useRef, useState, type FormEvent } from "react";
import { IconEdit } from "@/components/icons";
import PendingSubmitButton from "@/components/pending-submit-button";

export default function RenameLandingButton({ action, landingId, currentName, currentSlug, isContact = false, returnTo = "/admin" }: { action: (formData: FormData) => void | Promise<void>; landingId: string; currentName: string; currentSlug: string; isContact?: boolean; returnTo?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(currentName);
  const [slug, setSlug] = useState(currentSlug);
  const [step, setStep] = useState<"edit" | "confirm">("edit");

  const nameChanged = name.trim() !== currentName;
  const slugChanged = slug.trim() !== currentSlug;

  function open() {
    setName(currentName);
    setSlug(currentSlug);
    setStep("edit");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
    setStep("edit");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (step === "confirm") return; // user already confirmed — let it actually submit
    event.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    if (!nameChanged && !slugChanged) { close(); return; }
    setStep("confirm");
  }

  return (
    <>
      <button type="button" className="icon-text-button secondary-action slot-rename" title="Renombrar" aria-label="Renombrar" onClick={open}><IconEdit /> <span className="btn-label">Renombrar</span></button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-content">
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={close}>✕</button>

          {step === "edit" ? (
            <>
              <h2>Renombrar {isContact ? "tarjeta" : "landing"}</h2>
              <p className="muted">Cambiá el nombre visible y/o el link público de {isContact ? "la tarjeta" : "la landing"}.</p>
            </>
          ) : (
            <>
              <h2>Confirmá el cambio</h2>
              <p className="muted">Revisá antes de guardar: se actualizará {isContact ? "la tarjeta" : "la landing"}.</p>
            </>
          )}

          <form ref={formRef} action={action} onSubmit={handleSubmit} className="stack">
            <input type="hidden" name="id" value={landingId} />
            <input type="hidden" name="return_to" value={returnTo} />

            <div style={{ display: step === "edit" ? "grid" : "none", gap: "var(--space-4)" }}>
              <label className="label">{isContact ? "Nombre de la persona" : "Nombre de la landing"}
                <input name="business_name" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="label">Link público
                <div className="slug-field">
                  <span>/</span>
                  <input
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    required
                  />
                </div>
              </label>
              <button className="btn full" type="submit">Continuar</button>
            </div>

            <div style={{ display: step === "confirm" ? "grid" : "none", gap: "var(--space-4)" }}>
              <div className="rename-diff">
                {nameChanged && <p><span className="muted">Nombre</span><strong>{currentName} → {name}</strong></p>}
                {slugChanged && <p><span className="muted">Link</span><strong>/{currentSlug} → /{slug}</strong></p>}
              </div>
              {slugChanged && (
                <p className="rename-warning">
                  ⚠️ Si grabaste manualmente <strong>/{currentSlug}</strong> en un NFC o QR, ese enlace dejará de funcionar.
                  Los códigos nuevos generados desde el panel usan una dirección permanente y no se ven afectados.
                </p>
              )}
              <div className="rename-confirm-actions">
                <button type="button" className="btn secondary" onClick={() => setStep("edit")}>Volver</button>
                <PendingSubmitButton className="btn full" pendingText="Guardando…">Sí, guardar cambios</PendingSubmitButton>
              </div>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
