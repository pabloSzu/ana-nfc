"use client";

// Compartir una chapita, según el momento:
//  · Normal: imagen para historias y para publicación (para mostrarla con orgullo) y el link.
//  · Perdida: las mismas imágenes con "¡ESTOY PERDIDO/A!", y el link con el pedido de ayuda.
// Las imágenes llevan la dirección de su página escrita (un QR no sirve en algo que se mira en el
// mismo celular) y salen de app/api/og/mascota. Se bajan antes de que toquen la opción: el
// celular solo deja abrir su menú de compartir justo después de un toque, así que tienen que estar
// listas. Con ese menú se elige Instagram, WhatsApp, etc.; en la compu se descargan.
//
// PetSharePanel son las opciones (las usa la pantalla "Ahora, difundilo" del editor, al activar el
// modo perdido); PetShareButton es el botón que las abre en una hoja desde abajo.
import { useEffect, useRef, useState } from "react";
import { FiDownload, FiImage, FiLink, FiShare2, FiSquare } from "react-icons/fi";

type Kind = "historia" | "publicacion";
// version: la de petImageVersion (lib/pet.ts). Con ella las imágenes se bajan una sola vez mientras
// no cambie nada; sin ella, se arman de nuevo cada vez.
type Props = { path: string; petName: string; lost: boolean; lostZone?: string; female?: boolean; version?: string };

