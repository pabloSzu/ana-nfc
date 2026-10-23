"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { IconCheckCircle, IconAlertCircle, IconX } from "@/components/icons";

const NOTICE_KEYS = ["error", "success", "saved"];

// El aviso de arriba (verde o rojo, se va solo a los 5 segundos). Lo usan Toast, que lo saca de
// la dirección (?saved, ?error) después de un redirect, y las pantallas que reciben la respuesta
// de una acción directamente (por ejemplo, el editor de la chapita).
export function ToastBubble({ message, isError = false, onDone }: { message: string; isError?: boolean; onDone: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  function dismiss() {
    setVisible(false);
    setTimeout(onDone, 220);
  }

  return (
    <div className={`toast-wrap ${isError ? "toast-error" : "toast-success"} ${visible ? "toast-in" : "toast-out"}`} role="status">
      {isError ? <IconAlertCircle /> : <IconCheckCircle />}
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={dismiss} aria-label="Cerrar">
        <IconX />
      </button>
    </div>
  );
}

export default function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  const success = searchParams.get("success") || searchParams.get("saved");
  const message = error || success;

  if (!message) return null;

  // Al cerrarse, saca el aviso de la dirección (si no, volvería a aparecer al recargar).
  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    NOTICE_KEYS.forEach((key) => params.delete(key));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return <ToastBubble key={message} message={message} isError={Boolean(error)} onDone={clear} />;
}
