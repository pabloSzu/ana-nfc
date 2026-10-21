import Image from "next/image";
import Link from "next/link";
import { IconFileText, IconPaw, IconQrCode, IconShieldCheck, IconSmartphone, IconWifi } from "@/components/icons";
import "../chapitas.css";

const steps = [
  { icon: IconFileText, who: "Vos", title: "1. Generás un lote", text: "Elegís la cantidad. BIONFC crea una chapita vacía y una tarjeta privada de activación para cada unidad." },
  { icon: IconQrCode, who: "Vos", title: "2. Preparás el producto", text: "Imprimís el QR exterior, grabás exactamente el mismo enlace en el NFC y emparejás la tarjeta correcta con el paquete." },
  { icon: IconShieldCheck, who: "Comprador", title: "3. Activa su chapita", text: "Escanea el QR privado del paquete, confirma su email y carga los datos. No tenés que pedirle información durante la venta." },
  { icon: IconPaw, who: "Quien la encuentra", title: "4. Contacta a la familia", text: "Acerca el celular o escanea el QR exterior. La ficha abre sin cuenta y muestra los medios de contacto elegidos por la familia." },
];

export default function TagTutorialPage() {
  return <main className="shell admin-shell ch-tutorial-page">
    <Link className="back-link" href="/admin/chapitas">← Volver a Chapitas</Link>

    <header className="ch-tutorial-hero">
      <div>
        <p className="eyebrow">Tutorial de Chapitas</p>
        <h1>De la caja a una mascota protegida</h1>
        <p>Este es el recorrido completo. Primero probalo con una sola unidad en DEV; para fabricar chapitas reales, generá e imprimí todo desde <b>bionfc.com</b>.</p>
      </div>
      <Image src="/images/bionfc/tutorial-chapitas.webp" alt="Una chapita NFC, su paquete de activación y la ficha pública en un celular" width={1600} height={534} priority />
    </header>

    <section className="ch-tutorial-steps" aria-label="Recorrido paso a paso">
      {steps.map(({ icon: Icon, who, title, text }) => <article key={title}>
        <span className="ch-tutorial-step-icon"><Icon /></span><small>{who}</small><h2>{title}</h2><p>{text}</p>
      </article>)}
    </section>

    <section className="elevated-section ch-link-map">
      <header><div><p className="eyebrow">Los enlaces, sin vueltas</p><h2>Cada dirección tiene un trabajo distinto</h2></div><IconWifi /></header>
      <div className="ch-link-map-grid">
        <article><span>En la chapita</span><code>bionfc.com/go/ID</code><p>Es permanente. Va en el NFC y en el QR exterior. Nunca contiene el nombre ni el código secreto.</p></article>
        <article><span>Para compartir</span><code>bionfc.com/mascota/toby-a7k3f2</code><p>Es amigable, única y estable. Dos mascotas llamadas Toby reciben terminaciones diferentes.</p></article>
        <article><span>Dentro del paquete</span><code>bionfc.com/activar?c=…</code><p>Es privado y se usa una sola vez para asignar la chapita a la persona que la compró.</p></article>
      </div>
      <aside><strong>Importante:</strong> si la familia cambia el nombre o los datos, no se modifica el enlace grabado físicamente. BIONFC siempre lo lleva a la ficha correcta.</aside>
    </section>

    <section className="elevated-section ch-guide">
      <header className="ch-section-heading"><div><p className="eyebrow">Después de la venta</p><h2>Activar no es lo mismo que volver a entrar</h2></div></header>
      <div className="ch-user-journey">
        <article><IconShieldCheck /><div><strong>Primera vez: activar</strong><p>Usa el QR privado o entra a <b>bionfc.com/activar</b>. El código de 8 caracteres se consume una sola vez.</p></div></article>
        <article><IconSmartphone /><div><strong>Después: editar</strong><p>Entra a <b>bionfc.com/mi/entrar</b>, escribe su email y recibe 6 números. No existe una contraseña para recordar.</p></div></article>
        <article><IconPaw /><div><strong>Cuando alguien la encuentra</strong><p>Escanea o acerca el celular y ve la ficha pública. No necesita registrarse ni escribir códigos.</p></div></article>
      </div>
      <aside className="ch-code-explainer">
        <div><span className="ch-code-sample">ABCD-2346</span><p><strong>Código de activación</strong><br />8 caracteres · está en el paquete · un solo uso.</p></div>
        <div><span className="ch-code-sample is-otp">906438</span><p><strong>Código de acceso</strong><br />6 números · llega por email · vence y se renueva.</p></div>
      </aside>
      <div className="ch-faq">
        <h3>Dudas comunes</h3>
        <details><summary>¿Qué pasa si hay dos mascotas llamadas Toby?</summary><p>No se mezclan. Cada registro tiene un ID interno único y cada enlace amigable lleva una terminación diferente: por ejemplo, <b>toby-a7k3f2</b> y <b>toby-k9m2p4</b>.</p></details>
        <details><summary>¿Qué pasa si después le cambian el nombre?</summary><p>La ficha muestra el nombre nuevo, pero conserva su dirección. Así los enlaces compartidos y la chapita siguen funcionando.</p></details>
        <details><summary>¿Qué pasa si el dueño pierde su contraseña?</summary><p>No existe contraseña. Entra desde <b>bionfc.com/mi/entrar</b> y recibe un código nuevo de 6 números en su email.</p></details>
        <details><summary>¿Qué pasa si no le llega el email?</summary><p>Puede revisar Spam o Promociones y tocar “Mandar otro código”. Si sigue sin llegar, revisá que use el mismo email con el que activó.</p></details>
        <details><summary>¿Qué pasa si pierde la tarjeta de activación?</summary><p>Si todavía no activó, desde el lote tocás “Cambiar código” y le das una tarjeta nueva. Si ya activó, no pasa nada: ese código ya fue consumido.</p></details>
        <details><summary>¿El QR y el NFC se vencen?</summary><p>No. Ambos apuntan al enlace permanente. La familia puede cambiar la ficha sin volver a grabar la chapita.</p></details>
      </div>
    </section>

    <div className="ch-tutorial-finish"><Link className="btn" href="/admin/chapitas">Entendido, volver a mis chapitas</Link></div>
  </main>;
}
