"use client";

import { useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";

export default function LogoUpload({ action, removeAction, landingId, currentUrl }: { action: (formData: FormData) => void | Promise<void>; removeAction: (formData: FormData) => void | Promise<void>; landingId: string; currentUrl?: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const compressed = await compressImage(file, 320);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(compressed);
    if (inputRef.current) inputRef.current.files = dataTransfer.files;
    formRef.current?.requestSubmit();
  }

  return (
    <div className="upload-box">
      <form ref={formRef} action={action} className="stack" style={{ gap: 6 }}>
        <input type="hidden" name="landing_id" value={landingId} />
        {currentUrl && <img src={currentUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "var(--radius-sm)", margin: "0 auto" }} />}
        <label className="upload-button">
          {uploading ? "Optimizando y subiendo..." : currentUrl ? "Cambiar logo" : "Subir logo o foto"}
          <input ref={inputRef} name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
        </label>
        <small>JPG, PNG o WEBP. La comprimimos sola para que cargue rápido.</small>
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
