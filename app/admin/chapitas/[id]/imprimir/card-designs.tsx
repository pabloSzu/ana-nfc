// Los diseños de la tarjetita del paquete: frente con el QR secreto y el código de activación;
// dorso con cómo funciona y dónde entrar si se pierde. Todos con la misma estructura (lo que
// importa siempre en el mismo lugar) y cada uno con sus colores, adornos y textos, con la mascota
// hablando. Están dibujados en "em": 1em = 1 mm en una tarjeta de 85 mm de ancho, y la letra base
// crece con el tamaño elegido (print-studio.tsx), así que todo escala junto. Ningún texto queda
// por debajo de 2,2em (~6 puntos impreso). Estilos en print-studio.css (.pc-*).
import type { CSSProperties, ReactNode } from "react";
import { LuBone, LuCat, LuDog, LuFish, LuHeart, LuLeaf, LuLock, LuPawPrint, LuSparkles, LuStar, LuSun } from "react-icons/lu";
import { LOGO_FONT_FAMILY } from "@/components/bionfc-logo";
import { unitNumber } from "@/lib/pet-tags";
import type { PrintItem } from "./print-studio";

export type DesignId = "playful" | "paws" | "bones" | "kitty" | "park";
export type CardLayout = "classic" | "secure";

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

const LEAD = "Escaneá el código, confirmá tu email y cargá mi foto y tu WhatsApp.";

export const DESIGNS: Design[] = [
  {
    id: "playful", label: "Juguetón", hint: "Durazno y rosa, con patitas", swatch: "linear-gradient(135deg, #ffd3cb 0 50%, #3a1730 50%)",
    title: "¡Hola! Activame en 1 minuto", lead: LEAD, backTitle: "Así me ayudás a volver",
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
    title: "¡Miau! Activame en 1 minuto", lead: LEAD, backTitle: "Si me escapo, te avisan",
    deco: [{ icon: <LuFish />, x: 4, y: 76, size: 9, rotate: -16 }, { icon: <LuCat />, x: 44, y: 72, size: 11, rotate: 0 }, { icon: <LuSparkles />, x: 40, y: 4, size: 5, rotate: 0 }],
    backDeco: [{ icon: <LuCat />, x: 14, y: 42, size: 14, rotate: -8 }, { icon: <LuFish />, x: 38, y: 14, size: 6, rotate: 18 }],
  },
  {
    id: "park", label: "Parque", hint: "Verde y amarillo, sol y hojitas", swatch: "linear-gradient(135deg, #e5f6c9 0 50%, #2f6b2f 50%)",
    title: "¡A jugar! Pero primero, activame", lead: LEAD, backTitle: "Para que siempre vuelva",
    deco: [{ icon: <LuSun />, x: 40, y: 2, size: 9, rotate: 0 }, { icon: <LuLeaf />, x: 2, y: 74, size: 10, rotate: -30 }, { icon: <LuLeaf />, x: 16, y: 86, size: 6, rotate: 20 }, { icon: <LuPawPrint />, x: 48, y: 78, size: 7, rotate: -14 }],
    backDeco: [{ icon: <LuLeaf />, x: 12, y: 46, size: 13, rotate: -24 }, { icon: <LuSun />, x: 38, y: 8, size: 7, rotate: 0 }],
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
export function CardFront({ design: id, layout = "classic", item, host, style, bleed = false }: { design: DesignId; layout?: CardLayout; item: PrintItem; host: string; style: CSSProperties; bleed?: boolean }) {
  const design = designOf(id);
  if (layout === "secure") return <article className={`pc pc-${design.id} pc-front is-secure${bleed ? " is-bleed" : ""}`} style={style}>
    <Deco items={design.deco} />
    <div className="pc-secure-main">
      <div className="pc-secure-copy">
        <div className="pc-secure-top"><span className="pc-unit">{unit(item.number)}</span><span className="pc-product-chip">NFC + QR</span></div>
        <h2>Activá la chapita</h2>
        <p>En 2 minutos queda lista.</p>
        <ol>
          <li><b>1</b><span>Abrí la solapa.</span></li>
          <li><b>2</b><span>Escaneá el QR o usá el código.</span></li>
          <li><b>3</b><span>Cargá la foto y tu WhatsApp.</span></li>
        </ol>
        <p className="pc-secure-benefit"><strong>Si se pierde,</strong> quien la encuentre puede avisarte.</p>
        <div className="pc-secure-edit"><Logo /><small>Después podés editarla en <b>{host}/mi</b></small></div>
      </div>
      <div className="pc-secure-secret">
        <strong><LuLock aria-hidden="true" /> Para activar</strong>
        {/* eslint-disable-next-line @next/next/no-img-element -- QR secreto generado en el servidor */}
        <div className="pc-qrbox">{item.activationQr && <img src={item.activationQr} alt="" />}</div>
        <span className="pc-code">{item.code}</span>
        <small>{host}/activar</small>
        <em>Código privado</em>
      </div>
    </div>
    <span className="pc-fold-line"><i>DOBLAR SOBRE EL QR</i></span>
    <div className="pc-secure-flap"><span aria-hidden="true">←</span><strong>Doblá esta solapa sobre el QR</strong><small>Así el código queda oculto y protegido.</small></div>
  </article>;
  return <article className={`pc pc-${design.id} pc-front${bleed ? " is-bleed" : ""}`} style={style}>
    <Deco items={design.deco} />
    <div className="pc-copy">
      <span className="pc-unit">{unit(item.number)}</span>
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
