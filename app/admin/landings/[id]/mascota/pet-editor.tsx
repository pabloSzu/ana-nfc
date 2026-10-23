"use client";

// Editor de la chapita de mascota (Admin y dueño). En el celular, una cosa por pantalla y como
// página común (sin nada fijo, así el teclado del iPhone no tapa ni desacomoda nada). En la compu,
// la miniatura queda siempre a la izquierda y se mueve sola a la parte que se edita.
//
// Este archivo tiene el estado y guardar; las pantallas están en:
//  · pet-editor-flow.tsx: los 3 pasos de la primera vez, los pasos opcionales y "Ahora, difundilo".
//  · pet-editor-menu.tsx: el menú y la pantalla de cada opción.
//  · pet-editor-fields.tsx: piezas comunes (campos, miniatura, diseños).
// Qué pantalla se ve lo decide una sola variable (screen, ver pet-editor-context.tsx).
//
// Guardar llama a la acción (saveMyPet del dueño, savePet del Admin), que responde qué pasó
// (PetSaveResult): con eso se elige la pantalla siguiente y el aviso de arriba. Después se piden
// al servidor los datos de alrededor (landing: si quedó publicada, el link, la foto). Todo queda en
// borrador hasta guardar.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiChevronLeft, FiGrid } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import PetRenderer, { type PetSection } from "@/components/pet-renderer";
import CopyButton from "@/components/copy-button";
import PendingSubmitButton from "@/components/pending-submit-button";
import { ToastBubble } from "@/components/toast";
import PetPhotoAdjust from "./pet-photo-adjust";
import "driver.js/dist/driver.css";
import { compressImage } from "@/lib/compress-image";
import { FontLinks } from "@/lib/fonts";
import { PET_LOOKS, parsePet, petForEditing, petGendered, petHasContact, type PetData, type PetFamily, type PetSaveResult } from "@/lib/pet";
import { EditorProvider, PANELS, type Editor, type EditorLanding, type Panel, type Screen } from "./pet-editor-context";
import { AfterScreen, SetupScreen, SpreadScreen } from "./pet-editor-flow";
import { MenuScreen, PanelScreen } from "./pet-editor-menu";

// "owner": el dueño, desde su panel (/mi). Sin QR ni publicar desde el Admin; se publica sola al
// guardar con un WhatsApp (saveMyPet).
type Props = {
  landing: EditorLanding;
  initialPet: PetData;
  saveAction: (formData: FormData) => Promise<PetSaveResult>;
  publishAction?: (formData: FormData) => void | Promise<void>;
  mode?: "admin" | "owner";
};

const OFFLINE = "No pudimos conectarnos. Revisá tu internet y probá de nuevo.";

// Qué parte de la chapita muestra la miniatura mientras se edita cada cosa (en la compu).
const PART_OF: Record<Panel | "menu", string> = { menu: ".pet-page", pet: ".pet-hero", family: ".pet-family", ficha: ".pet-card, .pet-family", look: ".pet-page", lost: ".pet-page" };
// Las partes de la chapita que se tocan en la miniatura (en la compu) llevan a su pantalla.
const panelOf = (section: PetSection): Panel => section === "about" || section === "health" || section === "finder" ? "ficha" : section === "design" ? "look" : section;
// La parte de la chapita que corresponde a cada pantalla (se resalta en la miniatura).
function sectionOf(screen: Screen): PetSection {
  if (screen.name === "setup") return screen.step === 2 ? "family" : "pet";
  if (screen.name !== "panel") return "design";
  return screen.panel === "ficha" ? "about" : screen.panel === "look" ? "design" : screen.panel;
}

