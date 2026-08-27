"use client";

import { useRef } from "react";

export default function LogoUpload({ action, landingId }: { action: (formData: FormData) => void | Promise<void>; landingId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return <form ref={formRef} action={action} className="upload-box"><input type="hidden" name="landing_id" value={landingId} /><label className="upload-button">Subir logo o foto<input name="file" type="file" accept="image/jpeg,image/png,image/webp" onChange={() => formRef.current?.requestSubmit()} /></label><small>JPG, PNG o WEBP. Máximo 5 MB.</small></form>;
}
