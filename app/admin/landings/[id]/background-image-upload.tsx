"use client";

import { useRef } from "react";

export default function BackgroundImageUpload({ action, removeAction, landingId, currentUrl }: { action: (formData: FormData) => void | Promise<void>; removeAction: (formData: FormData) => void | Promise<void>; landingId: string; currentUrl?: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div className="upload-box">
      <form ref={formRef} action={action} className="stack" style={{ gap: 6 }}>
        <input type="hidden" name="landing_id" value={landingId} />
        {currentUrl && <img src={currentUrl} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: "var(--radius-sm)" }} />}
        <label className="upload-button">{currentUrl ? "Cambiar imagen de fondo" : "Subir imagen de fondo"}<input name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={() => formRef.current?.requestSubmit()} /></label>
        <small>JPG, PNG o WEBP. Máximo 5 MB.</small>
      </form>
      {currentUrl && (
        <form action={removeAction}>
          <input type="hidden" name="landing_id" value={landingId} />
          <button type="submit" className="text-button" style={{ margin: "0 auto", display: "block" }}>Quitar imagen de fondo</button>
        </form>
      )}
    </div>
  );
}
