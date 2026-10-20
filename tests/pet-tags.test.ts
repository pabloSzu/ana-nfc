// Lotes y códigos de activación de chapitas (lib/pet-tags.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CODE_LENGTH, formatCode, newActivationCode, newTagSlug, normalizeCode, tagState } from "../lib/pet-tags.ts";

describe("códigos de activación", () => {
  test("8 caracteres fáciles de leer: sin 0, O, 1, I, L, 5 ni S", () => {
    for (let i = 0; i < 200; i++) {
      const code = newActivationCode();
      assert.equal(code.length, CODE_LENGTH);
      assert.doesNotMatch(code, /[01OILS5]/);
    }
  });

  test("se escribe como sea y se entiende igual", () => {
    assert.equal(normalizeCode(" abcd-2346 "), "ABCD2346");
    assert.equal(normalizeCode("ab cd 23 46"), "ABCD2346");
    assert.equal(formatCode("abcd2346"), "ABCD-2346");
  });

  test("el link de la chapita es corto y al azar", () => {
    assert.match(newTagSlug(), /^m-[a-z2-9]{7}$/);
    assert.notEqual(newTagSlug(), newTagSlug());
  });
});

describe("estado de una chapita del lote", () => {
  test("sin activar, activa o perdida", () => {
    assert.equal(tagState({ activated_at: null }), "stock");
    assert.equal(tagState({ activated_at: "2026-10-20", lost: false }), "active");
    assert.equal(tagState({ activated_at: "2026-10-20", lost: true }), "lost");
  });
});
