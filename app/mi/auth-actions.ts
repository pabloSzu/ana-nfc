"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { allow, clientIp, createAdminClient } from "@/lib/supabase/admin";
import { normalizeCode } from "@/lib/pet-tags";
import { TERMS_VERSION } from "@/lib/terms";

// Entrada de los dueños (no del staff): sin contraseña. Ponen su email, les llega un código de 6
// números y lo escriben acá.
//
// En Supabase el registro público está APAGADO ("Allow new users to sign up"): la única forma de
// tener cuenta es activar una chapita con un código válido, y la cuenta la crea este servidor con
// la clave secreta. Así nadie arma cuentas ni manda mails salteándose esto con la clave pública.
// Todo lo que se puede abusar (probar códigos, pedir mails) tiene límite por IP y por email.

export type ActionResult = { ok: true } | { ok: false, error: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOO_MANY = "Hiciste muchos intentos seguidos. Esperá unos minutos y probá de nuevo.";

function friendly(message: string): string {
  if (/rate limit|security purposes|seconds/i.test(message)) return "Mandamos muchos códigos seguidos. Esperá un minuto y probá de nuevo.";
  if (/expired|invalid/i.test(message)) return "El código no es correcto o ya venció. Revisalo o pedí uno nuevo.";
  if (/signups not allowed|not allowed|not found/i.test(message)) return "Ese email no tiene una chapita. Para entrar por primera vez, activá tu chapita con el código de la tarjetita.";
  return "No pudimos mandar el código. Probá de nuevo en un rato.";
}

// ¿El código de la tarjetita existe y no se usó? Con límite por IP: son 8 caracteres, y sin
// límite alguien podría probar millones hasta dar con uno.
async function codeIsValid(code: string): Promise<"ok" | "invalid" | "limit" | "error"> {
  if (!(await allow(`code:${await clientIp()}`, 20, 10 * 60))) return "limit";
  const { data, error } = await createAdminClient().rpc("tag_code_valid", { p_code: normalizeCode(code) });
  if (error) { console.error("tag_code_valid falló", error.message); return "error"; }
  return data ? "ok" : "invalid";
}

export async function sendLoginCode(email: string, tagCode = ""): Promise<ActionResult> {
  const clean = email.trim().toLowerCase();
  if (!emailPattern.test(clean)) return { ok: false, error: "Ese email no parece válido." };
  const ip = await clientIp();
  if (!(await allow(`mail-ip:${ip}`, 10, 60 * 60)) || !(await allow(`mail:${clean}`, 6, 60 * 60))) return { ok: false, error: TOO_MANY };

  if (tagCode) {
    const valid = await codeIsValid(tagCode);
    if (valid === "limit") return { ok: false, error: TOO_MANY };
    if (valid === "error") return { ok: false, error: "No pudimos revisar el código. Probá de nuevo." };
    if (valid === "invalid") return { ok: false, error: "Ese código no existe o ya se usó." };
    // La cuenta la crea el servidor (si ya existía, Supabase avisa y seguimos igual). Se crea
    // confirmada porque para entrar igual hay que escribir el código que llega a ese email.
    const { error } = await createAdminClient().auth.admin.createUser({ email: clean, email_confirm: true });
    if (error && !/already|registered|exists/i.test(error.message)) {
      console.error("createUser falló", error.message);
      return { ok: false, error: "No pudimos crear tu cuenta. Probá de nuevo en un rato." };
    }
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: false } });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function verifyLoginCode(email: string, token: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.replace(/\D/g, ""), type: "email" });
  return error ? { ok: false, error: friendly(error.message) } : { ok: true };
}

export async function checkTagCode(code: string): Promise<ActionResult> {
  if (!normalizeCode(code)) return { ok: false, error: "Escribí el código de la tarjetita." };
  const valid = await codeIsValid(code);
  if (valid === "ok") return { ok: true };
  if (valid === "limit") return { ok: false, error: TOO_MANY };
  if (valid === "error") return { ok: false, error: "No pudimos revisar el código. Probá de nuevo." };
  return { ok: false, error: "Ese código no existe o ya se usó. Revisá la tarjetita de tu chapita." };
}

// Ya con la sesión iniciada: la chapita pasa a ser de este usuario y se abre su editor.
export async function activateTag(code: string, acceptedTerms: boolean): Promise<ActionResult> {
  if (!acceptedTerms) return { ok: false, error: "Para activar la chapita tenés que aceptar los términos." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("activate_tag", { p_code: normalizeCode(code), p_terms_version: TERMS_VERSION });
  if (error) {
    if (/demasiados_intentos/.test(error.message)) return { ok: false, error: TOO_MANY };
    if (/sin_sesion/.test(error.message)) return { ok: false, error: "Se cerró tu sesión. Volvé a poner tu email." };
    console.error("activate_tag falló", error.message);
    return { ok: false, error: "No pudimos activar la chapita. Probá de nuevo." };
  }
  if (!data) return { ok: false, error: "Ese código no existe o ya se usó." };
  revalidatePath("/mi");
  redirect(`/mi/chapita/${data}?saved=${encodeURIComponent("¡Chapita activada! Cargá los datos de tu mascota")}`);
}

// "No soy yo": en /activar con la sesión de otra persona abierta (por ejemplo, la del celular de
// la veterinaria). Cierra la sesión solo en este navegador.
export async function switchAccount(code: string) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(`/activar${code ? `?c=${encodeURIComponent(normalizeCode(code))}` : ""}`);
}

// "Salir" cierra la sesión solo en este dispositivo (por defecto Supabase cierra todas).
export async function logoutOwner() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/mi/entrar");
}
