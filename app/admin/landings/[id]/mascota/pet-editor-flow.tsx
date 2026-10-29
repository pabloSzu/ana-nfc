"use client";

// Las pantallas de recorrido del editor de la chapita, una cosa por pantalla:
//  · SetupScreen: los 3 pasos de la primera vez (foto, nombre, WhatsApp); el último publica.
//  · AfterScreen: "¡Ya funciona!", los pasos opcionales (cada uno con "Saltear") y el final con
//    Compartir.
//  · SpreadScreen: "Ahora, difundilo", al activar el modo perdido.
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaInstagram } from "react-icons/fa6";
import { LuPawPrint, LuPrinter } from "react-icons/lu";
import { PetSharePanel, PetStoryShareButton } from "@/components/pet-share-button";
import { cleanPhoneInput, petGendered, petNameExample, petHasContact, petImageVersion, petIsFemale, petPhoneProblem, petPhotoStyle, type PetFamily } from "@/lib/pet";
import { AFTER_STEPS, useEditor, type AfterStep } from "./pet-editor-context";
import { BirthField, Choice, Field, KindChoice, LookGrid, MiniPreview, PhoneStatus } from "./pet-editor-fields";

// "Guardá tu acceso" (final del recorrido): antes de irse (por ejemplo, a subir la historia), que se
// lleve cómo volver. Mandárselo por WhatsApp a sí mismo anda en cualquier celular (elige su propio
// chat); "Copiar link" para quien no lo usa. El día que se pierda, la chapita no la va a tener a mano.
function AccessCard({ petName }: { petName: string }) {
  const [copied, setCopied] = useState(false);
  const portalUrl = () => `${window.location.origin}/mi`;
  function sendToMe() {
    const text = `Mi acceso a la chapita de ${petName} 🐾 Para editarla o avisar si se pierde: ${portalUrl()} (entro con mi email)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }
  async function copy() {
    try { await navigator.clipboard.writeText(portalUrl()); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { window.prompt("Copiá este link:", portalUrl()); }
  }
  return <div className="pet-access">
    <strong>📌 Guardá tu acceso</strong>
    <p>Para editarla o avisar si se pierde, entrá a <b>bionfc.com/mi</b> con tu email. Mandátelo y lo tenés siempre a mano:</p>
    <button type="button" className="pet-access-wa" onClick={sendToMe}>💬 Mandármelo por WhatsApp</button>
    <button type="button" className="pet-access-copy" onClick={copy}>{copied ? "¡Link copiado!" : "Copiar link"}</button>
    <small>También llegás escaneando su chapita y tocando <b>“¿Es tu mascota?”</b>, abajo de todo.</small>
  </div>;
}

export function SetupScreen({ step }: { step: 0 | 1 | 2 }) {
  const { pet, name, setName, petName, photoUrl, photo, change, about, saving, go, publish } = useEditor();
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
      <label className="pet-field pet-wizard-field"><span className="sr-only">Nombre</span><input value={name} maxLength={60} placeholder={petNameExample(pet.kind)} enterKeyHint="next" autoCapitalize="words" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (name.trim()) go({ name: "setup", step: 2 }); } }} /></label>
      <KindChoice />
      <Choice label="Sexo" options={["Macho", "Hembra"]} value={pet.about.sex} onPick={(sex) => about({ sex })} />
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

const CONFETTI = ["#f5a25d", "#ff6fa3", "#ffd23f", "#3ecf8e", "#3aa0ff", "#8a5cf7", "#e9772f", "#ff4f6d", "#19c35a"];

// El ejemplo de raza según lo que es.
export const breedExample = (kind: string) => kind === "Gato" ? "Ej: Siamés, común europeo" : kind === "Perro" ? "Ej: Caniche, mestizo" : "Ej: Mestizo";

const nextAfter = (step: AfterStep): AfterStep => AFTER_STEPS[AFTER_STEPS.indexOf(step) + 1] || "done";

export function AfterScreen({ step }: { step: AfterStep }) {
  const { landing, savedPet, pet, name, petName, dirty, saving, change, about, health, go, save } = useEditor();
  const version = petImageVersion(savedPet, name, landing.photoUrl, landing.slug);
  const storyUrl = `/api/og/mascota/${landing.slug}?formato=historia&v=${version}`;
  // Mientras completa los pasos, el navegador ya baja la imagen de la historia: al final se ve al instante.
  useEffect(() => { if (landing.published) new Image().src = storyUrl; }, [landing.published, storyUrl]);
  const [storyLoaded, setStoryLoaded] = useState(false);
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
  // Primero lo que sigue (una frase y el botón, arriba: se ve en cualquier celular sin bajar);
  // la vista previa y "Probala" van abajo, como extra.
  if (step === "ready") return <section className="pet-wizard pet-celebrate is-ready">
    <div className="pet-wizard-progress is-done" aria-hidden="true"><span style={{ width: "100%" }} /></div>
    <div className="pet-celebrate-mark" aria-hidden="true">🎉</div>
    <h2>¡La chapita de {petName} ya funciona!</h2>
    <p className="pet-wizard-lead">Lo esencial ya está listo. Te recomendamos completar su ficha: datos para {petGendered(pet, "reconocerlo", "reconocerla")} y otro contacto por si no respondés.</p>
    <button type="button" className="pet-step-next pet-ficha-cta" onClick={() => go({ name: "after", step: "look" })}>
      <span className="pet-ficha-icon" aria-hidden="true"><LuPawPrint /></span>
      <span className="pet-ficha-copy">Completar su ficha<small>Son 2 minutos · {AFTER_STEPS.length} pasos cortitos</small></span>
      <span className="pet-ficha-arrow" aria-hidden="true">→</span>
    </button>
    <Link className="pet-celebrate-home" href={`/mi?nueva=${landing.id}`}>Lo hago después</Link>
    <div className="pet-celebrate-preview">
      <p>Así la ve quien la escanea:</p>
      <MiniPreview />
      <p className="pet-celebrate-try"><span aria-hidden="true">📱</span><span><b>Probala:</b> acercá tu celular a la chapita o escaneá su QR.</span></p>
    </div>
  </section>;

  // Final del recorrido: festejo (papelitos) y la invitación a subir su historia. Primero lo que
  // gana el dueño (que más gente conozca su cara) y después el gracias; cada historia que se sube
  // es publicidad gratis. Se ve la imagen real que va a subir.
  if (step === "done") {
    return <section className="pet-wizard pet-celebrate is-done">
      <div className="pet-confetti" aria-hidden="true">{CONFETTI.map((color, index) => <i key={index} style={{ left: `${6 + index * 11}%`, background: color, animationDelay: `${(index * 0.7) % 3}s` }} />)}</div>
      <div className="pet-wizard-progress is-done" aria-hidden="true"><span style={{ width: "100%" }} /></div>
      <div className="pet-celebrate-mark" aria-hidden="true">🎉</div>
      <h2>¡{petName} ya tiene su chapita!</h2>
      <p className="pet-wizard-lead">Mostrásela a tus amigos en tus historias.</p>
      <AccessCard petName={petName} />
      {/* La historia que va a subir. Mientras se arma, un esqueleto con brillo; después, un fundido. */}
      <figure className={`pet-story-preview${storyLoaded ? " is-loaded" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- la imagen para historias, la misma que se comparte */}
        <img src={storyUrl} alt={`La historia de ${petName}`} onLoad={() => setStoryLoaded(true)} ref={(image) => { if (image?.complete && image.naturalWidth) setStoryLoaded(true); }} />
        <figcaption>Así queda tu historia</figcaption>
      </figure>
      <PetStoryShareButton path={`/mascota/${landing.slug}`} petName={name} version={version} className="pet-step-next pet-story-cta" label="Subir a mi historia" icon={<FaInstagram aria-hidden="true" />} />
      <p className="pet-story-thanks">Y de paso nos ayudás a crecer 🧡</p>
      {/* Termina en Mis chapitas: es su lugar (editar, compartir y, si se pierde, avisar). La
          primera vez se le muestra qué hay ahí, también el botón para cuando se pierda (?nueva=,
          ver app/mi/mi-welcome.tsx). */}
      <Link className="pet-done-card" href={`/mi?nueva=${landing.id}`}>
        <span className="pet-done-paw" aria-hidden="true">🐾</span>
        <span><strong>Listo, ir a Mis chapitas</strong><small>Editar, compartir o avisar si se pierde</small></span>
        <span className="pet-done-arrow" aria-hidden="true">→</span>
      </Link>
    </section>;
  }

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
      {/* El sexo ya se pregunta en el paso del nombre: acá solo si lo salteó (según lo guardado,
          así no desaparece al tocarlo). */}
      {!savedPet.about.sex && <Choice label="Sexo" options={["Macho", "Hembra"]} value={pet.about.sex} onPick={(sex) => about({ sex })} />}
      <Choice label="Tamaño" options={["Chico", "Mediano", "Grande"]} value={pet.about.size} onPick={(size) => about({ size })} />
      <BirthField />
      <Choice label={petGendered(pet, "Castrado", "Castrada")} options={["Sí", "No"]} value={pet.health.neutered} onPick={(neutered) => health({ neutered })} />
      <Field label="Alergias o medicación"><input value={pet.health.allergies} maxLength={120} placeholder="Ej: Alérgico al pollo" onChange={(event) => health({ allergies: event.target.value })} /></Field>
      <Field label="Raza"><input value={pet.about.breed} maxLength={80} placeholder={breedExample(pet.kind)} onChange={(event) => about({ breed: event.target.value })} /></Field>
    </>}

    {step === "family" && <>
      <h2>¿Alguien más para avisar?</h2>
      <p className="pet-wizard-lead">Por si no contestás: tu pareja, un hijo o quien viva con {petName}. Aparece como otro botón de WhatsApp.</p>
      <Field label="Nombre" help="El botón va a decir “Avisale a Ana”."><input value={second.name} maxLength={40} placeholder="Ej: Ana" autoCapitalize="words" onChange={(event) => setSecond({ name: event.target.value })} /></Field>
      <label className="pet-field"><span>WhatsApp</span><input type="tel" inputMode="tel" autoComplete="off" value={second.phone} maxLength={20} placeholder="351 555 1234" onChange={(event) => setSecond({ phone: cleanPhoneInput(event.target.value) })} /><PhoneStatus phone={second.phone} /></label>
    </>}


    <button type="button" className="pet-step-next" disabled={blocked || saving} onClick={() => goNext()}>{saving ? <><i className="spin" aria-hidden="true" />Guardando…</> : blocked ? "Revisá el WhatsApp" : step === "family" ? "Terminar →" : "Siguiente →"}</button>
    <button type="button" className="pet-celebrate-home" disabled={saving} onClick={() => goNext(true)}>Saltear</button>
  </section>;
}

