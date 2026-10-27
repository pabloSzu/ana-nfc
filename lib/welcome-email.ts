import "server-only";
import { getSiteOrigin } from "@/lib/site-url";
import { CONTACT_EMAIL } from "@/lib/terms";

// Se manda una sola vez, cuando la chapita se publica por primera vez. Publicar nunca depende
// de este correo: si Resend no está configurado o falla, la chapita queda activa igual.
const FROM = "BIONFC <hola@auth.bionfc.com>";

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!));

export function welcomeEmailContent({ petName, petSlug, photoUrl = "" }: { petName: string; petSlug: string; photoUrl?: string }) {
  const origin = getSiteOrigin();
  const rawName = petName.replace(/[\r\n]+/g, " ").trim() || "tu mascota";
  const name = escape(rawName);
  const pageUrl = `${origin}/mascota/${encodeURIComponent(petSlug)}`;
  const portalUrl = `${origin}/mi`;
  const photo = photoUrl
    ? `<img src="${escape(photoUrl)}" width="104" height="104" alt="Foto de ${name}" style="display:block;width:104px;height:104px;border:5px solid #fff;border-radius:52px;object-fit:cover;box-shadow:0 10px 28px rgba(105,55,25,.18)">`
    : `<div style="width:94px;height:94px;border:5px solid #fff;border-radius:52px;background:#fbe5d4;box-shadow:0 10px 28px rgba(105,55,25,.14);font-size:42px;line-height:94px;text-align:center">🐾</div>`;

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>La chapita de ${name} ya está activa</title>
  <style>
    @media only screen and (max-width:620px){
      .email-wrap{padding:0!important}.email-card{border-radius:0!important}.email-pad{padding-left:22px!important;padding-right:22px!important}.email-button{display:block!important;text-align:center!important}.email-title{font-size:27px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#fff6ed;color:#2d1d12;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Ya podés probar la chapita de ${name} y completar su ficha.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:linear-gradient(145deg,#fffaf5,#f9dfcb)">
    <tr><td class="email-wrap" align="center" style="padding:34px 14px">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="email-card" style="width:100%;max-width:600px;overflow:hidden;border:1px solid #f0d9c8;border-radius:24px;background:#fff;box-shadow:0 16px 42px rgba(113,59,26,.10)">
        <tr><td class="email-pad" style="padding:25px 34px 18px">
          <a href="${origin}" style="display:inline-block;color:#17120f;font-size:22px;font-weight:800;letter-spacing:-1px;text-decoration:none">BIO<span style="color:#258bd2">NFC</span></a>
        </td></tr>
        <tr><td align="center" style="padding:12px 24px 0;background:linear-gradient(180deg,#fff 0,#fff8f2 100%)">${photo}</td></tr>
        <tr><td class="email-pad" align="center" style="padding:18px 42px 34px;background:#fff8f2">
          <div style="display:inline-block;padding:6px 11px;border-radius:99px;background:#e8f6ed;color:#16723a;font-size:12px;font-weight:800;letter-spacing:.5px">✓ CHAPITA ACTIVA</div>
          <h1 class="email-title" style="margin:12px 0 9px;color:#2d1d12;font-size:31px;line-height:1.16;letter-spacing:-.7px">¡Listo! La chapita de ${name}<br>ya está activa</h1>
          <p style="max-width:470px;margin:0 auto 24px;color:#72513b;font-size:16px;line-height:1.55">Quien acerque su celular o escanee el QR podrá conocer a ${name} y comunicarse con vos rápidamente.</p>
          <a class="email-button" href="${pageUrl}" style="display:inline-block;padding:15px 25px;border-radius:13px;background:#df6f30;color:#fff;font-size:16px;font-weight:800;text-decoration:none;box-shadow:0 9px 20px rgba(199,87,30,.24)">Ver la chapita de ${name}</a>
          <p style="margin:15px 0 0;color:#8b6a53;font-size:13px">Probala ahora desde tu celular para ver lo mismo que verá quien la encuentre.</p>
        </td></tr>
        <tr><td class="email-pad" style="padding:30px 34px 10px">
          <h2 style="margin:0 0 8px;color:#2d1d12;font-size:19px;line-height:1.3">Completá o actualizá su ficha</h2>
          <p style="margin:0 0 14px;color:#72513b;font-size:15px;line-height:1.55">Podés cambiar la foto, los contactos y sus datos cuando quieras. Entrás con este mismo email; no necesitás recordar una contraseña.</p>
          <a href="${portalUrl}" style="color:#c65b21;font-size:15px;font-weight:800;text-decoration:underline;text-underline-offset:3px">Ir a Mis chapitas →</a>
        </td></tr>
        <tr><td class="email-pad" style="padding:24px 34px 30px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #f3d6d1;border-radius:16px;background:#fff7f6">
            <tr>
              <td valign="top" style="width:38px;padding:18px 0 18px 18px;font-size:24px">🚨</td>
              <td style="padding:18px">
                <h2 style="margin:0 0 5px;color:#8e241c;font-size:17px">Si alguna vez se pierde</h2>
                <p style="margin:0;color:#72513b;font-size:14px;line-height:1.55">Entrá a <a href="${portalUrl}" style="color:#b64524;font-weight:800">Mis chapitas</a> y tocá <b>“Avisar que se perdió”</b>. Su página mostrará el aviso y quedará lista para compartir.</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td class="email-pad" align="center" style="padding:23px 34px;border-top:1px solid #f2e3d8;background:#fffaf6;color:#886b58;font-size:12px;line-height:1.55">
          ¿Necesitás ayuda? Respondé este email y te ayudamos.<br>
          Este mensaje se envió porque activaste una chapita BIONFC.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `¡Listo! La chapita de ${rawName} ya está activa.

Quien acerque su celular o escanee el QR podrá conocer a ${rawName} y comunicarse con vos rápidamente.

Ver su chapita: ${pageUrl}

Completá o actualizá su ficha: ${portalUrl}
Entrás con este mismo email; no necesitás recordar una contraseña.

Si alguna vez se pierde, entrá a Mis chapitas y tocá “Avisar que se perdió”.

¿Necesitás ayuda? Respondé este email y te ayudamos.`;

  return { subject: `🐾 La chapita de ${rawName} ya está activa`, html, text };
}

export async function sendWelcomeEmail({ to, petName, petSlug, photoUrl = "" }: { to: string; petName: string; petSlug: string; photoUrl?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const content = welcomeEmailContent({ petName, petSlug, photoUrl });
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, reply_to: CONTACT_EMAIL, ...content }),
    });
    if (!response.ok) console.error("Mail de bienvenida: Resend respondió", response.status, await response.text());
  } catch (error) {
    console.error("Mail de bienvenida no se pudo mandar", error);
  }
}