export default function PetEditor({ landing, initialPet, saveAction, publishAction, mode = "admin" }: Props) {
  const isOwner = mode === "owner";
  const searchParams = useSearchParams();
  // Los teléfonos, como los escribe la gente ("351 555-1234"), no como se guardan.
  const [pet, setPet] = useState(() => petForEditing(initialPet));
  const [name, setNameValue] = useState(landing.name);
  // Lo último guardado: "Cancelar" vuelve a esto. Se lleva acá (no se toma de lo que manda el
  // servidor) para no depender de cuándo llegan los datos nuevos.
  const [saved, setSaved] = useState(() => ({ name: landing.name, pet: petForEditing(initialPet) }));
  const router = useRouter();
  // La primera vez del dueño (recién activada, sin publicar) arranca en los pasos; ?seccion=lost
  // (lo usa "Avisar que se perdió" en /mi) abre directo esa pantalla.
  const [screen, setScreen] = useState<Screen>(() => {
    if (isOwner && !landing.published && !landing.blocked) return { name: "setup", step: 0 };
    const requested = searchParams.get("seccion");
    return PANELS.includes(requested as Panel) ? { name: "panel", panel: requested as Panel } : { name: "menu" };
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingNow = useRef(false);
  const [notice, setNotice] = useState<{ message: string; isError: boolean; key: number } | null>(null);
  // La foto elegida vive acá y se agrega al guardar.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [adjustingPhoto, setAdjustingPhoto] = useState(false);
  const [draft, setDraft] = useState<{ name: string; pet: PetData } | null>(null);
  const [bigOpen, setBigOpen] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const bigPreview = useRef<HTMLDialogElement>(null);
  const discardDialog = useRef<HTMLDialogElement>(null);
  const draftKey = `bionfc-pet-draft:${landing.id}`;
  const photoUrl = photoPreview ?? (photoRemoved ? "" : landing.photoUrl);
  const screenKey = JSON.stringify(screen);

  // Borrador en el celular del dueño: si se le corta la sesión, se queda sin batería o cierra sin
  // guardar, al volver se le ofrece recuperar lo que había escrito.
  useEffect(() => {
    if (!isOwner) return;
    try {
      const raw = JSON.parse(localStorage.getItem(draftKey) || "null") as { name?: unknown; pet?: unknown } | null;
      const stored = raw && typeof raw.name === "string" ? { name: raw.name, pet: parsePet({ pet: raw.pet }) } : null;
      if (stored && JSON.stringify(stored) !== JSON.stringify({ name: landing.name, pet: petForEditing(initialPet) })) setDraft(stored);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOwner || !dirty) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ name, pet })); } catch {}
  }, [isOwner, dirty, draftKey, name, pet]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Cada pantalla arranca desde arriba.
  useEffect(() => { window.scrollTo(0, 0); }, [screenKey]);

  // La tecla Enter del celular dice "Listo" en los campos de una línea (los de los pasos ya dicen
  // "Siguiente"). Se pone acá para no repetirlo en cada campo.
  useEffect(() => {
    editorRef.current?.querySelectorAll("input:not([enterkeyhint]):not([type=checkbox]):not([type=file]):not([type=range])").forEach((input) => input.setAttribute("enterkeyhint", "done"));
  });

  // La miniatura (en la compu se ve al lado) se mueve sola a la parte que se edita.
  useEffect(() => {
    const target = screen.name === "setup" ? (screen.step === 2 ? "family" : "pet") : screen.name === "panel" ? screen.panel : "menu";
    const mini = screenRef.current;
    const part = mini?.querySelector(PART_OF[target]);
    if (!mini || !part) return;
    const timer = setTimeout(() => mini.scrollTo({ top: target === "menu" ? 0 : Math.max(0, (part as HTMLElement).offsetTop - 16), behavior: "smooth" }), 60);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKey]);

  const notify = (message: string, isError = false) => setNotice({ message, isError, key: Date.now() });
  const change = (patch: Partial<PetData>) => { setPet((current) => ({ ...current, ...patch })); setDirty(true); };

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
    // Achicar la foto tarda un momento: mientras, el círculo muestra "Preparando foto…".
    setPreparingPhoto(true);
    const compressed = await compressImage(file, 900, 0.85).finally(() => setPreparingPhoto(false));
    if (photoInput.current) photoInput.current.value = "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(compressed.type)) { setPhotoError("Ese formato de foto no sirve. Elegí una foto JPG o PNG."); return; }
    if (compressed.size > 4.5 * 1024 * 1024) { setPhotoError("La foto es muy pesada. Probá con otra o sacale una captura de pantalla."); return; }
    setPhotoFile(compressed);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(compressed));
    setPhotoRemoved(false);
    setDirty(true);
    setAdjustingPhoto(true);
  }

  function removePhoto() {
    if (photoInput.current) photoInput.current.value = "";
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoRemoved(true);
    setDirty(true);
  }

  // Guarda todo lo cargado y devuelve la respuesta de la acción. Si se corta internet, un aviso
  // en vez de quedar "Guardando…" para siempre; si venció la sesión, la acción manda a entrar (y
  // eso no se ataja).
  async function save({ quiet = false, pet: petToSave = pet }: { quiet?: boolean; pet?: PetData } = {}): Promise<PetSaveResult | null> {
    if (savingNow.current) return null;
    if (petToSave !== pet) setPet(petToSave);
    savingNow.current = true;
    setSaving(true);
    const formData = new FormData();
    formData.set("landing_id", landing.id);
    formData.set("business_name", name);
    formData.set("pet", JSON.stringify(petToSave));
    formData.set("remove_photo", photoRemoved ? "true" : "false");
    // El dueño ya aceptó los términos al activar; el aviso de qué se publica está en el último paso.
    if (isOwner && !landing.published) formData.set("public_visibility_ack", "yes");
    if (photoFile) formData.set("photo", photoFile);
    let result: PetSaveResult;
    try {
      result = await saveAction(formData);
    } catch (error) {
      if (String((error as { digest?: string })?.digest).startsWith("NEXT_REDIRECT")) throw error;
      result = { ok: false, error: OFFLINE };
    } finally {
      savingNow.current = false;
      setSaving(false);
    }
    if (!result.ok) { notify(result.error, true); return result; }
    setSaved({ name, pet: petToSave });
    // Los datos de alrededor que cambia el servidor (si quedó publicada, el link, la foto).
    router.refresh();
    setDirty(false);
    setPhotoFile(null);
    try { localStorage.removeItem(draftKey); } catch {}
    if (result.message && !quiet) notify(result.message);
    return result;
  }

  async function publish() {
    const result = await save();
    if (result?.ok) setScreen(result.firstPublish ? { name: "after", step: "ready" } : { name: "menu" });
  }

  async function savePanel() {
    if (!dirty) { setScreen({ name: "menu" }); return; }
    const result = await save();
    if (!result?.ok) return;
    setScreen(result.lostActivated ? { name: "spread" } : result.firstPublish ? { name: "after", step: "ready" } : { name: "menu" });
  }

  // Con cambios, "Cancelar" pregunta con un aviso propio (no la ventanita gris del navegador).
  function cancelPanel() {
    if (dirty) discardDialog.current?.showModal();
    else setScreen({ name: "menu" });
  }

  function discardChanges() {
    discardDialog.current?.close();
    setNameValue(saved.name);
    setPet(saved.pet);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoRemoved(false);
    setDirty(false);
    try { localStorage.removeItem(draftKey); } catch {}
    setScreen({ name: "menu" });
  }

  function restoreDraft() {
    if (!draft) return;
    setNameValue(draft.name);
    setPet(draft.pet);
    setDirty(true);
    setDraft(null);
  }

  function discardDraft() {
    try { localStorage.removeItem(draftKey); } catch {}
    setDraft(null);
  }

  function openBig() { setBigOpen(true); bigPreview.current?.showModal(); }

  // Ayuda ("¿Cómo funciona?" en el menú): la pantalla se oscurece y un cartelito por paso.
  async function startTour() {
    const { driver } = await import("driver.js");
    const steps = [
      { element: ".pet-mini", popover: { title: "Tu chapita", description: "Así la ve quien la escanea. Podés cambiarla todas las veces que quieras: el QR y el NFC físicos siguen funcionando." } },
      { element: ".pet-menu", popover: { title: "Todo lo que podés cambiar", description: "Tocá una fila para editarla. A la derecha ves lo que falta." } },
      { element: "[data-tour='row-family']", popover: { title: "Contacto público", description: "El WhatsApp que cargues aparece en la ficha para que quien encuentre a tu mascota pueda avisarte. Tu email de acceso no se muestra." } },
      { element: "[data-tour='row-lost']", popover: { title: "Si se pierde", description: `Acá prendés el cartel rojo de “${petGendered(pet, "¡Estoy perdido!", "¡Estoy perdida!")}”. Lo apagás cuando aparece.` } },
      { element: "[data-tour='row-ficha']", popover: { title: "Lo que falta", description: "Lo que dice “Agregar” en violeta todavía está vacío: tocalo para completarlo." } },
      { element: "[data-tour='row-look']", popover: { title: "Guardar", description: "Cada pantalla tiene “Cancelar” y “Guardar” arriba. Los cambios se ven en su página recién al guardar." } },
      ...(isOwner ? [{ element: ".pet-editor-portal", popover: { title: "Todas tus chapitas", description: "Acá volvés a tu panel: compartir, ver o avisar si se perdió. Para entrar otro día: bionfc.com/mi con tu email." } }] : []),
    ];
    driver({ showProgress: true, progressText: "{{current}} de {{total}}", nextBtnText: "Siguiente", prevBtnText: "Atrás", doneBtnText: "Entendido", overlayOpacity: 0.65, stagePadding: 6, stageRadius: 14, popoverClass: "pet-tour", steps }).drive();
  }

  const editor: Editor = {
    landing, isOwner, savedPet: saved.pet, pet, name, petName: name.trim() || "tu mascota", photoUrl, dirty, saving, screen,
    go: setScreen,
    change,
    setName: (value) => { setNameValue(value); setDirty(true); },
    about: (patch) => change({ about: { ...pet.about, ...patch } }),
    health: (patch) => change({ health: { ...pet.health, ...patch } }),
    setMember: (index, patch: Partial<PetFamily>) => change({ family: pet.family.map((member, current) => current === index ? { ...member, ...patch } : member) }),
    photo: { preparing: preparingPhoto, error: photoError, pick: () => photoInput.current?.click(), adjust: () => setAdjustingPhoto(true), remove: removePhoto },
    save, publish, savePanel, cancelPanel, openBig, startTour,
  };

  return <EditorProvider value={editor}>
    <div ref={editorRef} className={`pet-editor${screen.name !== "menu" ? " is-focused" : ""}`}>
      <FontLinks ids={PET_LOOKS.map((item) => item.titleFont)} />
      <header className={`pet-editor-top${isOwner ? " is-owner" : ""}`}>
        {isOwner
          ? <Link className="pet-editor-portal" href="/mi" aria-label="Ir a Mis chapitas"><FiChevronLeft aria-hidden="true" /><FiGrid aria-hidden="true" /><span>Mis chapitas</span></Link>
          : <Link className="pet-editor-back" href="/admin/chapitas/fichas" aria-label="Volver a Fichas de mascotas">←<span className="pet-editor-back-text">Fichas de mascotas</span></Link>}
        {/* El dueño: solo "Mis chapitas" (ver y compartir la página están ahí). */}
        {!isOwner && <div className="pet-editor-title"><small>{landing.published ? "Publicada" : "Borrador"}</small><strong>{name.trim() || "Tu chapita"}</strong></div>}
        <div className="pet-editor-actions">
          {!isOwner && <details className="pet-editor-more">
            <summary aria-label="Más opciones">⋯</summary>
            <div className="pet-editor-more-menu">
              {landing.published && <a href={`/mascota/${landing.slug}`} target="_blank" rel="noopener noreferrer">Ver chapita publicada</a>}
              {landing.published && <CopyButton text={`/mascota/${landing.slug}`} label="Copiar link" />}
              <Link href={`/admin/landings/${landing.id}/qr`}>QR y NFC</Link>
              {publishAction && <form action={publishAction} className="pet-editor-publish-menu">
                <input type="hidden" name="id" value={landing.id} />
                <input type="hidden" name="published" value={landing.published ? "false" : "true"} />
                <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/mascota`} />
                {!landing.published && <label className="pet-public-ack"><input type="checkbox" name="public_visibility_ack" value="yes" required /> Ficha y WhatsApp públicos</label>}
                <PendingSubmitButton pendingText={landing.published ? "Despublicando…" : "Publicando…"} disabled={dirty || (!landing.published && !petHasContact(pet))}>{landing.published ? "Despublicar" : "Publicar"}</PendingSubmitButton>
              </form>}
            </div>
          </details>}
          {saving && <span className="pet-editor-saving"><i className="spin" aria-hidden="true" />Guardando…</span>}
        </div>
      </header>

      {/* Un solo aviso a la vez, el más importante. */}
      {landing.blocked ? <p className="pet-editor-note is-danger">BIONFC pausó esta chapita y por ahora no se muestra. Si creés que es un error, escribinos a contacto.bionfc@gmail.com.</p>
        : draft ? <p className="pet-editor-note">Quedaron cambios sin guardar de la otra vez. <button type="button" className="pet-editor-link" onClick={restoreDraft}>Recuperarlos</button> · <button type="button" className="pet-editor-link" onClick={discardDraft}>Descartar</button></p>
        : null}

      <div className="pet-ed">
        <input ref={photoInput} type="file" accept="image/*" hidden onChange={(event) => pickPhoto(event.target.files?.[0])} />

        {/* Arriba (en la compu, a la izquierda): la chapita en un celular en miniatura. */}
        <div className="pet-ed-preview">
          <div className="pet-mini" role="button" tabIndex={0} aria-label="Ver la chapita en grande" onClick={(event) => { if (!(event.target as HTMLElement).closest(".pet-editable")) openBig(); }} onKeyDown={(event) => { if (event.key === "Enter") openBig(); }}>
            <div className="pet-mini-screen" ref={screenRef}>
              <PetRenderer landing={{ business_name: name }} pet={pet} photoUrl={photoUrl} edit={{ selected: sectionOf(screen), onSelect: (section) => { if (screen.name === "menu" || screen.name === "panel") setScreen({ name: "panel", panel: panelOf(section) }); } }} />
            </div>
          </div>
          {/* Al lado de la miniatura (en el celular): de quién es, si está publicada y verla en
              grande. Nada más. */}
          <div className="pet-summary">
            <strong>{name.trim() || "Tu chapita"}</strong>
            <span className={`pet-summary-state${landing.blocked ? " is-off" : landing.published ? " is-on" : ""}`}>{landing.blocked ? "Pausada" : landing.published ? "Publicada" : "Sin publicar"}</span>
            <button type="button" className="pet-summary-zoom" onClick={openBig}>Ver en grande</button>
          </div>
        </div>

        {/* Abajo: la pantalla que corresponda. Enter en un campo cierra el teclado; los campos
            con su propio Enter (los pasos) lo manejan antes. */}
        <div className="pet-ed-controls" onKeyDown={(event) => {
          const target = event.target as HTMLElement;
          if (event.key !== "Enter" || event.defaultPrevented || target.tagName !== "INPUT") return;
          event.preventDefault();
          target.blur();
        }}>
          {screen.name === "setup" && <SetupScreen step={screen.step} />}
          {screen.name === "after" && <AfterScreen step={screen.step} />}
          {screen.name === "spread" && <SpreadScreen />}
          {screen.name === "menu" && <MenuScreen />}
          {screen.name === "panel" && <PanelScreen panel={screen.panel} />}
        </div>

        {adjustingPhoto && photoUrl && <PetPhotoAdjust src={photoUrl} initial={pet.photo} onCancel={() => setAdjustingPhoto(false)} onApply={(photo) => { change({ photo }); setAdjustingPhoto(false); }} />}

        <dialog ref={discardDialog} className="pet-confirm" aria-labelledby="pet-confirm-title" onClick={(event) => { if (event.target === discardDialog.current) discardDialog.current.close(); }}>
          <strong id="pet-confirm-title">¿Salir sin guardar?</strong>
          <p>Los cambios que hiciste en esta pantalla se van a perder.</p>
          <button type="button" className="pet-step-next" onClick={() => discardDialog.current?.close()}>Seguir editando</button>
          <button type="button" className="pet-confirm-leave" onClick={discardChanges}>Salir sin guardar</button>
        </dialog>

        <dialog ref={bigPreview} className="pet-big" onClose={() => setBigOpen(false)} onClick={(event) => { if (event.target === bigPreview.current) bigPreview.current.close(); }} aria-label="La chapita en grande">
          {bigOpen && <>
            <div className="pet-big-bar"><strong>Así se ve tu chapita</strong><button type="button" onClick={() => bigPreview.current?.close()}>Cerrar ✕</button></div>
            <div className="pet-big-content" onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><PetRenderer landing={{ slug: landing.slug, business_name: name }} pet={pet} photoUrl={photoUrl} /></div>
          </>}
        </dialog>
      </div>

      {notice && <ToastBubble key={notice.key} message={notice.message} isError={notice.isError} onDone={() => setNotice(null)} />}
    </div>
  </EditorProvider>;
}
