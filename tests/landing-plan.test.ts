// Reglas de plan, vencimiento y redirección (lib/landing-plan.ts). Corren con el test runner de
// Node, sin dependencias: `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  GRACE_DAYS,
  WARNING_DAYS,
  effectiveRedirect,
  managementUpdate,
  manualRedirectUpdate,
  normalizeLink,
  parsePlan,
  pickButtonLink,
  planOf,
  planStatus,
  publishUpdate,
  renewalUpdate,
  renewedExpiry,
  type UpdateResult,
} from "../lib/landing-plan.ts";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-13T15:00:00.000Z");
const inDays = (days: number) => new Date(NOW.getTime() + days * DAY).toISOString();
const ok = (result: UpdateResult) => { assert.equal(result.ok, true, result.ok ? "" : result.error); return (result as Extract<UpdateResult, { ok: true }>).update; };
const fails = (result: UpdateResult, pattern: RegExp) => { assert.equal(result.ok, false); assert.match((result as Extract<UpdateResult, { ok: false }>).error, pattern); };

describe("planOf / parsePlan", () => {
  test("cualquier valor desconocido o vacío es anual", () => {
    assert.equal(planOf({}), "annual");
    assert.equal(planOf({ plan: null }), "annual");
    assert.equal(planOf({ plan: "otro" }), "annual");
    assert.equal(planOf({ plan: "direct" }), "direct");
    assert.equal(planOf({ plan: "lifetime" }), "lifetime");
    assert.equal(parsePlan("lifetime"), "lifetime");
    assert.equal(parsePlan(null), "annual");
    assert.equal(parsePlan("DROP TABLE"), "annual");
  });
});

describe("effectiveRedirect: qué abre la página pública", () => {
  const fallback = "https://instagram.com/negocio";

  test("anual vigente se muestra", () => {
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(100), fallback_url: fallback }, NOW), null);
  });

  test("anual vencida dentro de los días de gracia se sigue mostrando", () => {
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(-1), fallback_url: fallback }, NOW), null);
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(-GRACE_DAYS), fallback_url: fallback }, NOW), null);
  });

  test("anual vencida más allá de la gracia abre el link de respaldo", () => {
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(-GRACE_DAYS - 0.01), fallback_url: fallback }, NOW), fallback);
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(-400), fallback_url: fallback }, NOW), fallback);
  });

  test("anual vencida sin link de respaldo se sigue mostrando (no se apaga nunca)", () => {
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(-400), fallback_url: "" }, NOW), null);
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(-400), fallback_url: "   " }, NOW), null);
  });

  test("anual sin fecha (borrador) no redirige", () => {
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: null, fallback_url: fallback }, NOW), null);
  });

  test("anual redirigida a mano abre su link aunque esté vigente", () => {
    assert.equal(effectiveRedirect({ plan: "annual", expires_at: inDays(100), redirect_url: fallback }, NOW), fallback);
  });

  test("link directo abre su link siempre y no le afectan las fechas", () => {
    assert.equal(effectiveRedirect({ plan: "direct", redirect_url: "https://g.page/r/x", expires_at: inDays(-999) }, NOW), "https://g.page/r/x");
  });

  test("link directo sin link cargado todavía no redirige", () => {
    assert.equal(effectiveRedirect({ plan: "direct", redirect_url: null }, NOW), null);
  });

  test("sin vencimiento nunca redirige, aunque quede algo viejo en la base", () => {
    assert.equal(effectiveRedirect({ plan: "lifetime", redirect_url: "https://viejo.com", expires_at: inDays(-999), fallback_url: fallback }, NOW), null);
  });
});

