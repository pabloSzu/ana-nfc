"use client";

// El menú del editor de la chapita y la pantalla de cada opción.
//  · MenuScreen: "¿Se perdió?" aparte y a la vista, y la lista de opciones. A la derecha de cada
//    fila, solo lo que hace falta mirar: "Agregar" (en color) si está vacío y en rojo lo que falta
//    para que funcione.
//  · PanelScreen: una opción, con "Cancelar · Guardar" fijo arriba, como al editar un contacto en
//    el celular. En modo perdido, arriba solo "Cancelar": la acción es el botón grande de abajo.
import { useState } from "react";
import { PET_ABOUT_FIELDS, PET_FAMILY_MAX, PET_HEALTH_FIELDS, cleanPhoneInput, formatReward, petGendered, petHasContact, petLook, petPhotoStyle, petRows } from "@/lib/pet";
import { TITLES, useEditor, type Panel } from "./pet-editor-context";
import { Choice, Field, LookGrid, MiniPreview, PhoneStatus } from "./pet-editor-fields";

export function MenuScreen() {
  const { landing, isOwner, pet, name, photoUrl, dirty, saving, go, save, publish, startTour } = useEditor();
  const hasContact = petHasContact(pet);
  const fichaCount = petRows(pet.about, PET_ABOUT_FIELDS).length + petRows(pet.health, PET_HEALTH_FIELDS).length + (pet.finder.trim() ? 1 : 0);
  const canPublish = isOwner && !landing.published && !landing.blocked && Boolean(name.trim()) && hasContact;
  const rows: { id: Exclude<Panel, "lost">; status?: string; tone?: "warn" | "add" }[] = [
    { id: "pet", ...(!name.trim() ? { status: "Falta el nombre", tone: "warn" } : !photoUrl ? { status: "Agregar foto", tone: "add" } : {}) },
    { id: "family", ...(!hasContact ? { status: "Falta el WhatsApp", tone: "warn" } : {}) },
    { id: "ficha", ...(!fichaCount ? { status: "Agregar", tone: "add" } : {}) },
    { id: "look" },
  ];
  // Diseño: el colorcito del elegido (dice más que el nombre).
  const look = petLook(pet.look);
  return <>
    {/* Sin publicar después de los pasos (por ejemplo, si falló al publicar). */}
    {isOwner && !landing.published && <div className={`pet-ed-intro${canPublish ? " is-ready" : ""}`}>{canPublish
      ? <><span>Todavía no está publicada. Quien la escanee verá estos datos y tu WhatsApp.</span><button type="button" className="pet-step-next is-publish" disabled={saving} onClick={publish}>{saving ? <><i className="spin" aria-hidden="true" />Publicando…</> : "Publicar mi chapita"}</button></>
      : <>Para publicarla falta {!name.trim() ? "el nombre" : "tu WhatsApp"}.</>}</div>}
    {/* Solo pasa con un borrador recuperado: se guarda con un toque. */}
    {dirty && !saving && <p className="pet-unsaved" role="status"><span aria-hidden="true">●</span> Tenés cambios sin guardar. <button type="button" className="pet-editor-link" onClick={() => save()}>Guardar</button></p>}
    {/* Lo urgente, aparte y a la vista: el día que se pierde, se encuentra en un segundo. */}
    {landing.published && <button type="button" className={`pet-lost-card${pet.lost ? " is-on" : ""}`} data-tour="row-lost" onClick={() => go({ name: "panel", panel: "lost" })}>
      <span aria-hidden="true">🚨</span>
      <span><strong>{pet.lost ? "Modo perdido activo" : "¿Se perdió?"}</strong><small>{pet.lost ? "Su página muestra el cartel rojo." : "Activá el aviso rojo en su página."}</small></span>
      <b>{pet.lost ? "Desactivar" : "Avisar"}</b>
    </button>}
    <ul className="pet-menu">
      {rows.map((row) => <li key={row.id}>
        <button type="button" className="pet-menu-row" data-tour={`row-${row.id}`} onClick={() => go({ name: "panel", panel: row.id })}>
          <span className="pet-menu-icon" aria-hidden="true">{TITLES[row.id].icon}</span>
          <span className="pet-menu-label">{TITLES[row.id].label}</span>
          {row.status && <span className={`pet-menu-status${row.tone ? ` is-${row.tone}` : ""}`}>{row.status}</span>}
          {row.id === "look" && <span className="pet-menu-swatch" role="img" aria-label={look.label} style={{ background: `linear-gradient(135deg, ${look.background} 0 58%, ${look.accent} 58% 100%)` }} />}
          <span className="pet-menu-go" aria-hidden="true">›</span>
        </button>
      </li>)}
      {/* La ayuda, como una opción más del menú. */}
      <li><button type="button" className="pet-menu-row" onClick={startTour}>
        <span className="pet-menu-icon" aria-hidden="true">💡</span>
        <span className="pet-menu-label">¿Cómo funciona?</span>
        <span className="pet-menu-go" aria-hidden="true">›</span>
      </button></li>
    </ul>
  </>;
}

