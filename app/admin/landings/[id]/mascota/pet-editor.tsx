"use client";

// Editor de la chapita de mascota (Admin y dueño). La chapita se ve entera, tal como se publica
// (components/pet-renderer.tsx), y cada parte se edita en un panel: en el celular sube desde
// abajo, en la compu queda al costado. Se abre tocando un chip de arriba o la parte de la chapita.
//
// La primera vez del dueño (recién activada, sin publicar) la guía es este mismo panel, que va
// pasando solo por Mascota → Ficha → Diseño; al terminar queda la chapita con "Publicar". Así hay
// una sola forma de editar, que se aprende haciéndola. Todo queda en borrador hasta guardar
// (savePet / saveMyPet).
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PetRenderer, { type PetSection } from "@/components/pet-renderer";
import CopyButton from "@/components/copy-button";
import PendingSubmitButton from "@/components/pending-submit-button";
import "driver.js/dist/driver.css";
import { compressImage } from "@/lib/compress-image";
import { getFontFamily, FontLinks } from "@/lib/fonts";
import { PET_FAMILY_MAX, PET_LOOKS, formatPhone, petHasContact, petPhoneProblem, type PetData, type PetFamily } from "@/lib/pet";

// "owner": el dueño, desde su panel (/mi). Sin QR, sin publicar a mano desde el Admin y volviendo
// a sus chapitas; publica con el botón de arriba (saveMyPet publica cuando hay un WhatsApp).
type Props = {
  landing: { id: string; slug: string; name: string; photoUrl: string; published: boolean; blocked?: boolean };
  initialPet: PetData;
  saveAction: (formData: FormData) => void | Promise<void>;
  publishAction?: (formData: FormData) => void | Promise<void>;
  mode?: "admin" | "owner";
};

type Panel = "pet" | "family" | "ficha" | "design" | "lost";

const PANELS: { id: Panel; label: string; icon: string }[] = [
  { id: "pet", label: "Mascota", icon: "🐶" },
  { id: "family", label: "Familia", icon: "📞" },
  { id: "ficha", label: "Ficha", icon: "📋" },
  { id: "design", label: "Diseño", icon: "🎨" },
  { id: "lost", label: "¿Se perdió?", icon: "🚨" },
];
const GUIDE: Panel[] = ["pet", "ficha", "design"];

// La chapita tiene más partes que paneles: ficha agrupa "Sobre mí", "Mi salud" y "Si me encontrás".
const panelOf = (section: PetSection): Panel => section === "about" || section === "health" || section === "finder" ? "ficha" : section;

// Opciones de un toque; tocar la elegida la desmarca.
function Choice({ label, options, value, onPick }: { label: string; options: string[]; value: string; onPick: (value: string) => void }) {
  return <div className="pet-field"><span>{label}</span><div className="pet-choice" role="group" aria-label={label}>
    {options.map((option) => <button type="button" key={option} className={value === option ? "active" : ""} aria-pressed={value === option} onClick={() => onPick(value === option ? "" : option)}>{option}</button>)}
  </div></div>;
}

