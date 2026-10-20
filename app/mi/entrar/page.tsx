import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OwnerLogin from "./owner-login";

// Solo se vuelve a una pantalla del panel del dueño, nunca a otro sitio.
const safeNext = (value: string | undefined) => value && /^\/mi(\/[\w-]+)*$/.test(value) ? value : "/mi";

export default async function EnterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims?.sub) redirect(next);
  return <main className="mi-main mi-narrow">
    <h1>Entrar</h1>
    <p className="mi-lead">{next === "/mi" ? "Para editar los datos de tu mascota o avisar que se perdió." : "Se cerró tu sesión. Entrá de nuevo para guardar tus cambios: no se perdieron."}</p>
    <OwnerLogin next={next} />
    <p className="mi-hint mi-center">¿Todavía no activaste tu chapita? <Link href="/activar">Activala acá</Link> con el código de la tarjetita.</p>
  </main>;
}
