import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { newLanding, updateClient } from "../../actions";
import LandingCreationForm from "../../landing-creation-form";
import ModalTrigger from "../../modal-trigger";
import { IconEdit, IconFileText, IconPlus, IconUser } from "@/components/icons";
import Toast from "@/components/toast";
import { Suspense } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";
import AdminPageAvatar from "@/components/admin-page-avatar";

type Landing = {
  id: string;
  business_name: string;
  business_type: string | null;
  slug: string;
  published: boolean | null;
  logo_url: string | null;
  logo_style: unknown;
  primary_color: string | null;
};

function PageList({ items, kind }: { items: Landing[]; kind: "landing" | "contact" }) {
  const singular = kind === "contact" ? "tarjeta personal" : "landing";
  if (!items.length) return <div className="client-page-empty">
    {kind === "contact" ? <IconUser /> : <IconFileText />}
    <div><strong>Todavía no hay {singular}</strong><p>Creá la primera con el botón de arriba.</p></div>
  </div>;
  return <div className="client-page-list">{items.map((landing) => <article className="client-page-item" key={landing.id}>
    <AdminPageAvatar page={landing} />
    <div className="client-page-copy">
      <strong>{landing.business_name}</strong>
      <small>/{landing.slug}</small>
    </div>
    <span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span>
    <Link className="icon-text-button accent" href={`/admin/landings/${landing.id}/editor-v2`}><IconEdit /> Editar</Link>
  </article>)}</div>;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = String(authData?.claims?.sub || "");
  if (!userId) redirect("/admin/login");
  const [{ data: client }, { data }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).eq("owner_id", userId).maybeSingle(),
    supabase.from("landings").select("id,business_name,business_type,slug,published,logo_url,logo_style,primary_color").eq("client_id", id).eq("owner_id", userId).order("created_at", { ascending: false }),
  ]);
  if (!client) notFound();
  const landings = (data || []) as Landing[];
  const contactCards = landings.filter((landing) => landing.business_type === "contact");
  const landingPages = landings.filter((landing) => landing.business_type !== "contact");
  const returnTo = `/admin/clientes/${id}`;

  return <main className="shell client-detail-shell">
    <Suspense fallback={null}><Toast /></Suspense>
    <header className="builder-header client-detail-header">
      <Link className="back-link" href="/admin/clientes">← Volver a clientes</Link>
      <div className="client-detail-title"><div className="avatar small colorful" style={{ background: client.primary_color || "#1f2937" }}>{client.name.slice(0, 1)}</div><div><p className="eyebrow">Cliente</p><h1>{client.name}</h1><p className="muted">{landings.length} {landings.length === 1 ? "experiencia digital" : "experiencias digitales"} en total</p></div></div>
      <div className="client-create-actions">
        <ModalTrigger label="Nueva landing" icon={<IconPlus />} title="Nueva landing" description={`Va a quedar guardada directamente dentro de ${client.name}.`}>
          <LandingCreationForm clients={[]} action={newLanding} kind="custom" clientId={id} clientName={client.name} returnTo={returnTo} />
        </ModalTrigger>
        <ModalTrigger label="Nueva tarjeta personal" icon={<IconPlus />} title="Nueva tarjeta personal" description={`Va a quedar guardada directamente dentro de ${client.name}.`} variant="secondary">
          <LandingCreationForm clients={[]} action={newLanding} kind="contact" clientId={id} clientName={client.name} returnTo={returnTo} />
        </ModalTrigger>
      </div>
    </header>

    <div className="client-detail-layout">
      <section className="card form-card client-identity-card">
        <div className="section-heading"><span className="step">01</span><div><h2>Datos del cliente</h2><p className="muted">Información general y colores de su marca.</p></div></div>
        <form action={updateClient} className="stack"><input type="hidden" name="id" value={id} /><label className="label">Nombre del negocio<input name="name" defaultValue={client.name} required /></label><label className="label">Email<input name="email" type="email" defaultValue={client.email} /></label><label className="label">WhatsApp<input name="phone" defaultValue={client.phone} /></label><div className="form-split"><label className="label">Color principal<input name="primary_color" type="color" defaultValue={client.primary_color || "#1f2937"} /></label><label className="label">Color de fondo<input name="background_color" type="color" defaultValue={client.background_color || "#f7f5f0"} /></label></div><PendingSubmitButton className="btn full" pendingText="Guardando…">Guardar cambios</PendingSubmitButton></form>
      </section>

      <div className="client-page-groups">
        <section className="card client-page-group">
          <div className="client-page-group-heading"><div><p className="eyebrow">Para el negocio</p><h2>Landings <span>{landingPages.length}</span></h2><p className="muted">Cada una puede tener su propio diseño, enlace, QR y NFC.</p></div><ModalTrigger label="Agregar" icon={<IconPlus />} title="Nueva landing" description={`Va a quedar guardada directamente dentro de ${client.name}.`} variant="secondary"><LandingCreationForm clients={[]} action={newLanding} kind="custom" clientId={id} clientName={client.name} returnTo={returnTo} /></ModalTrigger></div>
          <PageList items={landingPages} kind="landing" />
        </section>
        <section className="card client-page-group">
          <div className="client-page-group-heading"><div><p className="eyebrow">Para personas</p><h2>Tarjetas personales <span>{contactCards.length}</span></h2><p className="muted">Una tarjeta independiente para cada persona que la necesite.</p></div><ModalTrigger label="Agregar" icon={<IconPlus />} title="Nueva tarjeta personal" description={`Va a quedar guardada directamente dentro de ${client.name}.`} variant="secondary"><LandingCreationForm clients={[]} action={newLanding} kind="contact" clientId={id} clientName={client.name} returnTo={returnTo} /></ModalTrigger></div>
          <PageList items={contactCards} kind="contact" />
        </section>
      </div>
    </div>
  </main>;
}
