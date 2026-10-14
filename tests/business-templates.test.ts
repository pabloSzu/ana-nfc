// Qué prediseños se ofrecen (lib/business-templates.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BUSINESS_TEMPLATES, editorTemplates, sortTemplateRows, templateActionRows, templateChoices } from "../lib/business-templates.ts";

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
