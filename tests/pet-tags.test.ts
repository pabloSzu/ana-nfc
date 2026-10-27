// Lotes y códigos de activación de chapitas (lib/pet-tags.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { activationPath, CODE_LENGTH, formatCode, newActivationCode, newTagSlug, normalizeCode, shortTagCode, shortTagRange, tagState } from "../lib/pet-tags.ts";

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

  test("el QR secreto abre la activación con el código precargado", () => {
    assert.equal(activationPath("abcd-2346"), "/activar?c=ABCD2346");
  });

  test("el link de la chapita es corto y al azar", () => {
    assert.match(newTagSlug(), /^m-[a-z2-9]{7}$/);
    assert.notEqual(newTagSlug(), newTagSlug());
  });
});

describe("link corto del QR", () => {
  test("los primeros 12 caracteres del id, sin guiones", () => {
    assert.equal(shortTagCode("2AD4B7A2-EE0B-49A6-8669-71EB4EF75491"), "2ad4b7a2ee0b");
  });

  test("el rango abarca justo los ids que empiezan así", () => {
    const [from, to] = shortTagRange("2ad4b7a2ee0b")!;
    const id = "2ad4b7a2-ee0b-49a6-8669-71eb4ef75491";
    assert.ok(from <= id && id <= to);
    assert.equal(from, "2ad4b7a2-ee0b-0000-0000-000000000000");
    assert.equal(to, "2ad4b7a2-ee0b-ffff-ffff-ffffffffffff");
  });

  test("cualquier otra cosa no es un código", () => {
    assert.equal(shortTagRange("2ad4b7a2"), null);
    assert.equal(shortTagRange("2ad4b7a2ee0z"), null);
    assert.equal(shortTagRange("2AD4B7A2EE0B"), null);
  });
});

describe("estado de una chapita del lote", () => {
  test("sin activar, activa o perdida", () => {
    assert.equal(tagState({ activated_at: null }), "stock");
    assert.equal(tagState({ activated_at: "2026-10-20", lost: false }), "active");
    assert.equal(tagState({ activated_at: "2026-10-20", lost: true }), "lost");
  });
});
