"use client";

import { useRouter } from "next/navigation";
import EmailCodeLogin from "../email-code-login";

export default function OwnerLogin() {
  const router = useRouter();
  return <EmailCodeLogin onDone={() => { router.replace("/mi"); router.refresh(); }} />;
}