export default function PetEditor({ landing, initialPet, saveAction, publishAction, mode = "admin" }: Props) {
  const isOwner = mode === "owner";
  const searchParams = useSearchParams();
  const [pet, setPet] = useState(initialPet);
  const [name, setName] = useState(landing.name);
  const firstTime = isOwner && !landing.published && !landing.blocked;
  // Guía de la primera vez: índice en GUIDE, o null si no hay guía (o ya terminó).
  const [guide, setGuide] = useState<number | null>(firstTime ? 0 : null);
  // Guía dejada a medias (en qué paso quedó), para ofrecer retomarla.
  const [guidePaused, setGuidePaused] = useState<number | null>(null);
  // ?seccion=lost abre directo esa parte (lo usa "Avisar que se perdió" en /mi).
  const requested = PANELS.find((item) => item.id === searchParams.get("seccion"))?.id;
  const [panel, setPanel] = useState<Panel | null>(firstTime ? "pet" : requested || null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // La foto elegida vive acá y se agrega al guardar: así no se pierde si el formulario se vacía
  // después de un error.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [draft, setDraft] = useState<{ name: string; pet: PetData } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const draftKey = `bionfc-pet-draft:${landing.id}`;
  // Ya publicada, lo que más se usa es avisar que se perdió: va primero.
  const panels = landing.published ? [PANELS[4], ...PANELS.slice(0, 4)] : PANELS;

  // En la compu el panel siempre está a la vista (al costado); en el celular se abre a pedido.
  useEffect(() => {
    if (!panel && window.matchMedia("(min-width: 900px)").matches) setPanel(landing.published ? "lost" : "pet");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al publicar después de la guía, una sola vez, los cartelitos de bienvenida (se recuerda en el
  // celular para no repetirlos).
  const startedFirstTime = useRef(firstTime);
  useEffect(() => {
    if (!landing.published || !startedFirstTime.current) return;
    startedFirstTime.current = false;
    setGuide(null);
    setPanel(null);
    const key = `bionfc-pet-welcome:${landing.id}`;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch {}
    const timer = setTimeout(() => startTour("welcome"), 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landing.published]);

  // Guardar vuelve a esta misma pantalla (con ?saved o ?error) sin recargarla: ahí termina el
  // "Guardando…", y solo si se guardó deja de haber cambios pendientes.
  useEffect(() => {
    setSaving(false);
    if (searchParams.get("saved")) {
      setDirty(false);
      setPhotoFile(null);
      try { localStorage.removeItem(draftKey); } catch {}
    }
  }, [landing, searchParams, draftKey]);

  // Borrador en el celular del dueño: si se le corta la sesión, se queda sin batería o cierra sin
  // guardar, al volver se le ofrece recuperar lo que había escrito.
  useEffect(() => {
    if (!isOwner) return;
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || "null") as { name: string; pet: PetData } | null;
      if (saved && JSON.stringify(saved) !== JSON.stringify({ name: landing.name, pet: initialPet })) setDraft(saved);
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

  const change = (patch: Partial<PetData>) => { setPet((current) => ({ ...current, ...patch })); setDirty(true); };
  const setMember = (index: number, patch: Partial<PetFamily>) => change({ family: pet.family.map((member, current) => current === index ? { ...member, ...patch } : member) });
  const about = (patch: Partial<PetData["about"]>) => change({ about: { ...pet.about, ...patch } });
  const health = (patch: Partial<PetData["health"]>) => change({ health: { ...pet.health, ...patch } });

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
    const compressed = await compressImage(file, 900, 0.85);
    if (photoInput.current) photoInput.current.value = "";
    if (!["image/jpeg", "image/png", "image/webp"].includes(compressed.type)) { setPhotoError("Ese formato de foto no sirve. Elegí una foto JPG o PNG."); return; }
    if (compressed.size > 4.5 * 1024 * 1024) { setPhotoError("La foto es muy pesada. Probá con otra o sacale una captura de pantalla."); return; }
    setPhotoFile(compressed);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(compressed));
    setPhotoRemoved(false);
    setDirty(true);
  }

  function removePhoto() {
    if (photoInput.current) photoInput.current.value = "";
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoRemoved(true);
    setDirty(true);
  }

  async function submit(formData: FormData) {
    if (photoFile) formData.set("photo", photoFile);
    await saveAction(formData);
  }

  function restoreDraft() {
    if (!draft) return;
    setName(draft.name);
    setPet(draft.pet);
    setDirty(true);
    setDraft(null);
  }

  function discardDraft() {
    try { localStorage.removeItem(draftKey); } catch {}
    setDraft(null);
  }

  // Teclado del celular: el panel se apoya justo arriba del teclado y usa solo el alto que queda
  // libre (visualViewport), así no tapa lo que se escribe. Con el teclado abierto el panel ocupa
  // todo ese alto y el campo elegido queda centrado.
  const sheetRef = useRef<HTMLElement>(null);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || !panel) return;
    const update = () => {
      const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      sheetRef.current?.style.setProperty("--kb", `${keyboard}px`);
      sheetRef.current?.style.setProperty("--vvh", `${viewport.height}px`);
      setTyping(keyboard > 120);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => { viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); };
  }, [panel]);
  const keepFieldVisible = (target: EventTarget) => {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  };

  // Celular con un panel abierto: la chapita entera, achicada como un celular en miniatura, en el
  // espacio que queda entre los chips y el panel. Así se ve el efecto completo de cada cambio
  // (sobre todo del diseño). Con el panel cerrado vuelve a tamaño real.
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const mobile = !window.matchMedia("(min-width: 900px)").matches;
      const nav = document.querySelector(".pet-editor-nav")?.getBoundingClientRect();
      const sheet = sheetRef.current?.getBoundingClientRect();
      const page = stage.querySelector(".pet-page");
      if (!panel || !mobile || typing || !nav || !sheet || !page) { stage.classList.remove("is-mini"); stage.style.removeProperty("--mini"); return; }
      const top = Math.max(nav.bottom, 0) + 10;
      const height = Math.max(90, sheet.top - top - 10);
      const current = Number(stage.style.getPropertyValue("--mini")) || 1;
      const natural = page.getBoundingClientRect().height / current + 16;
      stage.classList.add("is-mini");
      stage.style.setProperty("--mini-top", `${top}px`);
      stage.style.setProperty("--mini-height", `${height}px`);
      stage.style.setProperty("--mini", String(Math.min(0.62, Math.max(0.18, height / natural))));
    };
    const frame = requestAnimationFrame(fit);
    // El panel entra con una animación corta: se vuelve a medir cuando terminó.
    const later = setTimeout(fit, 260);
    window.addEventListener("resize", fit);
    return () => { cancelAnimationFrame(frame); clearTimeout(later); window.removeEventListener("resize", fit); };
  }, [panel, typing, pet, name, photoPreview]);

  // Avanzar en la guía; al pasar el último paso se cierra el panel y queda la chapita con
  // "Publicar" resaltado.
  function nextGuide() {
    if (guide === null) return;
    const next = guide + 1;
    if (next < GUIDE.length) { setGuide(next); setPanel(GUIDE[next]); return; }
    setGuide(null);
    setGuidePaused(null);
    setPanel(window.matchMedia("(min-width: 900px)").matches ? "design" : null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Salir de la guía antes de terminarla (otra parte o ✕) la deja en pausa: arriba queda
  // "Seguir con el armado" para retomarla donde quedó. El paso 1 (nombre y WhatsApp) es
  // obligatorio: hasta completarlo no se puede salir.
  function leaveGuide() {
    if (guide === null) return;
    setGuidePaused(guide);
    setGuide(null);
  }

  function resumeGuide() {
    if (guidePaused === null) return;
    setGuide(guidePaused);
    setPanel(GUIDE[guidePaused]);
    setGuidePaused(null);
  }

  function openPanel(next: Panel) {
    if (guide === 0 && !guideReady) return;
    if (guide !== null && next !== GUIDE[guide]) leaveGuide();
    setPanel(next);
  }

  function closePanel() {
    if (guide === 0 && !guideReady) return;
    leaveGuide();
    setPanel(null);
  }

  // Recorridos con la pantalla oscurecida y un cartelito por paso (driver.js):
  //  · "welcome": una sola vez, al publicar después de la guía. Dónde se cambia todo, dónde se
  //    avisa que se perdió y cómo volver a entrar.
  //  · "help": el botón "?", cuando la persona lo pide.
  async function startTour(kind: "welcome" | "help") {
    const { driver } = await import("driver.js");
    const steps = kind === "welcome" ? [
      { element: ".pet-editor-nav", popover: { title: "¡Tu chapita ya funciona! 🎉", description: "Acá cambiás cualquier cosa cuando quieras: la foto, la familia, la ficha o el diseño. También podés tocar la chapita." } },
      { element: "[data-tour='tab-lost']", popover: { title: "Si se pierde", description: "Tocás acá, prendés el modo perdido y en la chapita aparece un cartel rojo con la zona y la recompensa." } },
      { element: ".pet-editor-back", popover: { title: "Para volver a entrar", description: "Entrá a bionfc.com/mi con tu email: te llega un código y listo. No hay contraseña." } },
    ] : [
      { element: ".pet-editor-nav", popover: { title: "Cada parte de la chapita", description: "Tocá una para cambiarla. También podés tocar directo la parte en la chapita." } },
      { element: "[data-tour='tab-lost']", popover: { title: "Si se pierde", description: "Acá prendés el cartel rojo de “¡Estoy perdido!”, con la zona y la recompensa. Lo apagás cuando aparece." } },
      { element: "[data-tour='tab-design']", popover: { title: "Diseño", description: "Cambiá colores y letras. Los datos no se tocan." } },
      { element: ".pet-editor-save", popover: { title: "Guardar", description: "Los cambios se ven en la chapita recién cuando tocás este botón." } },
    ];
    driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente",
      prevBtnText: "Atrás",
      doneBtnText: "Entendido",
      overlayOpacity: 0.65,
      stagePadding: 6,
      stageRadius: 14,
      popoverClass: "pet-tour",
      steps,
    }).drive();
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    if (saving) { event.preventDefault(); return; }
    setSaving(true);
  }

  const photoUrl = photoPreview ?? (photoRemoved ? "" : landing.photoUrl);
  const hasContact = petHasContact(pet);
  const firstPhone = pet.family[0]?.phone || "";
  const setFirstPhone = (phone: string) => change({ family: pet.family.length ? pet.family.map((member, index) => index === 0 ? { ...member, phone } : member) : [{ name: "", phone }] });
  const phoneOk = hasContact && !petPhoneProblem(firstPhone);
  const canPublishAsOwner = isOwner && !landing.published && !landing.blocked && Boolean(name.trim()) && hasContact;
  const guideReady = guide !== 0 || (Boolean(name.trim()) && phoneOk);
  const phoneStatus = (phone: string) => {
    if (!phone.trim()) return null;
    const problem = petPhoneProblem(phone);
    return problem ? <small className="pet-phone-warn">{problem}</small> : <small className="pet-phone-ok">✓ Va a quedar así: {formatPhone(phone)}</small>;
  };
  const field = (label: string, input: ReactNode, help?: string) => <label className="pet-field"><span>{label}</span>{input}{help && <small>{help}</small>}</label>;
  const petName = name.trim() || "tu mascota";
  const saveLabel = saving ? (isOwner && !landing.published ? "Publicando…" : "Guardando…")
    : isOwner && !landing.published ? "Publicar" : dirty ? "Guardar" : "Guardado";
  const panelTitle = panel ? PANELS.find((item) => item.id === panel)!.label : "";

  return <div className={`pet-editor${panel ? " has-panel" : ""}`}>
    <FontLinks ids={PET_LOOKS.map((look) => look.titleFont)} />
    <header className="pet-editor-top">
      <Link className="pet-editor-back" href={isOwner ? "/mi" : "/admin/chapitas/fichas"} aria-label={isOwner ? "Volver a Mis chapitas" : "Volver a Fichas de mascotas"}>←<span className="pet-editor-back-text"> {isOwner ? "Mis chapitas" : "Fichas de mascotas"}</span></Link>
      <div className="pet-editor-title"><small>{landing.published ? "Publicada" : isOwner ? "Sin publicar" : "Borrador"}</small><strong>{name.trim() || "Tu chapita"}</strong></div>
      <div className="pet-editor-actions">
        {guide === null && <button type="button" className="pet-editor-ghost pet-editor-help-trigger" onClick={() => startTour("help")} aria-label="Ayuda">?</button>}
        {(landing.published || !isOwner) && <details className="pet-editor-more">
          <summary aria-label="Más opciones">⋯</summary>
          <div className="pet-editor-more-menu">
            {landing.published && <a href={`/mascota/${landing.slug}`} target="_blank" rel="noopener noreferrer">Ver chapita publicada</a>}
            {landing.published && <CopyButton text={`/mascota/${landing.slug}`} label="Copiar link" />}
            {!isOwner && <Link href={`/admin/landings/${landing.id}/qr`}>QR y NFC</Link>}
          </div>
        </details>}
        {!isOwner && publishAction && <form action={publishAction} className="pet-editor-publish">
          <input type="hidden" name="id" value={landing.id} />
          <input type="hidden" name="published" value={landing.published ? "false" : "true"} />
          <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/mascota`} />
          {!landing.published && <label className="pet-public-ack"><input type="checkbox" name="public_visibility_ack" value="yes" required /> Ficha y WhatsApp públicos</label>}
          <PendingSubmitButton className="pet-editor-ghost" pendingText={landing.published ? "Despublicando…" : "Publicando…"} disabled={dirty || (!landing.published && !hasContact)}>{landing.published ? "Despublicar" : "Publicar"}</PendingSubmitButton>
        </form>}
        <button type="submit" form="pet-save" className={`pet-editor-save${canPublishAsOwner && guide === null ? " is-ready" : ""}`} disabled={saving || (isOwner && !landing.published ? !canPublishAsOwner : !dirty)}>{saveLabel}</button>
      </div>
    </header>

    <nav className="pet-editor-nav" aria-label="Partes de la chapita">
      {panels.map((item) => <button type="button" key={item.id} className={`${panel === item.id ? "active" : ""}${item.id === "lost" ? " is-lost-tab" : ""}${item.id === "lost" && pet.lost ? " is-on" : ""}`} aria-pressed={panel === item.id} disabled={guide === 0 && !guideReady && item.id !== "pet"} data-tour={`tab-${item.id}`} onClick={() => openPanel(item.id)}>
        <span aria-hidden="true">{item.icon}</span>{item.label}
      </button>)}
    </nav>

    {/* Un solo aviso a la vez, el más importante. */}
    {landing.blocked ? <p className="pet-editor-note is-danger">BIONFC pausó esta chapita y por ahora no se muestra. Si creés que es un error, escribinos a contacto.bionfc@gmail.com.</p>
      : draft ? <p className="pet-editor-note">Quedaron cambios sin guardar de la otra vez. <button type="button" className="pet-editor-link" onClick={restoreDraft}>Recuperarlos</button> · <button type="button" className="pet-editor-link" onClick={discardDraft}>Descartar</button></p>
      : isOwner && !landing.published && guide === null && guidePaused !== null ? <p className="pet-editor-note is-resume">Te falta terminar el armado (paso {guidePaused + 1} de {GUIDE.length}). <button type="button" className="pet-editor-resume" onClick={resumeGuide}>Seguir ▶</button></p>
      : isOwner && !landing.published && guide === null ? <p className="pet-editor-note is-tip">{canPublishAsOwner ? <>¡Casi lista! Revisala y tocá <strong>Publicar</strong>. Tocá cualquier parte para cambiarla.</> : <>Falta {!name.trim() ? "el nombre" : "tu WhatsApp"} para publicarla. <button type="button" className="pet-editor-link" onClick={() => openPanel(!name.trim() ? "pet" : "family")}>Completar</button></>}</p>
      : null}

    <form id="pet-save" action={submit} onSubmit={handleSave} className="pet-editor-body">
      <input type="hidden" name="landing_id" value={landing.id} />
      <input type="hidden" name="business_name" value={name} />
      <input type="hidden" name="pet" value={JSON.stringify(pet)} />
      <input type="hidden" name="remove_photo" value={photoRemoved ? "true" : "false"} />
      {/* El dueño ya aceptó los términos al activar; el aviso de qué se publica está en la chapita. */}
      {isOwner && !landing.published && <input type="hidden" name="public_visibility_ack" value="yes" />}
      <input ref={photoInput} type="file" accept="image/*" hidden onChange={(event) => pickPhoto(event.target.files?.[0])} />

      <div className="pet-stage" ref={stageRef}>
        <div className="pet-stage-frame">
          <PetRenderer landing={{ business_name: name }} pet={pet} photoUrl={photoUrl} edit={{ selected: panel === "ficha" ? "about" : panel || "design", onSelect: (section) => openPanel(panelOf(section)) }} />
        </div>
        <p className="pet-stage-hint">Tocá cualquier parte de la chapita para cambiarla.</p>
      </div>

      {panel ? <section ref={sheetRef} className={`pet-sheet${typing ? " is-typing" : ""}`} aria-label={`Editar: ${panelTitle}`}>
        <header className="pet-sheet-head">
          <div>{guide !== null && <small>Paso {guide + 1} de {GUIDE.length}</small>}<strong>{panel === "pet" && guide !== null ? `Tu mascota` : panel === "ficha" ? `La ficha de ${petName}` : panelTitle}</strong></div>
          {!(guide === 0 && !guideReady) && <button type="button" className="pet-sheet-close" onClick={closePanel} aria-label="Cerrar">✕</button>}
        </header>

        <div className="pet-sheet-body" onFocusCapture={(event) => keepFieldVisible(event.target)}>
          {panel === "pet" && <>
            <div className="pet-photo-field">
              <button type="button" className="pet-photo-thumb" onClick={() => photoInput.current?.click()} aria-label={photoUrl ? "Cambiar foto" : "Subir foto"}>{/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}{photoUrl ? <img src={photoUrl} alt="" /> : <span>📷</span>}</button>
              <div>
                <button type="button" className="pet-editor-ghost" onClick={() => photoInput.current?.click()}>{photoUrl ? "Cambiar foto" : "Subir foto"}</button>
                {photoUrl && <button type="button" className="pet-editor-link" onClick={removePhoto}>Quitar</button>}
                <small>De frente y con buena luz.</small>
              </div>
            </div>
            {photoError && <p className="pet-phone-warn">{photoError}</p>}
            {field("Nombre", <input value={name} maxLength={60} placeholder="Ej: Toby" onChange={(event) => { setName(event.target.value); setDirty(true); }} />)}
            {(guide !== null || (isOwner && !landing.published && pet.family.length <= 1)) && <label className="pet-field"><span>Tu WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" value={firstPhone} maxLength={30} placeholder="351 555 1234" onChange={(event) => setFirstPhone(event.target.value)} /><small>Con la característica. Si alguien encuentra a {petName}, te escribe acá con un toque.</small>{phoneStatus(firstPhone)}</label>}
            {guide === null && <>
              {field("Saludo", <input value={pet.greeting} maxLength={40} placeholder="¡Hola! Soy" onChange={(event) => change({ greeting: event.target.value })} />, "Va arriba del nombre. Vacío no se muestra.")}
              {field("Mensaje", <textarea rows={2} value={pet.message} maxLength={200} onChange={(event) => change({ message: event.target.value })} />, "Lo primero que lee quien la encuentra.")}
            </>}
          </>}

          {panel === "family" && <>
            <p className="pet-editor-help">Cada persona tiene su botón de WhatsApp, con el mensaje “¡Hola! Encontré a {petName} 🐾” ya escrito, y otro para llamar.</p>
            {pet.family.map((member, index) => <div className="pet-member" key={index}>
              <div className="pet-member-head"><strong>Persona {index + 1}</strong>{pet.family.length > 1 && <button type="button" className="pet-editor-link" onClick={() => change({ family: pet.family.filter((_, current) => current !== index) })}>Quitar</button>}</div>
              {field("Nombre (opcional)", <input value={member.name} maxLength={40} placeholder="Ej: Ana" onChange={(event) => setMember(index, { name: event.target.value })} />, "El botón dice “Avisale a Ana”.")}
              <label className="pet-field"><span>WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" value={member.phone} maxLength={30} placeholder="351 555 1234" onChange={(event) => setMember(index, { phone: event.target.value })} />{phoneStatus(member.phone)}</label>
            </div>)}
            {pet.family.length < PET_FAMILY_MAX && <button type="button" className="pet-editor-ghost" onClick={() => change({ family: [...pet.family, { name: "", phone: "" }] })}>+ Agregar {pet.family.length ? "otra persona" : "una persona"}</button>}
          </>}

          {panel === "ficha" && <>
            <p className="pet-editor-help">Opcional, pero ayuda a que vuelva más rápido. Lo que dejes vacío no se muestra.</p>
            <fieldset className="pet-group"><legend>Sobre {petName}</legend>
              <div className="pet-row">
                {field("Raza", <input value={pet.about.breed} maxLength={80} placeholder="Ej: Mestizo" onChange={(event) => about({ breed: event.target.value })} />)}
                {field("Edad", <input value={pet.about.age} maxLength={80} placeholder="Ej: 4 años" onChange={(event) => about({ age: event.target.value })} />)}
              </div>
              <Choice label="Sexo" options={["Macho", "Hembra"]} value={pet.about.sex} onPick={(sex) => about({ sex })} />
              <Choice label="Tamaño" options={["Chico", "Mediano", "Grande"]} value={pet.about.size} onPick={(size) => about({ size })} />
              <div className="pet-row">
                {field("Color", <input value={pet.about.color} maxLength={80} placeholder="Ej: Marrón" onChange={(event) => about({ color: event.target.value })} />)}
                {field("Carácter", <input value={pet.about.character} maxLength={80} placeholder="Ej: Manso" onChange={(event) => about({ character: event.target.value })} />)}
              </div>
            </fieldset>
            <fieldset className="pet-group"><legend>Salud</legend>
              <div className="pet-row">
                <Choice label="Vacunas" options={["Al día", "No"]} value={pet.health.vaccines} onPick={(vaccines) => health({ vaccines })} />
                <Choice label="Castrado" options={["Sí", "No"]} value={pet.health.neutered} onPick={(neutered) => health({ neutered })} />
              </div>
              {field("Medicación", <input value={pet.health.medication} maxLength={120} placeholder="Ej: Una pastilla por día" onChange={(event) => health({ medication: event.target.value })} />)}
              {field("Alergias", <input value={pet.health.allergies} maxLength={120} placeholder="Ej: Ninguna" onChange={(event) => health({ allergies: event.target.value })} />)}
              {field("Veterinaria", <input value={pet.health.vet} maxLength={120} placeholder="Ej: Patitas · 351 555-1234" onChange={(event) => health({ vet: event.target.value })} />)}
            </fieldset>
            {field("Si alguien la encuentra…", <textarea rows={3} value={pet.finder} maxLength={500} placeholder={"Ej: Soy manso pero un poco miedoso.\nAcercate despacio y llamame por mi nombre."} onChange={(event) => change({ finder: event.target.value })} />)}
          </>}

          {panel === "design" && <>
            <p className="pet-editor-help">Tocá un estilo y mirá cómo queda. Solo cambia la apariencia.</p>
            <div className="pet-looks">{PET_LOOKS.map((look) => <button type="button" key={look.id} className={`pet-look-option look-${look.id}${pet.look === look.id ? " active" : ""}`} aria-pressed={pet.look === look.id} onClick={() => change({ look: look.id })} style={{ "--look-bg": look.background, "--look-bg-to": look.backgroundTo, "--look-accent": look.accent, "--look-accent-ink": look.accentInk, "--look-ink": look.ink, "--look-card": look.card, "--look-title-font": getFontFamily(look.titleFont) } as CSSProperties}>
              <span className="pet-look-mini" aria-hidden="true"><span className="pet-look-mini-name">{name.trim() || "Toby"}</span><span className="pet-look-mini-cta">Avisale</span></span>
              <span className="pet-look-caption"><strong>{look.label}</strong></span>
            </button>)}</div>
          </>}

          {panel === "lost" && <>
            <button type="button" className={`pet-switch${pet.lost ? " is-on" : ""}`} role="switch" aria-checked={pet.lost} onClick={() => change({ lost: !pet.lost })}>
              <span className="pet-switch-track" aria-hidden="true" />
              <span><strong>{pet.lost ? "Modo perdido prendido" : "Modo perdido apagado"}</strong><small>Prendelo si se perdió: arriba de la chapita aparece un cartel rojo. Apagalo cuando aparezca. Se aplica al guardar.</small></span>
            </button>
            {field("Dónde se perdió (opcional)", <input value={pet.lostZone} maxLength={120} placeholder="Ej: Barrio Cofico, cerca de la plaza" onChange={(event) => change({ lostZone: event.target.value })} />)}
            {field("Recompensa (opcional)", <input value={pet.reward} maxLength={60} placeholder="Ej: $50.000" onChange={(event) => change({ reward: event.target.value })} />)}
          </>}
        </div>

        <footer className="pet-sheet-foot">
          {guide === null
            ? <button type="button" className="pet-sheet-done" onClick={closePanel}>Listo</button>
            : <>
              {guide > 0 && <button type="button" className="pet-editor-ghost" onClick={nextGuide}>Saltar</button>}
              <button type="button" className="pet-sheet-done" onClick={nextGuide} disabled={!guideReady}>{!guideReady ? (!name.trim() ? "Falta el nombre" : "Falta un WhatsApp válido") : guide === GUIDE.length - 1 ? "Ver mi chapita →" : "Siguiente →"}</button>
            </>}
        </footer>
      </section> : <div className="pet-sheet-empty">Tocá una parte de la chapita o elegí arriba qué cambiar.</div>}
    </form>
  </div>;
}
