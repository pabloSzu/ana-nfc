import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { landingImageUrl } from "@/lib/landing-image";
import { parsePet } from "@/lib/pet";

// Las chapitas del dueño: las de los clientes de los que es miembro (ver client_members).
export default async function OwnerHome() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = String(claims?.claims?.sub || "");
  if (!userId) redirect("/mi/entrar");
  const { data: memberships } = await supabase.from("client_members").select("client_id").eq("user_id", userId);
  const clientIds = (memberships || []).map((row) => row.client_id);
  const { data: pages } = clientIds.length
    ? await supabase.from("landings").select("id,slug,business_name,business_type,logo_url,published,button_style").in("client_id", clientIds).eq("business_type", "pet").order("activated_at")
    : { data: [] };

  return <main className="mi-main">
    <h1>Mis chapitas</h1>
    {!pages?.length ? <div className="mi-empty">
      <p>Todavía no tenés ninguna chapita activada con este email.</p>
      <Link className="mi-button" href="/activar">Activar una chapita</Link>
    </div> : <ul className="mi-pets">{pages.map((page) => {
      const pet = parsePet(page.button_style);
      const photo = landingImageUrl(page.logo_url, 384);
      return <li key={page.id} className={pet.lost ? "is-lost" : ""}>
        <Link href={`/mi/chapita/${page.id}`}>
          <span className="mi-pet-photo">{/* eslint-disable-next-line @next/next/no-img-element -- foto de la mascota */}{photo ? <img src={photo} alt="" /> : "🐾"}</span>
          <span className="mi-pet-copy"><strong>{page.business_name}</strong><small>{pet.lost ? "🚨 Modo perdido prendido" : page.published ? "Publicada" : "Falta cargar el WhatsApp para publicarla"}</small></span>
          <em>Editar →</em>
        </Link>
      </li>;
    })}</ul>}
    {!!pages?.length && <p className="mi-hint mi-center">¿Compraste otra? <Link href="/activar">Activala acá</Link>.</p>}
  </main>;
}
