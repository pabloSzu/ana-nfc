import type { Metadata } from "next";
import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import "../globals.css";
import "../mi/mi.css";

export const metadata: Metadata = { title: "Términos y condiciones · BIONFC" };

// Términos de uso y privacidad. Los acepta quien activa una chapita (ver /activar).
// TODO de Pablo: que los revise un abogado antes de vender en cantidad.
const UPDATED = "20 de octubre de 2026";
const CONTACT = "https://wa.me/5493517873628";

export default function TermsPage() {
  return <div className="mi-shell">
    <header className="mi-top"><Link href="/" className="mi-brand" aria-label="BIONFC"><BioNFCLogo /></Link></header>
    <main className="mi-main terms">
      <h1>Términos y condiciones</h1>
      <p className="mi-hint">Última actualización: {UPDATED}</p>

      <h2>1. Qué es BIONFC</h2>
      <p>BIONFC vende objetos con chip NFC y código QR (chapitas, llaveros, tarjetas, carteles) que abren una página web. Al activar un producto o usar tu cuenta aceptás estos términos.</p>

      <h2>2. Tu cuenta</h2>
      <p>Entrás con tu email y un código que te mandamos; no usamos contraseñas. Sos responsable de mantener seguro el acceso a tu email. Podés pedirnos dar de baja tu cuenta cuando quieras.</p>

      <h2>3. Lo que publicás</h2>
      <p>Sos responsable de los datos, textos y fotos que cargues, y de tener derecho a usarlos. No está permitido publicar contenido ilegal, engañoso, ofensivo, que viole derechos de terceros o datos de otras personas sin su permiso. Podemos despublicar o borrar contenido que no cumpla estas reglas, o que alguien denuncie con razón, sin aviso previo.</p>

      <h2>4. Datos que se ven públicamente</h2>
      <p>La página de tu producto la puede ver cualquiera que escanee el QR, acerque su celular al chip o tenga el link. Eso incluye lo que cargues, como el nombre de tu mascota y el WhatsApp o teléfono de la familia. Cargá solo lo que quieras que se vea.</p>

      <h2>5. Tus datos personales</h2>
      <p>Guardamos tu email y los datos que cargues para que el servicio funcione. No los vendemos ni los compartimos con terceros, salvo los proveedores que necesitamos para operar (alojamiento y envío de emails) o si lo exige la ley. Contamos las visitas a cada página sin identificar a quien la visita. Podés pedir acceso, corrección o eliminación de tus datos escribiéndonos (Ley 25.326 de Protección de Datos Personales). La Agencia de Acceso a la Información Pública es el órgano de control de esa ley.</p>

      <h2>6. El servicio</h2>
      <p>Hacemos lo posible para que tu página esté siempre disponible, pero puede haber interrupciones. La chapita ayuda a que quien encuentre a tu mascota pueda avisarte, pero no garantiza que aparezca. Si tu producto tiene un plan anual y no se renueva, la página puede pasar a mostrar un único link; el producto físico sigue funcionando.</p>

      <h2>7. Cambios</h2>
      <p>Podemos actualizar estos términos. Si el cambio es importante, te avisamos por email o en tu panel.</p>

      <h2>8. Contacto</h2>
      <p>Por consultas, denuncias o para ejercer tus derechos sobre tus datos: <a href={CONTACT} target="_blank" rel="noopener noreferrer">escribinos por WhatsApp</a>.</p>
    </main>
  </div>;
}
