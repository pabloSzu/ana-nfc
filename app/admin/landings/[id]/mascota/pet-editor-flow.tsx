"use client";

// Las pantallas de recorrido del editor de la chapita, una cosa por pantalla:
//  · SetupScreen: los 3 pasos de la primera vez (foto, nombre, WhatsApp); el último publica.
//  · AfterScreen: "¡Ya funciona!", los pasos opcionales (cada uno con "Saltear") y el final con
//    Compartir.
//  · SpreadScreen: "Ahora, difundilo", al activar el modo perdido.
import Link from "next/link";
import PetShareButton, { PetSharePanel } from "@/components/pet-share-button";
import { cleanPhoneInput, petGendered, petHasContact, petImageVersion, petIsFemale, petPhoneProblem, petPhotoStyle, type PetFamily } from "@/lib/pet";
import { AFTER_STEPS, useEditor, type AfterStep } from "./pet-editor-context";
import { Choice, Field, LookGrid, MiniPreview, PhoneStatus } from "./pet-editor-fields";

export function SetupScreen({ step }: { step: 0 | 1 | 2 }) {
  const { pet, name, setName, petName, photoUrl, photo, change, saving, go, publish } = useEditor();
  const firstPhone = pet.family[0]?.phone || "";
  const setFirstPhone = (phone: string) => change({ family: pet.family.length ? pet.family.map((member, index) => index === 0 ? { ...member, phone } : member) : [{ name: "", phone }] });
  const phoneOk = petHasContact(pet) && !petPhoneProblem(firstPhone);
  return <section className="pet-wizard">
    <div className="pet-wizard-head">
      {step > 0 ? <button type="button" className="pet-wizard-back" onClick={() => go({ name: "setup", step: (step - 1) as 0 | 1 })}>← Atrás</button> : <span />}
      <span className="pet-wizard-count">Paso {step + 1} de 3</span>
    </div>
    <div className="pet-wizard-progress" aria-hidden="true"><span style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>

    {step === 0 && <>
      <h2>Subí una foto de tu mascota</h2>
      <p className="pet-wizard-lead">Ayuda a que la reconozcan. Podés cambiarla cuando quieras.</p>
      <button type="button" className="pet-wizard-photo" onClick={photo.pick} aria-label={photoUrl ? "Cambiar foto" : "Elegir foto"}>
        {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local */}
        {photo.preparing ? <span><i className="spin" aria-hidden="true" />Preparando foto…</span> : photoUrl ? <img src={photoUrl} alt="" style={petPhotoStyle(pet.photo)} /> : <span><b aria-hidden="true">📷</b>Tocá para elegir</span>}
      </button>
      {photo.error && <p className="pet-phone-warn">{photo.error}</p>}
      {photoUrl
        ? <>
            <button type="button" className="pet-step-next" onClick={() => go({ name: "setup", step: 1 })}>Siguiente →</button>
            <div className="pet-wizard-links"><button type="button" onClick={photo.adjust}>Ajustar foto</button><button type="button" onClick={photo.pick}>Cambiar foto</button></div>
          </>
        : <>
            <button type="button" className="pet-step-next" onClick={photo.pick}>Elegir foto</button>
            <div className="pet-wizard-links"><button type="button" onClick={() => go({ name: "setup", step: 1 })}>Saltear por ahora</button></div>
          </>}
    </>}

    {step === 1 && <>
      <h2>¿Cómo se llama?</h2>
      <p className="pet-wizard-lead">Es lo que va a leer en grande quien la encuentre.</p>
      {/* enterKeyHint: la tecla Enter del celular dice "Siguiente" y pasa al paso que sigue. */}
      <label className="pet-field pet-wizard-field"><span className="sr-only">Nombre</span><input value={name} maxLength={60} placeholder="Ej: Toby" enterKeyHint="next" autoCapitalize="words" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (name.trim()) go({ name: "setup", step: 2 }); } }} /></label>
      <button type="button" className="pet-step-next" disabled={!name.trim()} onClick={() => go({ name: "setup", step: 2 })}>{name.trim() ? "Siguiente →" : "Escribí el nombre"}</button>
    </>}

    {step === 2 && <>
      <h2>¿A qué WhatsApp te avisan?</h2>
      <p className="pet-wizard-lead">Si alguien encuentra a {petName}, toca un botón y te escribe a este número con el mensaje ya armado.</p>
      <label className="pet-field pet-wizard-field"><span className="sr-only">Tu WhatsApp</span><input type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="done" value={firstPhone} maxLength={20} placeholder="351 555 1234" onChange={(event) => setFirstPhone(cleanPhoneInput(event.target.value))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (phoneOk) publish(); } }} /><small>Con la característica, como lo marcás siempre.</small><PhoneStatus phone={firstPhone} /></label>
      {/* Publica de una (saveMyPet publica cuando hay un WhatsApp); después, "¡Ya funciona!". */}
      <button type="button" className="pet-step-next is-publish" disabled={!phoneOk || saving} onClick={publish}>{saving ? <><i className="spin" aria-hidden="true" />Publicando…</> : phoneOk ? "Publicar mi chapita" : "Falta un WhatsApp válido"}</button>
      <p className="pet-wizard-note">Quien la escanee va a ver su foto, su nombre y un botón para escribirte. Tu email no se muestra.</p>
    </>}
  </section>;
}

