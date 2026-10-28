"use client";

// Elegir el animal del frente de una chapita. En el panel se ve el elegido (su carita sobre el
// color de la chapita) y "Cambiar"; al tocarlo se abre un modal con perros y gatos en pestañas,
// buscador y las caritas grandes. Las imágenes van achicadas (next/image) para que abra rápido.
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { TAG_CATS, TAG_CHARACTERS, TAG_COLORS, TAG_CUSTOM, TAG_DOGS, TAG_GENERIC, isCat, isGenericCharacterId, type TagCharacter, type TagCharacterId } from "./tag-face";

type Tab = "dogs" | "cats" | "generic" | "custom";
const tabOf = (id: string): Tab => TAG_CUSTOM.some((item) => item.id === id) ? "custom" : isGenericCharacterId(id) ? "generic" : isCat(id) ? "cats" : "dogs";

const colorValue = (color: string) => color.startsWith("#") ? color : TAG_COLORS.find((item) => item.id === color)?.value || "#1673b8";
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const familyOf = (character: TagCharacter) => "family" in character ? character.family : character.id;
const coatOf = (character: TagCharacter) => "coat" in character ? character.coat : "";
const dogFamilyCount = new Set(TAG_DOGS.map(familyOf)).size;

function Face({ id, color, size }: { id: TagCharacterId; color: string; size: number }) {
  const character = TAG_CHARACTERS.find((item) => item.id === id) || TAG_CHARACTERS[0];
  return <span className="ps-animal-face" style={{ width: size, height: size, background: colorValue(color) }}>
    {/* Miniatura recortada al dibujo (public/pet-tags/thumbs): todas del mismo tamaño y centradas. */}
    <Image src={isGenericCharacterId(character.id) ? character.faceSrc : `/pet-tags/thumbs/${character.id}.png`} alt="" width={size} height={size} />
  </span>;
}

