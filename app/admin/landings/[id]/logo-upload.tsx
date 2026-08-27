"use client";

import { useRef } from "react";

export default function LogoUpload({ action, removeAction, landingId, currentUrl }: { action: (formData: FormData) => void | Promise<void>; removeAction: (formData: FormData) => void | Promise<void>; landingId: string; currentUrl?: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div className="upload-box">
      <form ref={formRef} action={action} className="stack" style={{ gap: 6 }}>
        <input type="hidden" name="landing_id" value={landingId} />
        {currentUrl && <img src={currentUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "var(--radius-sm)", margin: "0 auto" }} />}
        <label className="upload-button">{currentUrl ? "Cambiar logo" : "Subir logo o foto"}<input name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={() => formRef.current?.requestSubmit()} /></label>
        <small>JPG, PNG o WEBP. Máximo 5 MB.</small>
      </form>
      {currentUrl && (
        <form action={removeAction}>
          <input type="hidden" name="landing_id" value={landingId} />
          <button type="submit" className="text-button" style={{ margin: "0 auto", display: "block" }}>Quitar logo</button>
        </form>
      )}
    </div>
  );
}
