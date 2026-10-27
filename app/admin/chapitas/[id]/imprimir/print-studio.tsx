"use client";

// El estudio de impresión de un lote: a la izquierda las opciones, a la derecha las páginas tal
// como salen. Se imprime con el navegador ("Guardar como PDF" para llevar a la imprenta).
//  · Tarjetas: 5 diseños (card-designs.tsx), varios tamaños, frente y dorso, en dos formatos:
//     - Hoja A4: varias por hoja, para imprimir en casa. Los dorsos van espejados en su hoja: al
//       imprimir doble faz (girando por el lado largo) cada dorso cae detrás de su frente.
//     - Una por página: cada cara en su página, con 2 mm de sangrado y marcas de corte. Es como
//       la piden las imprentas (ellas arman las planchas) y como se importa en Canva.
//  · QR de las chapitas: el tamaño en mm se elige según la chapita.
// Las opciones quedan guardadas en esta compu.
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { LuPrinter } from "react-icons/lu";
import { CardBack, CardFront, DESIGNS, type DesignId } from "./card-designs";
import TagFace, { TAG_COLORS, TAG_STYLES, tagStyleFor, type TagStyle } from "./tag-face";

export type PrintItem = { id: string; number: number; code: string; activationQr: string; tagQr: string };
type Mode = "cards" | "qr";
type Settings = {
  design: DesignId;
  size: string;
  width: number;
  height: number;
  sides: "both" | "front";
  output: "sheet" | "single";
  cutLines: boolean;
  qrSize: number;
  qrNumber: boolean;
  qrColor: string;
  qrDesign: TagStyle | "mix";
};

const SIZES = [
  { id: "85x55", label: "Tarjeta personal · 85×55 mm", width: 85, height: 55 },
  { id: "90x50", label: "Tarjeta angosta · 90×50 mm", width: 90, height: 50 },
  { id: "100x70", label: "Grande · 100×70 mm", width: 100, height: 70 },
  { id: "custom", label: "Otra medida", width: 85, height: 55 },
];
const DEFAULTS: Settings = { design: "playful", size: "85x55", width: 85, height: 55, sides: "both", output: "single", cutLines: true, qrSize: 30, qrNumber: true, qrColor: "rainbow", qrDesign: "mix" };
const STORAGE_KEY = "bionfc-print-settings";
// Hoja A4 con 7 mm de margen (casi todas las impresoras dejan ~5 mm sin imprimir): así entran
// 10 tarjetas personales por hoja, como en las planchas de imprenta.
const PAGE = { width: 210, height: 297, margin: 7 };
// Una por página: 2 mm de sangrado y 6 mm alrededor para las marcas de corte.
const BLEED = 2;
const MARKS = 6;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

// Las 8 rayitas de las marcas de corte: siguen las líneas donde se corta, por fuera del sangrado.
function CropMarks({ width, height }: { width: number; height: number }) {
  const left = MARKS + BLEED;
  const top = MARKS + BLEED;
  const length = MARKS - 1;
  const line = (style: CSSProperties, key: string) => <span key={key} className="ps-mark" style={style} />;
  return <>{[top, top + height].flatMap((y) => [
    line({ left: 0, top: `${y}mm`, width: `${length}mm`, height: ".2mm" }, `l${y}`),
    line({ right: 0, top: `${y}mm`, width: `${length}mm`, height: ".2mm" }, `r${y}`),
  ]).concat([left, left + width].flatMap((x) => [
    line({ top: 0, left: `${x}mm`, width: ".2mm", height: `${length}mm` }, `t${x}`),
    line({ bottom: 0, left: `${x}mm`, width: ".2mm", height: `${length}mm` }, `b${x}`),
  ]))}</>;
}

