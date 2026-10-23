"use client";

// Editor de la chapita de mascota (Admin y dueño). En el celular, una cosa por pantalla y como
// página común (sin nada fijo, así el teclado del iPhone no tapa ni desacomoda nada):
//
// · La primera vez del dueño (recién activada, sin publicar): tres pasos, foto, nombre y
//   WhatsApp; el último publica.
// · Después: arriba la chapita en un celular en miniatura (se ve en grande tocándola) y un menú
//   como el de ajustes del celular (Modo perdido, Mascota, Contactos, Datos importantes, Diseño)
//   con el estado de cada cosa. Cada fila abre su propia pantalla, con "← Volver" y "Guardar
//   cambios". Todo queda en borrador hasta guardar (savePet / saveMyPet).
//
// En la compu, la miniatura queda siempre a la izquierda y se mueve sola a la parte que se edita.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { FiChevronLeft, FiGrid } from "react-icons/fi";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PetRenderer, { type PetSection } from "@/components/pet-renderer";
import CopyButton from "@/components/copy-button";
import PetShareButton, { PetSharePanel } from "@/components/pet-share-button";
import PendingSubmitButton from "@/components/pending-submit-button";
import PetPhotoAdjust from "./pet-photo-adjust";
import "driver.js/dist/driver.css";
import { compressImage } from "@/lib/compress-image";
import { FontLinks } from "@/lib/fonts";
import { PET_ABOUT_FIELDS, PET_FAMILY_MAX, PET_HEALTH_FIELDS, PET_LOOKS, cleanPhoneInput, formatPhone, parsePet, petForEditing, petHasContact, petGendered, petIsFemale, petLook, petPhoneProblem, petPhotoStyle, petRows, type PetData, type PetFamily } from "@/lib/pet";

// "owner": el dueño, desde su panel (/mi). Sin QR ni publicar desde el Admin; publica con el
// botón de arriba (saveMyPet publica cuando hay un WhatsApp).
type Props = {
  landing: { id: string; slug: string; name: string; photoUrl: string; published: boolean; blocked?: boolean };
  initialPet: PetData;
  saveAction: (formData: FormData) => void | Promise<void>;
  publishAction?: (formData: FormData) => void | Promise<void>;
  mode?: "admin" | "owner";
};

type Panel = "pet" | "family" | "ficha" | "look" | "lost";
type View = "menu" | Panel;
type SetupStep = 0 | 1 | 2;
// Pasos opcionales después de publicar por primera vez (ver "after" en el editor).
type AfterStep = "ready" | "look" | "about" | "family" | "lost" | "done";
const AFTER_STEPS: AfterStep[] = ["look", "about", "family", "lost"];

const TITLES: Record<Panel, { label: string; icon: string }> = {
  pet: { label: "Nombre y foto", icon: "🐶" },
  family: { label: "Contactos", icon: "📞" },
  ficha: { label: "Datos importantes", icon: "📋" },
  look: { label: "Diseño", icon: "🎨" },
  lost: { label: "Modo perdido", icon: "🚨" },
};
const PANELS = Object.keys(TITLES) as Panel[];

// Qué parte de la chapita muestra la miniatura mientras se edita cada cosa.
const PART_OF: Record<View, string> = { menu: ".pet-page", pet: ".pet-hero", family: ".pet-family", ficha: ".pet-card, .pet-family", look: ".pet-page", lost: ".pet-page" };
// Las partes de la chapita que se tocan en la miniatura llevan a su formulario.
const viewOf = (section: PetSection): View => section === "about" || section === "health" || section === "finder" ? "ficha" : section === "design" ? "look" : section;

// Opciones de un toque; tocar la elegida la desmarca.
function Choice({ label, options, value, onPick }: { label: string; options: string[]; value: string; onPick: (value: string) => void }) {
  return <div className="pet-field"><span>{label}</span><div className="pet-choice" role="group" aria-label={label}>
    {options.map((option) => <button type="button" key={option} className={value === option ? "active" : ""} aria-pressed={value === option} onClick={() => onPick(value === option ? "" : option)}>{option}</button>)}
  </div></div>;
}

