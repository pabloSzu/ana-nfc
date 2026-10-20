import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OwnerLogin from "./owner-login";

export default async function EnterPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims?.sub) redirect("/mi");
  return <main className="mi-main mi-narrow">
    <h1>Entrar</h1>
    <p className="mi-lead">Para editar los datos de tu mascota o avisar que se perdió.</p>
    <OwnerLogin />
    <p className="mi-hint mi-center">¿Todavía no activaste tu chapita? <Link href="/activar">Activala acá</Link> con el código de la tarjetita.</p>
  </main>;
}
