"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText: string;
  children: ReactNode;
};

export default function PendingSubmitButton({ pendingText, children, disabled, className = "", ...props }: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  return <button {...props} className={className} type="submit" disabled={disabled || pending} aria-busy={pending}>
    {pending && <span className="button-spinner" aria-hidden="true" />}
    {pending ? pendingText : children}
  </button>;
}
