"use client";

import { useRef } from "react";
import Link from "next/link";
import { IconEye } from "@/components/icons";

// A landing's public link only resolves once it's published (app/[slug]/page.tsx filters on
// published:true), so "Ver" on a draft would just open a 404. Instead of a dead link, a draft
// gets the same button that explains why and offers to publish it right there.
export default function ViewLandingButton({ slug, landingId, published, publishAction, className = "" }: { slug: string; landingId: string; published: boolean; publishAction: (formData: FormData) => void | Promise<void>; className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const classes = `icon-text-button accent ${className}`.trim();

  if (published) {
    return <Link className={classes} href={`/${slug}`} target="_blank" title="Ver" aria-label="Ver"><IconEye /> <span className="btn-label">Ver</span></Link>;
  }

  return (
    <>
      <button type="button" className={`${classes} is-locked`} title="Publicala primero para poder verla" aria-label="Ver (publicala primero)" onClick={() => dialogRef.current?.showModal()}>
        <IconEye /> <span className="btn-label">Ver</span>
      </button>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-content">
          <button type="button" className="modal-close" aria-label="Cerrar" onClick={() => dialogRef.current?.close()}>✕</button>
          <h2>Primero publicala</h2>
          <p className="muted">Esta landing está en borrador, así que <strong>/{slug}</strong> todavía no abre nada. Publicala para poder verla.</p>
          <form action={publishAction} className="stack">
            <input type="hidden" name="id" value={landingId} />
            <input type="hidden" name="published" value="true" />
            <input type="hidden" name="return_to" value="/admin" />
            <div className="rename-confirm-actions">
              <button type="button" className="btn secondary" onClick={() => dialogRef.current?.close()}>Ahora no</button>
              <button className="btn full" type="submit">Publicar ahora</button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
