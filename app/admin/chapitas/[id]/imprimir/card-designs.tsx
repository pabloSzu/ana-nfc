// Los diseños de la tarjetita del paquete: frente con el QR secreto y el código de activación;
// dorso con cómo funciona y dónde entrar si se pierde. Todos con la misma estructura (lo que
// importa siempre en el mismo lugar) y cada uno con sus colores, adornos y textos, con la mascota
// hablando. Están dibujados en "em": 1em = 1 mm en una tarjeta de 85 mm de ancho, y la letra base
// crece con el tamaño elegido (print-studio.tsx), así que todo escala junto. Ningún texto queda
// por debajo de 2,2em (~6 puntos impreso). Estilos en print-studio.css (.pc-*).
import type { CSSProperties, ReactNode } from "react";
import { LuBone, LuCat, LuDog, LuHeart, LuLock, LuPawPrint, LuSparkles, LuStar } from "react-icons/lu";
import { LOGO_FONT_FAMILY } from "@/components/bionfc-logo";
import { unitNumber } from "@/lib/pet-tags";
import type { PrintItem } from "./print-studio";

export type DesignId = "playful" | "paws" | "bones" | "kitty";
export type CardLayout = "classic" | "flap-a" | "flap-b";
// Las variantes con solapa se imprimen de una sola faz. Cerradas miden ancho × alto (85×55 por
// defecto, ver FLAP_LIMITS); la solapa siempre mide 30 mm (lo que necesita el QR) y abierta suma
// esos 30. Cerrada, la solapa tapa los últimos 30 mm del cuerpo y se cierra con un calco redondo
// sobre su borde: esa franja de la tapa queda libre.
export const isFlapCard = (layout: CardLayout) => layout === "flap-a" || layout === "flap-b";
export const FLAP_WIDTH = 30;
// WhatsApp de ayuda que se imprime debajo del código (vacío: no se imprime).
const HELP_WHATSAPP = "351 787 3628";
export const FLAP_LIMITS = { width: [80, 95], height: [40, 60] } as const;

type Design = {
  id: DesignId;
  label: string;
  hint: string;
  swatch: string;
  title: string;
  lead: string;
  backTitle: string;
  // Adornos del fondo: ícono, posición (en % de la tarjeta), tamaño (em) y giro.
  deco: { icon: ReactNode; x: number; y: number; size: number; rotate: number }[];
  backDeco: { icon: ReactNode; x: number; y: number; size: number; rotate: number }[];
};

// Lo mismo que pide la activación: entrar con el email y cargar el nombre y el WhatsApp (la foto es opcional).
const LEAD = "Escaneá el código, entrá con tu email y poné mi nombre y tu WhatsApp.";

