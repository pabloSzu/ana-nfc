import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { landingImageUrl } from "@/lib/landing-image";
import { parsePet } from "@/lib/pet";
import { FiEdit2, FiEye } from "react-icons/fi";
import PetShareButton from "@/components/pet-share-button";
// Las chapitas del dueño: las de los clientes de los que es miembro (ver client_members).
export default async function OwnerHome() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/mi/entrar");
  const { data: memberships } = await supabase.from("client_members").select("client_id").eq("user_id", userId);
  const clientIds = (memberships || []).map((row) => row.client_id);
  const { data: pages } = clientIds.length
    ? await supabase.from("landings").select("id,slug,pet_slug,business_name,business_type,logo_url,published,button_style,blocked_at").in("client_id", clientIds).eq("business_type", "pet").order("activated_at")
    : { data: [] };

  return <main className="mi-main">
    <h1>Mis chapitas</h1>    {!pages?.length ? <div className="mi-empty">
      <p>Todavía no tenés ninguna chapita activada con este email.</p>
      <Link className="mi-button" href="/activar">Activar una chapita</Link>
    </div> : <ul className="mi-pets">{pages.map((page) => {
      const pet = parsePet(page.button_style);
      const photo = landingImageUrl(page.logo_url, 384);
      const live = page.published && !page.blocked_at;
      const publicPath = `/mascota/${encodeURIComponent(page.pet_slug || page.slug)}`;
      return <li key={page.id} className={`mi-pet${pet.lost ? " is-lost" : ""}`}>
        <Link className="mi-pet-card" href={`/mi/chapita/${page.id}`}>
          <span className="mi-pet-photo">{/* eslint-disable-next-line @next/next/no-img-element -- foto de la mascota */}{photo ? <img src={photo} alt="" /> : "🐾"}</span>
          <span className="mi-pet-copy"><strong>{page.business_name || "Sin nombre todavía"}</strong><small>{page.blocked_at ? "Pausada por BIONFC" : pet.lost ? "🚨 Modo perdido prendido" : page.published ? "Funcionando" : "Falta cargar tu WhatsApp"}</small></span>
        </Link>
        <div className="mi-pet-actions">
          <Link href={`/mi/chapita/${page.id}`}><FiEdit2 aria-hidden="true" />Editar</Link>
          {live && <PetShareButton path={publicPath} petName={page.business_name || ""} lost={pet.lost} lostZone={pet.lostZone} className={pet.lost ? "is-urgent" : ""} />}
          {live && <a href={publicPath} target="_blank" rel="noopener noreferrer"><FiEye aria-hidden="true" />Ver</a>}
        </div>
        {/* Lo urgente, a un toque: abre el editor directo en "¿Se perdió?". */}
        {live && <Link className={`mi-lost-button${pet.lost ? " is-on" : ""}`} href={`/mi/chapita/${page.id}?seccion=lost`}>{pet.lost ? "✓ Ya apareció: sacar el cartel" : "🚨 Avisar que se perdió"}</Link>}
      </li>;
    })}</ul>}
    {!!pages?.length && <p className="mi-hint mi-center">¿Compraste otra? <Link href="/activar">Activala acá</Link>.</p>}
  </main>;
}
