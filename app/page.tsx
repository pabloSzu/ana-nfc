import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./marketing.css";
import {
  IconWifi, IconQrCode, IconEdit, IconDroplet, IconMessageCircle, IconRocket, IconCheckCircle,
  IconZap, IconPaintRoller, IconHeart, IconTrendingUp,
  IconChefHat, IconUserRound, IconDumbbell, IconShoppingBag, IconBriefcase, IconBedDouble, IconPartyPopper,
  IconTruck, IconShieldCheck,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "BioNFC — tu negocio, un toque",
  description: "Un tag NFC (y un QR de respaldo) que abre la landing de tu negocio al instante. Sin apps, sin escribir nada. Armá la tuya en minutos.",
};

const WHATSAPP_NUMBER = "5493884208746";
const WHATSAPP_TEXT = encodeURIComponent("Hola! Quiero mi landing con tag NFC 👋");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_TEXT}`;

const NAV_LINKS = [
  { href: "#negocios", label: "Para negocios" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#plantillas", label: "Plantillas" },
  { href: "#preguntas", label: "Preguntas" },
];

const BENEFITS = [
  { icon: IconZap, title: "Fácil de usar", body: "Solo acercás tu celular" },
  { icon: IconPaintRoller, title: "100% personalizable", body: "Tu estilo, tu marca" },
  { icon: IconTrendingUp, title: "Más clientes", body: "Más visibilidad, más ventas" },
  { icon: IconHeart, title: "Para cualquier negocio", body: "Grande o pequeño" },
];

const RUBROS = [
  { icon: IconChefHat, title: "Restaurantes", sub: "y cafeterías" },
  { icon: IconUserRound, title: "Estética", sub: "y belleza" },
  { icon: IconDumbbell, title: "Gimnasios", sub: "y salud" },
  { icon: IconShoppingBag, title: "Tiendas", sub: "y e-commerce" },
  { icon: IconBriefcase, title: "Profesionales", sub: "y servicios" },
  { icon: IconBedDouble, title: "Hoteles", sub: "y turismo" },
  { icon: IconPartyPopper, title: "Eventos", sub: "y mucho más" },
];

const STEPS = [
  { title: "Armamos tu landing", body: "Elegís plantilla, colores y qué botones mostrar: WhatsApp, Instagram, tu web, menú, turnos… lo que tu negocio necesite." },
  { title: "Te llega tu tag NFC", body: "Programado con tu link, listo para pegar en el mostrador, la vidriera o una tarjeta. Incluye QR de respaldo por las dudas." },
  { title: "La gente solo acerca el celular", body: "Sin instalar nada, sin escanear ni escribir. Se abre tu landing al toque, en cualquier teléfono con NFC." },
];

const FEATURES = [
  { icon: IconWifi, title: "Funciona con un toque", body: "Tecnología NFC: acercás el celular al tag y la landing se abre sola, sin apps de por medio." },
  { icon: IconQrCode, title: "QR de respaldo, siempre", body: "Todo tag incluye también un código QR, por si el teléfono de alguien no tiene NFC activado." },
  { icon: IconEdit, title: "Lo editás cuando quieras", body: "Cambiás textos, fotos y botones vos mismo desde un panel simple, sin depender de nadie." },
  { icon: IconDroplet, title: "Colores reales de marca", body: "Los botones de Instagram, WhatsApp y demás usan sus colores oficiales automáticamente." },
];

const EXAMPLES = [
  { name: "Estudio Aurora", kind: "Peluquería", avatarBg: "oklch(88% 0.06 40)", avatarColor: "oklch(35% 0.1 40)", cardBg: "oklch(97% 0.02 40)", nameColor: "oklch(32% 0.09 40)", btns: ["oklch(70% 0.15 25)", "oklch(78% 0.12 45)", "oklch(60% 0.02 40)"] },
  { name: "Café Nimbus", kind: "Cafetería", avatarBg: "oklch(40% 0.05 55)", avatarColor: "oklch(92% 0.03 80)", cardBg: "oklch(95% 0.02 70)", nameColor: "oklch(34% 0.05 55)", btns: ["oklch(45% 0.06 50)", "oklch(65% 0.1 60)", "oklch(55% 0.03 50)"] },
  { name: "FitZone", kind: "Gimnasio", avatarBg: "oklch(75% 0.19 145)", avatarColor: "oklch(18% 0.03 145)", cardBg: "oklch(16% 0.02 260)", nameColor: "oklch(93% 0.02 145)", btns: ["oklch(75% 0.19 145)", "oklch(65% 0.19 25)", "oklch(70% 0.02 260)"] },
];

const FAQS = [
  { q: "¿Necesito instalar algo o saber de tecnología?", a: "No. Vos elegís plantilla, colores y botones desde un panel simple, y nosotros te mandamos el tag ya programado. Tus clientes tampoco instalan nada: acercan el celular y listo." },
  { q: "¿Y si el celular de mi cliente no tiene NFC?", a: "Cada tag incluye un código QR de respaldo con el mismo link, así que siempre hay una forma de entrar a tu landing." },
  { q: "¿Puedo cambiar textos, fotos o botones después?", a: "Sí, cuando quieras, desde tu panel. Los cambios se ven al instante sin tener que pedir un tag nuevo." },
  { q: "¿Cuánto tarda en llegarme el tag?", a: "Coordinamos todo por WhatsApp: armamos tu landing, te mostramos cómo queda y despachamos el tag a todo el país." },
];

export default function Home() {
  return (
    <div className="bn">
      <nav className="bn-nav">
        <div className="bn-nav-inner">
          <span className="bn-brand"><span className="bn-brand-mark"><IconWifi /></span>BioNFC</span>
          <div className="bn-nav-links">
            {NAV_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </div>
          <div className="bn-nav-right">
            <Link className="bn-nav-login" href="/admin/login">¿Ya tenés cuenta? Ingresá</Link>
            <a className="bn-btn bn-btn-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><IconMessageCircle /> Quiero mi tag</a>
            <button className="bn-menu-btn" type="button" aria-label="Menú">☰</button>
          </div>
        </div>
      </nav>

      <header className="bn-hero" id="negocios">
        <div className="bn-wrap bn-hero-grid">
          <div>
            <span className="bn-eyebrow"><span className="bn-eyebrow-dot" aria-hidden="true" />NFC + página digital</span>
            <h1 className="bn-h1">Tu negocio.<br />Un toque.<br /><mark>Todo adentro.</mark></h1>
            <p className="bn-hero-sub">Un tag NFC (con QR de respaldo) que abre al instante la landing de tu negocio: WhatsApp, Instagram, tu web, menú, turnos y lo que necesites compartir. Nada de apps ni de escribir nada.</p>
            <div className="bn-hero-actions">
              <a className="bn-btn bn-btn-primary bn-btn-lg" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><IconMessageCircle /> Quiero mi tag, sin compromiso</a>
              <a className="bn-play-btn" href="#como-funciona">
                <span className="bn-play-icon"><IconCheckCircle /></span>
                <span><b>Ver cómo funciona</b><small>3 pasos, 1 minuto</small></span>
              </a>
            </div>
            <div className="bn-benefits">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bn-benefit">
                  <Icon aria-hidden="true" />
                  <b>{title}</b>
                  <span>{body}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bn-hero-photo">
            <Image
              src="/marketing/hero-nfc.png"
              alt="Llavero NFC BioNFC junto a un celular mostrando una landing con botones de WhatsApp, Instagram y TikTok"
              width={1254}
              height={1254}
              priority
              sizes="(max-width: 980px) 100vw, 560px"
            />
          </div>
        </div>
      </header>

      <div className="bn-proof">
        <div className="bn-wrap bn-proof-inner">
          <span className="bn-proof-item"><IconShieldCheck aria-hidden="true" /> Sin compromiso, hablás primero por WhatsApp</span>
          <span className="bn-proof-item"><IconTruck aria-hidden="true" /> Envíos a todo el país</span>
          <span className="bn-proof-item"><IconZap aria-hidden="true" /> Landing lista en minutos</span>
        </div>
      </div>

      <main>
        <section className="bn-section bn-wrap">
          <div className="bn-section-head">
            <span className="bn-kicker">Un NFC, infinitas posibilidades</span>
            <h2 className="bn-h2">Ideal para <em>cualquier rubro</em></h2>
            <p className="bn-section-sub">Diseñado para emprendedores, profesionales y empresas de todos los rubros. Mostrá lo mejor de tu negocio en segundos.</p>
          </div>
          <div className="bn-rubros">
            {RUBROS.map(({ icon: Icon, title, sub }) => (
              <article key={title} className="bn-rubro">
                <span className="bn-rubro-icon"><Icon aria-hidden="true" /></span>
                <p><b>{title}</b><span>{sub}</span></p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="bn-section bn-wrap">
          <div className="bn-section-head">
            <span className="bn-kicker">Cómo funciona</span>
            <h2 className="bn-h2">De la idea al tag pegado en tu mostrador</h2>
            <p className="bn-section-sub">Tres pasos, sin vueltas técnicas de tu lado.</p>
          </div>
          <ol className="bn-steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bn-step">
                <span className="bn-step-num">{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="plantillas" className="bn-section bn-wrap">
          <div className="bn-feature">
            <div className="bn-feature-grid">
              <div>
                <span className="bn-kicker">La posta</span>
                <h2 className="bn-h2">Sin escanear. Sin escribir. Solo acercar.</h2>
                <p className="bn-section-sub" style={{ marginTop: "var(--bn-space-2)" }}>Es la forma más rápida que existe de compartir el contacto de tu negocio con alguien que tenés en frente.</p>
                <ul className="bn-chip-list">
                  {FEATURES.map(({ icon: Icon, title, body }) => (
                    <li key={title} className="bn-chip">
                      <span className="bn-chip-icon"><Icon /></span>
                      <span><b>{title}</b><span>{body}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bn-nfc-demo">
                <div className="bn-tap">
                  <div className="bn-tap-ring" />
                  <div className="bn-tap-ring bn-r2" />
                  <div className="bn-tap-ring bn-r3" />
                  <div className="bn-tap-tag" />
                  <div className="bn-tap-phone" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bn-section bn-wrap">
          <div className="bn-section-head">
            <span className="bn-kicker">Ejemplos</span>
            <h2 className="bn-h2">Cada landing, con la cara de cada negocio</h2>
            <p className="bn-section-sub">Colores, tipografía y botones se adaptan a cada rubro — estos son inventados, solo para mostrar el estilo.</p>
          </div>
          <div className="bn-gallery">
            {EXAMPLES.map((ex) => (
              <div key={ex.name} className="bn-card">
                <div className="bn-mock" style={{ background: ex.cardBg }}>
                  <div className="bn-mock-avatar" style={{ background: ex.avatarBg, color: ex.avatarColor }}>{ex.name.slice(0, 1)}</div>
                  <span className="bn-mock-name" style={{ color: ex.nameColor }}>{ex.name}</span>
                  <div className="bn-mock-btns">
                    {ex.btns.map((color, i) => <span key={i} className="bn-mock-btn" style={{ background: color }} />)}
                  </div>
                </div>
                <h3>{ex.name}</h3>
                <p>{ex.kind}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="preguntas" className="bn-section bn-wrap">
          <div className="bn-section-head bn-section-head--center">
            <span className="bn-kicker">Preguntas frecuentes</span>
            <h2 className="bn-h2">Lo que más nos preguntan</h2>
          </div>
          <div className="bn-faq">
            {FAQS.map((faq) => (
              <details key={faq.q} className="bn-faq-item">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bn-section bn-wrap">
          <div className="bn-cta">
            <h2>¿Empezamos con la tuya?</h2>
            <p>Contanos de tu negocio por WhatsApp y coordinamos diseño, tag y todo lo demás.</p>
            <div className="bn-hero-actions">
              <a className="bn-btn bn-btn-primary bn-btn-lg" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><IconMessageCircle /> Escribir por WhatsApp</a>
            </div>
            <p className="bn-cta-note">Sin compromiso — primero charlamos, después armamos tu landing.</p>
          </div>
        </section>
      </main>

      <footer className="bn-footer">
        <div className="bn-wrap">
          <div className="bn-footer-top">
            <span className="bn-footer-brand"><span className="bn-brand-mark"><IconRocket aria-hidden="true" /></span>BioNFC</span>
            <a className="bn-btn bn-btn-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><IconMessageCircle /> Quiero mi tag</a>
          </div>
          <div className="bn-footer-points">
            <div className="bn-footer-point"><IconTruck aria-hidden="true" /><span>Envíos<br />a todo el país</span></div>
            <div className="bn-footer-point"><IconShieldCheck aria-hidden="true" /><span>Sin compromiso,<br />coordinás por WhatsApp</span></div>
            <div className="bn-footer-point"><IconMessageCircle aria-hidden="true" /><span>¿Dudas?<br />Hablá con nosotros</span></div>
          </div>
          <div className="bn-footer-bottom">
            <p className="bn-footer-muted">© {new Date().getFullYear()} BioNFC. Tags NFC y landings para negocios.</p>
            <div className="bn-footer-links">
              <Link href="/admin/login">Ingresar al panel</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
