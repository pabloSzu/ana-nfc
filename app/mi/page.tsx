import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { landingImageUrl } from "@/lib/landing-image";
import { PET_ABOUT_FIELDS, PET_HEALTH_FIELDS, parsePet, petGendered, petImageVersion, petIsFemale, petPhotoStyle, petRows } from "@/lib/pet";
import { FiEdit2, FiEye, FiPrinter } from "react-icons/fi";
import PetShareButton from "@/components/pet-share-button";
import MiWelcome from "./mi-welcome";
// Las chapitas del dueño: las de los clientes de los que es miembro (ver client_members).
export default async function OwnerHome({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  // Recién terminada (?nueva=id, desde el final del recorrido): se le muestra qué hay acá.
  const { nueva } = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/mi/entrar");
  const { data: memberships } = await supabase.from("client_members").select("client_id").eq("user_id", userId);
  const clientIds = (memberships || []).map((row) => row.client_id);
  const { data: pages } = clientIds.length
    ? await supabase.from("landings").select("id,slug,pet_slug,business_name,business_type,logo_url,published,button_style,blocked_at").in("client_id", clientIds).eq("business_type", "pet").order("activated_at")
    : { data: [] };

  return <main className="mi-main mi-home">
    {/* En la compu, el saludo y "Activar otra" arriba; en el celular, solo el título. */}
    <div className="mi-home-head">
      <div><small>Hola 👋</small><h1>Mis chapitas</h1><p>Todo lo que necesitás para editar, compartir o avisar si se pierde.</p></div>
      {!!pages?.length && <Link className="mi-home-new" href="/activar">+ Activar otra chapita</Link>}
    </div>    {!pages?.length ? <div className="mi-empty">
      <p>Todavía no tenés ninguna chapita activada con este email.</p>
      <Link className="mi-button" href="/activar">Activar una chapita</Link>
    </div> : <ul className="mi-pets">{pages.map((page) => {
      const pet = parsePet(page.button_style);
      const photo = landingImageUrl(page.logo_url, 384);
      const live = page.published && !page.blocked_at;
      // Ficha incompleta: sin foto o sin ningún dato de la mascota. Lleva directo a lo que falta.
      const hasFicha = (pet.birth ? 1 : 0) + petRows(pet.about, PET_ABOUT_FIELDS).length + petRows(pet.health, PET_HEALTH_FIELDS).length + (pet.finder.trim() ? 1 : 0) > 0;
      const missing = live && !pet.lost && (!page.logo_url ? "pet" : !hasFicha ? "ficha" : "");      const publicPath = `/mascota/${encodeURIComponent(page.pet_slug || page.slug)}`;
      return <li key={page.id} className={`mi-pet${pet.lost ? " is-lost" : ""}`}>
        <Link className="mi-pet-card" href={`/mi/chapita/${page.id}`}>
          <span className="mi-pet-photo">{/* eslint-disable-next-line @next/next/no-img-element -- foto de la mascota */}{photo ? <img src={photo} alt="" style={petPhotoStyle(pet.photo)} /> : "🐾"}{pet.lost && <em className="mi-pet-badge">🚨 {petGendered(pet, "Perdido", "Perdida")}</em>}</span>
          <span className="mi-pet-copy"><strong>{page.business_name || "Sin nombre todavía"}</strong><small>{page.blocked_at ? "Pausada por BIONFC" : pet.lost ? "🚨 Aviso de perdido activo" : page.published ? "Funcionando" : "Falta cargar tu WhatsApp"}</small></span>
        </Link>
        {missing && <Link className="mi-pet-incomplete" href={`/mi/chapita/${page.id}?seccion=${missing}`}>Ficha incompleta · <b>Completar</b></Link>}
        <div className="mi-pet-actions">
          <Link href={`/mi/chapita/${page.id}`}><FiEdit2 aria-hidden="true" />Editar</Link>
          {live && <PetShareButton path={publicPath} petName={page.business_name || ""} lost={pet.lost} lostZone={pet.lostZone} female={petIsFemale(pet)} version={petImageVersion(pet, page.business_name || "", page.logo_url || "", page.pet_slug || page.slug)} className={pet.lost ? "is-urgent" : ""} />}
          {live && <a href={publicPath} target="_blank" rel="noopener noreferrer"><FiEye aria-hidden="true" />Ver</a>}
          {/* Perdida: el cartel A4 para pegar en la calle. */}
          {live && pet.lost && <Link href={`/mi/chapita/${page.id}/cartel`}><FiPrinter aria-hidden="true" />Cartel</Link>}
        </div>
        {live && nueva === page.id && <MiWelcome petName={page.business_name || "tu mascota"} />}
        {/* Lo urgente, a un toque: abre el editor directo en "¿Se perdió?". */}
        {live && <Link className={`mi-lost-button${pet.lost ? " is-on" : ""}${live && nueva === page.id ? " is-highlight" : ""}`} href={`/mi/chapita/${page.id}?seccion=lost`}>{pet.lost ? "Sacar el aviso · ya volvió" : "🚨 Avisar que se perdió"}</Link>}
      </li>;
    })}</ul>}
    {!!pages?.length && <p className="mi-hint mi-center">¿Compraste otra? <Link href="/activar">Activala acá</Link>.</p>}
  </main>;
}
