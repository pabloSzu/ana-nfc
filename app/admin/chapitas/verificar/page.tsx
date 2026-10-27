import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VERIFY_COOKIE, VERIFY_HOURS } from "@/lib/pet-tags";
import { startVerify, stopVerify } from "./actions";
import "../chapitas.css";

// Verificar armado: antes de empaquetar, cada chapita se controla con el celu. Con el modo
// prendido, escanear el QR o acercar el NFC muestra qué unidad es (en vez de la página pública):
// el QR, el chip y la tarjeta tienen que decir lo mismo.
export default async function VerifyMode() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/admin/login");
  const on = (await cookies()).has(VERIFY_COOKIE);

  return <main className="shell admin-shell ch-verify">
    <Link className="back-link" href="/admin/chapitas">← Chapitas</Link>
    <h1>Verificar armado</h1>
    <p className="muted">Antes de empaquetar, controlá cada chapita con este celu: el QR, el chip y la tarjeta tienen que ser de la misma unidad.</p>
    <section className={`ch-verify-state${on ? " is-on" : ""}`}>
      <strong>{on ? "Modo verificación prendido" : "Modo verificación apagado"}</strong>
      <small>{on ? `En este navegador, por ${VERIFY_HOURS} horas o hasta que lo apagues.` : "Prendelo en el celu con el que vas a escanear."}</small>
      <form action={on ? stopVerify : startVerify}><button className={`btn${on ? " secondary" : ""}`}>{on ? "Apagar" : "Prender en este celu"}</button></form>
    </section>
    <ol className="ch-verify-steps">
      <li><b>1</b><span>Escaneá el <strong>QR del dorso</strong> con la cámara: tiene que decir su número de unidad.</span></li>
      <li><b>2</b><span>Acercá el celu a la <strong>chapita (NFC)</strong>: tiene que decir la misma unidad. Si no coincide, te avisa.</span></li>
      <li><b>3</b><span>Fijate que la <strong>tarjeta</strong> del paquete tenga ese mismo número de unidad y su código.</span></li>
    </ol>
    <p className="muted ch-verify-note">Usá el navegador en el que tenés abierto el Admin (en iPhone, Safari): ahí abren los links la cámara y el NFC. Con el modo apagado, las chapitas abren su página como siempre.</p>
  </main>;
}
