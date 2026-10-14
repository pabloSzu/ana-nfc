"use client";

import { useState } from "react";
import PendingSubmitButton from "@/components/pending-submit-button";
import { GRACE_DAYS, type LandingPlan, type PlanStatus } from "@/lib/landing-plan";

export type ManagePanelData = {
  id: string;
  plan: LandingPlan;
  kind: "página" | "tarjeta";
  published: boolean;
  status: PlanStatus;
  expiresLabel: string;
  expiresDate: string;
  fallbackUrl: string;
  autoFallback: string;
  effectiveFallback: string;
  directUrl: string;
  manualRedirect: boolean;
  opens: string;
  showBranding: boolean;
  whatsapp: string;
  hasClientPhone: boolean;
  renewUntil: string;
};

type Action = (fd: FormData) => Promise<void>;

const PLANS: { value: LandingPlan; title: string; note: string }[] = [
  { value: "annual", title: "Anual", note: "Se renueva cada año" },
  { value: "direct", title: "Link directo", note: "Un solo link, no vence" },
  { value: "lifetime", title: "Sin vencimiento", note: "Propia, regalo o cortesía" },
];

function Hidden({ id }: { id: string }) {
  return <input type="hidden" name="id" value={id} />;
}

// Arriba, el estado y lo que conviene hacer ahora; abajo, la configuración del plan. Cada plan
// muestra solo sus campos, y el servidor limpia lo que no aplica al plan elegido.
export default function ManagePanel({ data, saveAction, renewAction, redirectAction }: { data: ManagePanelData; saveAction: Action; renewAction: Action; redirectAction: Action }) {
  const [plan, setPlan] = useState<LandingPlan>(data.plan);
  const { kind } = data;
  const changed = plan !== data.plan;

  return (
    <div className="manage-layout">
      <section className={`card manage-hero is-${data.status.tone}`}>
        <div className="manage-hero-copy">
          <span className={`plan-status is-${data.status.tone}`}>{data.status.label}</span>
          <p className="manage-opens-line">
            <span>Al acercar el celular:</span>
            <strong>{!data.published ? `nada todavía, falta publicar la ${kind}` : data.opens ? data.opens : `se ve la ${kind}`}</strong>
          </p>
        </div>
        <div className="manage-hero-actions">
          {data.plan === "annual" && data.expiresLabel && <form action={renewAction}>
            <Hidden id={data.id} />
            <PendingSubmitButton className="btn" pendingText="Renovando…">Renovar hasta el {data.renewUntil}</PendingSubmitButton>
          </form>}
          {data.whatsapp && <a className="btn secondary" href={data.whatsapp} target="_blank" rel="noreferrer">Avisar por WhatsApp</a>}
          {data.plan === "annual" && data.expiresLabel && !data.hasClientPhone && <small className="manage-help">Cargá el teléfono del cliente para avisarle por WhatsApp.</small>}
          {data.plan === "annual" && data.manualRedirect && <form action={redirectAction}>
            <Hidden id={data.id} /><input type="hidden" name="clear" value="true" />
            <PendingSubmitButton className="btn secondary" pendingText="Guardando…">Volver a mostrar la {kind}</PendingSubmitButton>
          </form>}
        </div>
      </section>

      <section className="card manage-config">
        <form action={saveAction}>
          <Hidden id={data.id} />
          <div className="manage-tabs" role="radiogroup" aria-label="Plan">
            {PLANS.map((option) => <label key={option.value} className={plan === option.value ? "is-active" : ""}>
              <input type="radio" name="plan" value={option.value} checked={plan === option.value} onChange={() => setPlan(option.value)} />
              <strong>{option.title}</strong>
              <small>{option.note}</small>
            </label>)}
          </div>

          <div className="manage-fields">
            {plan === "annual" && <>
              <label className="manage-field">
                <span>Vence el</span>
                <input type="date" name="expires_at" defaultValue={data.expiresDate} />
                <small>{data.published ? "Vacío: corre un año desde hoy." : `Vacío: el año empieza cuando publiques la ${kind}.`}</small>
              </label>
              <label className="manage-field">
                <span>Link de respaldo <em>opcional</em></span>
                <input type="text" inputMode="url" name="fallback_url" placeholder={data.autoFallback ? data.autoFallback.replace(/^https?:\/\//, "") : "instagram.com/minegocio"} defaultValue={data.fallbackUrl || data.directUrl} />
                <small>{data.fallbackUrl
                  ? <>Si no renueva, a los {GRACE_DAYS} días el producto abre este link.{data.autoFallback && <> Si lo borrás, usa el primer botón de la {kind}.</>}</>
                  : data.autoFallback
                    ? <>Si no renueva, a los {GRACE_DAYS} días el producto abre este link. Vacío: usa el primer botón de la {kind}, <b>{data.autoFallback}</b></>
                    : <>Si no renueva, a los {GRACE_DAYS} días el producto abre este link. <b>La {kind} todavía no tiene botones</b>, así que cargá uno acá.</>}</small>
              </label>
            </>}

            {plan === "direct" && <label className="manage-field">
              <span>Link que abre el producto</span>
              <input type="text" inputMode="url" name="direct_url" placeholder="g.page/r/mi-negocio/review" defaultValue={data.directUrl || data.effectiveFallback} required />
              <small>Reseñas de Google, Instagram, WhatsApp, web… Se cambia acá sin regrabar el chip.</small>
            </label>}

            {plan === "lifetime" && <p className="manage-note">No vence nunca y la {kind} se muestra siempre.</p>}

            {plan !== "direct" && <label className="manage-check">
              <input type="checkbox" name="show_branding" defaultChecked={data.showBranding} />
              <span><strong>Firma de BIONFC</strong><small>El logo al pie de la {kind}.</small></span>
            </label>}
          </div>

          {changed && <p className="manage-change" role="status">{plan === "direct" ? `Al guardar, el producto abre el link directo y la ${kind} deja de mostrarse (no se borra).` : plan === "lifetime" ? `Al guardar, la ${kind} deja de vencer y se muestra siempre.` : `Al guardar, la ${kind} vuelve a mostrarse y vence cada año.`}</p>}

          <div className="manage-submit">
            <PendingSubmitButton className="btn" pendingText="Guardando…">Guardar cambios</PendingSubmitButton>
            {data.plan === "annual" && data.status.key === "expired" && !data.manualRedirect && data.effectiveFallback && data.published && !data.opens && <button className="text-button" type="submit" formAction={redirectAction}>Redirigir ya al link de respaldo</button>}
          </div>
        </form>
      </section>
    </div>
  );
}