export default function PrintStudio({ batchId, batchName, items, host, isLocal = false, initialMode }: { batchId: string; batchName: string; items: PrintItem[]; host: string; isLocal?: boolean; initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (stored && typeof stored === "object") {
        const next = { ...DEFAULTS, ...stored };
        // Un diseño guardado que ya no existe vuelve al primero.
        if (!DESIGNS.some((design) => design.id === next.design)) next.design = DEFAULTS.design;
        setSettings(next);
      }
    } catch {}
  }, []);
  const update = (patch: Partial<Settings>) => setSettings((current) => {
    const next = { ...current, ...patch };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    return next;
  });

  const width = clamp(settings.width, 40, 190);
  const height = clamp(settings.height, 30, 270);
  // La chapita entera (el círculo), en mm.
  const qrSize = clamp(settings.qrSize, 22, 45);
  const single = mode === "cards" && settings.output === "single";

  // Cuántas entran por hoja.
  const cardGap = 2;
  const cardCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + cardGap) / (width + cardGap)));
  const cardRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + cardGap) / (height + cardGap)));
  const perCardPage = cardCols * cardRows;
  // Bien juntas para no gastar hojas (2 mm entre una y otra para cortar).
  const qrGap = 2;
  // Abajo de cada círculo, el número de unidad (afuera: se recorta; es una guía para armar).
  const qrCell = qrSize + (settings.qrNumber ? 4 : 0);
  const qrCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + qrGap) / (qrSize + qrGap)));
  const qrRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + qrGap) / (qrCell + qrGap)));
  const perQrPage = qrCols * qrRows;

  const chunks = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, index * size + size));
  const cardPages = chunks(items, perCardPage);
  const qrPages = chunks(items, perQrPage);
  const faces = settings.sides === "both" ? 2 : 1;
  const pageCount = mode === "qr" ? qrPages.length : single ? items.length * faces : cardPages.length * faces;

  const cardStyle = { width: `${width}mm`, height: `${height}mm`, fontSize: `${width / 85}mm` };
  // Con sangrado la tarjeta crece 2 mm por lado (el fondo sigue por debajo) y el contenido queda
  // en la medida final.
  const bleedStyle = { width: `${width + BLEED * 2}mm`, height: `${height + BLEED * 2}mm`, borderWidth: `${BLEED}mm`, fontSize: `${width / 85}mm` };
  const singlePage = { width: width + (BLEED + MARKS) * 2, height: height + (BLEED + MARKS) * 2 };
  const gridStyle = (cols: number, cellWidth: number, gap: number) => ({ gridTemplateColumns: `repeat(${cols}, ${cellWidth}mm)`, gap: `${gap}mm` });

  return <div className="ps">
    {/* eslint-disable-next-line @next/next/no-page-custom-font -- solo para esta hoja de impresión */}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Poppins:wght@600;700;800&display=swap" />
    {/* El tamaño de página depende del formato elegido. */}
    <style>{`@media print { @page { size: ${single ? `${singlePage.width}mm ${singlePage.height}mm` : "A4"}; margin: 0; } }`}</style>
    <aside className="ps-panel">
      <Link className="ps-back" href={`/admin/chapitas/${batchId}`}>← Volver al lote</Link>
      <h1>{batchName}</h1>
      <p className="ps-muted">{items.length} {items.length === 1 ? "chapita sin activar" : "chapitas sin activar"} · {pageCount} {pageCount === 1 ? "página" : "páginas"}</p>

      {isLocal && <p className="ps-local">Estás en desarrollo: estos QR y códigos apuntan a tu computadora ({host}). Para chapitas reales, imprimí desde el Admin de bionfc.com.</p>}

      <div className="ps-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "cards"} className={mode === "cards" ? "is-on" : ""} onClick={() => setMode("cards")}>Tarjetas del paquete</button>
        <button type="button" role="tab" aria-selected={mode === "qr"} className={mode === "qr" ? "is-on" : ""} onClick={() => setMode("qr")}>QR de las chapitas</button>
      </div>

      {mode === "cards" ? <>
        <fieldset className="ps-group"><legend>Diseño</legend>
          <div className="ps-designs">{DESIGNS.map((design) => <button key={design.id} type="button" className={settings.design === design.id ? "is-on" : ""} onClick={() => update({ design: design.id })}>
            <span className="ps-swatch" style={{ background: design.swatch }} /><strong>{design.label}</strong><small>{design.hint}</small>
          </button>)}</div>
        </fieldset>
        <fieldset className="ps-group"><legend>Tamaño</legend>
          <select value={settings.size} onChange={(event) => { const size = SIZES.find((item) => item.id === event.target.value)!; update(size.id === "custom" ? { size: size.id } : { size: size.id, width: size.width, height: size.height }); }}>
            {SIZES.map((size) => <option key={size.id} value={size.id}>{size.label}</option>)}
          </select>
          {settings.size === "custom" && <div className="ps-row">
            <label>Ancho (mm)<input type="number" min={40} max={190} value={settings.width} onChange={(event) => update({ width: Number(event.target.value) })} /></label>
            <label>Alto (mm)<input type="number" min={30} max={270} value={settings.height} onChange={(event) => update({ height: Number(event.target.value) })} /></label>
          </div>}
        </fieldset>
        <fieldset className="ps-group"><legend>Caras</legend>
          <label className="ps-check"><input type="radio" checked={settings.sides === "both"} onChange={() => update({ sides: "both" })} />Frente y dorso</label>
          <label className="ps-check"><input type="radio" checked={settings.sides === "front"} onChange={() => update({ sides: "front" })} />Solo frente (el dorso lo hago en Canva)</label>
        </fieldset>
        <fieldset className="ps-group"><legend>Formato</legend>
          <label className="ps-check"><input type="radio" checked={settings.output === "single"} onChange={() => update({ output: "single" })} />Una por página, con sangrado (imprenta o Canva)</label>
          <label className="ps-check"><input type="radio" checked={settings.output === "sheet"} onChange={() => update({ output: "sheet" })} />Hoja A4, {perCardPage} por hoja (imprimir en casa)</label>
        </fieldset>
      </> : <fieldset className="ps-group"><legend>La chapita</legend>
        <label>Tamaño (diámetro): <b>{qrSize} mm</b><input type="range" min={22} max={45} value={qrSize} onChange={(event) => update({ qrSize: Number(event.target.value) })} /></label>
        <small className="ps-muted">El círculo entero, del tamaño de tu chapita. Entran {perQrPage} por hoja.</small>
        <span className="ps-colors-label">Diseño</span>
        <div className="ps-tag-styles">{TAG_STYLES.map((style) => <button key={style.id} type="button" className={settings.qrDesign === style.id ? "is-on" : ""} onClick={() => update({ qrDesign: style.id })}>{style.label}</button>)}</div>
        <span className="ps-colors-label">Color</span>
        <div className="ps-colors">
          {TAG_COLORS.map((color) => <button key={color.id} type="button" className={settings.qrColor === color.id ? "is-on" : ""} onClick={() => update({ qrColor: color.id })} aria-label={color.label} title={color.label}><span style={{ background: color.value }} /></button>)}
          {/* Un color propio: el selector de colores del navegador. */}
          <label className={`ps-color-custom${settings.qrColor.startsWith("#") ? " is-on" : ""}`} title="Otro color">
            <span style={settings.qrColor.startsWith("#") ? { background: settings.qrColor } : undefined}>{settings.qrColor.startsWith("#") ? "" : "+"}</span>
            <input type="color" value={settings.qrColor.startsWith("#") ? settings.qrColor : "#3a7bd5"} onChange={(event) => update({ qrColor: event.target.value })} aria-label="Elegir otro color" />
          </label>
        </div>
        <label className="ps-check"><input type="checkbox" checked={settings.qrNumber} onChange={(event) => update({ qrNumber: event.target.checked })} />Número de unidad abajo, afuera del círculo (guía para armar cada paquete con su tarjeta)</label>
        <small className="ps-muted">El código para activar nunca va en la chapita: con él, quien encuentra a la mascota podría quedarse con ella. Va solo en la tarjeta del paquete.</small>
      </fieldset>}

      {!single && <fieldset className="ps-group"><legend>Corte</legend>
        <label className="ps-check"><input type="checkbox" checked={settings.cutLines} onChange={(event) => update({ cutLines: event.target.checked })} />Líneas de corte punteadas</label>
      </fieldset>}

      <button type="button" className="btn full ps-print" onClick={() => window.print()} disabled={!items.length}><LuPrinter aria-hidden="true" /> Imprimir o guardar PDF</button>
      <div className="ps-help">
        <strong>{single ? "Para la imprenta o Canva" : "Para imprimir"}</strong>
        <span>En la ventana de impresión elegí <b>Guardar como PDF</b>, márgenes <b>Ninguno</b> y activá <b>Gráficos de fondo</b>.</span>
        {single
          ? <span>Cada cara va en su página, a {width}×{height} mm con <b>2 mm de sangrado</b> y marcas de corte{settings.sides === "both" ? ", frente y dorso intercalados" : ""}. Así lo piden las imprentas, y en Canva se importa con <b>Subir → el PDF</b>.</span>
          : settings.sides === "both" && mode === "cards" && <span>Doble faz, <b>girando por el lado largo</b>: los dorsos ya están ubicados para caer detrás de cada frente.</span>}
        <span className="is-warn">Las tarjetas tienen los códigos para activar: no compartas el PDF por cualquier lado.</span>
      </div>
    </aside>

    <main className={`ps-sheets${single ? " is-single" : ""}`}>
      {!items.length && <p className="ps-empty">Todas las chapitas de este lote ya están activadas: no hay nada para imprimir.</p>}
      {single ? items.flatMap((item) => [
        <section key={`${item.id}-f`} className="ps-single" style={{ width: `${singlePage.width}mm`, height: `${singlePage.height}mm` }} aria-label={`Unidad ${item.number}: frente`}>
          <CardFront design={settings.design} item={item} host={host} style={bleedStyle} bleed />
          <CropMarks width={width} height={height} />
        </section>,
        ...(settings.sides === "both" ? [<section key={`${item.id}-b`} className="ps-single" style={{ width: `${singlePage.width}mm`, height: `${singlePage.height}mm` }} aria-label={`Unidad ${item.number}: dorso`}>
          <CardBack design={settings.design} host={host} style={bleedStyle} bleed />
          <CropMarks width={width} height={height} />
        </section>] : []),
      ]) : mode === "cards" ? cardPages.map((page, pageIndex) => <div key={pageIndex} className="ps-pair">
        <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: frentes`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · frentes</span>
          <div className="ps-grid" style={gridStyle(cardCols, width, cardGap)}>
            {page.map((item) => <div key={item.id} className={`ps-cell${settings.cutLines ? " has-cut" : ""}`}><CardFront design={settings.design} item={item} host={host} style={cardStyle} /></div>)}
          </div>
        </section>
        {settings.sides === "both" && <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: dorsos`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · dorsos (atrás de la anterior)</span>
          <div className="ps-grid" style={gridStyle(cardCols, width, cardGap)}>
            {/* Espejado por fila: el dorso de la columna 1 va en la última, y así. */}
            {Array.from({ length: Math.ceil(page.length / cardCols) * cardCols }, (_, cell) => {
              const row = Math.floor(cell / cardCols);
              const item = page[row * cardCols + (cardCols - 1 - (cell % cardCols))];
              return <div key={cell} className={`ps-cell${item && settings.cutLines ? " has-cut" : ""}`}>{item ? <CardBack design={settings.design} host={host} style={cardStyle} /> : <div style={cardStyle} />}</div>;
            })}
          </div>
        </section>}
      </div>) : qrPages.map((page, pageIndex) => <section key={pageIndex} className="ps-page" aria-label={`Hoja ${pageIndex + 1}`}>
        <span className="ps-page-label">Hoja {pageIndex + 1}</span>
        <div className="ps-grid" style={gridStyle(qrCols, qrSize, qrGap)}>
          {page.map((item, index) => <div key={item.id} className="ps-tag-cell">
            <div className={`ps-tag-ring${settings.cutLines ? " has-cut" : ""}`}><TagFace id={item.id} qr={item.tagQr} diameter={qrSize} color={settings.qrColor} design={tagStyleFor(settings.qrDesign, index)} /></div>
            {settings.qrNumber && <span className="ps-tag-number">{item.number}</span>}
          </div>)}
        </div>
      </section>)}
    </main>
  </div>;
}
