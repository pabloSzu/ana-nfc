"use client";

import { useRouter } from "next/navigation";
import EmailCodeLogin from "../email-code-login";

// Después de entrar vuelve a donde estaba (por ejemplo, el editor si se le venció la sesión).
export default function OwnerLogin({ next = "/mi" }: { next?: string }) {
  const router = useRouter();
  return <EmailCodeLogin onDone={() => { router.replace(next); router.refresh(); }} />;
}