export function PetSharePanel({ path, petName, lost, lostZone = "", female = false, version }: Props) {
  const [files, setFiles] = useState<Partial<Record<Kind, { file: File; preview: string }>>>({});
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  // El link para el sticker "Enlace" de Instagram: se copia al tocar una imagen (en el mismo toque).
  const [linkReady, setLinkReady] = useState(false);
  // Los pasos para el sticker de Instagram aparecen recién al tocar "Historia" (antes estorban).
  const [storyTapped, setStoryTapped] = useState(false);
  // Si el navegador no deja copiar: el link a la vista para copiarlo a mano (sin ventanitas).
  const [manual, setManual] = useState("");
  const name = petName.trim() || "mi mascota";
  const slug = path.split("/").pop() || "";
  const pageUrl = () => new URL(path, window.location.origin).toString();
  const canShareFiles = (file: File) => typeof navigator !== "undefined" && Boolean(navigator.canShare?.({ files: [file] }));

  useEffect(() => {
    const urls: string[] = [];
    const stamp = version || String(Date.now());
    for (const kind of ["historia", "publicacion"] as Kind[]) {
      fetch(`/api/og/mascota/${slug}?formato=${kind}&v=${stamp}`)
        .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.blob(); })
        .then((blob) => {
          const file = new File([blob], `${name.replace(/[^\p{L}\p{N}]+/gu, "-")}-${lost ? "perdido" : "bionfc"}-${kind}.jpg`, { type: blob.type || "image/jpeg" });
          const preview = URL.createObjectURL(blob);
          urls.push(preview);
          setFiles((current) => ({ ...current, [kind]: { file, preview } }));
        })
        .catch(() => setFailed(true));
    }
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [slug, name, lost, version]);

  function shareImage(kind: Kind) {
    const ready = files[kind];
    if (!ready) return;
    if (kind === "historia") setStoryTapped(true);
    // Los dos en el mismo toque, sin esperar: copiar el link (para el sticker) y compartir.
    navigator.clipboard?.writeText(pageUrl()).then(() => setLinkReady(true), () => {});
    if (canShareFiles(ready.file)) {
      // Si cerró el menú, nada; si el navegador no pudo abrirlo, se descarga.
      navigator.share({ files: [ready.file] }).catch((error: Error) => { if (error.name !== "AbortError") download(ready); });
      return;
    }
    // Compu (o un navegador que no comparte archivos): se descarga.
    download(ready);
  }

  function download(ready: { file: File; preview: string }) {
    const link = document.createElement("a");
    link.href = ready.preview;
    link.download = ready.file.name;
    link.click();
  }

  async function shareLink() {
    const url = pageUrl();
    const text = lost
      ? `¡${name} se perdió${lostZone.trim() ? ` en ${lostZone.trim()}` : ""}! Si ${female ? "la" : "lo"} ves, avisá a su familia desde acá 🙏`
      : `Esta es la chapita de ${name} 🐾`;
    if (navigator.share) {
      try { await navigator.share({ title: name, text, url }); return; } catch (error) { if ((error as Error).name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setManual(url);
    }
  }

  const option = (kind: Kind) => {
    const ready = files[kind];
    const download = ready && !canShareFiles(ready.file);
    return <button type="button" key={kind} className="pet-share-option" disabled={!ready} onClick={() => shareImage(kind)}>
      <span className="pet-share-thumb" data-kind={kind}>{/* eslint-disable-next-line @next/next/no-img-element -- imagen recién generada */}{ready ? <img src={ready.preview} alt="" /> : failed ? "!" : <i className="spin" aria-hidden="true" />}</span>
      <span><strong>{kind === "historia" ? <><FiImage aria-hidden="true" /> Historia</> : <><FiSquare aria-hidden="true" /> Publicación</>}</strong>
        <small>{failed && !ready ? "No pudimos prepararla. Cerrá y probá de nuevo." : !ready ? "Preparando la imagen…" : kind === "historia" ? "Para historias, estados de WhatsApp y reels." : lost ? "Para el feed y los grupos de Facebook de mascotas perdidas." : "Para el feed de Instagram o Facebook."}</small></span>
      {download && <FiDownload className="pet-share-go" aria-label="Descargar" />}
    </button>;
  };

  return <>
    {(["historia", "publicacion"] as Kind[]).map(option)}
    {/* La imagen no lleva el link tocable (Instagram no lo deja poner desde una página web): se
        agrega con el sticker "Enlace". Mucha gente no sabe dónde está: los pasos, cortitos. */}
    {storyTapped && <ol className="pet-share-steps">
      <li>Tocá <b>Historia</b> y elegí <b>Instagram → Historia</b>.</li>
      <li>Tocá el ícono de <b>stickers</b> y elegí <b>“Enlace”</b>.</li>
      <li><b>Pegá el link</b>{linkReady ? " (ya está copiado)" : " (se copia solo al tocar la imagen)"} y ponelo sobre la dirección blanca. En “Personalizar texto” podés poner <b>{lost ? "Avisá acá si lo ves 🐾" : "Conocé su chapita 🐾"}</b>.</li>
    </ol>}
    {lost && <p className="pet-share-tip">En Facebook o en un estado de WhatsApp, pegá el link en el texto: ahí se puede tocar.</p>}
    <button type="button" className="pet-share-option" onClick={shareLink}>
      <span className="pet-share-thumb is-icon"><FiLink aria-hidden="true" /></span>
      <span><strong>{copied ? "¡Link copiado!" : "Enviar link"}</strong><small>{lost ? "Por WhatsApp o donde quieras. Se abre con su foto y el aviso." : "Por WhatsApp o donde quieras. Se ve con su foto."}</small></span>
    </button>
    {manual && <label className="pet-share-manual"><span>Copiá este link:</span><input readOnly value={manual} onFocus={(event) => event.currentTarget.select()} autoFocus /></label>}
  </>;
}

export default function PetShareButton({ className = "", label, ...props }: Props & { className?: string; label?: string }) {
  const sheet = useRef<HTMLDialogElement>(null);
  // El panel se arma al abrir (y se desarma al cerrar): así las imágenes son siempre las últimas.
  const [open, setOpen] = useState(false);
  const name = props.petName.trim() || "mi mascota";
  return <>
    <button type="button" className={className} onClick={() => { setOpen(true); sheet.current?.showModal(); }}>
      <FiShare2 aria-hidden="true" />{label || (props.lost ? "Compartir que se perdió" : "Compartir")}
    </button>
    <dialog ref={sheet} className="pet-share-sheet" aria-label="Compartir" onClose={() => setOpen(false)} onClick={(event) => { if (event.target === sheet.current) sheet.current.close(); }}>
      <div className="pet-share-head"><strong>{props.lost ? `Ayudá a encontrar a ${name}` : `Compartí la chapita de ${name}`}</strong><button type="button" onClick={() => sheet.current?.close()} aria-label="Cerrar">✕</button></div>
      <p className="pet-share-tip">{props.lost ? "Subila a tus historias y a los grupos de mascotas perdidas de tu zona. La imagen tiene la dirección de su página para que te avisen." : "Una imagen linda para tus redes, con la dirección de su chapita."}</p>
      {open && <PetSharePanel {...props} />}
    </dialog>
  </>;
}
