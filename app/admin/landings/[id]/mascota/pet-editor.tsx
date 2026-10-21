"use client";

// Editor de la chapita de mascota (Admin y dueño). Pantalla fija en dos partes, como una app:
// arriba, la chapita en un celular en miniatura, siempre del mismo tamaño, que se mueve sola a la
// parte que se está editando (y se ve en grande tocándola); abajo, las opciones.
//
// La primera vez del dueño (recién activada, sin publicar) son dos pasos obligatorios: foto y
// nombre, y su WhatsApp. Después, siempre, un menú como el de ajustes del celular (Mascota,
// Familia, Ficha, Diseño, ¿Se perdió?) con el estado de cada cosa; tocar una fila abre su
// formulario con "← Volver". Todo queda en borrador hasta guardar (savePet / saveMyPet).
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PetRenderer, { type PetSection } from "@/components/pet-renderer";
import CopyButton from "@/components/copy-button";
import PendingSubmitButton from "@/components/pending-submit-button";
import "driver.js/dist/driver.css";
import { compressImage } from "@/lib/compress-image";
import { FontLinks } from "@/lib/fonts";
import { PET_ABOUT_FIELDS, PET_FAMILY_MAX, PET_HEALTH_FIELDS, PET_LOOKS, formatPhone, petHasContact, petLook, petPhoneProblem, petRows, type PetData, type PetFamily } from "@/lib/pet";

// "owner": el dueño, desde su panel (/mi). Sin QR ni publicar desde el Admin; publica con el
// botón de arriba (saveMyPet publica cuando hay un WhatsApp).
type Props = {
  landing: { id: string; slug: string; name: string; photoUrl: string; published: boolean; blocked?: boolean };
  initialPet: PetData;
  saveAction: (formData: FormData) => void | Promise<void>;
  publishAction?: (formData: FormData) => void | Promise<void>;
  mode?: "admin" | "owner";
};

type Panel = "pet" | "family" | "ficha" | "lost";
type View = "menu" | Panel;

const TITLES: Record<Panel, { label: string; icon: string }> = {
  pet: { label: "Mascota", icon: "🐶" },
  family: { label: "Familia", icon: "📞" },
  ficha: { label: "Ficha", icon: "📋" },
  lost: { label: "¿Se perdió?", icon: "🚨" },
};