export const DESIGNS: Design[] = [
  {
    id: "playful", label: "Juguetón", hint: "Durazno y rosa, con patitas", swatch: "linear-gradient(135deg, #ffd3cb 0 50%, #3a1730 50%)",
    title: "¡Hola! Activame en 2 minutos", lead: LEAD, backTitle: "Así me ayudás a volver",
    deco: [{ icon: <LuPawPrint />, x: 44, y: 78, size: 18, rotate: -20 }, { icon: <LuHeart />, x: 36, y: 6, size: 6, rotate: 14 }],
    backDeco: [{ icon: <LuPawPrint />, x: 22, y: 42, size: 14, rotate: 18 }],
  },
  {
    id: "paws", label: "Patitas", hint: "Naranja y crema, lleno de huellas", swatch: "linear-gradient(135deg, #fff1e2 0 50%, #e9772f 50%)",
    title: "¡Guau! Ya casi tengo mi chapita", lead: LEAD, backTitle: "Si me pierdo, vuelvo a casa",
    deco: [{ icon: <LuPawPrint />, x: 2, y: 66, size: 10, rotate: -24 }, { icon: <LuPawPrint />, x: 14, y: 84, size: 7, rotate: -12 }, { icon: <LuPawPrint />, x: 40, y: 4, size: 6, rotate: 20 }, { icon: <LuDog />, x: 46, y: 70, size: 11, rotate: 0 }],
    backDeco: [{ icon: <LuPawPrint />, x: 8, y: 44, size: 11, rotate: -18 }, { icon: <LuPawPrint />, x: 26, y: 56, size: 8, rotate: -6 }],
  },
  {
    id: "bones", label: "Huesitos", hint: "Celeste, con huesitos y estrellas", swatch: "linear-gradient(135deg, #d9efff 0 50%, #1f4e8c 50%)",
    title: "¡Activame y salgamos a pasear!", lead: LEAD, backTitle: "Mi chapita me cuida",
    deco: [{ icon: <LuBone />, x: 4, y: 74, size: 12, rotate: -28 }, { icon: <LuBone />, x: 40, y: 2, size: 7, rotate: 24 }, { icon: <LuStar />, x: 52, y: 80, size: 5, rotate: 10 }, { icon: <LuSparkles />, x: 30, y: 60, size: 4, rotate: 0 }],
    backDeco: [{ icon: <LuBone />, x: 12, y: 44, size: 14, rotate: 20 }, { icon: <LuStar />, x: 40, y: 10, size: 5, rotate: 0 }],
  },
  {
    id: "kitty", label: "Michi", hint: "Lavanda, con orejitas de gato en el QR", swatch: "linear-gradient(135deg, #ece3ff 0 50%, #4b2a85 50%)",
    title: "¡Miau! Activame en 2 minutos", lead: LEAD, backTitle: "Si me escapo, te avisan",
    // Todo de michi: carita de gato y huellitas (los dos primeros son los que usa la tarjeta con solapa).
    deco: [{ icon: <LuCat />, x: 44, y: 72, size: 11, rotate: -6 }, { icon: <LuPawPrint />, x: 4, y: 76, size: 9, rotate: -16 }, { icon: <LuSparkles />, x: 40, y: 4, size: 5, rotate: 0 }],
    backDeco: [{ icon: <LuCat />, x: 14, y: 42, size: 14, rotate: -8 }, { icon: <LuPawPrint />, x: 38, y: 14, size: 6, rotate: 18 }],
  },
];

const designOf = (id: DesignId) => DESIGNS.find((design) => design.id === id) || DESIGNS[0];

function Logo({ light = false }: { light?: boolean }) {
  // Con la letra del logo de la marca (la misma que en la página).
  return <span className={`pc-logo${light ? " is-light" : ""}`} style={{ fontFamily: LOGO_FONT_FAMILY }}><b>BIO</b><i>NFC</i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.2a4.6 4.6 0 0 1 0 5.6" /><path d="M8.6 6.4a8.6 8.6 0 0 1 0 11.2" /><path d="M13.9 3.6a12.6 12.6 0 0 1 0 16.8" /></svg></span>;
}

function Deco({ items }: { items: Design["deco"] }) {
  return <div className="pc-deco" aria-hidden="true">{items.map((item, index) => <span key={index} style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: `${item.size}em`, transform: `rotate(${item.rotate}deg)` }}>{item.icon}</span>)}</div>;
}

export { unitNumber };
export const unit = (number: number) => `UNIDAD ${unitNumber(number)}`;

