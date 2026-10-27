"use client";

// El estudio de impresión de un lote: a la izquierda las opciones, a la derecha las páginas tal
// como salen. Se imprime con el navegador ("Guardar como PDF" para llevar a la imprenta).
//  · Tarjetas: 5 diseños (card-designs.tsx), varios tamaños, frente y dorso, en dos formatos:
//     - Hoja A4: varias por hoja, para imprimir en casa. Los dorsos van espejados en su hoja: al
//       imprimir doble faz (girando por el lado largo) cada dorso cae detrás de su frente.
//     - Una por página: cada cara en su página, con 2 mm de sangrado y marcas de corte. Es como
//       la piden las imprentas (ellas arman las planchas) y como se importa en Canva.
//  · QR de las chapitas: el tamaño en mm se elige según la chapita.
// Las opciones generales quedan guardadas en esta compu; lo de cada unidad (nombre, animal, color)
// se guarda en la chapita misma (actions.ts), así no se pierde ni lo pisa otra pestaña.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { LuPrinter } from "react-icons/lu";
import { CardBack, CardFront, DESIGNS, unit, unitNumber, type DesignId } from "./card-designs";
import { cleanTagPrint, TagBack, TagFront, TAG_CHARACTERS, TAG_COLORS, tagCharacterFor, type TagCharacterChoice, type TagCharacterId, type TagPrint } from "./tag-face";
import { saveTagPrint } from "./actions";

export type PrintItem = { id: string; number: number; code: string; activationQr: string; tagQr: string; print: TagPrint };
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
  tagSides: "both" | "front" | "back";
  tagOutput: "pairs" | "duplex";
  tagLayoutVersion: number;
  tagCharacter: TagCharacterChoice;
  tagNames: Record<string, string>;
  tagCharacters: Record<string, TagCharacterId>;
  tagColors: Record<string, string>;
  tagHole: boolean;
};

const SIZES = [
  { id: "85x55", label: "Tarjeta personal · 85×55 mm", width: 85, height: 55 },
  { id: "90x50", label: "Tarjeta angosta · 90×50 mm", width: 90, height: 50 },
  { id: "100x70", label: "Grande · 100×70 mm", width: 100, height: 70 },
  { id: "custom", label: "Otra medida", width: 85, height: 55 },
];
const DEFAULTS: Settings = { design: "playful", size: "85x55", width: 85, height: 55, sides: "both", output: "single", cutLines: true, qrSize: 30, qrNumber: true, qrColor: "mix", tagSides: "both", tagOutput: "pairs", tagLayoutVersion: 2, tagCharacter: "mix", tagNames: {}, tagCharacters: {}, tagColors: {}, tagHole: false };
const STORAGE_KEY = "bionfc-print-settings";
// Lo de cada unidad no va al navegador: viene de la base (PrintItem.print).
const UNIT_KEYS = ["tagNames", "tagCharacters", "tagColors"];
const prefsOf = (value: Settings) => Object.fromEntries(Object.entries(value).filter(([key]) => !UNIT_KEYS.includes(key)));
const savePrefs = (value: Settings) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsOf(value))); } catch {} };
const unitsOf = (entries: { id: string; print: TagPrint }[]) => ({
  tagNames: Object.fromEntries(entries.filter((entry) => entry.print.name).map((entry) => [entry.id, entry.print.name!])),
  tagCharacters: Object.fromEntries(entries.filter((entry) => entry.print.character).map((entry) => [entry.id, entry.print.character!])) as Record<string, TagCharacterId>,
  tagColors: Object.fromEntries(entries.filter((entry) => entry.print.color).map((entry) => [entry.id, entry.print.color!])),
});
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

// Pie de cada hoja, en el margen (fuera del corte): de qué lote es, qué unidades lleva y una línea
// de 50 mm para comprobar que se imprimió al 100% (con "Ajustar a la página" todo sale más chico y
// la chapita ya no entra en su base).
function SheetFoot({ batchName, page, pages, items, detail }: { batchName: string; page: number; pages: number; items: PrintItem[]; detail: string }) {
  const range = items.length ? `Unidades ${unitNumber(items[0].number)}–${unitNumber(items[items.length - 1].number)}` : "";
  return <footer className="ps-sheet-foot">
    <span>{[batchName, `Hoja ${page}/${pages}`, range, detail].filter(Boolean).join(" · ")}</span>
    <span className="ps-ruler"><i />Esta línea mide 50 mm</span>
  </footer>;
}