describe("planStatus: el chip de color", () => {
  test("link directo y sin vencimiento no muestran fechas", () => {
    const direct = planStatus({ plan: "direct", redirect_url: "https://x.com", expires_at: inDays(5) }, NOW);
    assert.equal(direct.key, "direct");
    assert.equal(direct.label, "Link directo · no vence");
    assert.doesNotMatch(direct.label, /\d/);
    const lifetime = planStatus({ plan: "lifetime", expires_at: inDays(-5) }, NOW);
    assert.equal(lifetime.key, "lifetime");
    assert.equal(lifetime.label, "Sin vencimiento");
  });

  test("link directo sin link avisa que falta", () => {
    const status = planStatus({ plan: "direct" }, NOW);
    assert.equal(status.key, "direct-missing");
    assert.equal(status.tone, "warn");
  });

  test("anual sin fecha: empieza al publicarla", () => {
    assert.equal(planStatus({ plan: "annual" }, NOW).key, "pending");
  });

  test("activa, por vencer y vence hoy, con los bordes exactos", () => {
    assert.equal(planStatus({ expires_at: inDays(WARNING_DAYS + 1) }, NOW).key, "active");
    const warning = planStatus({ expires_at: inDays(WARNING_DAYS) }, NOW);
    assert.equal(warning.key, "expiring");
    assert.equal(warning.label, `Vence en ${WARNING_DAYS} días`);
    assert.equal(planStatus({ expires_at: inDays(1) }, NOW).label, "Vence en 1 día");
    assert.equal(planStatus({ expires_at: NOW.toISOString() }, NOW).label, "Vence hoy");
  });

  test("vencida sin respaldo, vencida con respaldo en gracia y ya redirigida", () => {
    const missing = planStatus({ expires_at: inDays(-3) }, NOW);
    assert.equal(missing.key, "expired");
    assert.match(missing.label, /falta link de respaldo/);
    const grace = planStatus({ expires_at: inDays(-3), fallback_url: "https://x.com" }, NOW);
    assert.equal(grace.key, "expired");
    assert.match(grace.label, /en 12 días/);
    const auto = planStatus({ expires_at: inDays(-20), fallback_url: "https://x.com" }, NOW);
    assert.equal(auto.key, "redirected");
  });

  test("anual redirigida a mano", () => {
    assert.equal(planStatus({ expires_at: inDays(200), redirect_url: "https://x.com" }, NOW).key, "redirected");
  });
});

describe("renovar", () => {
  test("antes de vencer suma un año al vencimiento (no se pierden días)", () => {
    assert.equal(renewedExpiry("2026-12-01T15:00:00.000Z", NOW), "2027-12-01T15:00:00.000Z");
  });

  test("ya vencida, el año corre desde hoy", () => {
    assert.equal(renewedExpiry("2026-01-01T15:00:00.000Z", NOW), "2027-10-13T15:00:00.000Z");
    assert.equal(renewedExpiry(null, NOW), "2027-10-13T15:00:00.000Z");
  });

  test("renovar saca la redirección y solo aplica al plan anual", () => {
    const update = ok(renewalUpdate({ plan: "annual", expires_at: inDays(-20), redirect_url: "https://x.com" }, NOW));
    assert.equal(update.redirect_url, null);
    assert.equal(update.expires_at, "2027-10-13T15:00:00.000Z");
    fails(renewalUpdate({ plan: "lifetime" }, NOW), /anual/);
    fails(renewalUpdate({ plan: "direct" }, NOW), /anual/);
  });
});

describe("publicar", () => {
  test("la primera publicación de una anual arranca el año", () => {
    assert.deepEqual(publishUpdate({ plan: "annual" }, true, NOW), { published: true, expires_at: "2027-10-13T15:00:00.000Z" });
  });

  test("volver a publicar no reinicia el año", () => {
    assert.deepEqual(publishUpdate({ plan: "annual", expires_at: inDays(10) }, true, NOW), { published: true });
  });

  test("despublicar no toca la fecha", () => {
    assert.deepEqual(publishUpdate({ plan: "annual" }, false, NOW), { published: false });
  });

  test("link directo y sin vencimiento no reciben fecha", () => {
    assert.deepEqual(publishUpdate({ plan: "direct" }, true, NOW), { published: true });
    assert.deepEqual(publishUpdate({ plan: "lifetime" }, true, NOW), { published: true });
  });
});

