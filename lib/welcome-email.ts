import "server-only";
import { getSiteOrigin } from "@/lib/site-url";
import { CONTACT_EMAIL } from "@/lib/terms";

// Mail de bienvenida: se manda una sola vez, cuando el dueño publica su chapita por primera vez
// (app/mi/chapita/[id]/actions.ts). Queda en su casilla para el día que la mascota se pierda: ahí
// está cómo entrar a bionfc.com/mi y avisar.
//
// Sale por la API de Resend (RESEND_API_KEY, se crea en Resend → API Keys). Sin esa clave no se
// manda nada, y si Resend falla tampoco: publicar nunca depende de este mail.
const FROM = "BIONFC <hola@auth.bionfc.com>";

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));

export async function sendWelcomeEmail({ to, petName, petSlug }: { to: string; petName: string; petSlug: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const origin = getSiteOrigin();
  const host = new URL(origin).host;
  const name = escape(petName.trim() || "tu mascota");
  const pageUrl = `${origin}/mascota/${encodeURIComponent(petSlug)}`;
  const portalUrl = `${origin}/mi`;
  const button = (href: string, label: string, color: string) =>
    `<a href="${href}" style="display:inline-block;padding:13px 22px;border-radius:12px;background:${color};color:#fff;font-weight:700;text-decoration:none">${label}</a>`;
  const html = `<div style="max-width:520px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#2d1d12;line-height:1.55">
  <p style="font-size:30px;margin:0">🐾</p>
  <h1 style="margin:8px 0 6px;font-size:24px">La chapita de ${name} ya funciona</h1>
  <p style="margin:0 0 18px;color:#6b4a33">Quien la escanee o acerque su celular ve su página y puede avisarte por WhatsApp.</p>
  <p style="margin:0 0 22px">${button(pageUrl, `Ver la página de ${name}`, "#17803d")}</p>
  <h2 style="margin:0 0 4px;font-size:17px">🚨 Si se pierde</h2>
  <p style="margin:0 0 16px">Entrá a <a href="${portalUrl}" style="color:#c25e22;font-weight:700">${host}/mi</a> con este email (te llega un código, no hay contraseña) y tocá <b>“Avisar que se perdió”</b>. En su página aparece un cartel rojo con la zona y la recompensa, y lo podés compartir.</p>
  <h2 style="margin:0 0 4px;font-size:17px">✏️ Para cambiar datos</h2>
  <p style="margin:0 0 16px">El mismo link, <a href="${portalUrl}" style="color:#c25e22;font-weight:700">${host}/mi</a>. También podés escanear la chapita y tocar <b>“¿Es tu mascota? Editala”</b>, abajo de todo.</p>
  <h2 style="margin:0 0 4px;font-size:17px">📱 Probala</h2>
  <p style="margin:0 0 22px">Acercá tu celular a la chapita o escaneá su QR, así ves lo mismo que va a ver quien la encuentre.</p>
  <p style="margin:0;color:#8a6a52;font-size:13px">Guardá este mail para tenerlo a mano. ¿Dudas? Respondé este mail y te ayudamos.</p>
</div>`;
  const text = `La chapita de ${petName.trim() || "tu mascota"} ya funciona.\n\nSu página: ${pageUrl}\n\nSi se pierde: entrá a ${portalUrl} con este email y tocá "Avisar que se perdió".\nPara cambiar datos: el mismo link, o escaneá la chapita y tocá "¿Es tu mascota? Editala".\n\nGuardá este mail para tenerlo a mano.`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, reply_to: CONTACT_EMAIL, subject: `La chapita de ${petName.trim() || "tu mascota"} ya funciona 🐾`, html, text }),
    });
    if (!response.ok) console.error("Mail de bienvenida: Resend respondió", response.status, await response.text());
  } catch (error) {
    console.error("Mail de bienvenida no se pudo mandar", error);
  }
}
