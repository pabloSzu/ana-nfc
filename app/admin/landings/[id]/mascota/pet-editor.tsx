"use client";

// Editor de la chapita de mascota. Es propio, no el de landings: a la izquierda las partes de la
// chapita, en el medio el formulario de la parte elegida y a la derecha la chapita tal como se
// publica (components/pet-renderer.tsx), que también se toca para elegir qué editar. Todo queda
// en borrador hasta "Guardar" (savePet).
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PetRenderer, { type PetSection } from "@/components/pet-renderer";
import CopyButton from "@/components/copy-button";
import PendingSubmitButton from "@/components/pending-submit-button";
import { compressImage } from "@/lib/compress-image";
import { getFontFamily, FontLinks } from "@/lib/fonts";
import { PET_ABOUT_FIELDS, PET_FAMILY_MAX, PET_HEALTH_FIELDS, PET_LOOKS, petHasContact, type PetData, type PetFamily } from "@/lib/pet";

type Props = {
  landing: { id: string; slug: string; name: string; photoUrl: string; published: boolean };
  initialPet: PetData;
  saveAction: (formData: FormData) => void | Promise<void>;
  publishAction: (formData: FormData) => void | Promise<void>;
};

const SECTIONS: { id: PetSection; label: string; icon: string }[] = [
  { id: "pet", label: "Mascota", icon: "🐶" },
  { id: "family", label: "Familia", icon: "📞" },
  { id: "about", label: "Sobre mí", icon: "📋" },
  { id: "health", label: "Salud", icon: "💊" },
  { id: "finder", label: "Si me encontrás", icon: "🤝" },
  { id: "lost", label: "¿Se perdió?", icon: "🚨" },
  { id: "design", label: "Diseño", icon: "🎨" },
];

