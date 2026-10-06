import type { Metadata } from "next";
import Link from "next/link";
import "../marketing.css";
import "./pedido.css";
import { FaWhatsapp } from "react-icons/fa6";
import { body, display, hand } from "../_home/fonts";
import Logo from "../_home/logo";
import TallyEmbed from "./tally-embed";

export const metadata: Metadata = {
  title: "Pedí tu NFC — BioNFC",
  description: "Completá el pedido en 2 minutos. Te mandamos una vista previa por WhatsApp antes de imprimir.",
};

const TALLY_FORM_ID = "zxaMZg";
const WHATSAPP_NUMBER = "5493517873628";
const WA = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola BioNFC, quiero hacer un pedido. ¿Me ayudan?")}`;

// Tally solo deja incrustar un formulario publicado: en borrador, o si alguna vez se cierra,
// la URL del embed responde 404 y el iframe mostraría la página de error de Tally adentro del
// sitio. Se consulta antes de renderizar y, si no está disponible, la página ofrece WhatsApp en
// lugar de un recuadro roto. Cacheado 5 minutos: publicar el formulario se refleja solo, sin
// redesplegar, y no se le pega a Tally en cada visita.
async function formIsAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`https://tally.so/embed/${TALLY_FORM_ID}`, { method: "HEAD", next: { revalidate: 300 } });
    return response.ok;
  } catch {
    return false;
  }
}

// Cada taller recibe su propio link (/pedido?taller=grabados-lopez) y Tally guarda ese dato en
// el campo oculto "taller" de cada respuesta. Se normaliza en vez de rechazar: si alguien arma
// el link a mano con mayúsculas o espacios, igual tiene que llegar el mismo identificador.
function normalizeTaller(raw: string | string[] | undefined): string | null {
  const value = (Array.isArray(raw) ? raw[0] : raw) || "";
  const slug = value
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || null;
}

export default async function Pedido({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const taller = normalizeTaller((await searchParams).taller);
  const available = await formIsAvailable();

  const embed = new URL(`https://tally.so/embed/${TALLY_FORM_ID}`);
  // El título, la portada y el logo de Tally se ocultan porque la página ya tiene los suyos;
  // si no, el cliente vería "Armemos tu NFC" dos veces, una arriba de la otra.
  embed.search = new URLSearchParams({ alignLeft: "1", hideTitle: "1", transparentBackground: "1", dynamicHeight: "1" }).toString();
  if (taller) embed.searchParams.set("taller", taller);

  return (
    <div className={`bx ${display.variable} ${body.variable} ${hand.variable}`}>
      <header className="pedido-top">
        <Link href="/" className="bx-brand" aria-label="BioNFC, volver al inicio"><Logo /></Link>
        <a className="pedido-top-wa" href={WA} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />¿Dudas? Escribinos</a>
      </header>

      <main className="pedido">
        <div className="pedido-intro">
          <p className="bx-section-kicker">PEDÍ EL TUYO</p>
          {/* Sin bajada a propósito: la bienvenida del formulario ya dice que lleva 2 minutos y que
              hay vista previa antes de imprimir. Repetirlo acá hacía que se leyera dos veces. */}
          <h1 className="bx-h2">Armemos tu NFC</h1>
        </div>

        <div className="pedido-card">
          {available ? (
            <TallyEmbed src={embed.toString()} />
          ) : (
            <div className="pedido-fallback">
              <p className="pedido-fallback-title">Armamos tu pedido por WhatsApp</p>
              <p>Contanos qué necesitás y te ayudamos a elegir.</p>
              <a className="bx-btn bx-btn-primary" href={WA} target="_blank" rel="noreferrer"><FaWhatsapp aria-hidden="true" />Escribinos por WhatsApp</a>
            </div>
          )}
        </div>

        {available && (
          <p className="pedido-alt">
            ¿Preferís hablar con alguien? <a href={WA} target="_blank" rel="noreferrer">Escribinos por WhatsApp</a>
          </p>
        )}
      </main>
    </div>
  );
}
