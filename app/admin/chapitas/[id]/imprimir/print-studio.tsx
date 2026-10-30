"use client";

// El estudio de impresión de un lote: a la izquierda las opciones, a la derecha las páginas tal
// como salen. Se imprime con el navegador ("Guardar como PDF" para llevar a la imprenta).
//  · Tarjetas: 5 diseños (card-designs.tsx), varios tamaños, frente y dorso, en dos formatos:
//     - Hoja A4 (o A3): varias por hoja, para imprimir en casa. Los dorsos van espejados en su hoja: al
//       imprimir doble faz (girando por el lado largo) cada dorso cae detrás de su frente.
//     - Una por página: cada cara en su página, con 2 mm de sangrado y marcas de corte. Es como
//       la piden las imprentas (ellas arman las planchas) y como se importa en Canva.
//  · QR de las chapitas: el tamaño en mm se elige según la chapita.
// Las opciones generales quedan guardadas en esta compu; lo de cada unidad (nombre, animal y color)
// se guarda en la chapita misma (actions.ts), así no se pierde ni lo pisa otra pestaña.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { LuPrinter } from "react-icons/lu";
import { tagCutContourSvg } from "@/lib/pet-tags";
import { CardBack, CardFront, DESIGN_ANIMAL, DESIGNS, FLAP_LIMITS, FLAP_WIDTH, DESIGN_GROUPS, autoCardDesign, designClash, designLabel, designSays, isFlapCard, unit, unitNumber, type CardAnimal, type CardLayout, type DesignId } from "./card-designs";
import { cleanTagPrint, isCat, isGenericCharacterId, TagBack, TagFront, isLightTagColor, TAG_CATS, TAG_CHARACTERS, TAG_COLORS, TAG_CUSTOM, TAG_DOGS, tagCharacterFor, type TagCharacterChoice, type TagCharacterId, type TagFrontStyle, type TagPrint, type VectorQr } from "./tag-face";
import { saveTagPrint } from "./actions";
import CharacterPicker from "./character-picker";

export type PrintItem = { id: string; number: number; code: string; activationQr: string; tagQr: VectorQr; print: TagPrint };
type Mode = "cards" | "qr";
type Settings = {
  design: DesignId;
  cardLayout: CardLayout;
  flapWidth: number;
  flapHeight: number;
  flapFresh: boolean;
  size: string;
  width: number;
  height: number;
  sides: "both" | "front";
  output: "sheet" | "single";
  cutLines: boolean;
  tagCutGuides: boolean;
  qrSize: number;
  qrColor: string;
  tagSides: "both" | "front" | "back";
  tagOutput: "pairs" | "duplex";
  tagLayoutVersion: number;
  tagCharacter: TagCharacterChoice;
  tagNames: Record<string, string>;
  tagCharacters: Record<string, TagCharacterId>;
  tagColors: Record<string, string>;
  tagCards: Record<string, DesignId>;
  cardMatch: boolean;
  tagHole: boolean;
  tagLayout: "v1" | "v2" | "v3" | "v4";
  tagFront: TagFrontStyle;
  paper: Paper;
};

const SIZES = [
  { id: "85x55", label: "Tarjeta personal · 85×55 mm", width: 85, height: 55 },
  { id: "90x50", label: "Tarjeta angosta · 90×50 mm", width: 90, height: 50 },
  { id: "100x70", label: "Grande · 100×70 mm", width: 100, height: 70 },
  { id: "custom", label: "Otra medida", width: 85, height: 55 },
];
const DEFAULTS: Settings = { design: "playful", cardLayout: "flap-a", flapWidth: 85, flapHeight: 55, flapFresh: false, size: "85x55", width: 85, height: 55, sides: "front", output: "single", cutLines: true, tagCutGuides: true, qrSize: 30, qrColor: "mix", tagSides: "both", tagOutput: "pairs", tagLayoutVersion: 2, tagCharacter: "mix", tagNames: {}, tagCharacters: {}, tagColors: {}, tagCards: {}, cardMatch: true, tagHole: false, paper: "A4", tagLayout: "v3", tagFront: "classic" };
const STORAGE_KEY = "bionfc-print-settings";
// Lo de cada unidad no va al navegador: viene de la base (PrintItem.print).
const UNIT_KEYS = ["tagNames", "tagCharacters", "tagColors", "tagCards"];
const prefsOf = (value: Settings) => Object.fromEntries(Object.entries(value).filter(([key]) => !UNIT_KEYS.includes(key)));
const savePrefs = (value: Settings) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsOf(value))); } catch {} };
const unitsOf = (entries: { id: string; print: TagPrint }[]) => ({
  tagNames: Object.fromEntries(entries.filter((entry) => entry.print.name).map((entry) => [entry.id, entry.print.name!])),
  tagCharacters: Object.fromEntries(entries.filter((entry) => entry.print.character).map((entry) => [entry.id, entry.print.character!])) as Record<string, TagCharacterId>,
  tagColors: Object.fromEntries(entries.filter((entry) => entry.print.color).map((entry) => [entry.id, entry.print.color!])),
  tagCards: Object.fromEntries(entries.filter((entry) => entry.print.card).map((entry) => [entry.id, entry.print.card!])) as Record<string, DesignId>,
});
// Hoja A4 (o A3, para imprenta o impresora grande) con 7 mm de margen (casi todas las impresoras
// dejan ~5 mm sin imprimir): así en A4 entran
// 10 tarjetas personales por hoja, como en las planchas de imprenta.
const PAPERS = { A4: { width: 210, height: 297 }, A3: { width: 297, height: 420 } } as const;
type Paper = keyof typeof PAPERS;
const PAGE_MARGIN = 7;
// Los cuatro diseños de la chapita (cambia el dorso; el frente es el mismo). Cada uno con su color,
// para que se note a simple vista cuál está elegido.
const LAYOUTS = [
  { value: "v3", label: "Diseño 1", hint: "NFC a la izquierda + QR más grande · recomendado" },
  { value: "v1", label: "Diseño 2", hint: "QR con el texto al lado" },
  { value: "v2", label: "Diseño 3", hint: "QR + dibujo del celu" },
  { value: "v4", label: "Diseño 4", hint: "QR izquierdo + textos alineados" },
] as const;
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
function SheetFoot({ batchName, page, pages, detail }: { batchName: string; page: number; pages: number; detail: string }) {
  return <footer className="ps-sheet-foot">
    <span>{[batchName, `Hoja ${page}/${pages}`, detail].filter(Boolean).join(" · ")}</span>
    <span className="ps-ruler"><i />Esta línea mide 50 mm</span>
  </footer>;
}

