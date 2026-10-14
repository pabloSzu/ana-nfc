// Qué prediseños se ofrecen (lib/business-templates.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS_TEMPLATES, buttonsMissingLink, editorTemplates, sortTemplateRows, templateActionRows, templateChoices, withoutLinks } from "../lib/business-templates.ts";

const row = (id: string, template_name: string | null, template_order = 0, template_hidden = false) => ({ id, template_name, template_order, template_hidden });

describe("prediseños", () => {
  test("sin prediseños propios se ofrecen los de BIONFC", () => {
    assert.equal(templateChoices([]).length, BUSINESS_TEMPLATES.length);
    assert.equal(templateChoices([row("a", null)])[0].id, BUSINESS_TEMPLATES[0].id);
    assert.equal(editorTemplates([]), BUSINESS_TEMPLATES);
  });

  test("con propios se usan solo esos, en orden y sin los ocultos", () => {
    const choices = templateChoices([row("b", "Bar", 2), row("a", "Café", 1), row("c", "Oculto", 0, true)]);
    assert.deepEqual(choices, [{ id: "mine-a", name: "Café" }, { id: "mine-b", name: "Bar" }]);
  });

  test("todos ocultos: no vuelven los de BIONFC", () => {
    assert.deepEqual(templateChoices([row("a", "Café", 0, true)]), []);
  });

  test("mismo orden: alfabético", () => {
    assert.deepEqual(sortTemplateRows([row("b", "Zapatería"), row("a", "Árbol")]).map((item) => item.id), ["a", "b"]);
  });

  test("los botones copiados conservan tipo, orden y extras", () => {
    const rows = templateActionRows(BUSINESS_TEMPLATES[0], "landing-1");
    assert.equal(rows.length, BUSINESS_TEMPLATES[0].actions.length);
    assert.deepEqual(rows.map((item) => item.position), rows.map((_, index) => index));
    assert.ok(rows.every((item) => item.landing_id === "landing-1" && item.enabled));
  });
});

describe("prediseños sin links", () => {
  test("al copiar, los botones y las redes quedan sin link pero se conservan", () => {
    const base = BUSINESS_TEMPLATES[0];
    const template = { ...base, landing: { ...base.landing, button_style: { ...base.landing.button_style, quickSocials: [{ type: "instagram", url: "molinocafe" }] } } };
    const copy = withoutLinks(template);
    assert.equal(copy.actions.length, template.actions.length);
    assert.ok(copy.actions.every((action) => action.url === ""));
    assert.deepEqual(copy.landing.button_style.quickSocials, [{ type: "instagram", url: "" }]);
    assert.equal(copy.actions[0].title, template.actions[0].title);
    assert.ok(template.actions.some((action) => action.url), "no modifica el original");
  });

  test("botones sin link: la promo no cuenta", () => {
    const missing = buttonsMissingLink([{ type: "whatsapp", url: "" }, { type: "promo", url: "" }, { type: "url", url: " https://x.com " }, { type: "review", url: "  " }]);
    assert.deepEqual(missing.map((item) => item.type), ["whatsapp", "review"]);
  });
});