export function PanelScreen({ panel }: { panel: Panel }) {
  const { savedPet, pet, name, setName, petName, photoUrl, photo, dirty, saving, change, about, health, setMember, savePanel, cancelPanel } = useEditor();
  // Qué botón del modo perdido se tocó (para poner la ruedita en ese).
  const [lostAction, setLostAction] = useState<"save" | "on" | "off">("save");
  const runLost = (action: "save" | "on" | "off") => { setLostAction(action); savePanel(action === "save" ? undefined : { lost: action === "on" }); };
  const spinner = (action: "save" | "on" | "off", label: string) => saving && lostAction === action ? <><i className="spin" aria-hidden="true" />{label}</> : null;
  const lostFields = <>
    <Field label="Dónde se perdió (opcional)"><input value={pet.lostZone} maxLength={120} placeholder="Ej: Barrio Cofico, cerca de la plaza" onChange={(event) => change({ lostZone: event.target.value })} /></Field>
    <Field label="Recompensa (opcional)" help="Completala solo si realmente vas a ofrecerla. Si queda vacío, no se muestra."><input value={pet.reward} maxLength={60} placeholder="Ej: $50.000" onChange={(event) => change({ reward: event.target.value })} onBlur={(event) => { const reward = formatReward(event.target.value); if (reward !== pet.reward) change({ reward }); }} /></Field>
  </>;
  return <section className="pet-form">
    <div className="pet-form-bar">
      <button type="button" onClick={cancelPanel} disabled={saving}>Cancelar</button>
      <strong>{TITLES[panel].label}</strong>
      {/* En modo perdido la acción es el botón grande de abajo (uno solo: activar o desactivar). */}
      {panel === "lost" ? <span aria-hidden="true" /> : <button type="button" className="is-save" onClick={() => savePanel()} disabled={saving} aria-label={saving ? "Guardando" : undefined}>{saving ? <i className="spin" aria-hidden="true" /> : "Guardar"}</button>}
    </div>

    {panel === "look" && <>
      <p className="pet-editor-help">Cambia los colores y las letras de su página. Lo que cargaste no cambia.</p>
      <MiniPreview />
      <LookGrid />
    </>}

    {panel === "pet" && <>
      <div className="pet-photo-field">
        <button type="button" className="pet-photo-thumb" onClick={photo.pick} aria-label={photoUrl ? "Cambiar foto" : "Subir foto"}>{/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}{photoUrl ? <img src={photoUrl} alt="" style={petPhotoStyle(pet.photo)} /> : <span>📷</span>}</button>
        <div>
          <button type="button" className="pet-editor-ghost" onClick={photo.pick}>{photoUrl ? "Cambiar foto" : "Subir foto"}</button>
          {photoUrl && <button type="button" className="pet-editor-ghost" onClick={photo.adjust}>Ajustar foto</button>}
          {photoUrl && <button type="button" className="pet-editor-link" onClick={photo.remove}>Quitar</button>}
        </div>
      </div>
      {photo.error && <p className="pet-phone-warn">{photo.error}</p>}
      <Field label="Nombre"><input value={name} maxLength={60} placeholder="Ej: Toby" onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Saludo" help="Va arriba del nombre. Vacío no se muestra."><input value={pet.greeting} maxLength={40} placeholder="¡Hola! Soy" onChange={(event) => change({ greeting: event.target.value })} /></Field>
      <Field label="Mensaje" help="Lo primero que lee quien la encuentra."><textarea rows={2} value={pet.message} maxLength={200} onChange={(event) => change({ message: event.target.value })} /></Field>
    </>}

    {panel === "family" && <>
      {pet.family.map((member, index) => <div className="pet-member" key={index}>
        <div className="pet-member-head"><strong>Contacto {index + 1}</strong>{pet.family.length > 1 && <button type="button" className="pet-editor-link" onClick={() => change({ family: pet.family.filter((_, current) => current !== index) })}>Quitar</button>}</div>
        <Field label="Nombre (opcional)"><input value={member.name} maxLength={40} placeholder="Ej: Ana" onChange={(event) => setMember(index, { name: event.target.value })} /></Field>
        <label className="pet-field"><span>WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" value={member.phone} maxLength={20} placeholder="351 555 1234" onChange={(event) => setMember(index, { phone: cleanPhoneInput(event.target.value) })} /><PhoneStatus phone={member.phone} /></label>
      </div>)}
      {pet.family.length < PET_FAMILY_MAX && <button type="button" className="pet-editor-ghost" onClick={() => change({ family: [...pet.family, { name: "", phone: "" }] })}>+ Agregar {pet.family.length ? "otro contacto" : "un contacto"}</button>}
    </>}

    {panel === "ficha" && <>
      <p className="pet-editor-help">Son datos opcionales que pueden ayudar a cuidarla y devolverla más rápido. Lo que quede vacío no se muestra.</p>
      <fieldset className="pet-group"><legend>Sobre {petName}</legend>
        <div className="pet-row">
          <Field label="Raza"><input value={pet.about.breed} maxLength={80} placeholder="Ej: Mestizo" onChange={(event) => about({ breed: event.target.value })} /></Field>
          <Field label="Edad"><input value={pet.about.age} maxLength={80} placeholder="Ej: 4 años" onChange={(event) => about({ age: event.target.value })} /></Field>
        </div>
        <Choice label="Sexo" options={["Macho", "Hembra"]} value={pet.about.sex} onPick={(sex) => about({ sex })} />
        <Choice label="Tamaño" options={["Chico", "Mediano", "Grande"]} value={pet.about.size} onPick={(size) => about({ size })} />
        <div className="pet-row">
          <Field label="Color"><input value={pet.about.color} maxLength={80} placeholder="Ej: Marrón" onChange={(event) => about({ color: event.target.value })} /></Field>
          <Field label="Carácter"><input value={pet.about.character} maxLength={80} placeholder="Ej: Manso" onChange={(event) => about({ character: event.target.value })} /></Field>
        </div>
      </fieldset>
      <fieldset className="pet-group"><legend>Salud</legend>
        <div className="pet-row">
          <Choice label="Vacunas" options={["Al día", "No"]} value={pet.health.vaccines} onPick={(vaccines) => health({ vaccines })} />
          <Choice label={petGendered(pet, "Castrado", "Castrada")} options={["Sí", "No"]} value={pet.health.neutered} onPick={(neutered) => health({ neutered })} />
        </div>
        <Field label="Medicación"><input value={pet.health.medication} maxLength={120} placeholder="Ej: Una pastilla por día" onChange={(event) => health({ medication: event.target.value })} /></Field>
        <Field label="Alergias"><input value={pet.health.allergies} maxLength={120} placeholder="Ej: Ninguna" onChange={(event) => health({ allergies: event.target.value })} /></Field>
        <Field label="Veterinaria"><input value={pet.health.vet} maxLength={120} placeholder="Ej: Patitas · 351 555-1234" onChange={(event) => health({ vet: event.target.value })} /></Field>
      </fieldset>
      <Field label="Si alguien la encuentra…"><textarea rows={3} value={pet.finder} maxLength={500} placeholder={"Ej: Soy manso pero un poco miedoso.\nAcercate despacio y llamame por mi nombre."} onChange={(event) => change({ finder: event.target.value })} /></Field>
    </>}

    {/* Modo perdido: un solo botón que dice lo que pasa al tocarlo, según lo guardado. */}
    {panel === "lost" && !savedPet.lost && <>
      <p className="pet-editor-help">Si se perdió, activá el aviso: arriba de su página aparece este cartel rojo y después lo compartís por WhatsApp o en historias.</p>
      <MiniPreview preview={{ ...pet, lost: true }} />
      {lostFields}
      <button type="button" className="pet-step-next pet-lost-confirm is-on" onClick={() => runLost("on")} disabled={saving}>{spinner("on", "Activando…") || "🚨 Activar aviso"}</button>
    </>}
    {panel === "lost" && savedPet.lost && <>
      <div className="pet-lost-status"><span aria-hidden="true">🚨</span><span><strong>El aviso está activo</strong><small>Arriba de la página de {petName} se ve el cartel rojo. Cuando aparezca, desactivalo.</small></span></div>
      {lostFields}
      {dirty && <button type="button" className="pet-step-next" onClick={() => runLost("save")} disabled={saving}>{spinner("save", "Guardando…") || "Guardar cambios"}</button>}
      <button type="button" className="pet-step-next pet-lost-confirm" onClick={() => runLost("off")} disabled={saving}>{spinner("off", "Desactivando…") || "✓ Apareció: desactivar aviso"}</button>
    </>}
  </section>;
}
