"use server";import {createClient} from "@/lib/supabase/server";import { revalidateLandingPage } from "@/lib/landing-cache";import {redirect} from "next/navigation";import {revalidatePath} from "next/cache";
import { businessProfiles, isPlausiblePhone } from "@/lib/landing-catalog";
import { BUSINESS_TEMPLATES, buttonsMissingLink, sortTemplateRows, templateActionRows, templateFromLanding, withoutLinks, type BusinessTemplate } from "@/lib/business-templates";
import { phoneFromInput } from "@/lib/contact-card";
import { DEFAULT_PET_MESSAGE, newPet, parsePet, petHasContact, petLook } from "@/lib/pet";
import { manualRedirectUpdate, managementUpdate, normalizeLink, parsePlan, publishUpdate, renewalUpdate, type UpdateResult } from "@/lib/landing-plan";
const slugify=(v:string)=>v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,60);
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function auth(){const s=await createClient();const {data,error}=await s.auth.getClaims();const userId=String(data?.claims?.sub||"");if(error||!userId)redirect("/admin/login");return {s,user:{id:userId}}}
function checkClientFields(fd:FormData,onError:(message:string)=>never){const name=String(fd.get("name")||"").trim();if(!name)onError("El nombre del cliente es obligatorio.");const email=String(fd.get("email")||"").trim();if(email&&!emailPattern.test(email))onError("El email no parece válido. Revisalo y probá de nuevo.");const phone=String(fd.get("phone")||"").trim();if(phone&&!isPlausiblePhone(phone))onError("El WhatsApp parece incompleto. Escribilo con código de país, ej: 5493511234567.");return {name,email,phone}}
export async function newClient(fd:FormData){const requestedReturnTo=String(fd.get("return_to")||"/admin");const returnTo=requestedReturnTo.startsWith("/admin")?requestedReturnTo:"/admin";const onError=(message:string):never=>redirect(returnTo+"?error="+encodeURIComponent(message));const {name,email,phone}=checkClientFields(fd,onError);const {s,user}=await auth();const requestKey=String(fd.get("request_key")||"").trim().slice(0,100)||null;const {data,error}=await s.from("clients").upsert({owner_id:user.id,request_key:requestKey,name,email,phone,primary_color:String(fd.get("primary_color")||"#1f2937"),background_color:String(fd.get("background_color")||"#f7f5f0")},{onConflict:"owner_id,request_key"}).select("id").single();if(error)onError(error.message);if(!data)redirect(returnTo+"?error="+encodeURIComponent("No se pudo crear el cliente"));revalidatePath("/admin");revalidatePath("/admin/clientes");redirect("/admin/clientes/"+data.id+"?success="+encodeURIComponent("Cliente creado correctamente. Ya podés agregar sus landings o tarjetas."))}
export async function updateClient(fd:FormData){const {s,user}=await auth();const id=String(fd.get("id"));const onError=(message:string):never=>redirect("/admin/clientes/"+id+"?error="+encodeURIComponent(message));const {name,email,phone}=checkClientFields(fd,onError);const {data:client,error:lookupError}=await s.from("clients").select("id").eq("id",id).eq("owner_id",user.id).maybeSingle();if(lookupError)onError(lookupError.message);if(!client)onError("Cliente inexistente o sin permisos");const {error}=await s.from("clients").update({name,email,phone,notes:String(fd.get("notes")||"").trim().slice(0,2000),primary_color:String(fd.get("primary_color")||"#1f2937"),background_color:String(fd.get("background_color")||"#f7f5f0")}).eq("id",id).eq("owner_id",user.id);if(error)onError(error.message);revalidatePath("/admin/clientes/"+id);revalidatePath("/admin/clientes");revalidatePath("/admin");redirect("/admin/clientes/"+id+"?saved=Cliente actualizado")}
export async function deleteClient(fd:FormData){const {s,user}=await auth();const id=String(fd.get("id")||"");const requestedReturnTo=String(fd.get("return_to")||"/admin");const returnTo=requestedReturnTo.startsWith("/admin")?requestedReturnTo:"/admin";const {data:client,error:lookupError}=await s.from("clients").select("id").eq("id",id).eq("owner_id",user.id).maybeSingle();if(lookupError)redirect(returnTo+"?error="+encodeURIComponent(lookupError.message));if(!client)redirect(returnTo+"?error=Cliente inexistente o sin permisos");const {error}=await s.from("clients").delete().eq("id",id).eq("owner_id",user.id);if(error)redirect(returnTo+"?error="+encodeURIComponent(error.message));revalidatePath("/admin");revalidatePath("/admin/clientes");redirect(returnTo+"?saved="+encodeURIComponent("Cliente eliminado; sus páginas quedaron pendientes de asignación"))}
export async function newLanding(fd: FormData) {
  const { s, user } = await auth();
  const requestedReturnTo = String(fd.get("return_to") || "/admin");
  const returnTo = requestedReturnTo.startsWith("/admin") ? requestedReturnTo : "/admin";
  const onError = (message: string): never => redirect(returnTo + "?error=" + encodeURIComponent(message));
  const businessName = String(fd.get("business_name") || "").trim();
  // "direct" no es un tipo de página: es una landing que nunca se muestra y abre un solo link.
  // Se crea ya publicada y con plan direct, y se va directo a grabar el NFC.
  const isDirect = fd.get("business_type") === "direct";
  const businessType = isDirect ? "custom" : String(fd.get("business_type") || "custom");
  const requestKey = String(fd.get("request_key") || "").trim().slice(0, 100) || null;
  if (!businessName) onError(isDirect ? "Poné un nombre para identificar el link directo." : businessType === "contact" ? "El nombre de la persona es obligatorio." : "El nombre de la landing es obligatorio.");
  const directUrl = isDirect ? normalizeLink(fd.get("direct_url")) : "";
  if (isDirect && !directUrl) onError(directUrl === null ? "El link del producto no parece válido. Revisalo y probá de nuevo." : "Cargá el link que abre el producto.");
  const doneUrl = (id: string, type?: string | null) => isDirect
    ? "/admin/landings/" + id + "/qr?saved=" + encodeURIComponent("Link directo listo: grabalo en el NFC")
    : type === "pet" ? "/admin/landings/" + id + "/mascota?saved=" + encodeURIComponent("Chapita creada")
    : "/admin/landings/" + id + "/editor-v2?saved=" + encodeURIComponent(type === "contact" ? "Tarjeta creada" : "Landing creada");
  let slug = slugify(String(fd.get("slug") || businessName));
  const clientId = String(fd.get("client_id") || "") || null;
  if (!clientId) onError("Elegí el cliente al que pertenece esta página.");
  const [slugResult, clientResult, duplicateResult] = await Promise.all([
    s.rpc("slug_in_use", { p_slug: slug }),
    clientId ? s.from("clients").select("primary_color,background_color").eq("id", clientId).eq("owner_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    requestKey ? s.from("landings").select("id,business_type").eq("owner_id", user.id).eq("request_key", requestKey).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const { data: ex, error: slugError } = slugResult;
  if (slugError) onError(slugError.message);
  if (duplicateResult.error) onError(duplicateResult.error.message);
  if (duplicateResult.data) redirect(doneUrl(duplicateResult.data.id, duplicateResult.data.business_type));
  if (ex) slug += "-" + Math.floor(Math.random() * 999);
  if (!businessProfiles.some((profile) => profile.value === businessType)) onError("Tipo de perfil inválido");
  const { data: client, error: clientError } = clientResult;
  if (clientError) onError(clientError.message);
  if (clientId && !client) onError("Cliente inexistente o sin permisos");
  const isContact = businessType === "contact";
  const isPet = businessType === "pet";
  // Plantilla elegida al crear: una propia ("mine-<id>", ver Plantillas más abajo) o, si todavía
  // no tiene ninguno, uno de BIONFC.
  const requestedTemplate = String(fd.get("rubro_template") || "");
  let rubroTemplate = !isContact && !isDirect && !isPet ? BUSINESS_TEMPLATES.find((template) => template.id === requestedTemplate) : undefined;
  if (!isContact && !isDirect && !isPet && requestedTemplate.startsWith("mine-")) {
    const { data: own } = await s.from("landings").select("*, actions(*)").eq("id", requestedTemplate.slice(5)).eq("owner_id", user.id).not("template_name", "is", null).maybeSingle();
    if (own) rubroTemplate = templateFromLanding(own);
  }
  // Los links de la plantilla son de ejemplo: la página nueva arranca sin ninguno (ver withoutLinks).
  if (rubroTemplate) rubroTemplate = withoutLinks(rubroTemplate);
  // La chapita de mascota no usa botones ni plantillas: arranca con sus datos vacíos (lib/pet.ts)
  // y, si se cargó, el WhatsApp de la familia.
  const petPhone = isPet ? phoneFromInput(String(fd.get("pet_phone") || "")) : "";
  if (petPhone && !isPlausiblePhone(petPhone)) onError("El teléfono de la familia no parece válido. Revisalo y probá de nuevo.");
  const look = petLook(undefined);
  const { data, error } = await s.from("landings").insert({
    owner_id: user.id, client_id: clientId, request_key: requestKey, business_name: businessName, slug,
    template: String(fd.get("template") || "professional"), business_type: businessType,
    plan: isDirect ? "direct" : parsePlan(fd.get("plan")) === "lifetime" ? "lifetime" : "annual",
    ...(isDirect ? { redirect_url: directUrl, published: true } : {}),
    primary_color: client?.primary_color || (isContact ? "#343d31" : "#1f2937"),
    background_color: client?.background_color || (isContact ? "#e9eae2" : "#f7f5f0"),
    ...(isContact ? { button_style: { contactTheme: "essential", contactLayout: "card" } } : {}),
    ...(isPet ? { primary_color: look.accent, background_color: look.background, description: DEFAULT_PET_MESSAGE, button_style: { pet: newPet(petPhone) } } : {}),
    // Una landing creada desde una plantilla por rubro arranca idéntica a ella, con los datos de
    // ejemplo, salvo el nombre visible, que es el que se escribió al crearla.
    ...(rubroTemplate ? { ...rubroTemplate.landing, business_name: businessName, title_style: { ...rubroTemplate.landing.title_style, headline: businessName } } : {}),
  }).select("id").single();
  if (error && requestKey) {
    const { data: existing } = await s.from("landings").select("id,business_type").eq("owner_id", user.id).eq("request_key", requestKey).maybeSingle();
    if (existing) redirect(doneUrl(existing.id, existing.business_type));
  }
  if (error) onError(error.message);
  const landingId = data?.id;
  if (!landingId) onError("No se pudo crear la landing");
  if (rubroTemplate) {
    const { error: actionsError } = await s.from("actions").insert(templateActionRows(rubroTemplate, landingId));
    if (actionsError) onError(actionsError.message);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  if (clientId) revalidatePath("/admin/clientes/" + clientId);
  redirect(doneUrl(landingId, businessType));
}

export async function publish(fd: FormData) {
  const { s, user } = await auth();
  const id = String(fd.get("id") || "");
  const returnTo = String(fd.get("return_to") || "/admin");
  const target = returnTo.startsWith("/admin") ? returnTo : "/admin";
  const desired = String(fd.get("published")) === "true";
  const { data: landing, error: lookupError } = await s.from("landings").select("id,slug,business_type,plan,expires_at,template_name,button_style,client_id").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (lookupError) redirect(target + "?error=" + encodeURIComponent(lookupError.message));
  if (!landing) redirect(target + "?error=Página inexistente o sin permisos");
  if (desired && landing.template_name) redirect(target + "?error=" + encodeURIComponent("Una plantilla no se publica: creá una página desde ella."));
  // Un botón sin link no llevaría a ningún lado (por ejemplo, recién copiado de una plantilla).
  if (desired && landing.business_type === "pet" && !petHasContact(parsePet(landing.button_style))) redirect(target + "?error=" + encodeURIComponent("Cargá el WhatsApp de la familia antes de publicar la chapita."));
  if (desired && landing.business_type === "pet" && fd.get("public_visibility_ack") !== "yes") redirect(target + "?error=" + encodeURIComponent("Confirmá qué datos de la chapita se harán públicos."));
  if (desired && landing.business_type !== "contact" && landing.business_type !== "pet") {
    const { data: actions, error: actionsError } = await s.from("actions").select("type,url,title").eq("landing_id", id).eq("enabled", true);
    if (actionsError) redirect(target + "?error=" + encodeURIComponent(actionsError.message));
    const missing = buttonsMissingLink(actions || []);
    if (missing.length) redirect(target + "?error=" + encodeURIComponent(`Antes de publicar, completá el link de: ${missing.map((action) => action.title || "un botón").join(", ")}.`));
  }
  if (desired && landing.business_type === "contact") {
    const { data: actions, error: actionsError } = await s.from("actions").select("type,url").eq("landing_id", id).eq("enabled", true).in("type", ["phone", "email", "whatsapp"]);
    if (actionsError) redirect(target + "?error=" + encodeURIComponent(actionsError.message));
    if (!actions?.some((action) => String(action.url || "").trim())) redirect(target + "?error=" + encodeURIComponent("Agregá un teléfono, email o WhatsApp antes de publicar la tarjeta."));
  }
  // Publicar por primera vez una página anual arranca su año (ver publishUpdate).
  // Una chapita que ya es de un dueño y se despublica desde acá (por ejemplo, por una denuncia) queda
  // bloqueada: el dueño no la puede volver a publicar al guardar (ver save_my_pet). Publicarla
  // desde acá la desbloquea.
  const moderation = landing.business_type === "pet" ? { blocked_at: !desired && landing.client_id ? new Date().toISOString() : null } : {};
  const { error } = await s.from("landings").update({ ...publishUpdate(landing, desired), ...moderation }).eq("id", id).eq("owner_id", user.id);
  if (error) redirect(target + "?error=" + encodeURIComponent(error.message));
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  revalidatePath("/admin/landings/" + id);
  if (landing.slug) revalidateLandingPage(landing.slug);
  const label = landing.business_type === "contact" ? "Tarjeta" : "Landing";
  redirect(target + "?saved=" + encodeURIComponent(`${label} ${desired ? "publicada" : "despublicada"}`));
}
export async function renameLanding(fd:FormData){const {s,user}=await auth();const id=String(fd.get("id")||"");const requestedReturnTo=String(fd.get("return_to")||"/admin");const returnTo=requestedReturnTo.startsWith("/admin")?requestedReturnTo:"/admin";const fail=(message:string):never=>redirect(returnTo+"?error="+encodeURIComponent(message));const businessName=String(fd.get("business_name")||"").trim();if(!businessName)fail("El nombre de la landing es obligatorio.");const slug=slugify(String(fd.get("slug")||""));if(!slug)fail("El link de la landing es obligatorio.");const {data:landing,error:lookupError}=await s.from("landings").select("id,slug,business_name,business_type,title_style").eq("id",id).eq("owner_id",user.id).maybeSingle();if(lookupError)fail(lookupError.message);if(!landing)redirect(returnTo+"?error="+encodeURIComponent("Landing inexistente o sin permisos"));const slugChanged=slug!==landing.slug;if(slugChanged){const {data:ex,error:slugError}=await s.rpc("slug_in_use",{p_slug:slug,p_landing:id});if(slugError)fail(slugError.message);if(ex)fail("Ese link ya está en uso por otra página.")}const currentTitleStyle=landing.title_style&&typeof landing.title_style==="object"&&!Array.isArray(landing.title_style)?landing.title_style as Record<string,unknown>:{};const update:Record<string,unknown>={business_name:businessName,slug};if(landing.business_type!=="contact"&&typeof currentTitleStyle.headline!=="string")update.title_style={...currentTitleStyle,headline:landing.business_name};const {error}=await s.from("landings").update(update).eq("id",id).eq("owner_id",user.id);if(error)fail(error.message);revalidatePath("/admin");revalidatePath("/admin/paginas");revalidatePath("/admin/landings/"+id+"/editor-v2");if(landing.slug)revalidateLandingPage(landing.slug);if(slugChanged)revalidateLandingPage(slug);redirect(returnTo+"?saved="+encodeURIComponent(slugChanged?"Nombre y link actualizados":"Nombre actualizado"))}
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
  if (landing.slug) revalidateLandingPage(landing.slug);
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

// --- Gestión de una página: plan, vencimiento, link de respaldo y firma -------------------------
// Todo lo operativo de una página vive en /admin/landings/[id]/gestion, separado del editor de
// diseño. Las reglas están en lib/landing-plan.ts (con tests); acá solo se lee el formulario, se
// guarda lo que esas funciones devuelven y se refresca la página pública, porque cualquiera de
// estos cambios puede hacer que pase a mostrarse o a redirigir.
async function applyManagement(fd: FormData, decide: (landing: Record<string, unknown>) => UpdateResult): Promise<never> {
  const { s, user } = await auth();
  const id = String(fd.get("id") || "");
  const target = "/admin/landings/" + id + "/gestion";
  const { data: landing, error } = await s.from("landings").select("id,slug,plan,expires_at,fallback_url,redirect_url,published,button_style").eq("id", id).eq("owner_id", user.id).maybeSingle();
  if (error) redirect(target + "?error=" + encodeURIComponent(error.message));
  if (!landing) redirect("/admin/paginas?error=" + encodeURIComponent("Página inexistente o sin permisos"));
  const result = decide(landing);
  if (!result.ok) redirect(target + "?error=" + encodeURIComponent(result.error));
  const { error: updateError } = await s.from("landings").update(result.update).eq("id", id).eq("owner_id", user.id);
  if (updateError) redirect(target + "?error=" + encodeURIComponent(updateError.message));
  revalidatePath(target);
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
  revalidatePath("/admin/landings/" + id + "/editor-v2");
  if (landing.slug) revalidateLandingPage(landing.slug);
  redirect(target + "?saved=" + encodeURIComponent(result.message));
}

export async function saveLandingManagement(fd: FormData) {
  return applyManagement(fd, (landing) => managementUpdate(landing, {
    plan: fd.get("plan"),
    expiresAt: fd.get("expires_at"),
    fallbackUrl: fd.get("fallback_url"),
    directUrl: fd.get("direct_url"),
    showBranding: fd.get("show_branding") === "on",
  }));
}

export async function renewLanding(fd: FormData) {
  return applyManagement(fd, (landing) => renewalUpdate(landing));
}

export async function setLandingRedirect(fd: FormData) {
  return applyManagement(fd, (landing) => manualRedirectUpdate(landing, fd.get("clear") !== "true"));
}

// --- Plantillas ---------------------------------------------------------------------------------
// Una plantilla es una landing propia con template_name: no tiene cliente, nunca se publica y no
// aparece en Páginas. Se edita en el editor de siempre y se maneja en /admin/plantillas. Elegirla
// (al crear una página o desde el editor) copia la página entera. Siempre son copias: guardar una
// página de un cliente como plantilla no la saca de su lugar.
const TEMPLATES_PATH = "/admin/plantillas";
const templateName = (value: unknown) => String(value || "").trim().slice(0, 40);

async function insertTemplate(s: Awaited<ReturnType<typeof createClient>>, ownerId: string, source: BusinessTemplate | null, name: string, order: number) {
  // Una plantilla nunca guarda links: ni los de ejemplo ni los de la página de un cliente copiada.
  const template = source && withoutLinks(source);
  const { data, error } = await s.from("landings").insert({
    owner_id: ownerId, client_id: null, business_type: "custom", template: "professional", plan: "lifetime", published: false,
    slug: "plantilla-" + crypto.randomUUID().slice(0, 8), business_name: template?.landing.business_name || name,
    ...(template ? template.landing : {}), template_name: name, template_order: order, template_hidden: false,
  }).select("id").single();
  if (error || !data) return { error: error?.message || "No se pudo crear la plantilla" };
  if (template?.actions.length) {
    const { error: actionsError } = await s.from("actions").insert(templateActionRows(template, data.id));
    if (actionsError) return { error: actionsError.message };
  }
  return { id: data.id as string };
}

async function nextTemplateOrder(s: Awaited<ReturnType<typeof createClient>>, ownerId: string) {
  const { data } = await s.from("landings").select("template_order").eq("owner_id", ownerId).not("template_name", "is", null).order("template_order", { ascending: false }).limit(1);
  return Number(data?.[0]?.template_order ?? -1) + 1;
}

function refreshTemplates() {
  revalidatePath(TEMPLATES_PATH);
  revalidatePath("/admin");
  revalidatePath("/admin/paginas");
}

export async function createTemplate(fd: FormData) {
  const { s, user } = await auth();
  const name = templateName(fd.get("template_name"));
  if (!name) redirect(TEMPLATES_PATH + "?error=" + encodeURIComponent("Ponele un nombre a la plantilla."));
  const result = await insertTemplate(s, user.id, null, name, await nextTemplateOrder(s, user.id));
  if ("error" in result) redirect(TEMPLATES_PATH + "?error=" + encodeURIComponent(String(result.error)));
  refreshTemplates();
  redirect("/admin/landings/" + result.id + "/editor-v2?saved=" + encodeURIComponent("Plantilla creada: armalo como cualquier página"));
}

// Trae las plantillas de BIONFC (lib/business-templates.ts) a la cuenta, para poder editarlas,
// ocultarlos u ordenarlos. Los que ya están (mismo nombre) no se duplican.
export async function importBuiltinTemplates() {
  const { s, user } = await auth();
  const { data: existing, error } = await s.from("landings").select("template_name").eq("owner_id", user.id).not("template_name", "is", null);
  if (error) redirect(TEMPLATES_PATH + "?error=" + encodeURIComponent(error.message));
  const taken = new Set((existing || []).map((row) => row.template_name));
  let order = await nextTemplateOrder(s, user.id);
  let added = 0;
  for (const template of BUSINESS_TEMPLATES) {
    if (taken.has(template.name)) continue;
    const result = await insertTemplate(s, user.id, template, template.name, order++);
    if ("error" in result) redirect(TEMPLATES_PATH + "?error=" + encodeURIComponent(String(result.error)));
    added++;
  }
  refreshTemplates();
  redirect(TEMPLATES_PATH + "?saved=" + encodeURIComponent(added ? `Listo: ${added} plantillas de BIONFC en tu cuenta` : "Ya las tenías todas"));
}

// Copia una página (una plantilla, o la landing de un cliente desde Gestión) como plantilla nueva.
export async function copyAsTemplate(fd: FormData) {
  const { s, user } = await auth();
  const id = String(fd.get("id") || "");
  const requestedReturnTo = String(fd.get("return_to") || TEMPLATES_PATH);
  const returnTo = requestedReturnTo.startsWith("/admin") ? requestedReturnTo : TEMPLATES_PATH;
  const fail = (message: string): never => redirect(returnTo + "?error=" + encodeURIComponent(message));
  const { data: source, error } = await s.from("landings").select("*, actions(*)").eq("id", id).eq("owner_id", user.id).eq("business_type", "custom").maybeSingle();
  if (error) fail(error.message);
  if (!source) fail("Página inexistente o sin permisos");
  const name = templateName(fd.get("template_name")) || templateName(`${source.template_name || source.business_name} (copia)`);
  const result = await insertTemplate(s, user.id, templateFromLanding(source), name, await nextTemplateOrder(s, user.id));
  if ("error" in result) fail(String(result.error));
  refreshTemplates();
  redirect(returnTo + "?saved=" + encodeURIComponent(`Plantilla "${name}" creada`));
}

export async function updateTemplate(fd: FormData) {
  const { s, user } = await auth();
  const id = String(fd.get("id") || "");
  const op = String(fd.get("op") || "");
  const fail = (message: string): never => redirect(TEMPLATES_PATH + "?error=" + encodeURIComponent(message));
  const { data: rows, error } = await s.from("landings").select("id,template_name,template_order,template_hidden").eq("owner_id", user.id).not("template_name", "is", null);
  if (error) fail(error.message);
  const sorted = sortTemplateRows(rows || []);
  const index = sorted.findIndex((row) => row.id === id);
  if (index < 0) fail("Plantilla inexistente o sin permisos");
  const update = (patch: Record<string, unknown>, rowId = id) => s.from("landings").update(patch).eq("id", rowId).eq("owner_id", user.id);
  let message = "";
  let updateError: { message: string } | null = null;
  if (op === "rename") {
    const name = templateName(fd.get("template_name"));
    if (!name) fail("Ponele un nombre a la plantilla.");
    updateError = (await update({ template_name: name })).error;
    message = "Nombre actualizado";
  } else if (op === "hide" || op === "show") {
    updateError = (await update({ template_hidden: op === "hide" })).error;
    message = op === "hide" ? "Plantilla oculta: ya no se ofrece al crear páginas" : "Plantilla visible otra vez";
  } else if (op === "up" || op === "down") {
    const other = index + (op === "up" ? -1 : 1);
    if (other >= 0 && other < sorted.length) {
      [sorted[index], sorted[other]] = [sorted[other], sorted[index]];
      for (const [position, row] of sorted.entries()) {
        if (row.template_order === position) continue;
        const { error: orderError } = await update({ template_order: position }, row.id);
        if (orderError) fail(orderError.message);
      }
    }
    message = "Orden actualizado";
  } else if (op === "delete") {
    const { error: deleteError } = await s.from("landings").delete().eq("id", id).eq("owner_id", user.id).not("template_name", "is", null);
    if (deleteError) fail(deleteError.message);
    message = "Plantilla eliminada";
  } else fail("Acción desconocida");
  if (updateError) fail(updateError.message);
  refreshTemplates();
  redirect(TEMPLATES_PATH + "?saved=" + encodeURIComponent(message));
}

// Una denuncia revisada (ver /denunciar): deja de aparecer en el Resumen. Si la página tenía que
// bajarse, se despublica aparte, desde su Gestión o su editor.
export async function resolveReport(fd: FormData) {
  const { s } = await auth();
  const { error } = await s.from("reports").update({ resolved_at: new Date().toISOString() }).eq("id", String(fd.get("id") || ""));
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));
  revalidatePath("/admin");
  redirect("/admin?saved=" + encodeURIComponent("Denuncia marcada como resuelta"));
}