export default function PrintStudio({ batchId, batchName, items, host, isLocal = false, initialMode }: { batchId: string; batchName: string; items: PrintItem[]; host: string; isLocal?: boolean; initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULTS, ...unitsOf(items) }));
  const [previewId, setPreviewId] = useState(items[0]?.id || "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Guarda una unidad en la chapita. Mientras se escribe el nombre, espera a que se deje de tipear.
  const saveUnit = (id: string, print: TagPrint, delay = 0) => {
    clearTimeout(saveTimers.current[id]);
    setSaveState("saving");
    saveTimers.current[id] = setTimeout(() => {
      saveTagPrint(batchId, id, cleanTagPrint(print)).then((ok) => setSaveState(ok ? "saved" : "error"), () => setSaveState("error"));
    }, delay);
  };
  // Si se cierra con algo sin guardar, el navegador pregunta antes.
  useEffect(() => {
    if (saveState !== "saving") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (stored && typeof stored === "object") {
        // Lo que versiones anteriores guardaban en el navegador por unidad pasa una sola vez a la
        // chapita (sólo si la chapita todavía no tiene nada elegido).
        const legacy = items.filter((item) => !Object.keys(item.print).length)
          .map((item) => ({ id: item.id, print: cleanTagPrint({ name: stored.tagNames?.[item.id], character: stored.tagCharacters?.[item.id], color: stored.tagColors?.[item.id] }) }))
          .filter((entry) => Object.keys(entry.print).length);
        for (const entry of legacy) saveUnit(entry.id, entry.print);
        const next = { ...DEFAULTS, ...stored, ...unitsOf([...items.filter((item) => Object.keys(item.print).length), ...legacy]) };
        // Un diseño guardado que ya no existe vuelve al primero.
        if (!DESIGNS.some((design) => design.id === next.design)) next.design = DEFAULTS.design;
        // La versión anterior dejaba el modo espejado demasiado visible. Una sola vez migramos a
        // pares para armado; si después alguien activa doble faz a propósito, la elección se guarda.
        if (!stored.tagLayoutVersion || stored.tagLayoutVersion < DEFAULTS.tagLayoutVersion) {
          next.tagOutput = "pairs";
          next.tagSides = "both";
          next.tagLayoutVersion = DEFAULTS.tagLayoutVersion;
        }
        savePrefs(next);
        setSettings(next);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo al abrir el estudio
  }, []);
  const update = (patch: Partial<Settings>) => setSettings((current) => {
    const next = { ...current, ...patch };
    savePrefs(next);
    return next;
  });

  const width = clamp(settings.width, 40, 190);
  const height = clamp(settings.height, 30, 270);
  // La chapita entera (el círculo), en mm. Desde 28 mm: más chica, el QR no se lee bien impreso.
  const qrSize = clamp(settings.qrSize, 28, 45);
  const single = mode === "cards" && settings.output === "single";

  // Cuántas entran por hoja.
  const cardGap = 2;
  const cardCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + cardGap) / (width + cardGap)));
  const cardRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + cardGap) / (height + cardGap)));
  const perCardPage = cardCols * cardRows;
  // Bien juntas para no gastar hojas (2 mm entre una y otra para cortar).
  const qrGap = 2;
  // Abajo de cada círculo, el código de activación (afuera: se recorta; es una guía para armar).
  const qrCell = qrSize + (settings.qrNumber ? 4 : 0);
  const qrCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + qrGap) / (qrSize + qrGap)));
  const qrRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + qrGap) / (qrCell + qrGap)));
  const perQrPage = qrCols * qrRows;
  // Formato recomendado: cada frente queda al lado de su dorso en la misma hoja.
  const pairInnerGap = 3;
  const pairGap = 3;
  const pairWidth = qrSize * 2 + pairInnerGap;
  const pairCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + pairGap) / (pairWidth + pairGap)));
  // En pares el código va vertical entre ambas caras: no consume una franja debajo.
  const pairRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + pairGap) / (qrSize + pairGap)));
  const perPairPage = pairCols * pairRows;

  const chunks = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, index * size + size));
  const cardPages = chunks(items, perCardPage);
  const qrPages = chunks(items, perQrPage);
  const pairPages = chunks(items, perPairPage);
  const faces = settings.sides === "both" ? 2 : 1;
  const tagFaces = settings.tagSides === "both" ? 2 : 1;
  const pageCount = mode === "qr"
    ? settings.tagSides === "both" && settings.tagOutput === "pairs" ? pairPages.length : qrPages.length * tagFaces
    : single ? items.length * faces : cardPages.length * faces;

  const cardStyle = { width: `${width}mm`, height: `${height}mm`, fontSize: `${width / 85}mm` };
  // Con sangrado la tarjeta crece 2 mm por lado (el fondo sigue por debajo) y el contenido queda
  // en la medida final.
  const bleedStyle = { width: `${width + BLEED * 2}mm`, height: `${height + BLEED * 2}mm`, borderWidth: `${BLEED}mm`, fontSize: `${width / 85}mm` };
  const singlePage = { width: width + (BLEED + MARKS) * 2, height: height + (BLEED + MARKS) * 2 };
  const gridStyle = (cols: number, cellWidth: number, gap: number) => ({ gridTemplateColumns: `repeat(${cols}, ${cellWidth}mm)`, gap: `${gap}mm` });
  const printOf = (id: string, patch: TagPrint): TagPrint => ({ name: settings.tagNames[id], character: settings.tagCharacters[id], color: settings.tagColors[id], ...patch });
  const setTagName = (id: string, name: string) => {
    update({ tagNames: { ...settings.tagNames, [id]: name.slice(0, 14) } });
    saveUnit(id, printOf(id, { name: name.slice(0, 14) }), 700);
  };
  const setTagCharacter = (id: string, character: string) => {
    const next = { ...settings.tagCharacters };
    if (!character) delete next[id];
    else next[id] = character as TagCharacterId;
    update({ tagCharacters: next });
    saveUnit(id, printOf(id, { character: next[id] }));
  };
  const setTagColor = (id: string, color: string) => {
    const next = { ...settings.tagColors };
    if (!color) delete next[id];
    else next[id] = color;
    update({ tagColors: next });
    saveUnit(id, printOf(id, { color: next[id] }));
  };
  // Lo automático sale del N° de unidad (no del orden en la lista): así no cambia cuando se
  // activa otra chapita del lote y se reimprime.
  const characterOf = (item: PrintItem) => settings.tagCharacters[item.id] || tagCharacterFor(settings.tagCharacter, item.number - 1);
  const colorOf = (item: PrintItem) => {
    const choice = settings.tagColors[item.id] || settings.qrColor;
    const mix = ["blue", "violet", "pink", "orange", "green"];
    return choice === "mix" ? mix[(item.number - 1) % mix.length] : choice;
  };
  const previewItem = items.find((item) => item.id === previewId) || items[0];
  const selectItem = (id: string) => setPreviewId(id);
  const selectItemFromKeyboard = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectItem(id);
    }
  };
  const resetTag = (id: string) => {
    const tagNames = { ...settings.tagNames }; delete tagNames[id];
    const tagCharacters = { ...settings.tagCharacters }; delete tagCharacters[id];
    const tagColors = { ...settings.tagColors }; delete tagColors[id];
    update({ tagNames, tagCharacters, tagColors });
    saveUnit(id, {});
  };
  const tagArtwork = (item: PrintItem, side: "front" | "back", suffix: string) => <div className={`ps-tag-ring${settings.cutLines ? " has-cut" : ""}`}>
    {side === "front"
      ? <TagFront id={`${item.id}-${suffix}-front`} diameter={qrSize} color={colorOf(item)} character={characterOf(item)} name={settings.tagNames[item.id] || ""} hole={settings.tagHole} />
      : <TagBack id={`${item.id}-${suffix}-back`} qr={item.tagQr} diameter={qrSize} color={colorOf(item)} design="classic" hole={settings.tagHole} />}
  </div>;
  const tagCell = (item: PrintItem, side: "front" | "back") => <button type="button" className={`ps-tag-cell ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} aria-label={`Seleccionar chapita con código ${item.code}`}>
    {tagArtwork(item, side, "sheet")}
    {settings.qrNumber && <span className="ps-tag-number">{unit(item.number)}</span>}
  </button>;

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
        <button type="button" role="tab" aria-selected={mode === "cards"} className={mode === "cards" ? "is-on" : ""} onClick={() => setMode("cards")}>Tarjetas de activación</button>
        <button type="button" role="tab" aria-selected={mode === "qr"} className={mode === "qr" ? "is-on" : ""} onClick={() => setMode("qr")}>Chapitas</button>
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
      </> : <>
      <fieldset className="ps-group"><legend>Impresión de chapitas</legend>
        <label>Tamaño (diámetro): <b>{qrSize} mm</b><input type="range" min={28} max={45} value={qrSize} onChange={(event) => update({ qrSize: Number(event.target.value) })} /></label>
        <span className="ps-colors-label">Formato de hoja</span>
        <div className="ps-output-options">
          <button type="button" className={settings.tagOutput === "pairs" ? "is-on" : ""} onClick={() => update({ tagOutput: "pairs", tagSides: "both", tagLayoutVersion: 2 })}><strong>Pares para armado</strong><small>Frente y dorso juntos, en orden normal · recomendado</small></button>
        </div>
        <details className="ps-print-advanced">
          <summary>Impresión doble faz (avanzado){settings.tagOutput === "duplex" ? " · activa" : ""}</summary>
          <p>Sólo si imprimís directamente sobre material doble faz. Los dorsos deben salir espejados para coincidir al dar vuelta la hoja.</p>
          <button type="button" className={settings.tagOutput === "duplex" ? "is-on" : ""} onClick={() => update({ tagOutput: "duplex", tagLayoutVersion: 2 })}>Usar hojas para doble faz</button>
          {settings.tagOutput === "duplex" && <div className="ps-tag-styles">
            <button type="button" className={settings.tagSides === "both" ? "is-on" : ""} onClick={() => update({ tagSides: "both" })}>Ambas caras</button>
            <button type="button" className={settings.tagSides === "front" ? "is-on" : ""} onClick={() => update({ tagSides: "front" })}>Sólo frente</button>
            <button type="button" className={settings.tagSides === "back" ? "is-on" : ""} onClick={() => update({ tagSides: "back" })}>Sólo dorso</button>
          </div>}
        </details>
        <label className="ps-check"><input type="checkbox" checked={settings.tagHole} onChange={(event) => update({ tagHole: event.target.checked })} />Con agujero (marca un puntito para perforar)</label>
        {settings.tagOutput === "duplex" && <label className="ps-check"><input type="checkbox" checked={settings.qrNumber} onChange={(event) => update({ qrNumber: event.target.checked })} />Mostrar el N° de unidad debajo de cada chapita</label>}
      </fieldset>

      <details className="ps-defaults">
        <summary>Diseño automático del lote</summary>
        <label>Animal
          <select value={settings.tagCharacter} onChange={(event) => update({ tagCharacter: event.target.value as TagCharacterChoice })}>
            <option value="mix">Mezcla de perros y gatos</option>
            {TAG_CHARACTERS.map((character) => <option key={character.id} value={character.id}>{character.label}</option>)}
          </select>
        </label>
        <span className="ps-colors-label">Colores</span>
        <div className="ps-colors">
          {TAG_COLORS.map((color) => <button key={color.id} type="button" className={settings.qrColor === color.id ? "is-on" : ""} onClick={() => update({ qrColor: color.id })} aria-label={color.label} title={color.label}><span style={{ background: color.value }} /></button>)}
          <label className={`ps-color-custom${settings.qrColor.startsWith("#") ? " is-on" : ""}`} title="Otro color">
            <span style={settings.qrColor.startsWith("#") ? { background: settings.qrColor } : undefined}>{settings.qrColor.startsWith("#") ? "" : "+"}</span>
            <input type="color" value={settings.qrColor.startsWith("#") ? settings.qrColor : "#3a7bd5"} onChange={(event) => update({ qrColor: event.target.value })} aria-label="Elegir otro color" />
          </label>
        </div>
      </details>

      <section className="ps-personalize" aria-label="Personalización por unidad">
        <div className="ps-personalize-head"><strong>Elegí una unidad</strong><small className={`ps-save is-${saveState}`}>{{ idle: "Después personalizá sólo esa. Se guarda sola.", saving: "Guardando…", saved: "✓ Guardado en la chapita", error: "⚠ No se pudo guardar. Revisá la conexión." }[saveState]}</small></div>
        <div className="ps-unit-picker">{items.map((item) => <button type="button" key={item.id} className={previewItem?.id === item.id ? "is-on" : ""} onClick={() => setPreviewId(item.id)}>
          <span style={{ background: TAG_COLORS.find((color) => color.id === colorOf(item))?.value || colorOf(item) }} />
          <b>{unitNumber(item.number)} · {item.code}</b><small>{settings.tagNames[item.id]?.trim() || "Stock"}</small>
        </button>)}</div>
        {previewItem && <div className="ps-unit-editor">
          <label>Nombre <small>Opcional · vacío para stock</small><input value={settings.tagNames[previewItem.id] || ""} maxLength={14} placeholder="Ej: Luna" onChange={(event) => setTagName(previewItem.id, event.target.value)} /></label>
          <span className="ps-editor-label">Animal</span>
          <div className="ps-character-grid">
            <button type="button" className={!settings.tagCharacters[previewItem.id] ? "is-on" : ""} onClick={() => setTagCharacter(previewItem.id, "")}><span>Auto</span></button>
            {TAG_CHARACTERS.map((character) => <button type="button" key={character.id} title={character.label} aria-label={character.label} className={settings.tagCharacters[previewItem.id] === character.id ? "is-on" : ""} onClick={() => setTagCharacter(previewItem.id, character.id)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas locales para impresión */}
              <img src={character.src} alt="" />
            </button>)}
          </div>
          <span className="ps-editor-label">Color</span>
          <div className="ps-colors ps-unit-colors">
            <button type="button" className={!settings.tagColors[previewItem.id] ? "is-on" : ""} onClick={() => setTagColor(previewItem.id, "")} title="Automático"><span className="is-auto">A</span></button>
            {TAG_COLORS.filter((color) => color.id !== "mix").map((color) => <button key={color.id} type="button" className={settings.tagColors[previewItem.id] === color.id ? "is-on" : ""} onClick={() => setTagColor(previewItem.id, color.id)} aria-label={color.label} title={color.label}><span style={{ background: color.value }} /></button>)}
          </div>
          <button type="button" className="ps-reset-unit" onClick={() => resetTag(previewItem.id)}>Restablecer esta unidad</button>
        </div>}
      </section>
      <small className="ps-muted">El dorso conserva siempre el diseño original y el QR público. El código privado va sólo en la tarjeta de activación.</small>
      </>}

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
        {mode === "qr" && settings.tagOutput === "pairs" && <span>Cada unidad sale como un par: <b>frente y dorso juntos</b> en la misma hoja, listos para cortar y emparejar.</span>}
        {mode === "qr" && settings.tagOutput === "duplex" && settings.tagSides === "both" && <span>Primero sale la hoja de frentes y después la de dorsos, ya <b>espejada por fila</b>. Imprimí doble faz girando por el lado largo.</span>}
        {mode === "qr" && <span>La hoja de chapitas no lleva códigos privados: cada par se empareja con su tarjeta por el <b>N° de unidad</b>. Al terminar de armar, controlá cada una con <b>Verificar armado</b>.</span>}
        {mode === "cards" && <span className="is-warn">Las tarjetas tienen los códigos para activar: no compartas el PDF por cualquier lado.</span>}
      </div>
    </aside>

    <main className={`ps-sheets${single ? " is-single" : ""}`}>
      {!items.length && <p className="ps-empty">Todas las chapitas de este lote ya están activadas: no hay nada para imprimir.</p>}
      {mode === "qr" && previewItem && <section className="ps-tag-overview" aria-label={`Vista del código ${previewItem.code}`}>
        <div className="ps-tag-overview-head"><div><small>VISTA PREVIA</small><h2>{unit(previewItem.number)} · {previewItem.code}</h2></div><span>{settings.tagNames[previewItem.id]?.trim() || "Sin nombre · stock"}</span></div>
        <div className="ps-tag-overview-pair">
          <figure><TagFront id={`preview-${previewItem.id}-front`} diameter={60} color={colorOf(previewItem)} character={characterOf(previewItem)} name={settings.tagNames[previewItem.id] || ""} hole={settings.tagHole} /><figcaption>Frente</figcaption></figure>
          <figure><TagBack id={`preview-${previewItem.id}-back`} qr={previewItem.tagQr} diameter={60} color={colorOf(previewItem)} design="classic" hole={settings.tagHole} /><figcaption>Dorso original</figcaption></figure>
        </div>
      </section>}
      {single ? items.flatMap((item) => [
        <section key={`${item.id}-f`} className={`ps-single ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} style={{ width: `${singlePage.width}mm`, height: `${singlePage.height}mm` }} aria-label={`Seleccionar tarjeta con código ${item.code}: frente`} role="button" tabIndex={0} onClick={() => selectItem(item.id)} onKeyDown={(event) => selectItemFromKeyboard(event, item.id)}>
          <CardFront design={settings.design} item={item} host={host} style={bleedStyle} bleed />
          <CropMarks width={width} height={height} />
        </section>,
        ...(settings.sides === "both" ? [<section key={`${item.id}-b`} className={`ps-single ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} style={{ width: `${singlePage.width}mm`, height: `${singlePage.height}mm` }} aria-label={`Seleccionar tarjeta con código ${item.code}: dorso`} role="button" tabIndex={0} onClick={() => selectItem(item.id)} onKeyDown={(event) => selectItemFromKeyboard(event, item.id)}>
          <CardBack design={settings.design} host={host} style={bleedStyle} bleed />
          <CropMarks width={width} height={height} />
        </section>] : []),
      ]) : mode === "cards" ? cardPages.map((page, pageIndex) => <div key={pageIndex} className="ps-pair">
        <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: frentes`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · frentes</span>
          <div className="ps-grid" style={gridStyle(cardCols, width, cardGap)}>
            {page.map((item) => <button type="button" key={item.id} className={`ps-cell ps-selectable${settings.cutLines ? " has-cut" : ""}${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} aria-label={`Seleccionar tarjeta con código ${item.code}`}><CardFront design={settings.design} item={item} host={host} style={cardStyle} /></button>)}
          </div>
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={cardPages.length} items={page} detail="Tarjetas · frentes" />
        </section>
        {settings.sides === "both" && <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: dorsos`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · dorsos (atrás de la anterior)</span>
          <div className="ps-grid" style={gridStyle(cardCols, width, cardGap)}>
            {/* Espejado por fila: el dorso de la columna 1 va en la última, y así. */}
            {Array.from({ length: Math.ceil(page.length / cardCols) * cardCols }, (_, cell) => {
              const row = Math.floor(cell / cardCols);
              const item = page[row * cardCols + (cardCols - 1 - (cell % cardCols))];
              return item
                ? <button type="button" key={cell} className={`ps-cell ps-selectable${settings.cutLines ? " has-cut" : ""}${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} aria-label={`Seleccionar dorso de la tarjeta con código ${item.code}`}><CardBack design={settings.design} host={host} style={cardStyle} /></button>
                : <div key={cell} className="ps-cell"><div style={cardStyle} /></div>;
            })}
          </div>
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={cardPages.length} items={page} detail="Tarjetas · dorsos" />
        </section>}
      </div>) : settings.tagOutput === "pairs" ? pairPages.map((page, pageIndex) => <section key={pageIndex} className="ps-page ps-pair-page" aria-label={`Hoja ${pageIndex + 1}: frentes y dorsos de chapitas`}>
        <span className="ps-page-label">Hoja {pageIndex + 1} · pares para armado</span>
        <div className="ps-grid ps-pair-grid" style={{ gridTemplateColumns: `repeat(${pairCols}, ${pairWidth}mm)`, gap: `${pairGap}mm` }}>
          {page.map((item) => <button type="button" key={item.id} className={`ps-print-pair ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} aria-label={`Seleccionar chapita con código ${item.code}`}>
            <div className="ps-print-pair-faces">
              {tagArtwork(item, "front", `pair-${pageIndex}`)}
              {tagArtwork(item, "back", `pair-${pageIndex}`)}
              <span className="ps-pair-code">{unit(item.number)}</span>
            </div>
          </button>)}
        </div>
        <SheetFoot batchName={batchName} page={pageIndex + 1} pages={pairPages.length} items={page} detail={`Chapitas Ø ${qrSize} mm`} />
      </section>) : qrPages.map((page, pageIndex) => <div key={pageIndex} className="ps-pair ps-tag-pages">
        {settings.tagSides !== "back" && <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: frentes de chapitas`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · frentes</span>
          <div className="ps-grid" style={gridStyle(qrCols, qrSize, qrGap)}>
            {page.map((item) => <div key={item.id}>{tagCell(item, "front")}</div>)}
          </div>
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={qrPages.length} items={page} detail={`Chapitas Ø ${qrSize} mm · frentes`} />
        </section>}
        {settings.tagSides !== "front" && <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: dorsos de chapitas`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · dorsos (atrás de la anterior)</span>
          <div className="ps-grid" style={gridStyle(qrCols, qrSize, qrGap)}>
            {Array.from({ length: Math.ceil(page.length / qrCols) * qrCols }, (_, cell) => {
              const row = Math.floor(cell / qrCols);
              const item = page[row * qrCols + (qrCols - 1 - (cell % qrCols))];
              return <div key={cell}>{item ? tagCell(item, "back") : <div style={{ width: `${qrSize}mm`, height: `${qrCell}mm` }} />}</div>;
            })}
          </div>
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={qrPages.length} items={page} detail={`Chapitas Ø ${qrSize} mm · dorsos`} />
        </section>}
      </div>)}
    </main>
  </div>;
}