export default function PetEditor({ landing, initialPet, saveAction, publishAction, mode = "admin" }: Props) {
  const isOwner = mode === "owner";
  const searchParams = useSearchParams();
  // Los teléfonos, como los escribe la gente ("351 555-1234"), no como se guardan.
  const [pet, setPet] = useState(() => petForEditing(initialPet));
  const [name, setName] = useState(landing.name);
  const firstTime = isOwner && !landing.published && !landing.blocked;
  // Pasos de la primera vez (0: foto, 1: nombre, 2: WhatsApp y publicar), o null.
  const [setup, setSetup] = useState<SetupStep | null>(firstTime ? 0 : null);
  // ?seccion=lost abre directo esa parte (lo usa "Avisar que se perdió" en /mi).
  const requested = searchParams.get("seccion");
  const [view, setView] = useState<View>(PANELS.includes(requested as Panel) ? requested as Panel : "menu");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  // La foto elegida vive acá y se agrega al guardar: así no se pierde si el formulario se vacía
  // después de un error.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [adjustingPhoto, setAdjustingPhoto] = useState(false);
  const [draft, setDraft] = useState<{ name: string; pet: PetData } | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const bigPreview = useRef<HTMLDialogElement>(null);
  const [bigOpen, setBigOpen] = useState(false);
  const draftKey = `bionfc-pet-draft:${landing.id}`;

  // Después de publicar, el recorrido sigue solo, con pasos opcionales (cada uno con "Saltear"):
  // "¡Ya funciona!" → diseño → datos → segundo contacto → "si algún día se pierde" → final con
  // Compartir.
  const startedFirstTime = useRef(firstTime);
  const [after, setAfter] = useState<AfterStep | null>(null);
  useEffect(() => {
    if (!landing.published || !startedFirstTime.current) return;
    startedFirstTime.current = false;
    setSetup(null);
    setView("menu");
    setAfter("ready");
  }, [landing.published]);

  // Guardar vuelve a esta misma pantalla (con ?saved o ?error) sin recargarla: ahí termina el
  // "Guardando…", y solo si se guardó deja de haber cambios pendientes y se vuelve al menú.
  useEffect(() => {
    setSaving(false);
    if (searchParams.get("saved") || searchParams.get("guardado")) {
      setDirty(false);
      setPhotoFile(null);
      setView("menu");
      try { localStorage.removeItem(draftKey); } catch {}
    }
  }, [landing, searchParams, draftKey]);
  // ?guardado (guardado sin aviso) no lo saca el aviso de arriba como a ?saved: se saca acá, una
  // vez que los efectos de este guardado ya lo leyeron.
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!searchParams.get("guardado")) return;
    const timer = setTimeout(() => router.replace(pathname, { scroll: false }), 50);
    return () => clearTimeout(timer);
  }, [searchParams, router, pathname]);

  // Borrador en el celular del dueño: si se le corta la sesión, se queda sin batería o cierra sin
  // guardar, al volver se le ofrece recuperar lo que había escrito.
  useEffect(() => {
    if (!isOwner) return;
    try {
      const raw = JSON.parse(localStorage.getItem(draftKey) || "null") as { name?: unknown; pet?: unknown } | null;
      const saved = raw && typeof raw.name === "string" ? { name: raw.name, pet: parsePet({ pet: raw.pet }) } : null;
      if (saved && JSON.stringify(saved) !== JSON.stringify({ name: landing.name, pet: petForEditing(initialPet) })) setDraft(saved);
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

  // Recién activado el modo perdido: la pantalla "Ahora, difundilo" con las opciones para
  // compartir. Es cuando más importa difundirlo y, si no se le muestra ahí, el dueño no se entera
  // de que puede. Al guardar se anota en el celular (sessionStorage) que se está activando: al
  // volver del guardado el editor se arma de nuevo y no recuerda cómo estaba antes, así que no
  // alcanza con comparar.
  const spreadKey = `bionfc-pet-spread:${landing.id}`;
  const [spread, setSpread] = useState(false);
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(spreadKey)) return;
      if (searchParams.get("error")) { sessionStorage.removeItem(spreadKey); return; }
      if (!searchParams.get("saved") && !searchParams.get("guardado")) return;
      sessionStorage.removeItem(spreadKey);
      if (initialPet.lost) { setSpread(true); setView("menu"); }
    } catch {}
  }, [searchParams, spreadKey, initialPet.lost]);

  // Cada paso y cada opción del menú es una pantalla nueva: arranca desde arriba.
  useEffect(() => { window.scrollTo(0, 0); }, [view, setup, after, spread]);

  // La tecla Enter del celular dice "Listo" en los campos de una línea (los de los pasos ya dicen
  // "Siguiente"). Se pone acá para no repetirlo en cada campo.
  useEffect(() => {
    editorRef.current?.querySelectorAll("input:not([enterkeyhint]):not([type=checkbox]):not([type=file]):not([type=range])").forEach((input) => input.setAttribute("enterkeyhint", "done"));
  });

  // La miniatura (en la compu se ve al lado del formulario) se mueve sola a la parte que se edita.
  useEffect(() => {
    const screen = screenRef.current;
    const part = screen?.querySelector(PART_OF[setup === 2 ? "family" : setup !== null ? "pet" : view]);
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

  // Achicar la foto tarda un momento: mientras, el círculo muestra "Preparando foto…".
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError("");
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

  // Ayuda del botón "?": la pantalla se oscurece y un cartelito por paso (driver.js).
  async function startTour() {
    const { driver } = await import("driver.js");
    const steps = [
      { element: ".pet-mini", popover: { title: "Tu chapita", description: "Así la ve quien la escanea. Podés cambiarla todas las veces que quieras: el QR y el NFC físicos siguen funcionando." } },
      { element: ".pet-menu", popover: { title: "Todo lo que podés cambiar", description: "Tocá una fila para editarla. A la derecha ves cómo está cada cosa." } },
      { element: "[data-tour='row-family']", popover: { title: "Contacto público", description: "El WhatsApp que cargues aparece en la ficha para que quien encuentre a tu mascota pueda avisarte. Tu email de acceso no se muestra." } },
      { element: "[data-tour='row-lost']", popover: { title: "Si se pierde", description: `Acá prendés el cartel rojo de “${petGendered(pet, "¡Estoy perdido!", "¡Estoy perdida!")}”. Lo apagás cuando aparece.` } },
      { element: "[data-tour='row-ficha']", popover: { title: "Lo que falta", description: "Lo que dice “Agregar” en violeta todavía está vacío: tocalo para completarlo." } },
      { element: "[data-tour='row-look']", popover: { title: "Guardar", description: "Cada pantalla tiene “Cancelar” y “Guardar” arriba. Los cambios se ven en su página recién al guardar." } },
      ...(isOwner ? [{ element: ".pet-editor-portal", popover: { title: "Todas tus chapitas", description: "Acá volvés a tu panel: compartir, ver o avisar si se perdió. Para entrar otro día: bionfc.com/mi con tu email." } }] : []),
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

  // Guardar desde código. quiet: guardado de los pasos opcionales, sin el aviso "Cambios
  // guardados" encima de la pantalla siguiente (ver saveMyPet).
  const quietInput = useRef<HTMLInputElement>(null);
  function save(quiet = false) {
    if (quietInput.current) quietInput.current.value = quiet ? "1" : "";
    (document.getElementById("pet-save") as HTMLFormElement | null)?.requestSubmit();
  }
  // Pantalla de una opción: "Guardar" guarda y vuelve al menú (el guardado vuelve con ?saved);
  // "Cancelar" vuelve sin guardar y, si había cambios, pregunta antes de descartarlos.
  const saveView = () => {
    if (!dirty) { setView("menu"); return; }
    // Se está activando el modo perdido: al volver del guardado se muestra "Ahora, difundilo".
    if (isOwner && landing.published && pet.lost && !initialPet.lost) { try { sessionStorage.setItem(spreadKey, "1"); } catch {} }
    save();
  };
  // Con cambios, "Cancelar" pregunta con un aviso propio (no la ventanita gris del navegador).
  const discardDialog = useRef<HTMLDialogElement>(null);
  const cancelView = () => { if (dirty) discardDialog.current?.showModal(); else setView("menu"); };
  const discardChanges = () => {
    discardDialog.current?.close();
    setName(landing.name);
    setPet(petForEditing(initialPet));
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoRemoved(false);
    setDirty(false);
    try { localStorage.removeItem(draftKey); } catch {}
    setView("menu");
  };

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
  const fichaCount = petRows(pet.about, PET_ABOUT_FIELDS).length + petRows(pet.health, PET_HEALTH_FIELDS).length + (pet.finder.trim() ? 1 : 0);
  const look = petLook(pet.look);
  const photoStyle = petPhotoStyle(pet.photo);
  // El menú: a la derecha, solo lo que hace falta mirar. "Agregar" (violeta) si está vacío y en
  // rojo lo que falta para que funcione; lo demás, sin nada. El modo perdido va aparte, arriba.
  const rows: { id: Exclude<Panel, "lost">; status?: string; tone?: "warn" | "add" }[] = [
    { id: "pet", ...(!name.trim() ? { status: "Falta el nombre", tone: "warn" } : !photoUrl ? { status: "Agregar foto", tone: "add" } : {}) },
    { id: "family", ...(!hasContact ? { status: "Falta el WhatsApp", tone: "warn" } : {}) },
    { id: "ficha", ...(!fichaCount ? { status: "Agregar", tone: "add" } : {}) },
    { id: "look", status: look.label },
  ];

  // En el celular, los pasos y las pantallas de cada opción ocupan toda la pantalla: la
  // miniatura se ve solo en el menú (en la compu queda siempre al lado).
  const focused = setup !== null || view !== "menu" || after !== null || spread;
  // Pasos opcionales: al pasar del último con datos ("¿Alguien más?") se guarda lo cargado, así
  // no se pierde aunque después cierre sin terminar. Si falla, el aviso de error queda a la vista.
  const goAfter = (next: AfterStep) => {
    if (after === "family" && dirty) save(true);
    setAfter(next);
  };
  const nextAfter = (step: AfterStep): AfterStep => AFTER_STEPS[AFTER_STEPS.indexOf(step) + 1] || "done";
  const second = pet.family[1] || { name: "", phone: "" };
  const setSecond = (patch: Partial<PetFamily>) => change({ family: [pet.family[0] || { name: "", phone: "" }, { ...second, ...patch }] });
  const miniPreview = (preview: PetData) => <div className="pet-mini pet-celebrate-mini" role="button" tabIndex={0} aria-label="Ver la chapita en grande" onClick={() => { setBigOpen(true); bigPreview.current?.showModal(); }} onKeyDown={(event) => { if (event.key === "Enter") { setBigOpen(true); bigPreview.current?.showModal(); } }}>
    <div className="pet-mini-screen"><PetRenderer landing={{ business_name: name }} pet={preview} photoUrl={photoUrl} /></div>
  </div>;
  return <div ref={editorRef} className={`pet-editor${focused ? " is-focused" : ""}`}>
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
            {!isOwner && <Link href={`/admin/landings/${landing.id}/qr`}>QR y NFC</Link>}
            {!isOwner && publishAction && <form action={publishAction} className="pet-editor-publish-menu">
              <input type="hidden" name="id" value={landing.id} />
              <input type="hidden" name="published" value={landing.published ? "false" : "true"} />
              <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/mascota`} />
              {!landing.published && <label className="pet-public-ack"><input type="checkbox" name="public_visibility_ack" value="yes" required /> Ficha y WhatsApp públicos</label>}
              <PendingSubmitButton pendingText={landing.published ? "Despublicando…" : "Publicando…"} disabled={dirty || (!landing.published && !hasContact)}>{landing.published ? "Despublicar" : "Publicar"}</PendingSubmitButton>
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

    <form id="pet-save" action={submit} onSubmit={handleSave} className="pet-ed">
      <input type="hidden" name="landing_id" value={landing.id} />
      <input type="hidden" name="business_name" value={name} />
      <input type="hidden" name="pet" value={JSON.stringify(pet)} />
      <input type="hidden" name="remove_photo" value={photoRemoved ? "true" : "false"} />
      <input ref={quietInput} type="hidden" name="quiet" defaultValue="" />
      {/* El dueño ya aceptó los términos al activar; el aviso de qué se publica está abajo. */}
      {isOwner && !landing.published && <input type="hidden" name="public_visibility_ack" value="yes" />}
      <input ref={photoInput} type="file" accept="image/*" hidden onChange={(event) => pickPhoto(event.target.files?.[0])} />

      {/* Arriba: la chapita en un celular en miniatura, siempre del mismo tamaño. */}
      <div className="pet-ed-preview">
        <div className="pet-mini" role="button" tabIndex={0} aria-label="Ver la chapita en grande" onClick={(event) => { if (!(event.target as HTMLElement).closest(".pet-editable")) { setBigOpen(true); bigPreview.current?.showModal(); } }} onKeyDown={(event) => { if (event.key === "Enter") { setBigOpen(true); bigPreview.current?.showModal(); } }}>
          <div className="pet-mini-screen" ref={screenRef}>
            <PetRenderer landing={{ business_name: name }} pet={pet} photoUrl={photoUrl} edit={{ selected: setup === 2 ? "family" : setup !== null ? "pet" : view === "ficha" ? "about" : view === "menu" || view === "look" ? "design" : view, onSelect: (section) => openView(viewOf(section)) }} />
          </div>
        </div>
        {/* Al lado de la miniatura (en el celular): de quién es, si está publicada y verla en
            grande. Nada más. */}
        <div className="pet-summary">
          <strong>{name.trim() || "Tu chapita"}</strong>
          <span className={`pet-summary-state${landing.blocked ? " is-off" : landing.published ? " is-on" : ""}`}>{landing.blocked ? "Pausada" : landing.published ? "Publicada" : "Sin publicar"}</span>
          <button type="button" className="pet-summary-zoom" onClick={() => { setBigOpen(true); bigPreview.current?.showModal(); }}>Ver en grande</button>
        </div>
      </div>

      {/* Abajo: los pasos de la primera vez, el menú o el formulario de una parte. Enter en un
          campo cierra el teclado (sin esto, al estar dentro del formulario, guardaba todo sin
          avisar); los campos con su propio Enter (los pasos) lo manejan antes. */}
      <div className="pet-ed-controls" onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        if (event.key !== "Enter" || event.defaultPrevented || target.tagName !== "INPUT") return;
        event.preventDefault();
        target.blur();
      }}>
        {/* Primera vez: una cosa por pantalla. Cada paso es una página común (sin nada fijo),
            así el teclado del celular, sobre todo el del iPhone, no tapa nada. */}
        {setup !== null && <section className="pet-wizard">
          <div className="pet-wizard-head">
            {setup > 0 ? <button type="button" className="pet-wizard-back" onClick={() => setSetup((setup - 1) as SetupStep)}>← Atrás</button> : <span />}
            <span className="pet-wizard-count">Paso {setup + 1} de 3</span>
          </div>
          <div className="pet-wizard-progress" aria-hidden="true"><span style={{ width: `${((setup + 1) / 3) * 100}%` }} /></div>

          {setup === 0 && <>
            <h2>Subí una foto de tu mascota</h2>
            <p className="pet-wizard-lead">Ayuda a que la reconozcan. Podés cambiarla cuando quieras.</p>
            <button type="button" className="pet-wizard-photo" onClick={() => photoInput.current?.click()} aria-label={photoUrl ? "Cambiar foto" : "Elegir foto"}>
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
              {preparingPhoto ? <span><i className="spin" aria-hidden="true" />Preparando foto…</span> : photoUrl ? <img src={photoUrl} alt="" style={photoStyle} /> : <span><b aria-hidden="true">📷</b>Tocá para elegir</span>}
            </button>
            {photoError && <p className="pet-phone-warn">{photoError}</p>}
            {photoUrl
              ? <>
                  <button type="button" className="pet-step-next" onClick={() => setSetup(1)}>Siguiente →</button>
                  <div className="pet-wizard-links"><button type="button" onClick={() => setAdjustingPhoto(true)}>Ajustar foto</button><button type="button" onClick={() => photoInput.current?.click()}>Cambiar foto</button></div>
                </>
              : <>
                  <button type="button" className="pet-step-next" onClick={() => photoInput.current?.click()}>Elegir foto</button>
                  <div className="pet-wizard-links"><button type="button" onClick={() => setSetup(1)}>Saltear por ahora</button></div>
                </>}
          </>}

          {setup === 1 && <>
            <h2>¿Cómo se llama?</h2>
            <p className="pet-wizard-lead">Es lo que va a leer en grande quien la encuentre.</p>
            {/* enterKeyHint: la tecla Enter del celular dice "Siguiente" y pasa al paso que sigue. */}
            <label className="pet-field pet-wizard-field"><span className="sr-only">Nombre</span><input value={name} maxLength={60} placeholder="Ej: Toby" enterKeyHint="next" autoCapitalize="words" onChange={(event) => { setName(event.target.value); setDirty(true); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (name.trim()) setSetup(2); } }} /></label>
            <button type="button" className="pet-step-next" disabled={!name.trim()} onClick={() => setSetup(2)}>{name.trim() ? "Siguiente →" : "Escribí el nombre"}</button>
          </>}

          {setup === 2 && <>
            <h2>¿A qué WhatsApp te avisan?</h2>
            <p className="pet-wizard-lead">Si alguien encuentra a {petName}, toca un botón y te escribe a este número con el mensaje ya armado.</p>
            <label className="pet-field pet-wizard-field"><span className="sr-only">Tu WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="done" value={firstPhone} maxLength={20} placeholder="351 555 1234" onChange={(event) => setFirstPhone(cleanPhoneInput(event.target.value))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (phoneOk) event.currentTarget.form?.requestSubmit(); } }} /><small>Con la característica, como lo marcás siempre.</small>{phoneStatus(firstPhone)}</label>
            {/* Publica de una: saveMyPet publica cuando hay un WhatsApp; después aparece "¡Listo!". */}
            <button type="submit" className="pet-step-next is-publish" disabled={!phoneOk || saving}>{saving ? <><i className="spin" aria-hidden="true" />Publicando…</> : phoneOk ? "Publicar mi chapita" : "Falta un WhatsApp válido"}</button>
            <p className="pet-wizard-note">Quien la escanee va a ver su foto, su nombre y un botón para escribirte. Tu email no se muestra.</p>
          </>}
        </section>}

        {/* Recién publicada: ya funciona. Lo principal es seguir completándola. */}
        {after === "ready" && <section className="pet-wizard pet-celebrate">
          <div className="pet-wizard-progress is-done" aria-hidden="true"><span style={{ width: "100%" }} /></div>
          <div className="pet-celebrate-mark" aria-hidden="true">🎉</div>
          <h2>¡La chapita de {petName} ya funciona!</h2>
          <p className="pet-wizard-lead">Así la ve quien la escanea:</p>
          {miniPreview(pet)}
          <p className="pet-celebrate-try"><span aria-hidden="true">📱</span><span><b>Probala:</b> acercá tu celular a la chapita o escaneá su QR.</span></p>
          <p className="pet-celebrate-pitch">Ahora sumemos lo que ayuda a que vuelva más rápido.</p>
          <button type="button" className="pet-step-next" onClick={() => setAfter("look")}>Seguir · 2 minutos →</button>
          <button type="button" className="pet-celebrate-home" onClick={() => setAfter("done")}>Lo hago después</button>
        </section>}

        {/* Pasos opcionales: uno por pantalla, con "Saltear". */}
        {after && AFTER_STEPS.includes(after) && <section className="pet-wizard">
          <div className="pet-wizard-head">
            <button type="button" className="pet-wizard-back" onClick={() => setAfter(AFTER_STEPS[AFTER_STEPS.indexOf(after) - 1] || "ready")}>← Atrás</button>
            <span className="pet-wizard-count">Opcional · {AFTER_STEPS.indexOf(after) + 1} de {AFTER_STEPS.length}</span>
          </div>
          <div className="pet-wizard-progress" aria-hidden="true"><span style={{ width: `${((AFTER_STEPS.indexOf(after) + 1) / AFTER_STEPS.length) * 100}%` }} /></div>

          {after === "look" && <>
            <h2>Elegí un diseño</h2>
            <p className="pet-wizard-lead">Cambia los colores y las letras. Podés cambiarlo cuando quieras.</p>
            {miniPreview(pet)}
            <div className="pet-look-grid" role="group" aria-label="Diseño">{PET_LOOKS.map((item) => <button type="button" key={item.id} className={pet.look === item.id ? "active" : ""} aria-pressed={pet.look === item.id} onClick={() => change({ look: item.id })}><span style={{ background: `linear-gradient(135deg, ${item.background} 0 58%, ${item.accent} 58% 100%)` }} /><small>{item.label}</small></button>)}</div>
          </>}

          {after === "about" && <>
            <h2>Contanos de {petName}</h2>
            <p className="pet-wizard-lead">Ayuda a reconocerl{petGendered(pet, "o", "a")} y a cuidarl{petGendered(pet, "o", "a")} si alguien l{petGendered(pet, "o", "a")} encuentra. Lo que no marques no se muestra.</p>
            <Choice label="Sexo" options={["Macho", "Hembra"]} value={pet.about.sex} onPick={(sex) => about({ sex })} />
            <Choice label="Tamaño" options={["Chico", "Mediano", "Grande"]} value={pet.about.size} onPick={(size) => about({ size })} />
            <Choice label={petGendered(pet, "Castrado", "Castrada")} options={["Sí", "No"]} value={pet.health.neutered} onPick={(neutered) => health({ neutered })} />
            {field("Alergias o medicación", <input value={pet.health.allergies} maxLength={120} placeholder="Ej: Alérgico al pollo" onChange={(event) => health({ allergies: event.target.value })} />)}
            {field("Raza", <input value={pet.about.breed} maxLength={80} placeholder="Ej: Mestizo" onChange={(event) => about({ breed: event.target.value })} />)}
          </>}

          {after === "family" && <>
            <h2>¿Alguien más para avisar?</h2>
            <p className="pet-wizard-lead">Por si no contestás: tu pareja, un hijo o quien viva con {petName}. Aparece como otro botón de WhatsApp.</p>
            {field("Nombre", <input value={second.name} maxLength={40} placeholder="Ej: Ana" autoCapitalize="words" onChange={(event) => setSecond({ name: event.target.value })} />, "El botón va a decir “Avisale a Ana”.")}
            <label className="pet-field"><span>WhatsApp</span><input type="tel" inputMode="tel" autoComplete="off" value={second.phone} maxLength={20} placeholder="351 555 1234" onChange={(event) => setSecond({ phone: cleanPhoneInput(event.target.value) })} />{phoneStatus(second.phone)}</label>
          </>}

          {after === "lost" && <>
            <h2>Si algún día se pierde</h2>
            <p className="pet-wizard-lead">Entrás a <b>Mis chapitas</b> y tocás <b>“Avisar que se perdió”</b>. Arriba de su página aparece este cartel rojo, con la zona y la recompensa si querés:</p>
            {miniPreview({ ...pet, lost: true, lostZone: pet.lostZone || "tu barrio" })}
            <p className="pet-celebrate-try is-lost"><span aria-hidden="true">📣</span><span>Después lo compartís por WhatsApp o en historias con un toque. Cuando aparece, lo apagás.</span></p>
          </>}

          {after === "family" && second.phone.trim() && petPhoneProblem(second.phone)
            ? <button type="button" className="pet-step-next" disabled>Revisá el WhatsApp</button>
            : <button type="button" className="pet-step-next" onClick={() => goAfter(nextAfter(after))}>{after === "lost" ? "Entendido →" : "Siguiente →"}</button>}
          {after !== "lost" && <button type="button" className="pet-celebrate-home" onClick={() => goAfter(nextAfter(after))}>Saltear</button>}
        </section>}

        {/* Final del recorrido: ahora sí, a compartirla. */}
        {after === "done" && <section className="pet-wizard pet-celebrate">
          <div className="pet-wizard-progress is-done" aria-hidden="true"><span style={{ width: "100%" }} /></div>
          <div className="pet-celebrate-mark" aria-hidden="true">🐾</div>
          <h2>¡Lista la chapita de {petName}!</h2>
          {miniPreview(pet)}
          {/* El momento de más entusiasmo: la invitación a mostrarla en historias (cada una que
              se sube es publicidad gratis). */}
          <PetShareButton path={`/mascota/${landing.slug}`} petName={name} lost={false} className="pet-step-next is-publish" label="Mostrala en tus historias" />
          <Link className="pet-celebrate-more" href="/mi">Ir a Mis chapitas</Link>
          <button type="button" className="pet-celebrate-home" onClick={() => setAfter(null)}>Ver todo lo que puedo cambiar</button>
          <p className="pet-wizard-note">Para entrar otro día: <b>bionfc.com/mi</b> con tu email, o escaneá la chapita y tocá “¿Es tu mascota? Editala”.</p>
        </section>}

        {/* Modo perdido recién activado: a difundirlo. */}
        {spread && <section className="pet-wizard pet-spread">
          <div className="pet-spread-head"><span aria-hidden="true">🚨</span><div><strong>Modo perdido activado</strong><small>Su página ya muestra el cartel rojo.</small></div></div>
          <h2>Ahora, difundilo</h2>
          <p className="pet-wizard-lead">Las primeras horas son las que más importan. Compartilo en todos lados: la imagen lleva la dirección de su página para que te avisen.</p>
          <PetSharePanel path={`/mascota/${landing.slug}`} petName={name} lost lostZone={pet.lostZone} female={petIsFemale(pet)} />
          <div className="pet-spread-tips">
            <strong>Además</strong>
            <ul>
              <li>Publicalo en los <b>grupos de Facebook de mascotas perdidas</b> de tu zona y de la ciudad.</li>
              <li>Avisá en <b>veterinarias, petshops y negocios</b> cercanos.</li>
              <li>Tené el <b>teléfono a mano</b>: si alguien {petGendered(pet, "lo", "la")} encuentra, te escribe por WhatsApp desde su página.</li>
            </ul>
          </div>
          <button type="button" className="pet-step-next" onClick={() => setSpread(false)}>Listo</button>
        </section>}

        {setup === null && after === null && !spread && view === "menu" && <>
          {/* Sin publicar después de los pasos (por ejemplo, si falló al publicar). */}
          {isOwner && !landing.published && <div className={`pet-ed-intro${canPublishAsOwner ? " is-ready" : ""}`}>{canPublishAsOwner
            ? <><span>Todavía no está publicada. Quien la escanee verá estos datos y tu WhatsApp.</span><button type="button" className="pet-step-next is-publish" disabled={saving} onClick={() => save()}>{saving ? <><i className="spin" aria-hidden="true" />Publicando…</> : "Publicar mi chapita"}</button></>
            : <>Para publicarla falta {!name.trim() ? "el nombre" : "tu WhatsApp"}.</>}</div>}
          {/* Solo pasa con un borrador recuperado: se guarda con un toque. */}
          {dirty && !saving && <p className="pet-unsaved" role="status"><span aria-hidden="true">●</span> Tenés cambios sin guardar. <button type="button" className="pet-editor-link" onClick={() => save()}>Guardar</button></p>}
          {/* Lo urgente, aparte y a la vista: el día que se pierde, se encuentra en un segundo. */}
          {landing.published && <button type="button" className={`pet-lost-card${pet.lost ? " is-on" : ""}`} data-tour="row-lost" onClick={() => openView("lost")}>
            <span aria-hidden="true">🚨</span>
            <span><strong>{pet.lost ? "Modo perdido activo" : "¿Se perdió?"}</strong><small>{pet.lost ? "Su página muestra el cartel rojo." : "Activá el aviso rojo en su página."}</small></span>
            <b>{pet.lost ? "Desactivar" : "Avisar"}</b>
          </button>}
          <ul className="pet-menu">
            {rows.map((row) => <li key={row.id}>
              <button type="button" className="pet-menu-row" data-tour={`row-${row.id}`} onClick={() => openView(row.id)}>
                <span className="pet-menu-icon" aria-hidden="true">{TITLES[row.id].icon}</span>
                <span className="pet-menu-label">{TITLES[row.id].label}</span>
                {row.status && <span className={`pet-menu-status${row.tone ? ` is-${row.tone}` : ""}`}>{row.status}</span>}
                <span className="pet-menu-go" aria-hidden="true">›</span>
              </button>
            </li>)}
            {/* La ayuda, como una opción más del menú. */}
            <li><button type="button" className="pet-menu-row" onClick={() => startTour()}>
              <span className="pet-menu-icon" aria-hidden="true">💡</span>
              <span className="pet-menu-label">¿Cómo funciona?</span>
              <span className="pet-menu-go" aria-hidden="true">›</span>
            </button></li>
          </ul>
        </>}

        {/* Cada opción del menú es su propia pantalla, con "Cancelar" y "Guardar" en una barra
            fija arriba, como al editar un contacto en el celular. */}
        {setup === null && view !== "menu" && <section className="pet-form">
          <div className="pet-form-bar">
            <button type="button" onClick={cancelView} disabled={saving}>Cancelar</button>
            <strong>{TITLES[view].label}</strong>
            <button type="button" className="is-save" onClick={saveView} disabled={saving} aria-label={saving ? "Guardando" : undefined}>{saving ? <i className="spin" aria-hidden="true" /> : "Guardar"}</button>
          </div>

          {view === "look" && <>
            <p className="pet-editor-help">Cambia los colores y las letras de su página. Lo que cargaste no cambia.</p>
            {miniPreview(pet)}
            <div className="pet-look-grid" role="group" aria-label="Diseño">{PET_LOOKS.map((item) => <button type="button" key={item.id} className={pet.look === item.id ? "active" : ""} aria-pressed={pet.look === item.id} onClick={() => change({ look: item.id })}><span style={{ background: `linear-gradient(135deg, ${item.background} 0 58%, ${item.accent} 58% 100%)` }} /><small>{item.label}</small></button>)}</div>
          </>}

          {view === "pet" && <>
            <div className="pet-photo-field">
              <button type="button" className="pet-photo-thumb" onClick={() => photoInput.current?.click()} aria-label={photoUrl ? "Cambiar foto" : "Subir foto"}>{/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}{photoUrl ? <img src={photoUrl} alt="" style={photoStyle} /> : <span>📷</span>}</button>
              <div>
                <button type="button" className="pet-editor-ghost" onClick={() => photoInput.current?.click()}>{photoUrl ? "Cambiar foto" : "Subir foto"}</button>
                {photoUrl && <button type="button" className="pet-editor-ghost" onClick={() => setAdjustingPhoto(true)}>Ajustar foto</button>}
                {photoUrl && <button type="button" className="pet-editor-link" onClick={removePhoto}>Quitar</button>}
              </div>
            </div>
            {photoError && <p className="pet-phone-warn">{photoError}</p>}
            {field("Nombre", <input value={name} maxLength={60} placeholder="Ej: Toby" onChange={(event) => { setName(event.target.value); setDirty(true); }} />)}
            {field("Saludo", <input value={pet.greeting} maxLength={40} placeholder="¡Hola! Soy" onChange={(event) => change({ greeting: event.target.value })} />, "Va arriba del nombre. Vacío no se muestra.")}
            {field("Mensaje", <textarea rows={2} value={pet.message} maxLength={200} onChange={(event) => change({ message: event.target.value })} />, "Lo primero que lee quien la encuentra.")}
          </>}

          {view === "family" && <>
            {pet.family.map((member, index) => <div className="pet-member" key={index}>
              <div className="pet-member-head"><strong>Contacto {index + 1}</strong>{pet.family.length > 1 && <button type="button" className="pet-editor-link" onClick={() => change({ family: pet.family.filter((_, current) => current !== index) })}>Quitar</button>}</div>
              {field("Nombre (opcional)", <input value={member.name} maxLength={40} placeholder="Ej: Ana" onChange={(event) => setMember(index, { name: event.target.value })} />)}
              <label className="pet-field"><span>WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" value={member.phone} maxLength={20} placeholder="351 555 1234" onChange={(event) => setMember(index, { phone: cleanPhoneInput(event.target.value) })} />{phoneStatus(member.phone)}</label>
            </div>)}
            {pet.family.length < PET_FAMILY_MAX && <button type="button" className="pet-editor-ghost" onClick={() => change({ family: [...pet.family, { name: "", phone: "" }] })}>+ Agregar {pet.family.length ? "otro contacto" : "un contacto"}</button>}
          </>}

          {view === "ficha" && <>
            <p className="pet-editor-help">Son datos opcionales que pueden ayudar a cuidarla y devolverla más rápido. Lo que quede vacío no se muestra.</p>
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
                <Choice label={petGendered(pet, "Castrado", "Castrada")} options={["Sí", "No"]} value={pet.health.neutered} onPick={(neutered) => health({ neutered })} />
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
              <span><strong>{pet.lost ? "Modo perdido activo" : "Modo perdido inactivo"}</strong><small>Activá esta opción si se perdió: arriba de la página aparecerá un aviso rojo. Desactivala cuando vuelva. El cambio se aplica al guardar.</small></span>
            </button>
            {field("Dónde se perdió (opcional)", <input value={pet.lostZone} maxLength={120} placeholder="Ej: Barrio Cofico, cerca de la plaza" onChange={(event) => change({ lostZone: event.target.value })} />)}
            {field("Recompensa (opcional)", <input value={pet.reward} maxLength={60} placeholder="Ej: $50.000" onChange={(event) => change({ reward: event.target.value })} />, "Completala solo si realmente vas a ofrecerla. Si queda vacío, no se muestra.")}
            {/* Si cambió el interruptor, el botón dice lo que va a pasar al tocarlo: es el toque
                que publica (o saca) el cartel rojo. Hace lo mismo que "Guardar". */}
            {pet.lost !== initialPet.lost && <button type="button" className={`pet-step-next pet-lost-confirm${pet.lost ? " is-on" : ""}`} onClick={saveView} disabled={saving}>
              {saving ? <><i className="spin" aria-hidden="true" />{pet.lost ? "Activando…" : "Desactivando…"}</> : pet.lost ? "🚨 Activar aviso" : "✓ Desactivar aviso"}
            </button>}
          </>}

          {/* Guarda y vuelve al menú (el guardado recarga esta pantalla con ?saved). */}
        </section>}
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

    </form>
  </div>;
}
