// El texto de los términos y la privacidad, en un solo lugar: lo muestran la página /terminos y
// la hoja que se abre al activar (app/activar/terms-sheet.tsx). Si cambia algo de fondo, subir
// TERMS_VERSION y TERMS_UPDATED en lib/terms.ts (se guarda qué versión aceptó cada dueño).
// Pendiente: que los revise un abogado cuando el negocio crezca. Cuando se venda por internet,
// sumar compra, garantía legal (6 meses), arrepentimiento (10 días) y datos del vendedor.
import type { ReactNode } from "react";
import { CONTACT_EMAIL, CONTACT_WHATSAPP, RESPONSIBLE } from "@/lib/terms";

// Lo importante en pocas líneas, arriba de todo.
export const TERMS_SUMMARY = [
  { icon: "🐾", text: "La página de tu chapita es pública: la ve quien la escanee o tenga el link. Cargá solo lo que quieras mostrar." },
  { icon: "🔒", text: "Tu email no se muestra nunca. No vendemos tus datos ni los usamos para publicidad." },
  { icon: "✏️", text: "Sos responsable de lo que cargás, y de tener permiso para poner el teléfono de otra persona." },
  { icon: "🗑️", text: "Podés pedir que borremos tu cuenta y tus datos cuando quieras." },
  { icon: "🐶", text: "La chapita ayuda a que tu mascota vuelva, pero no puede garantizarlo." },
];

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export const TERMS_SECTIONS: { id: string; title: string; body: ReactNode }[] = [
  { id: "quienes-somos", title: "Quiénes somos", body: <>
    <p>BIONFC hace objetos con chip NFC y código QR (chapitas, llaveros, tarjetas, carteles) que abren una página web. El responsable del servicio y de los datos es {RESPONSIBLE}. Contacto: {mail}.</p>
    <p>Al activar un producto o usar tu cuenta, aceptás estos términos.</p>
  </> },
  { id: "tu-cuenta", title: "Tu cuenta", body: <>
    <p>Entrás con tu email y un código de 6 números que te mandamos: no hay contraseñas. Cuidá el acceso a tu email, porque quien entra a tu email puede entrar a tu cuenta.</p>
    <p>La cuenta la tiene que abrir una persona mayor de 18 años, o un menor con permiso de un adulto responsable.</p>
  </> },
  { id: "lo-que-publicas", title: "Lo que publicás", body: <>
    <p>Sos responsable de los datos, textos y fotos que cargues, y de tener derecho a usarlos. Si cargás el teléfono de otra persona (por ejemplo, alguien de tu familia), tiene que estar de acuerdo.</p>
    <p>No se puede publicar contenido ilegal, engañoso u ofensivo, ni datos de otras personas sin su permiso. Podemos pausar o borrar lo que no cumpla estas reglas o lo que alguien denuncie con razón.</p>
  </> },
  { id: "que-se-ve", title: "Qué se ve públicamente", body: <>
    <p>La página de tu chapita la puede ver cualquiera que la escanee, acerque su celular o tenga el link. Eso incluye lo que cargues: el nombre y la foto de tu mascota, sus datos y el WhatsApp o teléfono de la familia. Tu email no se muestra nunca.</p>
  </> },
  { id: "tus-datos", title: "Tus datos personales", body: <>
    <p>Guardamos tu email y lo que cargues solo para que el servicio funcione: mostrar la página de tu chapita y dejarte editarla. El equipo de BIONFC puede ver y corregir las fichas desde su panel para ayudarte, atender reclamos y evitar usos indebidos. No vendemos tus datos ni los usamos para publicidad.</p>
    <p>Para funcionar usamos proveedores que alojan los datos o mandan los emails por nosotros (Supabase, Vercel y el servicio de envío de emails). Sus servidores pueden estar fuera de la Argentina, por ejemplo en Brasil o Estados Unidos; al aceptar estos términos das tu consentimiento para eso.</p>
    <p>Contamos cuántas veces se abre cada página, sin identificar a quien la abre. Solo usamos las cookies necesarias para mantener tu sesión iniciada: nada de publicidad ni seguimiento.</p>
    <p>Guardamos tus datos mientras tengas la cuenta. Si la das de baja, los borramos.</p>
  </> },
  { id: "tus-derechos", title: "Tus derechos", body: <>
    <p>Podés pedir acceso, corrección o eliminación de tus datos escribiendo a {mail}. Te respondemos dentro de los plazos de la Ley 25.326 de Protección de Datos Personales: 10 días para el acceso y 5 días hábiles para corregir o borrar.</p>
    <p>La Agencia de Acceso a la Información Pública, que controla esa ley, atiende las denuncias por incumplimientos.</p>
  </> },
  { id: "baja", title: "Dar de baja la cuenta", body: <>
    <p>Podés pedir la baja cuando quieras escribiendo a {mail}. La página de tu chapita deja de mostrarse y borramos tu cuenta y lo que cargaste.</p>
  </> },
  { id: "el-servicio", title: "El servicio", body: <>
    <p>Hacemos lo posible para que tu página esté siempre disponible, pero puede haber interrupciones. La chapita ayuda a que quien encuentre a tu mascota pueda avisarte, pero no garantiza que aparezca.</p>
  </> },
  { id: "cambios", title: "Cambios", body: <>
    <p>Si cambiamos estos términos de forma importante, te avisamos por email o en tu panel antes de que empiecen a regir.</p>
  </> },
  { id: "contacto", title: "Contacto", body: <>
    <p>Por consultas, denuncias o para ejercer tus derechos: {mail} o <a href={CONTACT_WHATSAPP} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>
  </> },
];

export function TermsSummary({ compact = false }: { compact?: boolean }) {
  return <section className={`terms-summary${compact ? " is-compact" : ""}`} aria-labelledby={compact ? undefined : "terms-summary-title"}>
    {!compact && <div className="terms-summary-heading">
      <span aria-hidden="true">✓</span>
      <div><small>Resumen simple</small><h2 id="terms-summary-title">Lo importante, en 30 segundos</h2></div>
    </div>}
    <ul>{TERMS_SUMMARY.map((item) => <li key={item.text}><span aria-hidden="true">{item.icon}</span>{item.text}</li>)}</ul>
  </section>;
}

export function TermsSections({ compact = false }: { compact?: boolean }) {
  return <div className={`terms-sections${compact ? " is-compact" : ""}`}>
    {TERMS_SECTIONS.map((section, index) => <details key={section.id} id={section.id} className="terms-section" open={!compact && index === 0}>
      <summary>
        <span>{index + 1}</span>
        <strong>{section.title}</strong>
        <i aria-hidden="true">⌄</i>
      </summary>
      <div className="terms-section-body">{section.body}</div>
    </details>)}
  </div>;
}