const nextAfter = (step: AfterStep): AfterStep => AFTER_STEPS[AFTER_STEPS.indexOf(step) + 1] || "done";

export function AfterScreen({ step }: { step: AfterStep }) {
  const { landing, savedPet, pet, name, petName, dirty, saving, change, about, health, go, save } = useEditor();
  const second = pet.family[1] || { name: "", phone: "" };
  const setSecond = (patch: Partial<PetFamily>) => change({ family: [pet.family[0] || { name: "", phone: "" }, { ...second, ...patch }] });
  // Al pasar el último paso con datos ("¿Alguien más?") se guarda lo cargado, sin aviso: así no se
  // pierde aunque después cierre sin terminar. Espera a que se guarde: lo que sigue es compartir y
  // las imágenes salen de lo guardado. Si falla, se queda acá con el aviso de error.
  // "Saltear" en ese paso descarta el segundo contacto (aunque haya quedado a medio escribir).
  const goNext = async (skip = false) => {
    if (step === "family") {
      const next = skip && pet.family.length > 1 ? { ...pet, family: pet.family.slice(0, 1) } : pet;
      if (dirty || next !== pet) {
        const result = await save({ quiet: true, pet: next });
        if (!result?.ok) return;
      }
    }
    go({ name: "after", step: nextAfter(step) });
  };

  // Recién publicada: ya funciona. Lo principal es seguir completándola.
  if (step === "ready") return <section className="pet-wizard pet-celebrate">
    <div className="pet-wizard-progress is-done" aria-hidden="true"><span style={{ width: "100%" }} /></div>
    <div className="pet-celebrate-mark" aria-hidden="true">🎉</div>
    <h2>¡La chapita de {petName} ya funciona!</h2>
    <p className="pet-wizard-lead">Así la ve quien la escanea:</p>
    <MiniPreview />
    <p className="pet-celebrate-try"><span aria-hidden="true">📱</span><span><b>Probala:</b> acercá tu celular a la chapita o escaneá su QR.</span></p>
    <p className="pet-celebrate-pitch">Ahora sumemos lo que ayuda a que vuelva más rápido.</p>
    <button type="button" className="pet-step-next" onClick={() => go({ name: "after", step: "look" })}>Seguir · 2 minutos →</button>
    <button type="button" className="pet-celebrate-home" onClick={() => go({ name: "after", step: "done" })}>Lo hago después</button>
  </section>;

  // Final del recorrido: ahora sí, a compartirla.
  if (step === "done") return <section className="pet-wizard pet-celebrate">
    <div className="pet-wizard-progress is-done" aria-hidden="true"><span style={{ width: "100%" }} /></div>
    <div className="pet-celebrate-mark" aria-hidden="true">🐾</div>
    <h2>¡Lista la chapita de {petName}!</h2>
    <MiniPreview />
    {/* El momento de más entusiasmo: la invitación a mostrarla en historias (cada una que se
        sube es publicidad gratis). */}
    <PetShareButton path={`/mascota/${landing.slug}`} petName={name} lost={false} version={petImageVersion(savedPet, name, landing.photoUrl, landing.slug)} className="pet-step-next is-publish" label="Mostrala en tus historias" />
    <Link className="pet-celebrate-more" href="/mi">Ir a Mis chapitas</Link>
    <button type="button" className="pet-celebrate-home" onClick={() => go({ name: "menu" })}>Ver todo lo que puedo cambiar</button>
    <p className="pet-wizard-note">Para entrar otro día: <b>bionfc.com/mi</b> con tu email, o escaneá la chapita y tocá “¿Es tu mascota? Editala”.</p>
  </section>;

  // Pasos opcionales: uno por pantalla, con "Saltear".
  const index = AFTER_STEPS.indexOf(step);
  const blocked = step === "family" && Boolean(second.phone.trim()) && Boolean(petPhoneProblem(second.phone));
  return <section className="pet-wizard">
    <div className="pet-wizard-head">
      <button type="button" className="pet-wizard-back" onClick={() => go({ name: "after", step: AFTER_STEPS[index - 1] || "ready" })}>← Atrás</button>
      <span className="pet-wizard-count">Opcional · {index + 1} de {AFTER_STEPS.length}</span>
    </div>
    <div className="pet-wizard-progress" aria-hidden="true"><span style={{ width: `${((index + 1) / AFTER_STEPS.length) * 100}%` }} /></div>

    {step === "look" && <>
      <h2>Elegí un diseño</h2>
      <p className="pet-wizard-lead">Cambia los colores y las letras. Podés cambiarlo cuando quieras.</p>
      <MiniPreview />
      <LookGrid />
    </>}

    {step === "about" && <>
      <h2>Contanos de {petName}</h2>
      <p className="pet-wizard-lead">Ayuda a reconocerl{petGendered(pet, "o", "a")} y a cuidarl{petGendered(pet, "o", "a")} si alguien l{petGendered(pet, "o", "a")} encuentra. Lo que no marques no se muestra.</p>
      <Choice label="Sexo" options={["Macho", "Hembra"]} value={pet.about.sex} onPick={(sex) => about({ sex })} />
      <Choice label="Tamaño" options={["Chico", "Mediano", "Grande"]} value={pet.about.size} onPick={(size) => about({ size })} />
      <Choice label={petGendered(pet, "Castrado", "Castrada")} options={["Sí", "No"]} value={pet.health.neutered} onPick={(neutered) => health({ neutered })} />
      <Field label="Alergias o medicación"><input value={pet.health.allergies} maxLength={120} placeholder="Ej: Alérgico al pollo" onChange={(event) => health({ allergies: event.target.value })} /></Field>
      <Field label="Raza"><input value={pet.about.breed} maxLength={80} placeholder="Ej: Mestizo" onChange={(event) => about({ breed: event.target.value })} /></Field>
    </>}

    {step === "family" && <>
      <h2>¿Alguien más para avisar?</h2>
      <p className="pet-wizard-lead">Por si no contestás: tu pareja, un hijo o quien viva con {petName}. Aparece como otro botón de WhatsApp.</p>
      <Field label="Nombre" help="El botón va a decir “Avisale a Ana”."><input value={second.name} maxLength={40} placeholder="Ej: Ana" autoCapitalize="words" onChange={(event) => setSecond({ name: event.target.value })} /></Field>
      <label className="pet-field"><span>WhatsApp</span><input type="tel" inputMode="tel" autoComplete="off" value={second.phone} maxLength={20} placeholder="351 555 1234" onChange={(event) => setSecond({ phone: cleanPhoneInput(event.target.value) })} /><PhoneStatus phone={second.phone} /></label>
    </>}

    {step === "lost" && <>
      <h2>Si algún día se pierde</h2>
      <p className="pet-wizard-lead">Entrás a <b>Mis chapitas</b> y tocás <b>“Avisar que se perdió”</b>. Arriba de su página aparece este cartel rojo, con la zona y la recompensa si querés:</p>
      <MiniPreview preview={{ ...pet, lost: true, lostZone: pet.lostZone || "tu barrio" }} />
      <p className="pet-celebrate-try is-lost"><span aria-hidden="true">📣</span><span>Después lo compartís por WhatsApp o en historias con un toque. Cuando aparece, lo apagás.</span></p>
    </>}

    <button type="button" className="pet-step-next" disabled={blocked || saving} onClick={() => goNext()}>{saving ? <><i className="spin" aria-hidden="true" />Guardando…</> : blocked ? "Revisá el WhatsApp" : step === "lost" ? "Entendido →" : "Siguiente →"}</button>
    {step !== "lost" && <button type="button" className="pet-celebrate-home" disabled={saving} onClick={() => goNext(true)}>Saltear</button>}
  </section>;
}

