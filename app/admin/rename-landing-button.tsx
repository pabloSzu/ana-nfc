"use client";

import { useRef, useState, type FormEvent } from "react";
import { IconEdit } from "@/components/icons";

export default function RenameLandingButton({ action, landingId, currentName, currentSlug }: { action: (formData: FormData) => void | Promise<void>; landingId: string; currentName: string; currentSlug: string }) {
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
              <h2>Renombrar landing</h2>
              <p className="muted">Cambiá el nombre visible y/o el link público de la landing.</p>
            </>
          ) : (
            <>
              <h2>Confirmá el cambio</h2>
              <p className="muted">Revisá antes de guardar — esto va a actualizar la landing ya publicada.</p>
            </>
          )}

          <form ref={formRef} action={action} onSubmit={handleSubmit} className="stack">
            <input type="hidden" name="id" value={landingId} />

            <div style={{ display: step === "edit" ? "grid" : "none", gap: "var(--space-4)" }}>
              <label className="label">Nombre del negocio
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
                  ⚠️ Si ya imprimiste un tag NFC o QR para esta landing, apunta a <strong>/{currentSlug}</strong>.
                  Al cambiar el link, ese tag va a dejar de abrir esta página — vas a necesitar uno nuevo.
                </p>
              )}
              <div className="rename-confirm-actions">
                <button type="button" className="btn secondary" onClick={() => setStep("edit")}>Volver</button>
                <button className="btn full" type="submit">Sí, guardar cambios</button>
              </div>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
