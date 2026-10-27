import Link from "next/link";
import { IconFileText, IconPaw, IconQrCode, IconShieldCheck, IconSmartphone, IconWifi } from "@/components/icons";
import MascotasNav from "../mascotas-nav";
import "../chapitas.css";

const steps = [
  { icon: IconFileText, who: "Vos · stock", title: "1. Generás una tanda", text: "Elegís cuántas unidades preparar. Cada chapita nace vacía, sin cliente ni ficha pública, y recibe un código privado para la tarjeta del paquete." },
  { icon: IconQrCode, who: "Vos · armado", title: "2. Emparejás las piezas", text: "Imprimís el QR exterior, grabás el enlace permanente en el NFC y ponés en el paquete la tarjeta privada de la misma unidad. El número de unidad debe coincidir." },
  { icon: IconShieldCheck, who: "Comprador · primera vez", title: "3. Activa su chapita", text: "Escanea el QR privado del paquete, usa su email y el código de acceso que recibe por correo. Carga su mascota y el WhatsApp de contacto; entonces se publica su ficha." },
  { icon: IconPaw, who: "Quien la encuentra", title: "4. Avisa a la familia", text: "Acerca el celular al NFC o escanea el QR exterior. Ve la ficha pública y puede escribir o llamar, sin registrarse ni conocer el código privado." },
];