// value: el elegido para esta unidad ("" = automático); auto: el que le toca si es automático.
export default function CharacterPicker({ value, auto, color, name, onChange, onChooseGeneric }: { value: TagCharacterId | ""; auto: TagCharacterId; color: string; name: string; onChange: (id: TagCharacterId | "") => void; onChooseGeneric: (id: TagCharacterId) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const current = value || auto;
  const [tab, setTab] = useState<Tab>(tabOf(current));
  const [query, setQuery] = useState("");
  const [pendingGeneric, setPendingGeneric] = useState<TagCharacterId | null>(null);
  const [pendingFamily, setPendingFamily] = useState<TagCharacter[] | null>(null);
  const label = TAG_CHARACTERS.find((item) => item.id === current)?.label || "";
  const list = useMemo(() => {
    const search = normalize(query.trim());
    // Buscando, se busca en todos; si no, en la pestaña elegida.
    return search
      ? TAG_CHARACTERS.filter((item) => normalize(item.label).includes(search))
      : tab === "dogs" ? TAG_DOGS
        : tab === "cats" ? TAG_CATS
          : tab === "generic" ? TAG_GENERIC
            : TAG_CUSTOM;
  }, [query, tab]);
  const families = useMemo(() => {
    const grouped = new Map<string, TagCharacter[]>();
    for (const character of list) {
      const key = familyOf(character);
      grouped.set(key, [...(grouped.get(key) || []), character]);
    }
    return Array.from(grouped.values());
  }, [list]);
  const close = () => { setPendingGeneric(null); setPendingFamily(null); dialog.current?.close(); };
  const open = () => { setTab(tabOf(current)); setQuery(""); setPendingGeneric(null); setPendingFamily(null); dialog.current?.showModal(); };
  const choose = (id: TagCharacterId | "") => {
    if (id && isGenericCharacterId(id) && name.trim()) {
      setPendingGeneric(id);
      return;
    }
    onChange(id);
    close();
  };
  const confirmGeneric = () => {
    if (!pendingGeneric) return;
    onChooseGeneric(pendingGeneric);
    close();
  };

  return <>
    <button type="button" className="ps-animal-trigger" onClick={open}>
      <Face id={current} color={color} size={46} />
      <span><b>{label}</b><small>{value ? "Elegido a mano" : "Automático"}</small></span>
      <em>Cambiar</em>
    </button>
    <dialog ref={dialog} className="ps-animal-dialog" onClick={(event) => { if (event.target === dialog.current) close(); }}>
      <div className="ps-animal-box">
        <header>
          <div><strong>Elegí el animal</strong><small>Se ve en el frente de la chapita, con su color.</small></div>
          <button type="button" className="ps-animal-close" aria-label="Cerrar" onClick={close}>✕</button>
        </header>
        <div className="ps-animal-tools">
          <div className="ps-animal-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={!query && tab === "dogs"} className={!query && tab === "dogs" ? "is-on" : ""} onClick={() => { setTab("dogs"); setQuery(""); setPendingFamily(null); }}>🐶 Perritos <span>{dogFamilyCount}</span></button>
            <button type="button" role="tab" aria-selected={!query && tab === "cats"} className={!query && tab === "cats" ? "is-on" : ""} onClick={() => { setTab("cats"); setQuery(""); }}>🐱 Gatitos <span>{TAG_CATS.length}</span></button>
            <button type="button" role="tab" aria-selected={!query && tab === "generic"} className={!query && tab === "generic" ? "is-on" : ""} onClick={() => { setTab("generic"); setQuery(""); setPendingGeneric(null); }}>◉ Genéricos <span>{TAG_GENERIC.length}</span></button>
            {!!TAG_CUSTOM.length && <button type="button" role="tab" aria-selected={!query && tab === "custom"} className={`is-custom${!query && tab === "custom" ? " is-on" : ""}`} onClick={() => { setTab("custom"); setQuery(""); }}>✨ Personalizados <span>{TAG_CUSTOM.length}</span></button>}
          </div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar animal o estilo…" aria-label="Buscar animal o estilo" />
        </div>
        <div className="ps-animal-grid">
          {pendingFamily ? <div className="ps-coat-picker">
            <button type="button" className="ps-coat-back" onClick={() => setPendingFamily(null)}>← Volver a las razas</button>
            <strong>Elegí el pelaje</strong>
            <p>{pendingFamily[0].label.replace(/ (negro|apricot|chocolate)$/i, "")} · el dibujo y la posición no cambian.</p>
            <div>
              {pendingFamily.map((character) => <button type="button" key={character.id} className={value === character.id ? "is-on" : ""} onClick={() => choose(character.id)}>
                <Face id={character.id} color={color} size={96} />
                <b>{coatOf(character)}</b>
              </button>)}
            </div>
          </div> : pendingGeneric ? <div className="ps-generic-confirm" role="alertdialog" aria-labelledby="ps-generic-title" aria-describedby="ps-generic-copy">
            <Face id={pendingGeneric} color={color} size={92} />
            <strong id="ps-generic-title">Este diseño se usa sin nombre</strong>
            <p id="ps-generic-copy">Para elegirlo vamos a quitar <b>{name.trim()}</b> de esta chapita.</p>
            <div><button type="button" onClick={() => setPendingGeneric(null)}>Cancelar</button><button type="button" className="is-primary" onClick={confirmGeneric}>Quitar nombre y usarlo</button></div>
          </div> : <>
          {!query && <button type="button" className={`ps-animal-option is-auto${!value ? " is-on" : ""}`} onClick={() => choose("")}>
            <Face id={auto} color={color} size={84} />
            <b>Automático</b><small>{TAG_CHARACTERS.find((item) => item.id === auto)?.label}</small>
          </button>}
          {families.map((family) => {
            const character = family.find((item) => item.id === current) || family[0];
            const isSelected = family.some((item) => item.id === value);
            return <button type="button" key={familyOf(character)} className={`ps-animal-option${isSelected ? " is-on" : ""}`} onClick={() => family.length > 1 ? setPendingFamily(family) : choose(character.id)}>
              <Face id={character.id} color={color} size={84} />
              <b>{family[0].label.replace(/ (negro|apricot|chocolate)$/i, "")}</b>
              {family.length > 1 ? <small>{family.length} pelajes</small> : isGenericCharacterId(character.id) && <small>Sin nombre</small>}
            </button>;
          })}
          {!list.length && <p className="ps-animal-empty">No hay ninguna raza con ese nombre.</p>}
          </>}
        </div>
      </div>
    </dialog>
  </>;
}
