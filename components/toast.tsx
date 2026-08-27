"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { IconCheckCircle, IconAlertCircle, IconX } from "@/components/icons";

const NOTICE_KEYS = ["error", "success", "saved"];

export default function Toast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const error = searchParams.get("error");
  const success = searchParams.get("success") || searchParams.get("saved");
  const message = error || success;
  const isError = Boolean(error);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  function dismiss() {
    setVisible(false);
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      NOTICE_KEYS.forEach((key) => params.delete(key));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 220);
  }

  if (!message) return null;

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