export default function TagTutorialPage() {
  return <main className="shell admin-shell ch-tutorial-page">
    <header className="ch-tutorial-heading"><p className="eyebrow">BIONFC Mascotas</p><h1>Guía completa de chapitas</h1><p>Este es el recorrido desde la tanda hasta el aviso a la familia. Probalo primero con una unidad en DEV. Para fabricar productos reales, generá e imprimí los códigos desde el Admin publicado en bionfc.com.</p></header>
    <MascotasNav active="tutorial" />

    <section className="ch-quick-guide" aria-labelledby="quick-guide-title">
      <header><p className="eyebrow">Guía rápida</p><h2 id="quick-guide-title">Una unidad, tres piezas que trabajan juntas</h2><p>Buscá siempre el mismo número antes de cerrar el paquete.</p></header>
      <div className="ch-pieces">
        <article><span className="ch-piece-number">01</span><IconPaw /><strong>Chapita</strong><small>QR + NFC permanente</small></article>
        <span className="ch-piece-link" aria-hidden="true">+</span>
        <article><span className="ch-piece-number">01</span><IconQrCode /><strong>Tarjeta privada</strong><small>Activa una sola vez</small></article>
        <span className="ch-piece-link" aria-hidden="true">→</span>
        <article className="is-result"><IconSmartphone /><strong>Ficha de la mascota</strong><small>Se edita sin reimprimir</small></article>
      </div>
      <aside><IconShieldCheck /><span><strong>Chequeo antes de entregar:</strong> chapita 01 + tarjeta 01. El código privado nunca va grabado afuera.</span></aside>
    </section>

    <section className="ch-tutorial-steps" aria-label="Recorrido paso a paso">
      {steps.map(({ icon: Icon, who, title, text }) => <article key={title}><span className="ch-tutorial-step-icon"><Icon /></span><small>{who}</small><h2>{title}</h2><p>{text}</p></article>)}
    </section>

    <section className="elevated-section ch-link-map">
      <header><div><p className="eyebrow">Tres enlaces, tres trabajos</p><h2>Qué va en cada lugar</h2></div><IconWifi /></header>
      <div className="ch-link-map-grid">
        <article><span>En la chapita</span><code>bionfc.com/go/ID</code><p>Es permanente. Va grabado en el NFC y codificado en el QR exterior. Nunca lleva el nombre ni el código secreto.</p></article>
        <article><span>Ficha para compartir</span><code>bionfc.com/mascota/toby-a7k3f2</code><p>Es amigable y única. Dos mascotas con el mismo nombre reciben terminaciones diferentes. Se ve en «Mascotas activadas» después de activar.</p></article>
        <article><span>Dentro del paquete</span><code>bionfc.com/activar?c=…</code><p>El QR privado lleva a la activación. Su código de 8 caracteres se usa una sola vez para asignar la chapita al comprador.</p></article>
      </div>
      <aside><strong>Regla importante:</strong> si la familia cambia el nombre, la foto o el teléfono, no se reimprime el QR exterior ni se vuelve a grabar el NFC. El enlace permanente sigue llevando a su ficha.</aside>
    </section>

    <section className="elevated-section ch-guide">
      <header className="ch-section-heading"><div><p className="eyebrow">Después de la venta</p><h2>Activar no es lo mismo que volver a entrar</h2></div></header>
      <div className="ch-user-journey">
        <article><IconShieldCheck /><div><strong>Primera vez: activar</strong><p>Usa el QR privado o entra a <b>bionfc.com/activar</b>. El código de 8 caracteres del paquete se consume una sola vez.</p></div></article>
        <article><IconSmartphone /><div><strong>Después: editar</strong><p>Entra a <b>bionfc.com/mi/entrar</b>, escribe su email y recibe 6 números nuevos. No necesita contraseña.</p></div></article>
        <article><IconPaw /><div><strong>Si alguien la encuentra</strong><p>Usa el QR o NFC exterior y ve la ficha pública. No necesita cuenta ni ninguno de los dos códigos.</p></div></article>
      </div>
      <aside className="ch-code-explainer"><div><span className="ch-code-sample">ABCD-2346</span><p><strong>Código de activación</strong><br />8 caracteres · viene en el paquete · un solo uso.</p></div><div><span className="ch-code-sample is-otp">906438</span><p><strong>Código de acceso</strong><br />6 números · llega por email · vence y se renueva.</p></div></aside>
      <div className="ch-faq">
        <h3>Dudas comunes</h3>
        <details><summary>¿Dónde veo los lotes y dónde las mascotas?</summary><p>En <b>Lotes</b> fabricás las chapitas y ves las unidades sin activar o ya activadas. En <b>Mascotas activadas</b> abrís las páginas que hicieron los compradores. Todo está dentro del mismo Admin.</p></details>
        <details><summary>¿Qué pasa si hay dos mascotas llamadas Toby?</summary><p>No se mezclan. Cada chapita tiene un ID interno único y cada ficha recibe una terminación diferente, por ejemplo <b>toby-a7k3f2</b> y <b>toby-k9m2p4</b>.</p></details>
        <details><summary>¿Qué pasa si después le cambian el nombre?</summary><p>La ficha muestra el nombre nuevo, pero conserva su dirección y el enlace físico. Los QR y NFC ya entregados siguen funcionando.</p></details>
        <details><summary>¿Qué pasa si el dueño pierde su contraseña?</summary><p>No hay contraseña. Entra desde <b>bionfc.com/mi/entrar</b> y recibe un código nuevo de 6 números en su email.</p></details>
        <details><summary>¿Qué pasa si no le llega el email?</summary><p>Puede revisar Spam o Promociones y pedir otro código. Si sigue sin llegar, revisá que escriba el mismo email con el que activó.</p></details>
        <details><summary>¿Qué pasa si pierde la tarjeta del paquete?</summary><p>Si todavía no activó, desde la tanda podés tocar «Cambiar código» y darle una tarjeta nueva. Si ya activó, no pasa nada: ese código ya fue consumido.</p></details>
        <details><summary>¿El QR y el NFC se vencen?</summary><p>No. Ambos apuntan al enlace permanente. La familia puede actualizar la ficha sin volver a grabar la chapita.</p></details>
        <details><summary>¿La ficha es privada?</summary><p>La ficha publicada la puede abrir cualquiera que tenga el enlace o escanee la chapita. El email de acceso no se muestra, pero sí los datos y teléfonos cargados para que puedan avisar a la familia. BIONFC puede verla desde su Admin para dar soporte.</p></details>
      </div>
    </section>

    <div className="ch-tutorial-finish"><Link className="btn" href="/admin/chapitas">Ir a los lotes</Link><Link className="btn secondary" href="/admin/chapitas/fichas">Ver mascotas activadas</Link></div>
  </main>;
}
