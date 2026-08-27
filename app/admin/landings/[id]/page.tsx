import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ActionForm from "./action-form";
import ActionCard from "./action-card";
import LogoUpload from "./logo-upload";
import ProfileActionsForm from "./profile-actions-form";
import BuilderTabs from "./builder-tabs";
import { save, addAction, updateAction, removeAction, moveAction, uploadLogo, saveProfileActions } from "./actions";
import { publish, deleteLanding } from "../../actions";
import DeleteLandingButton from "../../delete-landing-button";
import { IconQrCode, IconEye } from "@/components/icons";

const autoColors: Record<string, string> = { whatsapp: "#25d366", instagram: "#c13584", tiktok: "#111111", facebook: "#1877f2", maps: "#db4437", youtube: "#ff0033", spotify: "#1db954", telegram: "#229ed9", email: "#334155", phone: "#475569", calendar: "#e05252", website: "#1f2937", url: "#1f2937" };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params;
  const notice = await searchParams;
  const supabase = await createClient();
  const { data: landing } = await supabase.from("landings").select("*").eq("id", id).maybeSingle();
  if (!landing) notFound();
  const { data: actions } = await supabase.from("actions").select("*").eq("landing_id", id).order("position");
  const customActions = actions?.filter((action) => !action.is_generated) || [];

  const identityPanel = (
    <section className="builder-block">
      <div className="section-heading">
        <div><h2>Identidad</h2><p className="muted">La primera impresión de tu landing: nombre, foto y colores.</p></div>
      </div>
      <form action={save} className="stack">
        <input type="hidden" name="id" value={id} />
        <label className="label">Nombre<input name="business_name" defaultValue={landing.business_name} /></label>
        <label className="label">Descripción<textarea name="description" defaultValue={landing.description} /></label>
        <label className="label">Logo URL<input name="logo_url" defaultValue={landing.logo_url} placeholder="https://..." /></label>
        <label className="label">WhatsApp principal<input name="whatsapp" defaultValue={landing.whatsapp} placeholder="549351..." /></label>
        <div className="form-split">
          <label className="label">Color principal<input name="primary_color" type="color" defaultValue={landing.primary_color || "#1f2937"} /></label>
          <label className="label">Color de fondo<input name="background_color" type="color" defaultValue={landing.background_color || "#f7f5f0"} /></label>
        </div>
        <label className="label">¿A dónde apunta el NFC? (opcional)<input name="redirect_url" type="url" defaultValue={landing.redirect_url || ""} placeholder="https://instagram.com/tunegocio" /></label>
        <p className="muted" style={{ fontSize: "0.75rem", marginTop: "-8px" }}>Dejalo vacío para usar esta landing. Si pegás un link (Instagram, tu web, Linktree...), el tag NFC va a llevar directo ahí en vez de mostrar esta página.</p>
        <button className="btn full" type="submit">Guardar identidad</button>
      </form>
      <LogoUpload action={uploadLogo} landingId={id} />
    </section>
  );

  const actionsPanel = (
    <section className="builder-block">
      <div className="section-heading">
        <div><h2>Botones de la landing</h2><p className="muted">Activá los que necesites y completá el enlace de cada uno.</p></div>
      </div>
      <ProfileActionsForm template={landing.template || "professional"} action={saveProfileActions} landingId={id} initial={actions || []} />
      <details className="advanced-actions">
        <summary>+ Agregar un botón personalizado</summary>
        <ActionForm action={addAction} landingId={id} />
        <div className="action-list">
          {customActions.map((action, index) => (
            <ActionCard key={action.id} action={action} landingId={id} update={updateAction} remove={removeAction} move={moveAction} first={index === 0} last={index === customActions.length - 1} />
          ))}
        </div>
      </details>
    </section>
  );

  const publishPanel = (
    <section className="builder-block publish-block">
      <div>
        <h2>{landing.published ? "Tu landing está online" : "Tu landing está en borrador"}</h2>
        <p className="muted">{landing.published ? "Cualquiera con el link o el tag NFC puede verla." : "Todavía no es visible para el público."}</p>
        <span className={landing.published ? "status published" : "status"}>{landing.published ? "Publicada" : "Borrador"}</span>
      </div>
      <form action={publish}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="published" value={String(!landing.published)} />
        <input type="hidden" name="return_to" value={`/admin/landings/${id}`} />
        <button className="btn full" type="submit">{landing.published ? "Despublicar" : "Publicar landing"}</button>
      </form>
      {landing.published && <Link className="btn secondary full" href={`/admin/landings/${id}/qr`}><IconQrCode /> Generar código QR para el tag NFC</Link>}
    </section>
  );

  return (
    <main className="shell builder-shell">
      <header className="builder-header">
        <Link className="back-link" href="/admin">← Volver</Link>
        <div><p className="eyebrow">Constructor</p><h1>{landing.business_name}</h1><p className="muted">/{landing.slug}</p></div>
        <div className="row-actions">
          <Link className="btn secondary" href={`/admin/landings/${id}/qr`}><IconQrCode /> Código QR</Link>
          <Link className="btn secondary" href={`/${landing.slug}`} target="_blank" rel="noreferrer"><IconEye /> Vista previa</Link>
          <DeleteLandingButton action={deleteLanding} />
        </div>
      </header>
      {notice.error && <div className="error">{notice.error}</div>}
      {notice.saved && <div className="success">{notice.saved}</div>}
      <div className="builder-layout">
        <div className="builder-content card">
          <BuilderTabs identity={identityPanel} actions={actionsPanel} publish={publishPanel} />
        </div>
        <aside className="phone-wrap">
          <p className="eyebrow">Vista previa</p>
          <div className="phone-preview" style={{ background: landing.background_color || "#f7f5f0" }}>
            <div className="phone-notch" />
            <div className="avatar">{landing.logo_url ? <img src={landing.logo_url} alt="" /> : landing.business_name.slice(0, 1)}</div>
            <h2>{landing.business_name}</h2>
            <p>{landing.description}</p>
            {actions?.filter((action) => action.enabled).map((action) => (
              <a
                className="preview-action"
                style={{ background: action.use_auto_color ? autoColors[action.type] || landing.primary_color : action.background_color || landing.primary_color, color: action.text_color || "#fff" }}
                href={action.type === "whatsapp" ? `https://wa.me/${(landing.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(action.message || "Hola, quiero hacer una consulta.")}` : action.type === "email" ? `mailto:${action.url}` : action.type === "phone" ? `tel:${action.url}` : action.url}
                key={action.id}
              >
                <span style={{ color: action.icon_color || "inherit" }}>{action.icon || "🔗"}</span> {action.title}
              </a>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
