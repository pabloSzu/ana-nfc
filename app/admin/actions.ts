"use server";import {createClient} from "@/lib/supabase/server";import {redirect} from "next/navigation";import {revalidatePath} from "next/cache";
import { businessProfiles, isPlausiblePhone } from "@/lib/landing-catalog";
const slugify=(v:string)=>v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,60);
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function auth(){const s=await createClient();const {data,error}=await s.auth.getClaims();const userId=String(data?.claims?.sub||"");if(error||!userId)redirect("/admin/login");return {s,user:{id:userId}}}
function checkClientFields(fd:FormData,onError:(message:string)=>never){const name=String(fd.get("name")||"").trim();if(!name)onError("El nombre del cliente es obligatorio.");const email=String(fd.get("email")||"").trim();if(email&&!emailPattern.test(email))onError("El email no parece válido. Revisalo y probá de nuevo.");const phone=String(fd.get("phone")||"").trim();if(phone&&!isPlausiblePhone(phone))onError("El WhatsApp parece incompleto. Escribilo con código de país, ej: 5493511234567.");return {name,email,phone}}
export async function newClient(fd:FormData){const requestedReturnTo=String(fd.get("return_to")||"/admin");const returnTo=requestedReturnTo.startsWith("/admin")?requestedReturnTo:"/admin";const onError=(message:string):never=>redirect(returnTo+"?error="+encodeURIComponent(message));const {name,email,phone}=checkClientFields(fd,onError);const {s,user}=await auth();const requestKey=String(fd.get("request_key")||"").trim().slice(0,100)||null;const {data,error}=await s.from("clients").upsert({owner_id:user.id,request_key:requestKey,name,email,phone,primary_color:String(fd.get("primary_color")||"#1f2937"),background_color:String(fd.get("background_color")||"#f7f5f0")},{onConflict:"owner_id,request_key"}).select("id").single();if(error)onError(error.message);if(!data)redirect(returnTo+"?error="+encodeURIComponent("No se pudo crear el cliente"));revalidatePath("/admin");revalidatePath("/admin/clientes");redirect("/admin/clientes/"+data.id+"?success="+encodeURIComponent("Cliente creado correctamente. Ya podés agregar sus landings o tarjetas."))}
export async function updateClient(fd:FormData){const {s,user}=await auth();const id=String(fd.get("id"));const onError=(message:string):never=>redirect("/admin/clientes/"+id+"?error="+encodeURIComponent(message));const {name,email,phone}=checkClientFields(fd,onError);const {data:client,error:lookupError}=await s.from("clients").select("id").eq("id",id).eq("owner_id",user.id).maybeSingle();if(lookupError)onError(lookupError.message);if(!client)onError("Cliente inexistente o sin permisos");const {error}=await s.from("clients").update({name,email,phone,primary_color:String(fd.get("primary_color")||"#1f2937"),background_color:String(fd.get("background_color")||"#f7f5f0")}).eq("id",id).eq("owner_id",user.id);if(error)onError(error.message);revalidatePath("/admin/clientes/"+id);revalidatePath("/admin/clientes");revalidatePath("/admin");redirect("/admin/clientes/"+id+"?saved=Cliente actualizado")}
export async function deleteClient(fd:FormData){const {s,user}=await auth();const id=String(fd.get("id")||"");const requestedReturnTo=String(fd.get("return_to")||"/admin");const returnTo=requestedReturnTo.startsWith("/admin")?requestedReturnTo:"/admin";const {data:client,error:lookupError}=await s.from("clients").select("id").eq("id",id).eq("owner_id",user.id).maybeSingle();if(lookupError)redirect(returnTo+"?error="+encodeURIComponent(lookupError.message));if(!client)redirect(returnTo+"?error=Cliente inexistente o sin permisos");const {error}=await s.from("clients").delete().eq("id",id).eq("owner_id",user.id);if(error)redirect(returnTo+"?error="+encodeURIComponent(error.message));revalidatePath("/admin");revalidatePath("/admin/clientes");redirect(returnTo+"?saved="+encodeURIComponent("Cliente eliminado; sus páginas quedaron pendientes de asignación"))}
export async function newLanding(fd: FormData) {
  const { s, user } = await auth();
  const requestedReturnTo = String(fd.get("return_to") || "/admin");
  const returnTo = requestedReturnTo.startsWith("/admin") ? requestedReturnTo : "/admin";
  const onError = (message: string): never => redirect(returnTo + "?error=" + encodeURIComponent(message));
  const businessName = String(fd.get("business_name") || "").trim();
  const businessType = String(fd.get("business_type") || "custom");
  const requestKey = String(fd.get("request_key") || "").trim().slice(0, 100) || null;
  if (!businessName) onError(businessType === "contact" ? "El nombre de la persona es obligatorio." : "El nombre de la landing es obligatorio.");
  let slug = slugify(String(fd.get("slug") || businessName));
  const clientId = String(fd.get("client_id") || "") || null;
  if (!clientId) onError("Elegí el cliente al que pertenece esta página.");
  const [slugResult, clientResult, duplicateResult] = await Promise.all([
    s.from("landings").select("id").eq("slug", slug).maybeSingle(),
    clientId ? s.from("clients").select("primary_color,background_color").eq("id", clientId).eq("owner_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    requestKey ? s.from("landings").select("id,business_type").eq("owner_id", user.id).eq("request_key", requestKey).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const { data: ex, error: slugError } = slugResult;
  if (slugError) onError(slugError.message);
  if (duplicateResult.error) onError(duplicateResult.error.message);
  if (duplicateResult.data) redirect("/admin/landings/" + duplicateResult.data.id + "/editor-v2?saved=" + encodeURIComponent(duplicateResult.data.business_type === "contact" ? "Tarjeta creada" : "Landing creada"));
  if (ex) slug += "-" + Math.floor(Math.random() * 999);
  if (!businessProfiles.some((profile) => profile.value === businessType)) onError("Tipo de perfil inválido");
  const { data: client, error: clientError } = clientResult;
  if (clientError) onError(clientError.message);
  if (clientId && !client) onError("Cliente inexistente o sin permisos");
  const isContact = businessType === "contact";
  const { data, error } = await s.from("landings").insert({
    owner_id: user.id, client_id: clientId, request_key: requestKey, business_name: businessName, slug,
    template: String(fd.get("template") || "professional"), business_type: businessType,
    primary_color: client?.primary_color || (isContact ? "#343d31" : "#1f2937"),
    background_color: client?.background_color || (isContact ? "#e9eae2" : "#f7f5f0"),
    ...(isContact ? { button_style: { contactTheme: "essential", contactLayout: "card" } } : {}),
  }).select("id").single();
  if (error && requestKey) {
    const { data: existing } = await s.from("landings").select("id,business_type").eq("owner_id", user.id).eq("request_key", requestKey).maybeSingle();
    if (existing) redirect("/admin/landings/" + existing.id + "/editor-v2?saved=" + encodeURIComponent(existing.business_type === "contact" ? "Tarjeta creada" : "Landing creada"));
  }
  if (error) onError(error.message);
  const landingId = data?.id;
  if (!landingId) onError("No se pudo crear la landing");
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  if (clientId) revalidatePath("/admin/clientes/" + clientId);
  redirect("/admin/landings/" + landingId + "/editor-v2?saved=" + encodeURIComponent(isContact ? "Tarjeta creada" : "Landing creada"));
}

export async function publish(fd: FormData) {
  const { s, user } = await auth();
  const id = String(fd.get("id") || "");
  const returnTo = String(fd.get("return_to") || "/admin");
  const target = returnTo.startsWith("/admin") ? returnTo : "/admin";
  const desired = String(fd.get("published")) === "true";
  const { data: landing, error: lookupError } = await s.from("landings").select("id,slug,business_type").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (lookupError) redirect(target + "?error=" + encodeURIComponent(lookupError.message));
  if (!landing) redirect(target + "?error=Página inexistente o sin permisos");
  if (desired && landing.business_type === "contact") {
    const { data: actions, error: actionsError } = await s.from("actions").select("type,url").eq("landing_id", id).eq("enabled", true).in("type", ["phone", "email", "whatsapp"]);
    if (actionsError) redirect(target + "?error=" + encodeURIComponent(actionsError.message));
    if (!actions?.some((action) => String(action.url || "").trim())) redirect(target + "?error=" + encodeURIComponent("Agregá un teléfono, email o WhatsApp antes de publicar la tarjeta."));
  }
  const { error } = await s.from("landings").update({ published: desired }).eq("id", id).eq("owner_id", user.id);
  if (error) redirect(target + "?error=" + encodeURIComponent(error.message));
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  revalidatePath("/admin/landings/" + id);
  if (landing.slug) revalidatePath("/" + landing.slug);
  const label = landing.business_type === "contact" ? "Tarjeta" : "Landing";
  redirect(target + "?saved=" + encodeURIComponent(`${label} ${desired ? "publicada" : "despublicada"}`));
}
export async function renameLanding(fd:FormData){const {s,user}=await auth();const id=String(fd.get("id")||"");const requestedReturnTo=String(fd.get("return_to")||"/admin");const returnTo=requestedReturnTo.startsWith("/admin")?requestedReturnTo:"/admin";const fail=(message:string):never=>redirect(returnTo+"?error="+encodeURIComponent(message));const businessName=String(fd.get("business_name")||"").trim();if(!businessName)fail("El nombre de la landing es obligatorio.");const slug=slugify(String(fd.get("slug")||""));if(!slug)fail("El link de la landing es obligatorio.");const {data:landing,error:lookupError}=await s.from("landings").select("id,slug").eq("id",id).eq("owner_id",user.id).maybeSingle();if(lookupError)fail(lookupError.message);if(!landing)redirect(returnTo+"?error="+encodeURIComponent("Landing inexistente o sin permisos"));const slugChanged=slug!==landing.slug;if(slugChanged){const {data:ex,error:slugError}=await s.from("landings").select("id").eq("slug",slug).maybeSingle();if(slugError)fail(slugError.message);if(ex)fail("Ese link ya está en uso por otra landing.")}const {error}=await s.from("landings").update({business_name:businessName,slug}).eq("id",id).eq("owner_id",user.id);if(error)fail(error.message);revalidatePath("/admin");revalidatePath("/admin/paginas");revalidatePath("/admin/landings/"+id+"/editor-v2");if(landing.slug)revalidatePath("/"+landing.slug);if(slugChanged)revalidatePath("/"+slug);redirect(returnTo+"?saved="+encodeURIComponent(slugChanged?"Nombre y link actualizados":"Nombre actualizado"))}
export async function deleteLanding(fd: FormData) {
  const { s, user } = await auth();
  const id = String(fd.get("id") || "");
  const requestedReturnTo = String(fd.get("return_to") || "/admin");
  const returnTo = requestedReturnTo.startsWith("/admin") ? requestedReturnTo : "/admin";
  const { data: landing, error: lookupError } = await s.from("landings").select("id,slug,business_type").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (lookupError) redirect(returnTo + "?error=" + encodeURIComponent(lookupError.message));
  if (!landing) redirect(returnTo + "?error=Página inexistente o sin permisos");
  const { error } = await s.from("landings").delete().eq("id", id).eq("owner_id", user.id);
  if (error) redirect(returnTo + "?error=" + encodeURIComponent(error.message));
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  if (landing.slug) revalidatePath("/" + landing.slug);
  redirect(returnTo + "?saved=" + encodeURIComponent(landing.business_type === "contact" ? "Tarjeta eliminada correctamente" : "Landing eliminada correctamente"));
}

export async function assignLandingClient(fd: FormData) {
  const { s, user } = await auth();
  const id = String(fd.get("id") || "");
  const clientId = String(fd.get("client_id") || "");
  const requestedReturnTo = String(fd.get("return_to") || "/admin/paginas");
  const returnTo = requestedReturnTo.startsWith("/admin") ? requestedReturnTo : "/admin/paginas";
  const fail = (message: string): never => redirect(returnTo + "?error=" + encodeURIComponent(message));
  if (!id || !clientId) fail("Elegí un cliente válido.");
  const [{ data: landing, error: landingError }, { data: client, error: clientError }] = await Promise.all([
    s.from("landings").select("id").eq("id", id).eq("owner_id", user.id).maybeSingle(),
    s.from("clients").select("id").eq("id", clientId).eq("owner_id", user.id).maybeSingle(),
  ]);
  if (landingError || clientError) fail(landingError?.message || clientError?.message || "No se pudo verificar la asignación.");
  if (!landing || !client) fail("La página o el cliente no existen.");
  const { error } = await s.from("landings").update({ client_id: clientId }).eq("id", id).eq("owner_id", user.id);
  if (error) fail(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  revalidatePath("/admin/clientes/" + clientId);
  redirect(returnTo + "?saved=" + encodeURIComponent("Página asignada correctamente"));
}
