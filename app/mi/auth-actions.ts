"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeCode } from "@/lib/pet-tags";

// Entrada de los dueños (no del staff): sin contraseña. Ponen su email, les llega un código de 6
// números y lo escriben acá. Quien no tiene cuenta la crea al activar su primera chapita.

export type ActionResult = { ok: true } | { ok: false, error: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendly(message: string): string {
  if (/rate limit|security purposes|seconds/i.test(message)) return "Mandamos muchos códigos seguidos. Esperá un minuto y probá de nuevo.";
  if (/expired|invalid/i.test(message)) return "El código no es correcto o ya venció. Revisalo o pedí uno nuevo.";
  if (/signups not allowed|not allowed/i.test(message)) return "Ese email no tiene una chapita. Para entrar por primera vez, activá tu chapita con el código de la tarjetita.";
  return "No pudimos mandar el código. Probá de nuevo en un rato.";
}

// La cuenta se crea solo al activar una chapita, y solo con un código válido: así nadie se arma
// una cuenta sin haber comprado, ni usa esto para mandar mails a direcciones ajenas. En
// "Entrar" (sin código) solo entra quien ya tiene cuenta.
export async function sendLoginCode(email: string, tagCode = ""): Promise<ActionResult> {
  const clean = email.trim().toLowerCase();
  if (!emailPattern.test(clean)) return { ok: false, error: "Ese email no parece válido." };
  const supabase = await createClient();
  let allowNew = false;
  if (tagCode) {
    const { data: valid } = await supabase.rpc("tag_code_valid", { p_code: normalizeCode(tagCode) });
    if (!valid) return { ok: false, error: "Ese código no existe o ya se usó." };
    allowNew = true;
  }
  const { error } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: allowNew } });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function verifyLoginCode(email: string, token: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.replace(/\D/g, ""), type: "email" });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function checkTagCode(code: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tag_code_valid", { p_code: normalizeCode(code) });
  if (error) return { ok: false, error: "No pudimos revisar el código. Probá de nuevo." };
  return data ? { ok: true } : { ok: false, error: "Ese código no existe o ya se usó. Revisá la tarjetita de tu chapita." };
}

// Ya con la sesión iniciada: la chapita pasa a ser de este usuario y se abre su editor.
export async function activateTag(code: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("activate_tag", { p_code: normalizeCode(code) });
  if (error || !data) return { ok: false, error: /codigo_invalido/.test(error?.message || "") ? "Ese código no existe o ya se usó." : "No pudimos activar la chapita. Probá de nuevo." };
  revalidatePath("/mi");
  redirect(`/mi/chapita/${data}?saved=${encodeURIComponent("¡Chapita activada! Cargá los datos de tu mascota")}`);
}

export async function logoutOwner() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/mi/entrar");
}