// Modo perdido recién activado: a difundirlo. Es cuando más importa y, si no se le muestra acá,
// el dueño no se entera de que puede.
export function SpreadScreen() {
  const { landing, isOwner, savedPet, pet, name, go } = useEditor();
  return <section className="pet-wizard pet-spread">
    <div className="pet-spread-head"><span aria-hidden="true">🚨</span><div><strong>Aviso de perdido activado</strong><small>Su página ya muestra el aviso rojo.</small></div></div>
    <h2>Ahora, difundilo</h2>
    <p className="pet-wizard-lead">Las primeras horas son las que más importan. Compartilo en todos lados: la imagen lleva la dirección de su página para que te avisen.</p>
    <PetSharePanel path={`/mascota/${landing.slug}`} petName={name} lost lostZone={pet.lostZone} female={petIsFemale(pet)} version={petImageVersion(savedPet, name, landing.photoUrl, landing.slug)} />
    {/* El cartel A4 para pegar en la calle (solo el dueño: la página es de su panel). */}
    {isOwner && <Link className="pet-share-option" href={`/mi/chapita/${landing.id}/cartel`}>
      <span className="pet-share-thumb is-icon"><LuPrinter aria-hidden="true" /></span>
      <span><strong>Cartel para imprimir</strong><small>Hoja A4 con su foto, tu WhatsApp y el QR. Para veterinarias, kioscos y postes.</small></span>
    </Link>}
    <div className="pet-spread-tips">
      <strong>Además</strong>
      <ul>
        {pet.kind === "Gato" && <li>Los gatos casi siempre están <b>escondidos cerca de casa</b>, en silencio. {petGendered(pet, "Buscalo", "Buscala")} de noche con linterna en patios, garajes, techos y debajo de autos, llamándol{petGendered(pet, "o", "a")} bajito.</li>}
        {pet.kind === "Perro" && <li>Los perros pueden <b>alejarse varias cuadras</b>. Recorré la zona y los lugares donde {petGendered(pet, "lo", "la")} paseás, y preguntá en refugios.</li>}
        <li>Publicalo en los <b>grupos de Facebook de mascotas perdidas</b> de tu zona y de la ciudad.</li>
        <li>Avisá en <b>veterinarias, petshops y negocios</b> cercanos.</li>
        <li>Tené el <b>teléfono a mano</b>: si alguien {petGendered(pet, "lo", "la")} encuentra, te escribe por WhatsApp desde su página.</li>
      </ul>
    </div>
    <button type="button" className="pet-step-next" onClick={() => go({ name: "menu" })}>Listo</button>
  </section>;
}
