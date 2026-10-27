"use client";

// Elegir el animal del frente de una chapita. En el panel se ve el elegido (su carita sobre el
// color de la chapita) y "Cambiar"; al tocarlo se abre un modal con perros y gatos en pestañas,
// buscador y las caritas grandes. Las imágenes van achicadas (next/image) para que abra rápido.
import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { TAG_CATS, TAG_CHARACTERS, TAG_COLORS, TAG_DOGS, isCat, type TagCharacterId } from "./tag-face";

const colorValue = (color: string) => color.startsWith("#") ? color : TAG_COLORS.find((item) => item.id === color)?.value || "#1673b8";
const normalize = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function Face({ id, color, size }: { id: TagCharacterId; color: string; size: number }) {
  const character = TAG_CHARACTERS.find((item) => item.id === id) || TAG_CHARACTERS[0];
  return <span className="ps-animal-face" style={{ width: size, height: size, background: colorValue(color) }}>
    <Image src={character.faceSrc} alt="" width={size} height={size} />
  </span>;
}

// value: el elegido para esta unidad ("" = automático); auto: el que le toca si es automático.
export default function CharacterPicker({ value, auto, color, onChange }: { value: TagCharacterId | ""; auto: TagCharacterId; color: string; onChange: (id: TagCharacterId | "") => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const current = value || auto;
  const [tab, setTab] = useState<"dogs" | "cats">(isCat(current) ? "cats" : "dogs");
  const [query, setQuery] = useState("");
  const label = TAG_CHARACTERS.find((item) => item.id === current)?.label || "";
  const list = useMemo(() => {
    const search = normalize(query.trim());
    // Buscando, se busca en todos; si no, en la pestaña elegida.
    return search ? TAG_CHARACTERS.filter((item) => normalize(item.label).includes(search)) : tab === "cats" ? TAG_CATS : TAG_DOGS;
  }, [query, tab]);
  const open = () => { setTab(isCat(current) ? "cats" : "dogs"); setQuery(""); dialog.current?.showModal(); };
  const choose = (id: TagCharacterId | "") => { onChange(id); dialog.current?.close(); };

  return <>
    <button type="button" className="ps-animal-trigger" onClick={open}>
      <Face id={current} color={color} size={46} />
      <span><b>{label}</b><small>{value ? "Elegido a mano" : "Automático"}</small></span>
      <em>Cambiar</em>
    </button>
    <dialog ref={dialog} className="ps-animal-dialog" onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className="ps-animal-box">
        <header>
          <div><strong>Elegí el animal</strong><small>Se ve en el frente de la chapita, con su color.</small></div>
          <button type="button" className="ps-animal-close" aria-label="Cerrar" onClick={() => dialog.current?.close()}>✕</button>
        </header>
        <div className="ps-animal-tools">
          <div className="ps-animal-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={!query && tab === "dogs"} className={!query && tab === "dogs" ? "is-on" : ""} onClick={() => { setTab("dogs"); setQuery(""); }}>🐶 Perros <span>{TAG_DOGS.length}</span></button>
            <button type="button" role="tab" aria-selected={!query && tab === "cats"} className={!query && tab === "cats" ? "is-on" : ""} onClick={() => { setTab("cats"); setQuery(""); }}>🐱 Gatos <span>{TAG_CATS.length}</span></button>
          </div>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar raza…" aria-label="Buscar raza" />
        </div>
        <div className="ps-animal-grid">
          {!query && <button type="button" className={`ps-animal-option is-auto${!value ? " is-on" : ""}`} onClick={() => choose("")}>
            <Face id={auto} color={color} size={84} />
            <b>Automático</b><small>{TAG_CHARACTERS.find((item) => item.id === auto)?.label}</small>
          </button>}
          {list.map((character) => <button type="button" key={character.id} className={`ps-animal-option${value === character.id ? " is-on" : ""}`} onClick={() => choose(character.id)}>
            <Face id={character.id} color={color} size={84} />
            <b>{character.label}</b>
          </button>)}
          {!list.length && <p className="ps-animal-empty">No hay ninguna raza con ese nombre.</p>}
        </div>
      </div>
    </dialog>
  </>;
}