// Modo perdido recién activado: a difundirlo. Es cuando más importa y, si no se le muestra acá,
// el dueño no se entera de que puede.
export function SpreadScreen() {
  const { landing, savedPet, pet, name, go } = useEditor();
  return <section className="pet-wizard pet-spread">
    <div className="pet-spread-head"><span aria-hidden="true">🚨</span><div><strong>Modo perdido activado</strong><small>Su página ya muestra el cartel rojo.</small></div></div>
    <h2>Ahora, difundilo</h2>
    <p className="pet-wizard-lead">Las primeras horas son las que más importan. Compartilo en todos lados: la imagen lleva la dirección de su página para que te avisen.</p>
    <PetSharePanel path={`/mascota/${landing.slug}`} petName={name} lost lostZone={pet.lostZone} female={petIsFemale(pet)} version={petImageVersion(savedPet, name, landing.photoUrl, landing.slug)} />
    <div className="pet-spread-tips">
      <strong>Además</strong>
      <ul>
        <li>Publicalo en los <b>grupos de Facebook de mascotas perdidas</b> de tu zona y de la ciudad.</li>
        <li>Avisá en <b>veterinarias, petshops y negocios</b> cercanos.</li>
        <li>Tené el <b>teléfono a mano</b>: si alguien {petGendered(pet, "lo", "la")} encuentra, te escribe por WhatsApp desde su página.</li>
      </ul>
    </div>
    <button type="button" className="pet-step-next" onClick={() => go({ name: "menu" })}>Listo</button>
  </section>;
}
