// Prueba completa de las chapitas, como un dueño real, contra DEV y el servidor local
// (npm run dev). Se corre con: npm run e2e:chapitas
//
// Crea un usuario y una chapita sin activar de prueba (sin mandar mails: la sesión se arma con la
// clave secreta), recorre todo en Chrome emulando un celular y al final borra lo que creó, salga
// bien o mal. Nunca corre contra PROD.
//
//  1. Activar con el código → los 3 pasos → publicar → "¡Ya funciona!".
//  2. Pasos opcionales → final → menú.
//  3. Editar el nombre y guardar → vuelve al menú con el aviso.
//  4. Cambiar algo y cancelar → pregunta → se descarta.
//  5. Activar el modo perdido → "Ahora, difundilo" (dos veces seguidas) → desactivar.
//  6. La página pública muestra el cartel y el link corto redirige.
//  7. "Compartir" en Mis chapitas prepara las imágenes.
import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { newActivationCode, newTagSlug } from "../lib/pet-tags.ts";

const BASE = process.env.E2E_BASE || "http://localhost:3000";
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const EMAIL = "e2e-chapitas@bionfc.test";
const PORT = 9399;

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (!SUPABASE_URL.includes("zupefxnbvlardzdrhqjb")) throw new Error("Esta prueba solo corre contra DEV.");
const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SECRET_KEY!);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const results: { step: string; ok: boolean; detail?: string }[] = [];
function check(step: string, ok: boolean, detail = "") {
  results.push({ step, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${step}${detail ? ` — ${detail}` : ""}`);
}

// ---------- Datos de prueba ----------
async function setup() {
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const old of users.filter((user) => user.email === EMAIL)) await cleanupUser(old.id);
  const user = (await admin.auth.admin.createUser({ email: EMAIL, email_confirm: true })).data.user!;
  const { data: batch } = await admin.from("tag_batches").select("id,owner_id").order("created_at").limit(1).single();
  const { data: tag, error } = await admin.from("landings").insert({
    owner_id: batch!.owner_id, client_id: null, business_type: "pet", template: "professional", plan: "lifetime", published: false,
    business_name: "Chapita e2e", slug: newTagSlug(), batch_id: batch!.id, tag_number: 9999, button_style: { pet: {} },
  }).select("id").single();
  if (error) throw error;
  const code = newActivationCode();
  await admin.from("tag_activations").insert({ landing_id: tag!.id, code });
  // Sesión sin mandar mail: un código generado con la clave secreta, canjeado acá.
  const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: EMAIL });
  if (!link.properties) throw new Error("No se pudo generar el código de entrada.");
  const anon = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data: verified, error: verifyError } = await anon.auth.verifyOtp({ email: EMAIL, token: link.properties.email_otp, type: "email" });
  if (verifyError) throw verifyError;
  // La cookie como la arma @supabase/ssr ("base64-" + JSON en base64url, en partes si es larga).
  const value = "base64-" + Buffer.from(JSON.stringify(verified.session)).toString("base64url");
  const name = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
  const cookies = value.length <= 3180 ? [{ name, value }] : value.match(/.{1,3180}/g)!.map((chunk, index) => ({ name: `${name}.${index}`, value: chunk }));
  return { userId: user.id, tagId: tag!.id, code, cookies };
}

async function cleanupUser(userId: string) {
  const { data: members } = await admin.from("client_members").select("client_id").eq("user_id", userId);
  const clientIds = (members || []).map((row) => row.client_id);
  if (clientIds.length) await admin.from("landings").delete().in("client_id", clientIds);
  await admin.from("client_members").delete().eq("user_id", userId);
  if (clientIds.length) await admin.from("clients").delete().in("id", clientIds);
  await admin.auth.admin.deleteUser(userId);
}

// ---------- Chrome (por el protocolo de depuración, sin librerías) ----------
async function openChrome(profile: string) {
  const proc = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  let targets: { type: string; webSocketDebuggerUrl: string }[] = [];
  for (let i = 0; i < 40 && !targets.length; i++) { try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); } catch { await sleep(250); } }
  const ws = new WebSocket(targets.find((target) => target.type === "page")!.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));
  let id = 0;
  const pending = new Map<number, (value: unknown) => void>();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) { pending.get(message.id)!(message.result ?? message.error); pending.delete(message.id); }
    if (message.method === "Runtime.exceptionThrown") console.log("  ! error en la página:", message.params.exceptionDetails.exception?.description?.slice(0, 160));
  });
  const send = (method: string, params: object = {}) => new Promise<any>((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); });
  const js = async (expression: string) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const waitFor = async (expression: string, seconds = 30) => { for (let i = 0; i < seconds * 2; i++) { if (await js(expression)) return true; await sleep(500); } return false; };
  const click = (selector: string) => js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
  const clickText = (text: string, scope = "button, a") => js(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(scope)})].find((x) => x.textContent.trim().startsWith(${JSON.stringify(text)})); if (!el) return false; el.click(); return true; })()`);
  // Escribe como una persona (dispara los cambios de React).
  const type = async (selector: string, text: string) => { await js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.focus(); el.select?.(); })()`); await send("Input.insertText", { text }); };
  const go = async (url: string) => { await send("Page.navigate", { url }); await waitFor("document.readyState === 'complete'"); await waitFor("Object.keys(document.querySelector('main, .pet-editor, .mi-shell') || {}).some((k) => k.startsWith('__react'))", 40); };
  await send("Runtime.enable"); await send("Page.enable"); await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  return { send, js, waitFor, click, clickText, type, go, close: () => { ws.close(); proc.kill(); } };
}

// ---------- El recorrido ----------
async function run() {
  const data = await setup();
  const profile = mkdtempSync(join(tmpdir(), "e2e-chapitas-"));
  const chrome = await openChrome(profile);
  const { js, waitFor, click, clickText, type, go, send } = chrome;
  try {
    for (const cookie of data.cookies) await send("Network.setCookie", { ...cookie, domain: new URL(BASE).hostname, path: "/" });

    // 1. Activar y los 3 pasos.
    await go(`${BASE}/activar?c=${data.code}`);
    await click(".mi-check input");
    await click("form.mi-form button[type=submit]");
    check("Activar: el código pasa", await waitFor("document.body.innerText.includes('Sí, activar con este email')"));
    await clickText("Sí, activar con este email");
    check("Activar: abre el paso 1", await waitFor("document.body.innerText.toLowerCase().includes('paso 1 de 3')", 40));
    check("Activar: sin cartelito verde", !(await js("Boolean(document.querySelector('.toast-wrap'))")));
    await clickText("Saltear por ahora");
    await type(".pet-wizard-field input", "Toby e2e");
    await clickText("Siguiente");
    await type(".pet-wizard-field input", "351 555 1234");
    let started = Date.now();
    await clickText("Publicar mi chapita");
    const publishedOk = await waitFor("document.body.innerText.includes('ya funciona')", 30);
    check("Publicar: aparece '¡Ya funciona!'", publishedOk, `${Date.now() - started} ms`);
    check("Publicar: sin cartelito verde", !(await js("Boolean(document.querySelector('.toast-wrap'))")));
    const { data: published } = await admin.from("landings").select("published,pet_slug").eq("id", data.tagId).single();
    check("Publicar: quedó publicada en la base", Boolean(published?.published), published?.pet_slug || "");

    // 2. Pasos opcionales.
    await clickText("Seguir");
    check("Opcionales: elegir diseño", await waitFor("document.body.innerText.includes('Elegí un diseño')"));
    await js("[...document.querySelectorAll('.pet-look-grid button')][3].click()");
    await clickText("Siguiente");
    await clickText("Hembra");
    await clickText("Siguiente");
    check("Opcionales: segundo contacto", await waitFor("document.body.innerText.includes('Alguien más')"));
    await clickText("Saltear", "button");
    check("Opcionales: si se pierde", await waitFor("document.body.innerText.includes('Si algún día se pierde')"));
    await clickText("Entendido");
    check("Opcionales: final", await waitFor("document.body.innerText.includes('Lista la chapita')"));
    await sleep(1500);
    const { data: afterSteps } = await admin.from("landings").select("button_style").eq("id", data.tagId).single();
    const savedPet = (afterSteps?.button_style as { pet?: { look?: string; about?: { sex?: string } } })?.pet;
    check("Opcionales: se guardó lo elegido", savedPet?.look === "divertido" && savedPet?.about?.sex === "Hembra", `${savedPet?.look} · ${savedPet?.about?.sex}`);
    await clickText("Ver todo lo que puedo cambiar");
    check("Opcionales: llega al menú", await waitFor("Boolean(document.querySelector('.pet-menu'))"));

    // 3. Editar y guardar.
    await click("[data-tour=row-pet]");
    await type(".pet-form .pet-field input", "Toby Editado");
    started = Date.now();
    await click(".pet-form-bar .is-save");
    const savedOk = await waitFor("Boolean(document.querySelector('.pet-menu'))");
    check("Guardar: vuelve al menú", savedOk, `${Date.now() - started} ms`);
    check("Guardar: muestra el aviso", await waitFor("document.querySelector('.toast-wrap')?.textContent.includes('Guardado')", 10));
    const { data: renamed } = await admin.from("landings").select("business_name,pet_slug").eq("id", data.tagId).single();
    check("Guardar: el nombre quedó en la base", renamed?.business_name === "Toby Editado", `link ${renamed?.pet_slug}`);

    // 4. Cancelar con cambios.
    await click("[data-tour=row-pet]");
    await type(".pet-form .pet-field input", "No guardar");
    await click(".pet-form-bar button");
    check("Cancelar: pregunta", await waitFor("document.querySelector('.pet-confirm')?.open"));
    await click(".pet-confirm-leave");
    check("Cancelar: vuelve al menú sin el cambio", await waitFor("Boolean(document.querySelector('.pet-menu')) && document.querySelector('.pet-summary strong')?.textContent === 'Toby Editado'"));

    // 5. Modo perdido, dos veces.
    for (const round of [1, 2]) {
      await click("[data-tour=row-lost]");
      await click(".pet-switch");
      const lostStarted = Date.now();
      await click(round === 1 ? ".pet-lost-confirm" : ".pet-form-bar .is-save");
      const spreadOk = await waitFor("Boolean(document.querySelector('.pet-spread'))", 30);
      check(`Perdido (${round}): aparece 'Ahora, difundilo'`, spreadOk, `${Date.now() - lostStarted} ms`);
      check(`Perdido (${round}): sin cartelito del modo perdido`, !(await js("Boolean(document.querySelector('.toast-wrap')?.textContent.toLowerCase().includes('perdido'))")));
      check(`Perdido (${round}): las imágenes se preparan`, await waitFor("[...document.querySelectorAll('.pet-share-option')].length >= 3 && ![...document.querySelectorAll('.pet-share-option')].some((b) => b.disabled)", 40));
      if (round === 1) {
        const page = await fetch(`${BASE}/mascota/${renamed?.pet_slug}`).then((response) => response.text());
        check("Perdido: la página pública muestra el cartel", page.includes("¡Estoy perdida!"));
      }
      await clickText("Listo");
      await click("[data-tour=row-lost]");
      await click(".pet-switch");
      await click(".pet-lost-confirm");
      check(`Perdido (${round}): desactivar vuelve al menú con el aviso`, await waitFor("Boolean(document.querySelector('.pet-menu')) && document.querySelector('.toast-wrap')?.textContent.includes('desactivado')", 20));
      await sleep(5500);
    }

    // 6. El link anterior redirige al actual.
    const old = await fetch(`${BASE}/mascota/${published?.pet_slug}`, { redirect: "manual" });
    check("Link: el anterior redirige al actual", old.status === 307 && (old.headers.get("location") || "").includes(renamed?.pet_slug || "?"), `${old.status} → ${old.headers.get("location")}`);

    // 7. Compartir desde Mis chapitas.
    await go(`${BASE}/mi`);
    await clickText("Compartir", ".mi-pet-actions button");
    check("Mis chapitas: Compartir prepara las imágenes", await waitFor("document.querySelector('.pet-share-sheet')?.open && [...document.querySelectorAll('.pet-share-sheet .pet-share-option')].length >= 3 && ![...document.querySelectorAll('.pet-share-sheet .pet-share-option')].some((b) => b.disabled)", 40));
  } finally {
    chrome.close();
    await cleanupUser(data.userId);
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

run()
  .then(() => {
    const failed = results.filter((result) => !result.ok);
    console.log(`\n${results.length - failed.length} de ${results.length} bien. Datos de prueba borrados.`);
    process.exit(failed.length ? 1 : 0);
  })
  .catch((error) => { console.error("La prueba se cortó:", error); process.exit(1); });
