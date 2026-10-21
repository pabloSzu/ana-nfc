import type { Metadata } from "next";
import Link from "next/link";
import BioNFCLogo from "@/components/bionfc-logo";
import { CONTACT_EMAIL, CONTACT_WHATSAPP, RESPONSIBLE, TERMS_UPDATED } from "@/lib/terms";
import "../globals.css";
import "../mi/mi.css";

export const metadata: Metadata = { title: "Términos y privacidad · BIONFC" };

// Términos de uso y privacidad. Los acepta quien activa una chapita (ver /activar); la versión
// aceptada se guarda (lib/terms.ts → client_members.terms_version). Si cambia el texto, cambiar
// TERMS_VERSION y TERMS_UPDATED.
// Pendiente: que los revise un abogado cuando el negocio crezca.
export default function TermsPage() {
  return <div className="mi-shell">
    <header className="mi-top"><Link href="/" className="mi-brand" aria-label="BIONFC"><BioNFCLogo /></Link></header>
    <main className="mi-main terms">
      <h1>Términos y privacidad</h1>
      <p className="mi-hint">Última actualización: {TERMS_UPDATED}</p>

      <h2>1. Quiénes somos</h2>
      <p>BIONFC vende objetos con chip NFC y código QR (chapitas, llaveros, tarjetas, carteles) que abren una página web. El responsable del servicio y de los datos es {RESPONSIBLE}. Contacto: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Al activar un producto o usar tu cuenta aceptás estos términos.</p>

      <h2>2. Tu cuenta</h2>
      <p>Entrás con tu email y un código que te mandamos; no usamos contraseñas. Cuidá el acceso a tu email: quien entra a tu email puede entrar a tu cuenta. Podés pedirnos dar de baja tu cuenta cuando quieras.</p>

      <h2>3. Lo que publicás</h2>
      <p>Sos responsable de los datos, textos y fotos que cargues, y de tener derecho a usarlos. Si cargás el teléfono de otra persona (por ejemplo, alguien de tu familia), tiene que estar de acuerdo. No está permitido publicar contenido ilegal, engañoso u ofensivo, ni datos de otras personas sin su permiso. Podemos pausar o borrar contenido que no cumpla estas reglas o que alguien denuncie con razón.</p>

      <h2>4. Qué se ve públicamente</h2>
      <p>La página de tu chapita la puede ver cualquiera que la escanee, acerque su celular o tenga el link. Eso incluye lo que cargues, como el nombre y la foto de tu mascota y el WhatsApp o teléfono de la familia. Cargá solo lo que quieras que se vea. Tu email no se muestra nunca.</p>

      <h2>5. Tus datos personales</h2>
      <p>Guardamos tu email y lo que cargues solo para que el servicio funcione: mostrar la página de tu chapita y dejarte editarla. El equipo de BIONFC puede ver y corregir las fichas desde su panel de administración para ayudarte, atender reclamos y evitar usos indebidos; no comparte tu email de acceso en la página pública. No vendemos tus datos ni los usamos para publicidad. Para funcionar usamos proveedores que los alojan o mandan los emails por nosotros (Supabase, Vercel y el servicio de envío de emails), cuyos servidores pueden estar fuera de la Argentina, por ejemplo en Brasil o Estados Unidos; al aceptar estos términos prestás tu consentimiento para eso. Contamos cuántas veces se abre cada página, sin identificar a quien la abre.</p>
      <p>Podés pedir acceso, corrección o eliminación de tus datos escribiendo a {CONTACT_EMAIL}; te respondemos dentro de los plazos de la Ley 25.326 de Protección de Datos Personales (10 días para el acceso y 5 días hábiles para corregir o borrar). La Agencia de Acceso a la Información Pública, órgano de control de esa ley, atiende las denuncias por incumplimientos.</p>

      <h2>6. El servicio</h2>
      <p>Hacemos lo posible para que tu página esté siempre disponible, pero puede haber interrupciones. La chapita ayuda a que quien encuentre a tu mascota pueda avisarte, pero no garantiza que aparezca.</p>

      <h2>7. Cambios</h2>
      <p>Si cambiamos estos términos de forma importante, te avisamos por email o en tu panel antes de que empiecen a regir.</p>

      <h2>8. Contacto</h2>
      <p>Por consultas, denuncias o para ejercer tus derechos sobre tus datos: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o <a href={CONTACT_WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>
    </main>
  </div>;
}