export default function PrintStudio({ batchId, batchName, items, host, isLocal = false, initialMode }: { batchId: string; batchName: string; items: PrintItem[]; host: string; isLocal?: boolean; initialMode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULTS, ...unitsOf(items) }));
  const [previewId, setPreviewId] = useState(items[0]?.id || "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editorNotice, setEditorNotice] = useState<{ id: string; message: string } | null>(null);
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
        if (!["classic", "flap-a", "flap-b"].includes(next.cardLayout)) next.cardLayout = DEFAULTS.cardLayout;
        if (!LAYOUTS.some((layout) => layout.value === next.tagLayout)) next.tagLayout = DEFAULTS.tagLayout;
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

  // Diseño 2: la tarjeta con solapa (la actual o sus variantes A y B, más anchas).
  const secureCard = settings.cardLayout !== "classic";
  // La solapa suma 25 mm: abierta mide 110×55 y al plegarla vuelve al formato 85×55.
  // Con solapa: el tamaño de la tarjeta cerrada se elige dentro de FLAP_LIMITS; abierta suma la solapa.
  const flapClosed = { width: clamp(settings.flapWidth, ...FLAP_LIMITS.width), height: clamp(settings.flapHeight, ...FLAP_LIMITS.height) };
  const width = secureCard ? flapClosed.width + FLAP_WIDTH : clamp(settings.width, 40, 190);
  const height = secureCard ? flapClosed.height : clamp(settings.height, 30, 270);
  // La chapita entera (el círculo), en mm. El QR vectorial de 25×25 módulos permite llegar a
  // 26 mm; por debajo los módulos quedan demasiado chicos para impresión doméstica confiable.
  const qrSize = clamp(settings.qrSize, 26, 45);
  const single = mode === "cards" && settings.output === "single";
  const paper: Paper = settings.paper in PAPERS ? settings.paper : "A4";
  const layoutLabel = LAYOUTS.find((layout) => layout.value === settings.tagLayout)?.label || LAYOUTS[0].label;
  // Las pruebas se pueden elegir únicamente en localhost. Aunque quedara una preferencia vieja,
  // una pantalla no local vuelve al frente nuevo estable.
  const frontStyle: TagFrontStyle = isLocal || settings.tagFront === "classic" || settings.tagFront === "brand" ? settings.tagFront : "brand";
  const PAGE = { ...PAPERS[paper], margin: PAGE_MARGIN };

  // Cuántas entran por hoja.
  const cardGap = 2;
  const cardCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + cardGap) / (width + cardGap)));
  const cardRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + cardGap) / (height + cardGap)));
  const perCardPage = cardCols * cardRows;
  // Bien juntas para no gastar hojas (2 mm entre una y otra para cortar).
  const qrGap = 2;
  const qrCell = qrSize;
  const qrCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + qrGap) / (qrSize + qrGap)));
  const qrRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + qrGap) / (qrCell + qrGap)));
  const perQrPage = qrCols * qrRows;
  // Formato recomendado: cada frente queda al lado de su dorso en la misma hoja.
  const pairInnerGap = 3;
  const pairGap = 3;
  const pairWidth = qrSize * 2 + pairInnerGap;
  const pairCols = Math.max(1, Math.floor((PAGE.width - PAGE.margin * 2 + pairGap) / (pairWidth + pairGap)));
  const pairRows = Math.max(1, Math.floor((PAGE.height - PAGE.margin * 2 + pairGap) / (qrSize + pairGap)));
  const perPairPage = pairCols * pairRows;

  const chunks = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, index * size + size));
  const cardPages = chunks(items, perCardPage);
  const qrPages = chunks(items, perQrPage);
  const pairPages = chunks(items, perPairPage);
  const cardBoth = !secureCard && settings.sides === "both";
  const faces = cardBoth ? 2 : 1;
  const tagFaces = settings.tagSides === "both" ? 2 : 1;
  const pageCount = mode === "qr"
    ? settings.tagSides === "both" && settings.tagOutput === "pairs" ? pairPages.length : qrPages.length * tagFaces
    : single ? items.length * faces : cardPages.length * faces;

  const cardScale = secureCard ? 1 : width / 85;
  const cardStyle = { width: `${width}mm`, height: `${height}mm`, fontSize: `${cardScale}mm` };
  // Con sangrado la tarjeta crece 2 mm por lado (el fondo sigue por debajo) y el contenido queda
  // en la medida final.
  const bleedStyle = { width: `${width + BLEED * 2}mm`, height: `${height + BLEED * 2}mm`, borderWidth: `${BLEED}mm`, fontSize: `${cardScale}mm` };
  const singlePage = { width: width + (BLEED + MARKS) * 2, height: height + (BLEED + MARKS) * 2 };
  const gridStyle = (cols: number, cellWidth: number, gap: number) => ({ gridTemplateColumns: `repeat(${cols}, ${cellWidth}mm)`, gap: `${gap}mm` });
  const printOf = (id: string, patch: TagPrint): TagPrint => ({ name: settings.tagNames[id], character: settings.tagCharacters[id], color: settings.tagColors[id], card: settings.tagCards[id], ...patch });
  const tagBackDesign = (layout: Settings["tagLayout"]) => layout === "v2" ? "v2" : layout === "v3" ? "v3" : layout === "v4" ? "v4" : "classic";
  const setTagName = (id: string, name: string) => {
    const cleanName = name.slice(0, 14);
    const tagNames = { ...settings.tagNames, [id]: cleanName };
    if (cleanName.trim() && isGenericCharacterId(settings.tagCharacters[id] || "")) {
      const tagCharacters = { ...settings.tagCharacters };
      delete tagCharacters[id];
      update({ tagNames, tagCharacters });
      saveUnit(id, printOf(id, { name: cleanName, character: undefined }), 700);
      setEditorNotice({ id, message: "Agregaste un nombre: cambiamos el diseño genérico por uno compatible." });
      return;
    }
    setEditorNotice(null);
    update({ tagNames });
    saveUnit(id, printOf(id, { name: cleanName }), 700);
  };
  const setTagCharacter = (id: string, character: string) => {
    const next = { ...settings.tagCharacters };
    if (!character) delete next[id];
    else next[id] = character as TagCharacterId;
    update({ tagCharacters: next });
    saveUnit(id, printOf(id, { character: next[id] }));
    setEditorNotice(null);
  };
  const setGenericCharacter = (id: string, character: TagCharacterId) => {
    const previousName = settings.tagNames[id]?.trim();
    const tagNames = { ...settings.tagNames }; delete tagNames[id];
    const tagCharacters = { ...settings.tagCharacters, [id]: character };
    update({ tagNames, tagCharacters });
    saveUnit(id, { character, color: settings.tagColors[id], card: settings.tagCards[id] });
    setEditorNotice({ id, message: previousName ? `Quitamos “${previousName}” y aplicamos el diseño genérico.` : "Diseño genérico aplicado." });
  };
  // delay: el selector de color libre manda un cambio por cada movimiento; se guarda al soltar.
  const setTagColor = (id: string, color: string, delay = 0) => {
    const next = { ...settings.tagColors };
    if (!color) delete next[id];
    else next[id] = color;
    update({ tagColors: next });
    saveUnit(id, printOf(id, { color: next[id] }), delay);
  };
  // Lo automático sale del N° de unidad (no del orden en la lista): así no cambia cuando se
  // activa otra chapita del lote y se reimprime.
  const characterOf = (item: PrintItem) => {
    const chosen = settings.tagCharacters[item.id];
    return chosen && (!settings.tagNames[item.id]?.trim() || !isGenericCharacterId(chosen))
      ? chosen
      : tagCharacterFor(settings.tagCharacter, item.number - 1);
  };
  const colorOf = (item: PrintItem) => {
    const choice = settings.tagColors[item.id] || settings.qrColor;
    const mix = ["blue", "violet", "pink", "orange", "green"];
    return choice === "mix" ? mix[(item.number - 1) % mix.length] : choice;
  };
  // El estilo de la tarjeta de cada unidad: el fijado a mano o el automático según su animal.
  const animalOf = (item: PrintItem): CardAnimal => {
    const id = characterOf(item);
    if (isCat(id)) return "cat";
    const character = TAG_CHARACTERS.find((entry) => entry.id === id) as { generic?: unknown } | undefined;
    return character?.generic === "symbol" ? "other" : "dog";
  };
  const autoCardOf = (item: PrintItem) => autoCardDesign(settings.design, animalOf(item), settings.cardMatch);
  const cardDesignOf = (item: PrintItem) => settings.tagCards[item.id] || autoCardOf(item);
  const setTagCard = (id: string, card: DesignId | "") => {
    const next = { ...settings.tagCards };
    if (!card) delete next[id];
    else next[id] = card;
    update({ tagCards: next });
    saveUnit(id, printOf(id, { card: next[id] }));
  };
  // Un estilo de otro animal ("¡Miau!" para un perro): se puede, pero su botoncito queda en naranja.
  const clashOf = (item: PrintItem, card: DesignId) => designClash(card, animalOf(item));
  // Elegir el mismo estilo que le da la regla es volver a la regla: "estilo propio" es sólo el distinto.
  // Si el estilo es del otro animal ("¡Miau!" para un perro), pregunta antes.
  const chooseCard = (item: PrintItem, card: DesignId) => {
    const apply = () => setTagCard(item.id, card === autoCardOf(item) ? "" : card);
    if (!clashOf(item, card)) return apply();
    const cat = animalOf(item) === "cat";
    setAsk({
      title: `Esta chapita es de ${cat ? "gato 🐱" : "perro 🐶"}`,
      text: `${designLabel(card)} es de ${cat ? "perritos" : "gatitos"}${designSays(card)}. ¿La querés igual para esta tarjeta?`,
      cancel: "Mejor no",
      actions: [{ label: `Sí, usar ${designLabel(card)}`, run: apply, main: true }],
    });
  };
  // El botoncito de estilo de cada tarjeta: uno abierto a la vez; se cierra tocando afuera o con Esc.
  const [stylePicker, setStylePicker] = useState<string | null>(null);
  // Confirmación (modal) y aviso de lo que cambió.
  const [ask, setAsk] = useState<{ title: string; text: string; cancel?: string; actions: { label: string; run: () => void; main?: boolean }[] } | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!stylePicker && !ask) return;
    const closeAll = () => { setStylePicker(null); setAsk(null); };
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") closeAll(); };
    const onClick = () => setStylePicker(null);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("click", onClick); };
  }, [stylePicker, ask]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const flashCards = (ids: string[]) => requestAnimationFrame(() => {
    for (const id of ids) document.querySelectorAll<HTMLElement>(`[data-card="${id}"]`).forEach((element) => {
      element.classList.remove("is-flash"); void element.offsetWidth; element.classList.add("is-flash");
    });
  });
  // El estilo de la barra lateral cambia TODAS las tarjetas (también las elegidas a mano). Si no
  // coincide con el animal de algunas chapitas (gatos con "¡Guau!" o perros con "¡Miau!"), antes
  // pregunta qué hacer con esas. Avisa cómo quedó y hace brillar las tarjetas.
  const ownCards = items.filter((item) => settings.tagCards[item.id]);
  const applyStyle = (design: DesignId, match: boolean) => {
    update({ design, cardMatch: match, tagCards: {} });
    for (const item of ownCards) saveUnit(item.id, printOf(item.id, { card: undefined }));
    const result = DESIGNS.map((entry) => [entry.label, items.filter((item) => autoCardDesign(design, animalOf(item), match) === entry.id).length] as const).filter(([, count]) => count);
    setToast(`Listo, cambiaron todas: ${result.map(([label, count]) => `${count} ${label}`).join(" · ")}.`);
    flashCards(items.map((item) => item.id));
  };
  const pickStyle = (design: DesignId) => {
    const clashing = items.filter((item) => designClash(design, animalOf(item)));
    if (!clashing.length) return applyStyle(design, settings.cardMatch);
    const cats = DESIGN_ANIMAL[design] === "dog";
    const other: DesignId = cats ? "kitty" : "paws";
    const count = clashing.length;
    setAsk({
      title: `Hay ${count === 1 ? `1 chapita de ${cats ? "gato 🐱" : "perro 🐶"}` : `${count} chapitas de ${cats ? "gato 🐱" : "perro 🐶"}`}`,
      text: `${designLabel(design)} es de ${cats ? "perritos" : "gatitos"}${designSays(design)}. ¿Qué hacemos con ${count === 1 ? "esa tarjeta" : "esas tarjetas"}?`,
      actions: [
        { label: `${designLabel(design)} en todas`, run: () => applyStyle(design, false) },
        { label: `${cats ? "Gatitos" : "Perritos"} con ${designLabel(other)}`, run: () => applyStyle(design, true), main: true },
      ],
    });
  };
  // Para la nota de la barra lateral: cuántas tarjetas cambia la regla del animal.
  const matched = settings.cardMatch ? items.filter((item) => !settings.tagCards[item.id] && designClash(settings.design, animalOf(item))) : [];
  const styleCount = DESIGNS.map((design) => [design.label, items.filter((item) => cardDesignOf(item) === design.id).length] as const).filter(([, count]) => count);
  // "Ver su chapita" / "Ver su tarjeta" sobre cada unidad (en la elegida y al pasar el mouse).
  const partnerButton = (item: PrintItem) => <button type="button" className="ps-tool-partner" onClick={(event) => { event.stopPropagation(); selectItem(item.id); showPartner(); }}>
    {mode === "qr" ? "Ver su tarjeta" : "Ver su chapita"} <i aria-hidden="true">→</i>
  </button>;
  const styleChip = (item: PrintItem) => {
    const own = settings.tagCards[item.id];
    const current = cardDesignOf(item);
    const clash = clashOf(item, current);
    const open = stylePicker === item.id;
    return <div className={`ps-style${open ? " is-open" : ""}${own ? " is-own" : ""}`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <div className="ps-style-row">
        <button type="button" className={`ps-style-chip${own ? ` is-${own}` : ""}${clash ? " is-clash" : ""}`} aria-expanded={open} aria-label={`Estilo de esta tarjeta: ${designLabel(current)}. Cambiar`} onClick={() => { selectItem(item.id); setStylePicker(open ? null : item.id); }}>
          {clash ? <b aria-hidden="true">!</b> : <span aria-hidden="true">🎨</span>}{designLabel(current)}<i aria-hidden="true">▾</i>
        </button>
        {partnerButton(item)}
      </div>
      {open && <div className="ps-style-menu">
        {clash && <p className="ps-style-warn">Esta chapita es de {animalOf(item) === "cat" ? "gato" : "perro"}.</p>}
        {DESIGN_GROUPS.map(([title, ids]) => <div key={title}><small>{title}</small>{ids.map((id) => <button key={id} type="button" className={current === id ? "is-on" : ""} onClick={() => { chooseCard(item, id); setStylePicker(null); }}><span className={`ps-style-dot is-${id}`} />{designLabel(id)}{current === id && <em>✓</em>}</button>)}</div>)}
        {own && <button type="button" className="ps-style-reset" onClick={() => { setTagCard(item.id, ""); setStylePicker(null); }}>↺ Como las demás <span>({designLabel(autoCardOf(item))})</span></button>}
      </div>}
    </div>;
  };
  const previewItem = items.find((item) => item.id === previewId) || items[0];
  const selectItem = (id: string) => setPreviewId(id);
  // "Ver su tarjeta" / "Ver su chapita": la unidad elegida es la misma en las dos pestañas; se
  // cambia de pestaña y, ya dibujada, se lleva a la vista y brilla un momento.
  const [jump, setJump] = useState(0);
  const showPartner = () => { setMode(mode === "qr" ? "cards" : "qr"); setJump((count) => count + 1); };
  useEffect(() => {
    if (!jump) return;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(".ps-sheets .ps-page .is-selected, .ps-sheets .ps-single.is-selected");
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.remove("is-flash"); void target.offsetWidth; target.classList.add("is-flash");
    });
    return () => cancelAnimationFrame(frame);
  }, [jump]);
  const stepUnit = (step: number) => {
    const index = previewItem ? items.indexOf(previewItem) : 0;
    const next = items[(index + step + items.length) % items.length];
    if (!next) return;
    selectItem(next.id);
    setJump((count) => count + 1);
  };
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
    saveUnit(id, settings.tagCards[id] ? { card: settings.tagCards[id] } : {});
    setEditorNotice(null);
  };
  const downloadSvg = (svg: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const downloadQrSvg = (item: PrintItem) => {
    const margin = 4;
    const total = item.tagQr.modules + margin * 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#fff"/><path d="${item.tagQr.path}" transform="translate(${margin} ${margin})" fill="#1d1410"/></svg>`;
    downloadSvg(svg, `chapita-${unitNumber(item.number)}-qr.svg`);
  };
  const downloadCutContourSvg = () => {
    downloadSvg(tagCutContourSvg(qrSize), `corte-chapita-${qrSize}mm.svg`);
  };
  const tagArtwork = (item: PrintItem, side: "front" | "back", suffix: string) => <div className="ps-tag-ring">
    {side === "front"
      ? <TagFront design={frontStyle} id={`${item.id}-${suffix}-front`} diameter={qrSize} color={colorOf(item)} character={characterOf(item)} name={settings.tagNames[item.id] || ""} hole={settings.tagHole} />
      : <TagBack id={`${item.id}-${suffix}-back`} qr={item.tagQr} diameter={qrSize} color={colorOf(item)} design={tagBackDesign(settings.tagLayout)} hole={settings.tagHole} />}
    {settings.tagCutGuides && <svg className="ps-cut-contour" viewBox="0 0 100 100" width={`${qrSize}mm`} height={`${qrSize}mm`} overflow="visible" aria-hidden="true">
      <g id={`CUT_CONTOUR-${item.id}-${suffix}-${side}`} fill="none" stroke="#ff00ff" strokeWidth=".01mm">
        <circle cx="50" cy="50" r="50" />
      </g>
    </svg>}
  </div>;
  // Divs (no botones) porque adentro va el botón "Ver su tarjeta".
  const tagCell = (item: PrintItem, side: "front" | "back") => <div role="button" tabIndex={0} data-card={item.id} className={`ps-tag-cell ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} onKeyDown={(event) => selectItemFromKeyboard(event, item.id)} aria-label={`Seleccionar chapita con código ${item.code}`}>
    <span className="ps-tools">{partnerButton(item)}</span>
    {tagArtwork(item, side, "sheet")}
  </div>;

  return <div className={`ps is-${paper.toLowerCase()}`} style={{ "--page-w": `${PAGE.width}mm`, "--page-h": `${PAGE.height}mm` } as CSSProperties}>
    {/* eslint-disable-next-line @next/next/no-page-custom-font -- solo para esta hoja de impresión */}
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Poppins:wght@600;700;800&display=swap" />
    {/* El tamaño de página depende del formato elegido. */}
    <style>{`@media print { @page { size: ${single ? `${singlePage.width}mm ${singlePage.height}mm` : paper}; margin: 0; } }`}</style>
    <aside className="ps-panel">
      <Link className="ps-back" href={`/admin/chapitas/${batchId}`}>← Volver al lote</Link>
      <h1>{batchName}</h1>
      <p className="ps-muted">{items.length} {items.length === 1 ? "chapita sin activar" : "chapitas sin activar"} · {pageCount} {pageCount === 1 ? "página" : "páginas"}</p>

      {isLocal && <p className="ps-local">Estás en desarrollo: estos QR y códigos apuntan a tu computadora ({host}). Para chapitas reales, imprimí desde el Admin de bionfc.com.</p>}

      {/* En el orden del trabajo: primero las chapitas (cada tarjeta sigue al animal de la suya) y después las tarjetas. */}
      <div className="ps-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === "qr"} className={mode === "qr" ? "is-on" : ""} onClick={() => setMode("qr")}><b>1</b>Chapitas</button>
        <button type="button" role="tab" aria-selected={mode === "cards"} className={mode === "cards" ? "is-on" : ""} onClick={() => setMode("cards")}><b>2</b>Tarjetas</button>
      </div>

      {mode === "cards" ? <>
        <p className="ps-flow-note">🐾 Cada tarjeta sigue al animal de su chapita: si cambiás una chapita, su tarjeta se actualiza sola. <b>Imprimí las tarjetas cuando las chapitas estén listas.</b></p>
        <div className="ps-stage-title"><span>1</span><div><strong>Diseño de tarjetas</strong><small>Elegí formato, estilo y tamaño.</small></div></div>
        <fieldset className="ps-group"><legend>Formato de tarjeta</legend>
          <div className="ps-card-formats">
            <button type="button" className={settings.cardLayout === "classic" ? "is-on" : ""} onClick={() => update({ cardLayout: "classic" })}><span className="ps-card-format-preview is-classic"><i /></span><strong>Diseño 1</strong><small>Clásica · QR visible · medida configurable</small></button>
            <button type="button" className={secureCard ? "is-on" : ""} onClick={() => update({ cardLayout: secureCard ? settings.cardLayout : "flap-a", sides: "front" })}><span className="ps-card-format-preview is-secure"><i /><b /></span><strong>Diseño 2</strong><small>Una sola faz · solapa privada · recomendado</small></button>
          </div>
          {secureCard && <div className="ps-tag-styles ps-flap-variants">
            {([["flap-a", "A · Tapa limpia"], ["flap-b", "B · Pasos a la vista"]] as const).map(([value, label]) => <button key={value} type="button" className={settings.cardLayout === value ? "is-on" : ""} onClick={() => update({ cardLayout: value, sides: "front" })}>{label}</button>)}
          </div>}
          {secureCard && <div className="ps-tag-styles ps-flap-variants">
            {([[false, "Aspecto original"], [true, "Aspecto nuevo ✨"]] as const).map(([value, label]) => <button key={label} type="button" className={settings.flapFresh === value ? "is-on" : ""} onClick={() => update({ flapFresh: value })}>{label}</button>)}
          </div>}
          {isFlapCard(settings.cardLayout) && <p className="ps-fold-note"><b>Armado:</b> doblá la solapa hacia adelante por la línea punteada (tapa el QR) y cerrala con un <b>calco redondo de ~16 mm</b> sobre su borde, mitad sobre la tapa. En pantalla te marco dónde va; no se imprime.</p>}
        </fieldset>
        <fieldset className="ps-group"><legend>Estilo de las tarjetas</legend>
          {DESIGN_GROUPS.map(([title, ids]) => <div key={title} className="ps-design-group"><small>{title}</small><div className="ps-designs">{DESIGNS.filter((design) => ids.includes(design.id)).map((design) => <button key={design.id} type="button" className={settings.design === design.id ? "is-on" : ""} onClick={() => pickStyle(design.id)}>
            <span className="ps-swatch" style={{ background: design.swatch }} /><strong>{design.label}</strong><small>{design.hint}</small>
          </button>)}</div></div>)}
          {!!matched.length && <p className="ps-muted ps-style-note">{DESIGN_ANIMAL[settings.design] === "dog" ? `🐱 ${matched.length === 1 ? "El gatito va" : `Los ${matched.length} gatitos van`} con Michi.` : `🐶 ${matched.length === 1 ? "El perrito va" : `Los ${matched.length} perritos van`} con Patitas.`}</p>}
          <p className="ps-muted ps-style-note">Cambia todas las tarjetas. Para cambiar una sola, usá su botoncito 🎨 en la hoja.</p>
          {!!styleCount.length && <p className="ps-style-count">En este lote: {styleCount.map(([label, count]) => `${count} ${label}`).join(" · ")}</p>}
        </fieldset>
        <fieldset className="ps-group"><legend>Tamaño</legend>
          {secureCard ? <>
            <div className="ps-row">
              <label>Ancho cerrada (mm)<input type="number" min={FLAP_LIMITS.width[0]} max={FLAP_LIMITS.width[1]} value={settings.flapWidth} onChange={(event) => update({ flapWidth: Number(event.target.value) })} /></label>
              <label>Alto (mm)<input type="number" min={FLAP_LIMITS.height[0]} max={FLAP_LIMITS.height[1]} value={settings.flapHeight} onChange={(event) => update({ flapHeight: Number(event.target.value) })} /></label>
            </div>
            <small className="ps-muted">Cerrada {flapClosed.width}×{flapClosed.height} mm · abierta {width}×{height} mm (la solapa del QR suma {FLAP_WIDTH} mm). Ancho de {FLAP_LIMITS.width[0]} a {FLAP_LIMITS.width[1]} y alto de {FLAP_LIMITS.height[0]} a {FLAP_LIMITS.height[1]}.</small>
          </> : <><select value={settings.size} onChange={(event) => { const size = SIZES.find((item) => item.id === event.target.value)!; update(size.id === "custom" ? { size: size.id } : { size: size.id, width: size.width, height: size.height }); }}>
            {SIZES.map((size) => <option key={size.id} value={size.id}>{size.label}</option>)}
          </select>
          {settings.size === "custom" && <div className="ps-row">
            <label>Ancho (mm)<input type="number" min={40} max={190} value={settings.width} onChange={(event) => update({ width: Number(event.target.value) })} /></label>
            <label>Alto (mm)<input type="number" min={30} max={270} value={settings.height} onChange={(event) => update({ height: Number(event.target.value) })} /></label>
          </div>}</>}
        </fieldset>
        <fieldset className="ps-group"><legend>Caras</legend>
          {secureCard ? <div className="ps-fixed-size"><strong>Una sola faz</strong><small>Las instrucciones, el QR y el código salen juntos en la misma cara.</small></div> : <><label className="ps-check"><input type="radio" checked={settings.sides === "both"} onChange={() => update({ sides: "both" })} />Frente y dorso</label><label className="ps-check"><input type="radio" checked={settings.sides === "front"} onChange={() => update({ sides: "front" })} />Solo frente (el dorso lo hago en Canva)</label></>}
        </fieldset>
        <fieldset className="ps-group"><legend>Formato</legend>
          <label className="ps-check"><input type="radio" checked={settings.output === "single"} onChange={() => update({ output: "single" })} />Una por página, con sangrado (imprenta o Canva)</label>
          <label className="ps-check"><input type="radio" checked={settings.output === "sheet"} onChange={() => update({ output: "sheet" })} />Hoja {paper}, {perCardPage} por hoja (imprimir en casa)</label>
        </fieldset>
      </> : <>
      <div className="ps-stage-title"><span>1</span><div><strong>Diseño general</strong><small>Definí cómo se imprimen todas las chapitas.</small></div></div>
      <section className="ps-layouts" aria-label="Diseño de la chapita">
        <span className="ps-layouts-title">Diseño de la chapita</span>
        <div>{LAYOUTS.map((layout, index) => {
          const on = settings.tagLayout === layout.value;
          return <button key={layout.value} type="button" className={`ps-layout is-${layout.value}${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => update({ tagLayout: layout.value })}>
            {on && <em>✓ Elegido</em>}
            {previewItem && <span className="ps-layout-faces" aria-hidden="true">
              <TagFront design={frontStyle} id={`layout-${layout.value}-${previewItem.id}-front`} diameter={14} color={colorOf(previewItem)} character={characterOf(previewItem)} name={settings.tagNames[previewItem.id] || ""} />
              <TagBack id={`layout-${layout.value}-${previewItem.id}-back`} qr={previewItem.tagQr} diameter={14} color={colorOf(previewItem)} design={tagBackDesign(layout.value)} />
            </span>}
            <strong><b>{index + 1}</b>{layout.label}</strong>
            <small>{layout.hint}</small>
          </button>;
        })}</div>
      </section>
      {/* El frente: el actual o el nuevo (sin "ACERCÁ TU CELU", con el logo en pastilla). */}
      <section className="ps-front-pick" aria-label="Frente de la chapita">
        <span className="ps-layouts-title">Frente</span>
        <div className="ps-tag-styles">{([
          ["classic", "Actual"], ["brand", "Nuevo ✨"],
          ...(isLocal ? [["test1", "PRUEBA1"], ["test2", "PRUEBA2"], ["test3", "PRUEBA3"], ["test4", "PRUEBA4"], ["test5", "PRUEBA5"]] : []),
        ] as [TagFrontStyle, string][]).map(([value, label]) => <button key={value} type="button" className={frontStyle === value ? "is-on" : ""} onClick={() => update({ tagFront: value })}>{label}</button>)}</div>
      </section>
      <fieldset className="ps-group"><legend>Impresión de chapitas</legend>
        <label>Tamaño (diámetro): <b>{qrSize} mm</b><input type="range" min={26} max={45} value={qrSize} onChange={(event) => update({ qrSize: Number(event.target.value) })} /></label>
        {qrSize < 30 && <small className="ps-compact-note">Modo compacto: el contenido se mete dentro del margen de corte y el QR usa 25×25 módulos. No recomendamos bajar de 26 mm.</small>}
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
      </fieldset>

      <details className="ps-defaults">
        <summary>Diseño automático del lote</summary>
        <label>Animal
          <select value={settings.tagCharacter} onChange={(event) => update({ tagCharacter: event.target.value as TagCharacterChoice })}>
            <optgroup label="Mezcla">
              <option value="mix">Perros y gatos</option>
              <option value="mix-dogs">Sólo perros</option>
              <option value="mix-cats">Sólo gatos</option>
            </optgroup>
            <optgroup label="Todas iguales · perro">{TAG_DOGS.map((character) => <option key={character.id} value={character.id}>{character.label}</option>)}</optgroup>
            <optgroup label="Todas iguales · gato">{TAG_CATS.map((character) => <option key={character.id} value={character.id}>{character.label}</option>)}</optgroup>
            {!!TAG_CUSTOM.length && <optgroup label="Todas iguales · personalizado">{TAG_CUSTOM.map((character) => <option key={character.id} value={character.id}>{character.label}</option>)}</optgroup>}
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

      <div className="ps-stage-title"><span>2</span><div><strong>Personalizar unidades</strong><small>Elegí una chapita y ajustala sin afectar las demás.</small></div></div>
      <section className="ps-personalize" aria-label="Personalización por unidad">
        <div className="ps-personalize-head"><div><strong>Editando esta chapita</strong>{previewItem && <span className={settings.tagNames[previewItem.id]?.trim() ? "has-name" : "is-stock"}>{settings.tagNames[previewItem.id]?.trim() ? "Con nombre" : "Stock"}</span>}</div><small className={`ps-save is-${saveState}`}>{{ idle: "Se guarda automáticamente.", saving: "Guardando…", saved: "✓ Guardado en la chapita", error: "⚠ No se pudo guardar. Revisá la conexión." }[saveState]}</small></div>
        {/* La unidad se elige tocándola en la hoja; ‹ › pasa a la anterior o a la siguiente (y la muestra). */}
        {previewItem && <div className="ps-unit-nav">
          <button type="button" onClick={() => stepUnit(-1)} aria-label="Chapita anterior" disabled={items.length < 2}>‹</button>
          <div><span style={{ background: TAG_COLORS.find((color) => color.id === colorOf(previewItem))?.value || colorOf(previewItem) }} /><b>{previewItem.code}</b><small>{unitNumber(previewItem.number)} · {items.indexOf(previewItem) + 1} de {items.length}</small></div>
          <button type="button" onClick={() => stepUnit(1)} aria-label="Chapita siguiente" disabled={items.length < 2}>›</button>
        </div>}
        {previewItem && <div className="ps-unit-editor">
          <label>Nombre <small>Opcional · vacío para stock</small><input value={settings.tagNames[previewItem.id] || ""} maxLength={14} placeholder="Ej: Luna" onChange={(event) => setTagName(previewItem.id, event.target.value)} /></label>
          <span className="ps-editor-label">Animal</span>
          {editorNotice?.id === previewItem.id && <p className="ps-editor-notice" role="status">{editorNotice.message}</p>}
          <CharacterPicker value={settings.tagCharacters[previewItem.id] || ""} auto={tagCharacterFor(settings.tagCharacter, previewItem.number - 1)} color={colorOf(previewItem)} name={settings.tagNames[previewItem.id] || ""} onChange={(id) => setTagCharacter(previewItem.id, id)} onChooseGeneric={(id) => setGenericCharacter(previewItem.id, id)} />
          <span className="ps-editor-label">Color</span>
          <div className="ps-colors ps-unit-colors">
            <button type="button" className={`ps-auto-color${!settings.tagColors[previewItem.id] ? " is-on" : ""}`} onClick={() => setTagColor(previewItem.id, "")} aria-label="Color automático" title="Color automático"><span className="is-auto">A</span><small>Auto</small></button>
            {TAG_COLORS.filter((color) => color.id !== "mix").map((color) => <button key={color.id} type="button" className={settings.tagColors[previewItem.id] === color.id ? "is-on" : ""} onClick={() => setTagColor(previewItem.id, color.id)} aria-label={color.label} title={color.label}><span style={{ background: color.value }} /></button>)}
            {(() => {
              const own = settings.tagColors[previewItem.id] || "";
              const custom = own.startsWith("#");
              return <label className={`ps-color-custom${custom ? " is-on" : ""}`} title="Otro color">
                <span style={custom ? { background: own } : undefined}>{custom ? "" : "+"}</span>
                <input type="color" value={custom ? own : "#3a7bd5"} onChange={(event) => setTagColor(previewItem.id, event.target.value, 600)} aria-label="Elegir otro color para esta chapita" />
              </label>;
            })()}
          </div>
          {isLightTagColor(colorOf(previewItem)) && <small className="ps-light-note">Color claro: las letras van oscuras para que se lean.</small>}
          <button type="button" className="ps-download-qr" onClick={() => downloadQrSvg(previewItem)}>Descargar QR vectorial (.SVG)</button>
          <button type="button" className="ps-reset-unit" onClick={() => resetTag(previewItem.id)}>Restablecer esta unidad</button>
        </div>}
      </section>
      <small className="ps-muted">El dorso conserva siempre el diseño original y el QR público. El código privado va sólo en la tarjeta de activación.</small>
      </>}

      <div className="ps-stage-title"><span>{mode === "qr" ? 3 : 2}</span><div><strong>Preparar impresión</strong><small>Revisá hoja, corte y cantidad de páginas.</small></div></div>
      {!single && <fieldset className="ps-group"><legend>Hoja</legend>
        <div className="ps-tag-styles">
          {(Object.keys(PAPERS) as Paper[]).map((size) => <button key={size} type="button" className={paper === size ? "is-on" : ""} onClick={() => update({ paper: size })}>{size} · {PAPERS[size].width}×{PAPERS[size].height} mm</button>)}
        </div>
        <small className="ps-muted">{paper === "A3" ? "A3 entra el doble por hoja: para imprenta o impresora grande." : "A4 es la de cualquier impresora."} Al imprimir, elegí el mismo tamaño de papel.</small>
      </fieldset>}

      {!single && <fieldset className="ps-group"><legend>Corte</legend>
        {mode === "qr" ? <>
          <label className="ps-check"><input type="checkbox" checked={settings.tagCutGuides} onChange={(event) => update({ tagCutGuides: event.target.checked })} />Contorno vectorial continuo (Corel/Adobe)</label>
          <button type="button" className="ps-cut-download" onClick={downloadCutContourSvg}>Descargar molde exacto de {qrSize} mm (.SVG)</button>
          <small className="ps-muted">El círculo magenta marca el diámetro final exacto; el color se extiende 1 mm afuera como sangrado. En Corel o Illustrator, asignale al trazo el spot/hairline que pida el taller (normalmente CutContour).</small>
        </> : <label className="ps-check"><input type="checkbox" checked={settings.cutLines} onChange={(event) => update({ cutLines: event.target.checked })} />Líneas de corte punteadas</label>}
      </fieldset>}

      <details className="ps-help-details">
        <summary>¿Cómo imprimir correctamente?</summary>
        <div className="ps-help">
          <span>Elegí <b>Guardar como PDF</b>, escala <b>100 %</b> (nunca “Ajustar”), márgenes <b>Ninguno</b> y activá <b>Gráficos de fondo</b>.</span>
          {single
            ? <span>Cada cara va en su página, a {width}×{height} mm con <b>2 mm de sangrado</b> y marcas de corte{cardBoth ? ", frente y dorso intercalados" : ""}.{secureCard ? " La línea interior es para doblar la solapa, no para cortar." : ""}</span>
            : cardBoth && mode === "cards" && <span>Doble faz: imprimí girando por el <b>lado largo</b>.</span>}
          {mode === "qr" && settings.tagOutput === "pairs" && <span>Cada unidad sale como <b>frente y dorso juntos</b>, lista para cortar y emparejar.</span>}
          {mode === "qr" && settings.tagOutput === "duplex" && settings.tagSides === "both" && <span>Los dorsos ya salen espejados. Imprimí doble faz girando por el lado largo.</span>}
          {mode === "qr" && <span>Al terminar, controlá cada chapita con <b>Verificar armado</b>.</span>}
          {mode === "cards" && <span className="is-warn">No compartas el PDF: contiene códigos de activación.</span>}
        </div>
      </details>

      <div className="ps-print-dock">
        <div className="ps-print-summary"><div><strong>{paper} · {items.length} {items.length === 1 ? "unidad" : "unidades"}</strong><small>{pageCount} {pageCount === 1 ? "página" : "páginas"}{mode === "qr" && settings.tagOutput === "pairs" ? " · frente y dorso juntos" : ""}</small></div>{mode === "cards" ? <span className="is-warn">Códigos privados</span> : <span className="is-ready">Listo para imprimir</span>}</div>
        <button type="button" className="btn full ps-print" onClick={() => window.print()} disabled={!items.length}><LuPrinter aria-hidden="true" /> Imprimir o guardar PDF</button>
        {mode === "qr" && <button type="button" className="ps-next-step" onClick={() => setMode("cards")}>Siguiente: <b>2</b> Tarjetas <i aria-hidden="true">→</i></button>}
      </div>
    </aside>

    <main className={`ps-sheets${single ? " is-single" : ""}`}>
      {!items.length && <p className="ps-empty">Todas las chapitas de este lote ya están activadas: no hay nada para imprimir.</p>}
      {mode === "qr" && previewItem && <section className="ps-tag-overview" aria-label={`Vista del código ${previewItem.code}`}>
        <div className="ps-tag-overview-head"><div><small>VISTA PREVIA</small><h2>{unit(previewItem.number)} · {previewItem.code}</h2></div><div className="ps-overview-side"><span>{settings.tagNames[previewItem.id]?.trim() || "Sin nombre · stock"}</span><button type="button" className="ps-partner" onClick={showPartner}>Ver su tarjeta <i aria-hidden="true">→</i></button></div></div>
        <div className="ps-tag-overview-pair">
          <figure><TagFront design={frontStyle} id={`preview-${previewItem.id}-front`} diameter={60} color={colorOf(previewItem)} character={characterOf(previewItem)} name={settings.tagNames[previewItem.id] || ""} hole={settings.tagHole} /><figcaption>Frente</figcaption></figure>
          <figure><TagBack id={`preview-${previewItem.id}-back`} qr={previewItem.tagQr} diameter={60} color={colorOf(previewItem)} design={tagBackDesign(settings.tagLayout)} hole={settings.tagHole} /><figcaption>Dorso · {layoutLabel}</figcaption></figure>
        </div>
      </section>}
      {single ? items.flatMap((item) => [
        <section key={`${item.id}-f`} className={`ps-single ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} style={{ width: `${singlePage.width}mm`, height: `${singlePage.height}mm` }} aria-label={`Seleccionar tarjeta con código ${item.code}: frente`} role="button" tabIndex={0} data-card={item.id} onClick={() => selectItem(item.id)} onKeyDown={(event) => selectItemFromKeyboard(event, item.id)}>
          {styleChip(item)}
          <CardFront design={cardDesignOf(item)} layout={settings.cardLayout} item={item} host={host} style={bleedStyle} bleed closed={flapClosed} fresh={settings.flapFresh} />
          <CropMarks width={width} height={height} />
        </section>,
        ...(cardBoth ? [<section key={`${item.id}-b`} className={`ps-single ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} style={{ width: `${singlePage.width}mm`, height: `${singlePage.height}mm` }} aria-label={`Seleccionar tarjeta con código ${item.code}: dorso`} role="button" tabIndex={0} onClick={() => selectItem(item.id)} onKeyDown={(event) => selectItemFromKeyboard(event, item.id)}>
          <CardBack design={cardDesignOf(item)} layout={settings.cardLayout} host={host} style={bleedStyle} bleed />
          <CropMarks width={width} height={height} />
        </section>] : []),
      ]) : mode === "cards" ? cardPages.map((page, pageIndex) => <div key={pageIndex} className="ps-pair">
        <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: frentes`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · frentes</span>
          <div className="ps-grid" style={gridStyle(cardCols, width, cardGap)}>
            {/* Un div (no un botón) porque adentro va el botoncito de estilo de la tarjeta. */}
            {page.map((item) => <div role="button" tabIndex={0} key={item.id} data-card={item.id} className={`ps-cell ps-selectable${settings.cutLines ? " has-cut" : ""}${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} onKeyDown={(event) => selectItemFromKeyboard(event, item.id)} aria-label={`Seleccionar tarjeta con código ${item.code}`}>{styleChip(item)}<CardFront design={cardDesignOf(item)} layout={settings.cardLayout} item={item} host={host} style={cardStyle} closed={flapClosed} fresh={settings.flapFresh} /></div>)}
          </div>
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={cardPages.length} detail="Tarjetas · frentes" />
        </section>
        {cardBoth && <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: dorsos`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · dorsos (atrás de la anterior)</span>
          <div className="ps-grid" style={gridStyle(cardCols, width, cardGap)}>
            {/* Espejado por fila: el dorso de la columna 1 va en la última, y así. */}
            {Array.from({ length: Math.ceil(page.length / cardCols) * cardCols }, (_, cell) => {
              const row = Math.floor(cell / cardCols);
              const item = page[row * cardCols + (cardCols - 1 - (cell % cardCols))];
              return item
                ? <button type="button" key={cell} className={`ps-cell ps-selectable${settings.cutLines ? " has-cut" : ""}${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} aria-label={`Seleccionar dorso de la tarjeta con código ${item.code}`}><CardBack design={cardDesignOf(item)} layout={settings.cardLayout} host={host} style={cardStyle} /></button>
                : <div key={cell} className="ps-cell"><div style={cardStyle} /></div>;
            })}
          </div>
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={cardPages.length} detail="Tarjetas · dorsos" />
        </section>}
      </div>) : settings.tagOutput === "pairs" ? pairPages.map((page, pageIndex) => <section key={pageIndex} className="ps-page ps-pair-page" aria-label={`Hoja ${pageIndex + 1}: frentes y dorsos de chapitas`}>
        <span className="ps-page-label">Hoja {pageIndex + 1} · pares para armado</span>
        <div className="ps-grid ps-pair-grid" style={{ gridTemplateColumns: `repeat(${pairCols}, ${pairWidth}mm)`, gap: `${pairGap}mm` }}>
          {page.map((item) => <div role="button" tabIndex={0} key={item.id} data-card={item.id} className={`ps-print-pair ps-selectable${previewItem?.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} onKeyDown={(event) => selectItemFromKeyboard(event, item.id)} aria-label={`Seleccionar chapita con código ${item.code}`}>
            <span className="ps-tools">{partnerButton(item)}</span>
            <div className="ps-print-pair-faces">
              {tagArtwork(item, "front", `pair-${pageIndex}`)}
              {tagArtwork(item, "back", `pair-${pageIndex}`)}
            </div>
          </div>)}
        </div>
        <SheetFoot batchName={batchName} page={pageIndex + 1} pages={pairPages.length} detail={`Chapitas Ø ${qrSize} mm · ${layoutLabel}`} />
      </section>) : qrPages.map((page, pageIndex) => <div key={pageIndex} className="ps-pair ps-tag-pages">
        {settings.tagSides !== "back" && <section className="ps-page" aria-label={`Hoja ${pageIndex + 1}: frentes de chapitas`}>
          <span className="ps-page-label">Hoja {pageIndex + 1} · frentes</span>
          <div className="ps-grid" style={gridStyle(qrCols, qrSize, qrGap)}>
            {page.map((item) => <div key={item.id}>{tagCell(item, "front")}</div>)}
          </div>
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={qrPages.length} detail={`Chapitas Ø ${qrSize} mm · frentes`} />
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
          <SheetFoot batchName={batchName} page={pageIndex + 1} pages={qrPages.length} detail={`Chapitas Ø ${qrSize} mm · dorsos`} />
        </section>}
      </div>)}
    </main>
    {ask && <div className="ps-modal" role="presentation" onClick={() => setAsk(null)}>
      <div className="ps-modal-box" role="alertdialog" aria-modal="true" aria-labelledby="ps-modal-title" onClick={(event) => event.stopPropagation()}>
        <h3 id="ps-modal-title">{ask.title}</h3>
        <p>{ask.text}</p>
        <div>
          <button type="button" className="ps-modal-cancel" onClick={() => setAsk(null)}>{ask.cancel || "Cancelar"}</button>
          {ask.actions.map((action) => <button key={action.label} type="button" className={action.main ? "ps-modal-ok" : "ps-modal-cancel"} autoFocus={action.main} onClick={() => { action.run(); setAsk(null); }}>{action.label}</button>)}
        </div>
      </div>
    </div>}
    {toast && <div className="ps-toast" role="status">{toast}<button type="button" onClick={() => setToast("")} aria-label="Cerrar">✕</button></div>}
  </div>;
}