describe("redirigir a mano", () => {
  test("necesita link de respaldo y plan anual", () => {
    assert.deepEqual(ok(manualRedirectUpdate({ plan: "annual", fallback_url: "https://x.com" }, true)), { redirect_url: "https://x.com" });
    fails(manualRedirectUpdate({ plan: "annual", fallback_url: "" }, true), /link de respaldo/);
    fails(manualRedirectUpdate({ plan: "lifetime", fallback_url: "https://x.com" }, true), /anual/);
    assert.deepEqual(ok(manualRedirectUpdate({ plan: "annual" }, false)), { redirect_url: null });
  });
});

describe("normalizeLink", () => {
  test("completa https y rechaza lo que no es un link", () => {
    assert.equal(normalizeLink("instagram.com/negocio"), "https://instagram.com/negocio");
    assert.equal(normalizeLink("  https://g.page/r/abc  "), "https://g.page/r/abc");
    assert.equal(normalizeLink("http://sitio.com.ar"), "http://sitio.com.ar");
    assert.equal(normalizeLink(""), "");
    assert.equal(normalizeLink(null), "");
    assert.equal(normalizeLink("hola"), null);
    assert.equal(normalizeLink("mi negocio.com"), null);
    assert.equal(normalizeLink("https://"), null);
    assert.equal(normalizeLink(".com"), null);
  });
});

describe("Guardar en Gestión", () => {
  const style = { showBranding: true, radius: 12 };

  test("anual: guarda fecha y respaldo, y respeta el resto de button_style", () => {
    const update = ok(managementUpdate({ plan: "annual", published: true, button_style: style }, { plan: "annual", expiresAt: "2027-03-20", fallbackUrl: "instagram.com/x", showBranding: false }, NOW));
    assert.equal(update.plan, "annual");
    assert.equal(update.expires_at, "2027-03-20T15:00:00.000Z");
    assert.equal(update.fallback_url, "https://instagram.com/x");
    assert.deepEqual(update.button_style, { showBranding: false, radius: 12 });
    assert.equal("redirect_url" in update, false);
  });

  test("anual: fecha vacía en una publicada conserva la que tenía, o arranca hoy si no tenía", () => {
    const kept = ok(managementUpdate({ plan: "annual", published: true, expires_at: inDays(50) }, { plan: "annual", expiresAt: "" }, NOW));
    assert.equal(kept.expires_at, inDays(50));
    const started = ok(managementUpdate({ plan: "lifetime", published: true }, { plan: "annual", expiresAt: "" }, NOW));
    assert.equal(started.expires_at, "2027-10-13T15:00:00.000Z");
  });

  test("anual: fecha vacía en un borrador queda vacía (empieza al publicar)", () => {
    assert.equal(ok(managementUpdate({ plan: "annual", published: false }, { plan: "annual" }, NOW)).expires_at, null);
  });

  test("anual: rechaza fechas y links inválidos", () => {
    fails(managementUpdate({ plan: "annual" }, { plan: "annual", expiresAt: "2027-02-30" }, NOW), /fecha/);
    fails(managementUpdate({ plan: "annual" }, { plan: "annual", expiresAt: "13/10/2027" }, NOW), /fecha/);
    fails(managementUpdate({ plan: "annual" }, { plan: "annual", fallbackUrl: "no es link" }, NOW), /respaldo/);
  });

  test("anual redirigida a mano: sigue al link nuevo, o se muestra si se borró el respaldo", () => {
    const base = { plan: "annual", published: true, expires_at: inDays(10), redirect_url: "https://viejo.com", fallback_url: "https://viejo.com" };
    assert.equal(ok(managementUpdate(base, { plan: "annual", fallbackUrl: "nuevo.com" }, NOW)).redirect_url, "https://nuevo.com");
    assert.equal(ok(managementUpdate(base, { plan: "annual", fallbackUrl: "" }, NOW)).redirect_url, null);
  });

  test("pasar de link directo a anual vuelve a mostrar la página", () => {
    const update = ok(managementUpdate({ plan: "direct", published: true, redirect_url: "https://g.page/r/x" }, { plan: "annual" }, NOW));
    assert.equal(update.redirect_url, null);
    assert.equal(update.expires_at, "2027-10-13T15:00:00.000Z");
  });

  test("link directo: exige un link válido, borra fechas y no toca la firma", () => {
    const update = ok(managementUpdate({ plan: "annual", expires_at: inDays(10), button_style: style }, { plan: "direct", directUrl: "g.page/r/abc", showBranding: false }, NOW));
    assert.deepEqual(update, { plan: "direct", redirect_url: "https://g.page/r/abc", expires_at: null });
    fails(managementUpdate({}, { plan: "direct", directUrl: "" }, NOW), /Cargá el link/);
    fails(managementUpdate({}, { plan: "direct", directUrl: "nada" }, NOW), /no parece válido/);
  });

  test("sin vencimiento: borra fecha y redirección, y guarda la firma", () => {
    const update = ok(managementUpdate({ plan: "annual", expires_at: inDays(-30), redirect_url: "https://x.com", button_style: style }, { plan: "lifetime", showBranding: true }, NOW));
    assert.equal(update.plan, "lifetime");
    assert.equal(update.expires_at, null);
    assert.equal(update.redirect_url, null);
    assert.deepEqual(update.button_style, { showBranding: true, radius: 12 });
  });

  test("lo guardado coincide con lo que después muestra la página pública", () => {
    // Una anual vencida hace 20 días con respaldo redirige; al pasarla a sin vencimiento, se muestra.
    const landing = { plan: "annual", published: true, expires_at: inDays(-20), fallback_url: "https://x.com" };
    assert.equal(effectiveRedirect(landing, NOW), "https://x.com");
    const after = { ...landing, ...ok(managementUpdate(landing, { plan: "lifetime" }, NOW)) };
    assert.equal(effectiveRedirect(after, NOW), null);
    // Y al renovarla vuelve a mostrarse.
    const renewed = { ...landing, ...ok(renewalUpdate(landing, NOW)) };
    assert.equal(effectiveRedirect(renewed, NOW), null);
    assert.equal(planStatus(renewed, NOW).key, "active");
  });
});