export default function PetEditor({ landing, initialPet, saveAction, publishAction }: Props) {
  const [pet, setPet] = useState(initialPet);
  const [name, setName] = useState(landing.name);
  const [section, setSection] = useState<PetSection>(landing.published ? "lost" : "pet");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  // Guardar vuelve a esta misma pantalla (con ?saved o ?error) sin recargarla: ahí termina el
  // "Guardando…", y solo si se guardó deja de haber cambios pendientes.
  useEffect(() => {
    setSaving(false);
    if (searchParams.get("saved")) setDirty(false);
  }, [landing, searchParams]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (patch: Partial<PetData>) => { setPet((current) => ({ ...current, ...patch })); setDirty(true); };
  const setMember = (index: number, patch: Partial<PetFamily>) => change({ family: pet.family.map((member, current) => current === index ? { ...member, ...patch } : member) });

  async function pickPhoto(file: File | undefined) {
    if (!file || !photoInput.current) return;
    const compressed = await compressImage(file, 900, 0.85);
    const transfer = new DataTransfer();
    transfer.items.add(compressed);
    photoInput.current.files = transfer.files;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(compressed));
    setPhotoRemoved(false);
    setDirty(true);
  }

  function removePhoto() {
    if (photoInput.current) photoInput.current.value = "";
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoRemoved(true);
    setDirty(true);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    if (saving) { event.preventDefault(); return; }
    setSaving(true);
  }

  const photoUrl = photoPreview ?? (photoRemoved ? "" : landing.photoUrl);
  const hasContact = petHasContact(pet);
  const field = (label: string, input: ReactNode, help?: string) => <label className="pet-field"><span>{label}</span>{input}{help && <small>{help}</small>}</label>;

  return <div className="pet-editor">
    <FontLinks ids={PET_LOOKS.map((look) => look.titleFont)} />
    <header className="pet-editor-top">
      <Link className="pet-editor-back" href="/admin/paginas">← Páginas</Link>
      <div className="pet-editor-title"><small>Chapita de mascota</small><strong>{name.trim() || "Sin nombre"}</strong></div>
      <span className={`pet-editor-status${landing.published ? " is-live" : ""}`}>{landing.published ? "Publicada" : "Borrador"}</span>
      <div className="pet-editor-actions">
        {landing.published && <>
          <a className="pet-editor-ghost" href={`/${landing.slug}`} target="_blank" rel="noopener noreferrer">Ver chapita</a>
          <CopyButton text={`/${landing.slug}`} label="Copiar link" />
        </>}
        <Link className="pet-editor-ghost" href={`/admin/landings/${landing.id}/qr`}>QR y NFC</Link>
        <form action={publishAction}>
          <input type="hidden" name="id" value={landing.id} />
          <input type="hidden" name="published" value={landing.published ? "false" : "true"} />
          <input type="hidden" name="return_to" value={`/admin/landings/${landing.id}/mascota`} />
          <PendingSubmitButton className="pet-editor-ghost" pendingText={landing.published ? "Despublicando…" : "Publicando…"} disabled={dirty || (!landing.published && !hasContact)}>{landing.published ? "Despublicar" : "Publicar"}</PendingSubmitButton>
        </form>
        <button type="submit" form="pet-save" className="pet-editor-save" disabled={!dirty || saving}>{saving ? "Guardando…" : dirty ? "Guardar cambios" : "Guardado"}</button>
      </div>
    </header>
    {dirty && <p className="pet-editor-note">Tenés cambios sin guardar. Guardá antes de publicar o salir.</p>}
    {!dirty && !landing.published && !hasContact && <p className="pet-editor-note">Para publicar, cargá el WhatsApp de la familia.</p>}

    <form id="pet-save" action={saveAction} onSubmit={handleSave} className="pet-editor-body">
      <input type="hidden" name="landing_id" value={landing.id} />
      <input type="hidden" name="business_name" value={name} />
      <input type="hidden" name="pet" value={JSON.stringify(pet)} />
      <input type="hidden" name="remove_photo" value={photoRemoved ? "true" : "false"} />
      <input ref={photoInput} type="file" name="photo" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => pickPhoto(event.target.files?.[0])} />

      <nav className="pet-editor-nav" aria-label="Partes de la chapita">
        {SECTIONS.map((item) => <button type="button" key={item.id} className={section === item.id ? "active" : ""} aria-pressed={section === item.id} onClick={() => setSection(item.id)}>
          <span aria-hidden="true">{item.icon}</span>{item.label}{item.id === "lost" && pet.lost && <i className="pet-editor-dot" aria-label="prendido" />}
        </button>)}
      </nav>

      <section className="pet-editor-panel">
        {section === "pet" && <>
          <h2>La mascota</h2>
          <div className="pet-photo-field">
            <div className="pet-photo-thumb">{/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}{photoUrl ? <img src={photoUrl} alt="" /> : <span>🐾</span>}</div>
            <div>
              <button type="button" className="pet-editor-ghost" onClick={() => photoInput.current?.click()}>{photoUrl ? "Cambiar foto" : "Subir foto"}</button>
              {photoUrl && <button type="button" className="pet-editor-link" onClick={removePhoto}>Quitar</button>}
              <small>Mejor de frente y con buena luz. Se recorta en círculo.</small>
            </div>
          </div>
          {field("Nombre", <input value={name} maxLength={60} placeholder="Ej: Toby" onChange={(event) => { setName(event.target.value); setDirty(true); }} />)}
          {field("Saludo", <input value={pet.greeting} maxLength={40} placeholder="¡Hola! Soy" onChange={(event) => change({ greeting: event.target.value })} />, "Va arriba del nombre. Dejalo vacío para no mostrarlo.")}
          {field("Mensaje", <textarea rows={3} value={pet.message} maxLength={200} onChange={(event) => change({ message: event.target.value })} />, "Lo primero que lee quien la encuentra.")}
        </>}

        {section === "family" && <>
          <h2>Familia</h2>
          <p className="pet-editor-help">Cada persona tiene su botón de WhatsApp, con el mensaje “¡Hola! Encontré a {name.trim() || "tu mascota"} 🐾” ya escrito, y otro para llamar.</p>
          {pet.family.map((member, index) => <div className="pet-member" key={index}>
            <div className="pet-member-head"><strong>Persona {index + 1}</strong><button type="button" className="pet-editor-link" onClick={() => change({ family: pet.family.filter((_, current) => current !== index) })}>Quitar</button></div>
            {field("Nombre (opcional)", <input value={member.name} maxLength={40} placeholder="Ej: Ana" onChange={(event) => setMember(index, { name: event.target.value })} />, "El botón dice “Avisale a Ana”. Sin nombre: “Avisale a mi familia”.")}
            {field("WhatsApp", <input type="tel" inputMode="tel" value={member.phone} maxLength={30} placeholder="54 9 351 123 4567" onChange={(event) => setMember(index, { phone: event.target.value })} />, "Con código de país. Se usa también para llamar.")}
          </div>)}
          {pet.family.length < PET_FAMILY_MAX && <button type="button" className="pet-editor-ghost" onClick={() => change({ family: [...pet.family, { name: "", phone: "" }] })}>+ Agregar {pet.family.length ? "otra persona" : "una persona"}</button>}
        </>}

        {section === "about" && <>
          <h2>Sobre mí</h2>
          <p className="pet-editor-help">Lo que dejes vacío no se muestra.</p>
          {PET_ABOUT_FIELDS.map((item) => <div key={item.key}>{field(item.label, <input value={pet.about[item.key]} maxLength={80} placeholder={`Ej: ${item.placeholder}`} onChange={(event) => change({ about: { ...pet.about, [item.key]: event.target.value } })} />)}</div>)}
        </>}

        {section === "health" && <>
          <h2>Salud</h2>
          <p className="pet-editor-help">Sirve si alguien la cuida unas horas o la lleva al veterinario. Lo que dejes vacío no se muestra.</p>
          {PET_HEALTH_FIELDS.map((item) => <div key={item.key}>{field(item.label, <input value={pet.health[item.key]} maxLength={120} placeholder={`Ej: ${item.placeholder}`} onChange={(event) => change({ health: { ...pet.health, [item.key]: event.target.value } })} />)}</div>)}
        </>}

        {section === "finder" && <>
          <h2>Si me encontrás</h2>
          {field("Qué hacer", <textarea rows={5} value={pet.finder} maxLength={500} placeholder={"Ej: Soy manso pero un poco miedoso.\nAcercate despacio y llamame por mi nombre."} onChange={(event) => change({ finder: event.target.value })} />, "Cómo acercarse, si muerde, si se escapa… Vacío no se muestra.")}
        </>}

        {section === "lost" && <>
          <h2>¿Se perdió?</h2>
          <button type="button" className={`pet-switch${pet.lost ? " is-on" : ""}`} role="switch" aria-checked={pet.lost} onClick={() => change({ lost: !pet.lost })}>
            <span className="pet-switch-track" aria-hidden="true" />
            <span><strong>{pet.lost ? "Modo perdido prendido" : "Modo perdido apagado"}</strong><small>Prendelo cuando la familia avise que se perdió: arriba de todo aparece un cartel rojo. Apagalo cuando aparezca. Se aplica al guardar.</small></span>
          </button>
          {field("Dónde se perdió (opcional)", <input value={pet.lostZone} maxLength={120} placeholder="Ej: Barrio Cofico, cerca de la plaza" onChange={(event) => change({ lostZone: event.target.value })} />)}
          {field("Recompensa (opcional)", <input value={pet.reward} maxLength={60} placeholder="Ej: $50.000" onChange={(event) => change({ reward: event.target.value })} />)}
        </>}

        {section === "design" && <>
          <h2>Diseño</h2>
          <p className="pet-editor-help">Cambia colores y letras. Los datos quedan igual.</p>
          <div className="pet-looks">{PET_LOOKS.map((look) => <button type="button" key={look.id} className={pet.look === look.id ? "active" : ""} aria-pressed={pet.look === look.id} onClick={() => change({ look: look.id })} style={{ background: `linear-gradient(160deg, ${look.background}, ${look.backgroundTo})`, color: look.ink }}>
            <span className="pet-look-name" style={{ fontFamily: getFontFamily(look.titleFont) }}>{look.label}</span>
            <span className="pet-look-pill" style={{ background: look.accent, color: look.accentInk }}>Avisale a mi familia</span>
            <span className="pet-look-card" style={{ background: look.card }} />
          </button>)}</div>
        </>}
      </section>

      <div className="pet-editor-preview">
        <div className="pet-editor-phone">
          <PetRenderer landing={{ business_name: name }} pet={pet} photoUrl={photoUrl} edit={{ selected: section, onSelect: setSection }} />
        </div>
        <small>Tocá cualquier parte de la chapita para editarla.</small>
      </div>
    </form>
  </div>;
}
