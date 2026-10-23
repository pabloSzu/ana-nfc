"use client";

// "Compartir" una chapita: abre un menú con lo que se puede compartir según el momento.
//  · Normal: la imagen para historias (para mostrarla con orgullo) y el link.
//  · Perdida: la historia y la imagen cuadrada (grupos de Facebook) con "¡ESTOY PERDIDO/A!" y
//    la dirección de su página, y el link con el pedido de ayuda.
// Las imágenes (con la dirección de su página escrita; un QR no sirve en algo que se mira en el
// mismo celular) salen de app/api/og/mascota y se bajan apenas se abre el menú: el celular solo
// deja abrir su menú de compartir justo después de un toque, así que tienen que estar listas. Con
// el menú del celular se elige Instagram, WhatsApp, etc.; en la compu se descargan.
import { useRef, useState } from "react";
import { FiDownload, FiImage, FiLink, FiShare2, FiSquare } from "react-icons/fi";

type Kind = "historia" | "cuadrado";

export default function PetShareButton({ path, petName, lost, lostZone = "", female = false, className = "", label }: { path: string; petName: string; lost: boolean; lostZone?: string; female?: boolean; className?: string; label?: string }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const [files, setFiles] = useState<Partial<Record<Kind, { file: File; preview: string }>>>({});
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  // Si el navegador no deja copiar: el link a la vista para copiarlo a mano (sin ventanitas).
  const [manual, setManual] = useState("");
  const name = petName.trim() || "mi mascota";
  const slug = path.split("/").pop() || "";
  const kinds: Kind[] = lost ? ["historia", "cuadrado"] : ["historia"];
  const canShareFiles = (file: File) => typeof navigator !== "undefined" && Boolean(navigator.canShare?.({ files: [file] }));

  // El link se copia apenas se abre el menú (tiene que ser en el mismo toque): en Instagram el
  // dueño solo agrega el sticker "Enlace" y lo pega. Una página web no puede poner el link sola.
  const [linkReady, setLinkReady] = useState(false);
  function open() {
    setFailed(false);
    sheet.current?.showModal();
    navigator.clipboard?.writeText(new URL(path, window.location.origin).toString()).then(() => setLinkReady(true), () => setLinkReady(false));
    // Siempre recién generadas (?t=): muestran lo último guardado.
    for (const kind of kinds) {
      if (files[kind]) URL.revokeObjectURL(files[kind]!.preview);
      fetch(`/api/og/mascota/${slug}?formato=${kind}&t=${Date.now()}`)
        .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.blob(); })
        .then((blob) => {
          const file = new File([blob], `${name.replace(/[^\p{L}\p{N}]+/gu, "-")}-${lost ? "perdido" : "bionfc"}-${kind}.png`, { type: "image/png" });
          setFiles((current) => ({ ...current, [kind]: { file, preview: URL.createObjectURL(blob) } }));
        })
        .catch(() => setFailed(true));
    }
  }

  async function shareImage(kind: Kind) {
    const ready = files[kind];
    if (!ready) return;
    if (canShareFiles(ready.file)) {
      try { await navigator.share({ files: [ready.file] }); } catch { /* cerró el menú */ }
      return;
    }
    // Compu (o un navegador que no comparte archivos): se descarga.
    const link = document.createElement("a");
    link.href = ready.preview;
    link.download = ready.file.name;
    link.click();
  }

  async function shareLink() {
    const url = new URL(path, window.location.origin).toString();
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
      <span><strong>{kind === "historia" ? <><FiImage aria-hidden="true" /> Historia de Instagram</> : <><FiSquare aria-hidden="true" /> Imagen para grupos</>}</strong>
        <small>{failed && !ready ? "No pudimos prepararla. Cerrá y probá de nuevo." : !ready ? "Preparando la imagen…" : kind === "historia" ? "También sirve para los estados de WhatsApp." : "Para grupos de Facebook de mascotas perdidas o el feed."}</small></span>
      {download && <FiDownload className="pet-share-go" aria-label="Descargar" />}
    </button>;
  };

  return <>
    <button type="button" className={className} onClick={open}>
      <FiShare2 aria-hidden="true" />{label || (lost ? "Compartir que se perdió" : "Compartir")}
    </button>
    <dialog ref={sheet} className="pet-share-sheet" aria-label="Compartir" onClick={(event) => { if (event.target === sheet.current) sheet.current.close(); }}>
      <div className="pet-share-head"><strong>{lost ? `Ayudá a encontrar a ${name}` : `Compartí la chapita de ${name}`}</strong><button type="button" onClick={() => sheet.current?.close()} aria-label="Cerrar">✕</button></div>
      <p className="pet-share-tip">{lost ? "Subila a tus historias y a los grupos de mascotas perdidas de tu zona. La imagen tiene la dirección de su página para que te avisen." : "Una imagen linda para tus historias, con la dirección de su chapita."}</p>
      {linkReady && <p className="pet-share-copied">✓ <span>Copiamos el link. En Instagram agregá el sticker <b>“Enlace”</b> y pegalo{lost ? "; en Facebook, pegalo en el texto de la publicación" : ""}.</span></p>}
      {kinds.map(option)}
      <button type="button" className="pet-share-option" onClick={shareLink}>
        <span className="pet-share-thumb is-icon"><FiLink aria-hidden="true" /></span>
        <span><strong>{copied ? "¡Link copiado!" : "Enviar link"}</strong><small>Por WhatsApp o donde quieras. Se ve con su foto.</small></span>
      </button>
      {manual && <label className="pet-share-manual"><span>Copiá este link:</span><input readOnly value={manual} onFocus={(event) => event.currentTarget.select()} autoFocus /></label>}
    </dialog>
  </>;
}