// bleed: la tarjeta con sangrado (el fondo sigue 2 mm más por fuera, ver .pc.is-bleed).
export function CardFront({ design: id, layout = "classic", item, host, style, bleed = false, closed = { width: 85, height: 55 }, fresh = false }: { design: DesignId; layout?: CardLayout; item: PrintItem; host: string; style: CSSProperties; bleed?: boolean; closed?: { width: number; height: number }; fresh?: boolean }) {
  const design = designOf(id);
  if (isFlapCard(layout)) {
    const clean = layout === "flap-a";
    // Los pasos reales de la activación: escanear, confirmar el email con el código de 6 dígitos que
    // llega por mail y cargar nombre y WhatsApp (la foto es opcional). Hablan como la mascota, igual
    // que el título. En la tapa de la B el QR está tapado: el primer paso arranca abriendo la solapa.
    const steps = <ol>
      <li><b>1</b>{clean ? "Escaneá el QR" : "Abrí la solapa y escaneá el QR"}</li>
      <li><b>2</b>Poné tu email y el código que te llega</li>
      <li><b>3</b>Cargá mi nombre y tu WhatsApp</li>
    </ol>;
    const later = <small>Después: editá mis datos o avisá si me pierdo en <b>{host}/mi</b>.</small>;
    // Los adornos del estilo sólo en esquinas libres: arriba a la derecha de la tapa y abajo en la
    // zona interior. Nunca detrás del texto ni donde va el calco.
    const [first, second] = design.deco;
    const sizes = { "--pc-c": `${closed.width - FLAP_WIDTH}em`, "--pc-w": `${closed.width}em`, "--pc-h": `${closed.height}em` } as CSSProperties;
    return <article className={`pc pc-${design.id} pc-front is-flap${clean ? "" : " is-steps"}${fresh ? " is-fresh" : ""}${bleed ? " is-bleed" : ""}`} style={{ ...style, ...sizes }}>
      <div className="pc-deco pc-flap-deco" aria-hidden="true">
        {first && <span style={{ left: "calc(var(--pc-c) - 15em)", top: "3.5em", transform: `rotate(${first.rotate}deg)` }}><i style={{ display: "block", fontSize: "9em" }}>{first.icon}</i></span>}
        {second && <span style={{ left: "calc(var(--pc-w) - 9em)", top: "calc(var(--pc-h) - 11em)", transform: `rotate(${second.rotate}deg)` }}><i style={{ display: "block", fontSize: "7em" }}>{second.icon}</i></span>}
      </div>
      {/* Tapa (0–55): lo que se ve con la tarjeta cerrada. */}
      <div className="pc-flap-cover">
        <Logo />
        <div className="pc-flap-title">
          <h2>{design.title}</h2>
          {clean ? <span className="pc-flap-open">Abrí la solapa <i aria-hidden="true">→</i></span> : steps}
        </div>
        <small className="pc-flap-foot">Si me pierdo, quien me encuentre te avisa</small>
      </div>
      {/* Bajo la solapa (55–85): se ve al abrirla, al lado del QR. */}
      <div className="pc-flap-inside">
        {clean ? <>
          <strong>Así se activa</strong>
          {steps}
          <small>¿Sin cámara? Entrá a <b>{host}/activar</b> y escribí el código.</small>
          {later}
        </> : <>
          <strong>¿No podés escanear?</strong>
          <small>Entrá a <b>{host}/activar</b> y escribí el código.</small>
          {later}
        </>}
      </div>
      {/* Solapa (85–115): el QR y el código, enteros y a 4 mm del pliegue. */}
      <div className="pc-flap-secret">
        <strong><LuLock aria-hidden="true" /> Para activar</strong>
        {/* eslint-disable-next-line @next/next/no-img-element -- QR secreto generado en el servidor */}
        <div className="pc-qrbox">{item.activationQr && <img src={item.activationQr} alt="" />}</div>
        <span className="pc-code">{item.code}</span>
        {HELP_WHATSAPP && <small className="pc-flap-help">¿Ayuda? WhatsApp <b>{HELP_WHATSAPP}</b></small>}
      </div>
      <span className="pc-flap-fold" aria-hidden="true" />
      {/* Sólo en pantalla: dónde va el calco que cierra la solapa. */}
      <span className="pc-flap-sticker" aria-hidden="true"><i>calco</i></span>
    </article>;
  }
  return <article className={`pc pc-${design.id} pc-front${bleed ? " is-bleed" : ""}`} style={style}>
    <Deco items={design.deco} />
    <div className="pc-copy">
      <h2>{design.title}</h2>
      <p>{design.lead}</p>
      <Logo />
    </div>
    <div className="pc-qr">
      {/* eslint-disable-next-line @next/next/no-img-element -- QR secreto generado en el servidor */}
      <div className="pc-qrbox">{item.activationQr && <img src={item.activationQr} alt="" />}</div>
      <span className="pc-code">{item.code}</span>
      <small>{host}/activar</small>
    </div>
  </article>;
}

export function CardBack({ design: id, host, style, bleed = false }: { design: DesignId; layout?: CardLayout; host: string; style: CSSProperties; bleed?: boolean }) {
  const design = designOf(id);
  return <article className={`pc pc-${design.id} pc-back${bleed ? " is-bleed" : ""}`} style={style}>
    <Deco items={design.backDeco} />
    <div className="pc-left"><h2>{design.backTitle}</h2><Logo light /></div>
    <ul>
      <li><b>1</b>Me encuentran y escanean mi chapita</li>
      <li><b>2</b>Ven mi foto y tu WhatsApp</li>
      <li><b>3</b>Te avisan al toque</li>
      <li><b>!</b>¿Me perdí? Avisá en {host}/mi</li>
    </ul>
  </article>;
}