describe("link de respaldo automático (primer botón)", () => {
  const build = (type: string, value: string) => /^https?:\/\//.test(value) ? value : type === "instagram" ? `https://instagram.com/${value.replace(/^@/, "")}` : value;

  test("toma el primer botón activo en orden, salteando email, teléfono y documentos", () => {
    const actions = [
      { type: "instagram", url: "cafenube", position: 3 },
      { type: "phone", url: "3511234567", position: 0 },
      { type: "email", url: "a@b.com", position: 1 },
      { type: "whatsapp", url: "+54 9 351 123-4567", position: 2, enabled: false },
    ];
    assert.equal(pickButtonLink(actions, build), "https://instagram.com/cafenube");
  });

  test("WhatsApp se convierte en wa.me", () => {
    assert.equal(pickButtonLink([{ type: "whatsapp", url: "+54 9 351 123-4567" }], build), "https://wa.me/5493511234567");
    assert.equal(pickButtonLink([{ type: "whatsapp", url: "123" }], build), null);
  });

  test("sin botones útiles no hay respaldo", () => {
    assert.equal(pickButtonLink([], build), null);
    assert.equal(pickButtonLink(null, build), null);
    assert.equal(pickButtonLink([{ type: "url", url: "no es un link" }], build), null);
  });

  test("con respaldo automático, la página vencida redirige igual; el cargado a mano tiene prioridad", () => {
    const auto = { plan: "annual", expires_at: inDays(-20), auto_fallback: "https://wa.me/5493511234567" };
    assert.equal(effectiveRedirect(auto, NOW), "https://wa.me/5493511234567");
    assert.equal(planStatus({ ...auto, expires_at: inDays(-3) }, NOW).key, "expired");
    assert.doesNotMatch(planStatus({ ...auto, expires_at: inDays(-3) }, NOW).label, /falta/);
    assert.equal(effectiveRedirect({ ...auto, fallback_url: "https://instagram.com/x" }, NOW), "https://instagram.com/x");
    assert.deepEqual(ok(manualRedirectUpdate({ plan: "annual", auto_fallback: "https://wa.me/1" }, true)), { redirect_url: "https://wa.me/1" });
  });
});
