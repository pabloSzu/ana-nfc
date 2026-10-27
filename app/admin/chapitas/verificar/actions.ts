"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VERIFY_COOKIE, VERIFY_HOURS, VERIFY_LAST_COOKIE } from "@/lib/pet-tags";

// Prende y apaga el modo "Verificar armado" en este navegador (ver lib/pet-tags.ts).
export async function startVerify() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const store = await cookies();
  store.set(VERIFY_COOKIE, "1", { path: "/", maxAge: VERIFY_HOURS * 3600, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  store.delete(VERIFY_LAST_COOKIE);
  redirect("/admin/chapitas/verificar");
}

export async function stopVerify() {
  const store = await cookies();
  store.delete(VERIFY_COOKIE);
  store.delete(VERIFY_LAST_COOKIE);
  redirect("/admin/chapitas/verificar");
}
