import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { withAutoFallback } from "@/lib/landing-fallback";
import ManageScreen from "./manage-screen";

// Lo operativo de una página, separado del editor de diseño: plan, vencimiento, link de
// respaldo, firma y el aviso de renovación al cliente. Cada plan muestra solo lo suyo.
export default async function Gestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const { data: row } = await supabase.from("landings").select("*, actions(type,url,enabled,position)").eq("id", id).eq("owner_id", userId).maybeSingle();
  if (!row) notFound();
  // Un prediseño no tiene plan ni cliente: se maneja desde su propio panel.
  if (row.template_name) redirect("/admin/predisenos");
  const landing = withAutoFallback(row);
  const { data: client } = landing.client_id
    ? await supabase.from("clients").select("id,name,phone,notes").eq("id", landing.client_id).eq("owner_id", userId).maybeSingle()
    : { data: null };
  return <ManageScreen landing={landing} client={client} />;
}