// Qué parte de la chapita muestra la miniatura mientras se edita cada cosa.
const PART_OF: Record<View, string> = { menu: ".pet-page", pet: ".pet-hero", family: ".pet-family", ficha: ".pet-card, .pet-family", lost: ".pet-page" };
// Las partes de la chapita que se tocan en la miniatura llevan a su formulario.
const viewOf = (section: PetSection): View => section === "about" || section === "health" || section === "finder" ? "ficha" : section === "design" ? "menu" : section;

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
  // Pasos obligatorios de la primera vez (0: foto y nombre, 1: WhatsApp), o null.
  const [setup, setSetup] = useState<0 | 1 | null>(firstTime ? 0 : null);
  const [justSetUp, setJustSetUp] = useState(false);
  // ?seccion=lost abre directo esa parte (lo usa "Avisar que se perdió" en /mi).
  const requested = searchParams.get("seccion");
  const [view, setView] = useState<View>(requested === "lost" || requested === "pet" || requested === "family" || requested === "ficha" ? requested : "menu");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typing, setTyping] = useState(false);
  // La foto elegida vive acá y se agrega al guardar: así no se pierde si el formulario se vacía
  // después de un error.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [draft, setDraft] = useState<{ name: string; pet: PetData } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const bigPreview = useRef<HTMLDialogElement>(null);
  const [bigOpen, setBigOpen] = useState(false);
  const draftKey = `bionfc-pet-draft:${landing.id}`;

  // Al publicar después de los pasos de la primera vez, una sola vez, los cartelitos de
  // bienvenida (se recuerda en el celular para no repetirlos).
  const startedFirstTime = useRef(firstTime);
  useEffect(() => {
    if (!landing.published || !startedFirstTime.current) return;
    startedFirstTime.current = false;
    setSetup(null);
    setJustSetUp(false);
    setView("menu");
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

  // Teclado del celular: la pantalla usa solo el alto que queda libre (visualViewport) y, con el
  // teclado abierto, la miniatura se esconde para dejarle todo el lugar a lo que se escribe.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => {
      const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      editorRef.current?.style.setProperty("--vvh", `${viewport.height}px`);
      setTyping(keyboard > 120);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => { viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); };
  }, []);

  // La miniatura se mueve sola a la parte que se está editando.
  useEffect(() => {
    const screen = screenRef.current;
    const part = screen?.querySelector(PART_OF[setup === 1 ? "family" : setup === 0 ? "pet" : view]);
    if (!screen || !part) return;
    const timer = setTimeout(() => {
      const offset = (part as HTMLElement).offsetTop - 16;
      screen.scrollTo({ top: view === "menu" && setup === null ? 0 : Math.max(0, offset), behavior: "smooth" });
    }, 60);
    return () => clearTimeout(timer);
  }, [view, setup]);

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

  function openView(next: View) {
    if (setup !== null) return;
    setView(next);
  }

  // Recorridos con la pantalla oscurecida y un cartelito por paso (driver.js):
  //  · "welcome": una sola vez, al publicar después de los pasos de la primera vez.
  //  · "help": el botón "?", cuando la persona lo pide.
  async function startTour(kind: "welcome" | "help") {
    const { driver } = await import("driver.js");
    const steps = kind === "welcome" ? [
      { element: ".pet-menu", popover: { title: "¡Tu chapita ya funciona! 🎉", description: "Acá cambiás cualquier cosa cuando quieras: la foto, la familia, la ficha o el diseño." } },
      { element: "[data-tour='row-lost']", popover: { title: "Si se pierde", description: "Tocás acá, prendés el modo perdido y en la chapita aparece un cartel rojo con la zona y la recompensa." } },
      { element: ".pet-editor-back", popover: { title: "Para volver a entrar", description: "Entrá a bionfc.com/mi con tu email: te llega un código y listo. No hay contraseña." } },
    ] : [
      { element: ".pet-mini", popover: { title: "Tu chapita", description: "Así la ve quien la escanea. Tocala para verla en grande, o tocá una parte para cambiarla." } },
      { element: ".pet-menu", popover: { title: "Todo lo que podés cambiar", description: "Tocá una fila para editarla. A la derecha ves cómo está cada cosa." } },
      { element: "[data-tour='row-lost']", popover: { title: "Si se pierde", description: "Acá prendés el cartel rojo de “¡Estoy perdido!”. Lo apagás cuando aparece." } },
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
  const phoneStatus = (phone: string) => {
    if (!phone.trim()) return null;
    const problem = petPhoneProblem(phone);
    return problem ? <small className="pet-phone-warn">{problem}</small> : <small className="pet-phone-ok">✓ Va a quedar así: {formatPhone(phone)}</small>;
  };
  const field = (label: string, input: ReactNode, help?: string) => <label className="pet-field"><span>{label}</span>{input}{help && <small>{help}</small>}</label>;
  const petName = name.trim() || "tu mascota";
  const saveLabel = saving ? (isOwner && !landing.published ? "Publicando…" : "Guardando…")
    : isOwner && !landing.published ? "Publicar" : dirty ? "Guardar" : "Guardado";
  const contacts = pet.family.filter((member) => member.phone.trim()).length;
  const fichaCount = petRows(pet.about, PET_ABOUT_FIELDS).length + petRows(pet.health, PET_HEALTH_FIELDS).length + (pet.finder.trim() ? 1 : 0);
  const look = petLook(pet.look);
  const rows: { id: Panel; status: string; warn?: boolean }[] = [
    { id: "pet", status: name.trim() || "Sin nombre", warn: !name.trim() },
    { id: "family", status: contacts ? `${contacts} ${contacts === 1 ? "contacto" : "contactos"}` : "Falta el WhatsApp", warn: !hasContact },
    { id: "ficha", status: fichaCount ? `${fichaCount} ${fichaCount === 1 ? "dato" : "datos"}` : "Completar" },
    { id: "lost", status: pet.lost ? "Prendido" : "Apagado", warn: pet.lost },
  ];
  // Ya publicada, lo que más se usa es avisar que se perdió: va primero.
  const orderedRows = landing.published ? [rows[3], ...rows.slice(0, 3)] : rows;

  return <div ref={editorRef} className={`pet-editor${typing ? " is-typing" : ""}`}>
    <FontLinks ids={PET_LOOKS.map((item) => item.titleFont)} />
    <header className="pet-editor-top">
      <Link className="pet-editor-back" href={isOwner ? "/mi" : "/admin/chapitas/fichas"} aria-label={isOwner ? "Volver a Mis chapitas" : "Volver a Fichas de mascotas"}>←<span className="pet-editor-back-text">{isOwner ? "Mis chapitas" : "Fichas de mascotas"}</span></Link>
      <div className="pet-editor-title"><small>{landing.published ? "Publicada" : isOwner ? "Sin publicar" : "Borrador"}</small><strong>{name.trim() || "Tu chapita"}</strong></div>
      <div className="pet-editor-actions">
        {setup === null && <button type="button" className="pet-editor-ghost pet-editor-help-trigger" onClick={() => startTour("help")} aria-label="Ayuda">?</button>}
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
        {setup === null && <button type="submit" form="pet-save" className={`pet-editor-save${canPublishAsOwner ? " is-ready" : ""}`} disabled={saving || (isOwner && !landing.published ? !canPublishAsOwner : !dirty)}>{saveLabel}</button>}
      </div>
    </header>

    {/* Un solo aviso a la vez, el más importante. */}
    {landing.blocked ? <p className="pet-editor-note is-danger">BIONFC pausó esta chapita y por ahora no se muestra. Si creés que es un error, escribinos a contacto.bionfc@gmail.com.</p>
      : draft ? <p className="pet-editor-note">Quedaron cambios sin guardar de la otra vez. <button type="button" className="pet-editor-link" onClick={restoreDraft}>Recuperarlos</button> · <button type="button" className="pet-editor-link" onClick={discardDraft}>Descartar</button></p>
      : null}

    <form id="pet-save" action={submit} onSubmit={handleSave} className="pet-ed">
      <input type="hidden" name="landing_id" value={landing.id} />
      <input type="hidden" name="business_name" value={name} />
      <input type="hidden" name="pet" value={JSON.stringify(pet)} />
      <input type="hidden" name="remove_photo" value={photoRemoved ? "true" : "false"} />
      {/* El dueño ya aceptó los términos al activar; el aviso de qué se publica está abajo. */}
      {isOwner && !landing.published && <input type="hidden" name="public_visibility_ack" value="yes" />}
      <input ref={photoInput} type="file" accept="image/*" hidden onChange={(event) => pickPhoto(event.target.files?.[0])} />

      {/* Arriba: la chapita en un celular en miniatura, siempre del mismo tamaño. */}
      <div className="pet-ed-preview">
        <div className="pet-mini" role="button" tabIndex={0} aria-label="Ver la chapita en grande" onClick={(event) => { if (!(event.target as HTMLElement).closest(".pet-editable")) { setBigOpen(true); bigPreview.current?.showModal(); } }} onKeyDown={(event) => { if (event.key === "Enter") { setBigOpen(true); bigPreview.current?.showModal(); } }}>
          <div className="pet-mini-screen" ref={screenRef}>
            <PetRenderer landing={{ business_name: name }} pet={pet} photoUrl={photoUrl} edit={{ selected: setup === 1 ? "family" : setup === 0 ? "pet" : view === "ficha" ? "about" : view === "menu" ? "design" : view, onSelect: (section) => openView(viewOf(section)) }} />
          </div>
        </div>
        <button type="button" className="pet-mini-zoom" onClick={() => { setBigOpen(true); bigPreview.current?.showModal(); }}>🔍 Ver en grande</button>
      </div>

      {/* Abajo: los pasos de la primera vez, el menú o el formulario de una parte. */}
      <div className="pet-ed-controls">
        {setup === 0 && <section className="pet-step">
          <p className="pet-step-count">Paso 1 de 2</p>
          <h2>¿Cómo se llama tu mascota?</h2>
          <div className="pet-photo-field">
            <button type="button" className="pet-photo-thumb" onClick={() => photoInput.current?.click()} aria-label={photoUrl ? "Cambiar foto" : "Subir foto"}>{/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}{photoUrl ? <img src={photoUrl} alt="" /> : <span>📷</span>}</button>
            <div>
              <button type="button" className="pet-editor-ghost" onClick={() => photoInput.current?.click()}>{photoUrl ? "Cambiar foto" : "Subir foto"}</button>
              <small>Opcional, pero ayuda a reconocerla.</small>
            </div>
          </div>
          {photoError && <p className="pet-phone-warn">{photoError}</p>}
          {field("Nombre", <input value={name} maxLength={60} placeholder="Ej: Toby" onChange={(event) => { setName(event.target.value); setDirty(true); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (name.trim()) setSetup(1); } }} />)}
          <button type="button" className="pet-step-next" disabled={!name.trim()} onClick={() => setSetup(1)}>{name.trim() ? "Siguiente →" : "Escribí el nombre"}</button>
        </section>}

        {setup === 1 && <section className="pet-step">
          <p className="pet-step-count">Paso 2 de 2</p>
          <h2>¿A qué WhatsApp te avisan?</h2>
          <p className="pet-editor-help">Si alguien encuentra a {petName}, toca un botón y te escribe a este número con el mensaje ya armado.</p>
          <label className="pet-field"><span>Tu WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" value={firstPhone} maxLength={30} placeholder="351 555 1234" onChange={(event) => setFirstPhone(event.target.value)} /><small>Con la característica, como lo marcás siempre.</small>{phoneStatus(firstPhone)}</label>
          <div className="pet-step-nav">
            <button type="button" className="pet-editor-ghost" onClick={() => setSetup(0)}>← Atrás</button>
            <button type="button" className="pet-step-next" disabled={!phoneOk} onClick={() => { setSetup(null); setJustSetUp(true); setView("menu"); }}>{phoneOk ? "Listo →" : "Falta un WhatsApp válido"}</button>
          </div>
        </section>}

        {setup === null && view === "menu" && <>
          {isOwner && !landing.published && <p className={`pet-ed-intro${canPublishAsOwner ? " is-ready" : ""}`}>{canPublishAsOwner
            ? <>{justSetUp ? "🎉 ¡Ya está! " : ""}Personalizala si querés y tocá <strong>Publicar</strong>. Quien la escanee verá estos datos y tu WhatsApp.</>
            : <>Para publicarla falta {!name.trim() ? "el nombre" : "tu WhatsApp"}.</>}</p>}
          <ul className="pet-menu">
            {orderedRows.map((row) => <li key={row.id}>
              <button type="button" className={`pet-menu-row${row.id === "lost" ? " is-lost" : ""}${row.id === "lost" && pet.lost ? " is-on" : ""}`} data-tour={`row-${row.id}`} onClick={() => openView(row.id)}>
                <span className="pet-menu-icon" aria-hidden="true">{TITLES[row.id].icon}</span>
                <span className="pet-menu-label">{TITLES[row.id].label}</span>
                <span className={`pet-menu-status${row.warn ? " is-warn" : ""}`}>{row.status}</span>
                <span className="pet-menu-go" aria-hidden="true">›</span>
              </button>
            </li>)}
            <li className="pet-menu-design" data-tour="row-design">
              <span className="pet-menu-icon" aria-hidden="true">🎨</span>
              <span className="pet-menu-label">Diseño <small>{look.label}</small></span>
              <span className="pet-swatches" role="group" aria-label="Diseño">{PET_LOOKS.map((item) => <button type="button" key={item.id} className={pet.look === item.id ? "active" : ""} aria-pressed={pet.look === item.id} aria-label={item.label} title={item.label} onClick={() => change({ look: item.id })} style={{ background: `linear-gradient(135deg, ${item.background} 0 50%, ${item.accent} 50% 100%)` }} />)}</span>
            </li>
          </ul>
        </>}

        {setup === null && view !== "menu" && <section className="pet-form">
          <header className="pet-form-head">
            <button type="button" className="pet-form-back" onClick={() => setView("menu")}>← Volver</button>
            <strong>{view === "ficha" ? `La ficha de ${petName}` : TITLES[view].label}</strong>
          </header>

          {view === "pet" && <>
            <div className="pet-photo-field">
              <button type="button" className="pet-photo-thumb" onClick={() => photoInput.current?.click()} aria-label={photoUrl ? "Cambiar foto" : "Subir foto"}>{/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}{photoUrl ? <img src={photoUrl} alt="" /> : <span>📷</span>}</button>
              <div>
                <button type="button" className="pet-editor-ghost" onClick={() => photoInput.current?.click()}>{photoUrl ? "Cambiar foto" : "Subir foto"}</button>
                {photoUrl && <button type="button" className="pet-editor-link" onClick={removePhoto}>Quitar</button>}
              </div>
            </div>
            {photoError && <p className="pet-phone-warn">{photoError}</p>}
            {field("Nombre", <input value={name} maxLength={60} placeholder="Ej: Toby" onChange={(event) => { setName(event.target.value); setDirty(true); }} />)}
            {field("Saludo", <input value={pet.greeting} maxLength={40} placeholder="¡Hola! Soy" onChange={(event) => change({ greeting: event.target.value })} />, "Va arriba del nombre. Vacío no se muestra.")}
            {field("Mensaje", <textarea rows={2} value={pet.message} maxLength={200} onChange={(event) => change({ message: event.target.value })} />, "Lo primero que lee quien la encuentra.")}
          </>}

          {view === "family" && <>
            <p className="pet-editor-help">Cada persona tiene su botón de WhatsApp, con el mensaje “¡Hola! Encontré a {petName} 🐾” ya escrito, y otro para llamar.</p>
            {pet.family.map((member, index) => <div className="pet-member" key={index}>
              <div className="pet-member-head"><strong>Persona {index + 1}</strong>{pet.family.length > 1 && <button type="button" className="pet-editor-link" onClick={() => change({ family: pet.family.filter((_, current) => current !== index) })}>Quitar</button>}</div>
              {field("Nombre (opcional)", <input value={member.name} maxLength={40} placeholder="Ej: Ana" onChange={(event) => setMember(index, { name: event.target.value })} />, "El botón dice “Avisale a Ana”.")}
              <label className="pet-field"><span>WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" value={member.phone} maxLength={30} placeholder="351 555 1234" onChange={(event) => setMember(index, { phone: event.target.value })} />{phoneStatus(member.phone)}</label>
            </div>)}
            {pet.family.length < PET_FAMILY_MAX && <button type="button" className="pet-editor-ghost" onClick={() => change({ family: [...pet.family, { name: "", phone: "" }] })}>+ Agregar {pet.family.length ? "otra persona" : "una persona"}</button>}
          </>}

          {view === "ficha" && <>
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

          {view === "lost" && <>
            <button type="button" className={`pet-switch${pet.lost ? " is-on" : ""}`} role="switch" aria-checked={pet.lost} onClick={() => change({ lost: !pet.lost })}>
              <span className="pet-switch-track" aria-hidden="true" />
              <span><strong>{pet.lost ? "Modo perdido prendido" : "Modo perdido apagado"}</strong><small>Prendelo si se perdió: arriba de la chapita aparece un cartel rojo. Apagalo cuando aparezca. Se aplica al guardar.</small></span>
            </button>
            {field("Dónde se perdió (opcional)", <input value={pet.lostZone} maxLength={120} placeholder="Ej: Barrio Cofico, cerca de la plaza" onChange={(event) => change({ lostZone: event.target.value })} />)}
            {field("Recompensa (opcional)", <input value={pet.reward} maxLength={60} placeholder="Ej: $50.000" onChange={(event) => change({ reward: event.target.value })} />)}
          </>}

          <button type="button" className="pet-step-next pet-form-done" onClick={() => setView("menu")}>Listo</button>
        </section>}
      </div>

      <dialog ref={bigPreview} className="pet-big" onClose={() => setBigOpen(false)} onClick={(event) => { if (event.target === bigPreview.current) bigPreview.current.close(); }} aria-label="La chapita en grande">
        {bigOpen && <>
          <div className="pet-big-bar"><strong>Así se ve tu chapita</strong><button type="button" onClick={() => bigPreview.current?.close()}>Cerrar ✕</button></div>
          <div className="pet-big-content" onClickCapture={(event) => { if ((event.target as HTMLElement).closest("a")) event.preventDefault(); }}><PetRenderer landing={{ slug: landing.slug, business_name: name }} pet={pet} photoUrl={photoUrl} /></div>
        </>}
      </dialog>
    </form>
  </div>;
}
