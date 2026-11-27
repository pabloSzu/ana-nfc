// Cómo se acomodan las tarjetitas en la hoja (app/admin/chapitas/[id]/imprimir/card-pack.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { cardSizeOptions, packCards, type CardSlot } from "../app/admin/chapitas/[id]/imprimir/card-pack.ts";

// A4 menos 7 mm de margen por lado, 2 mm entre tarjetas; la tarjeta abierta base es 115×55 mm.
const AREA = { width: 196, height: 283 }, GAP = 2, BASE = { width: 115, height: 55 };
const at = (percent: number) => packCards(AREA.width, AREA.height, BASE.width * percent / 100, BASE.height * percent / 100, GAP);
const box = (slot: CardSlot, percent: number) => {
  const w = BASE.width * percent / 100, h = BASE.height * percent / 100;
  return { left: slot.x, top: slot.y, right: slot.x + (slot.rotated ? h : w), bottom: slot.y + (slot.rotated ? w : h) };
};

describe("acomodar tarjetitas", () => {
  test("girando entran más que todas horizontales", () => {
    assert.equal(at(100).length, 6);
    assert.equal(at(86).length, 9);
    assert.equal(at(70).length, 14);
    assert.equal(at(68).length, 17);
  });

  test("si todas horizontales ya es lo mejor, no gira ninguna", () => {
    const slots = at(82);
    assert.equal(slots.length, 12);
    assert.ok(slots.every((slot) => !slot.rotated));
  });

  test("ninguna se sale de la hoja ni se pisa con otra (con 2 mm entre medio)", () => {
    for (const percent of [100, 95, 86, 82, 75, 70, 68, 65]) {
      const boxes = at(percent).map((slot) => box(slot, percent));
      for (const b of boxes) assert.ok(b.left >= -1e-9 && b.top >= -1e-9 && b.right <= AREA.width + 1e-9 && b.bottom <= AREA.height + 1e-9, `${percent}%: se sale`);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], c = boxes[j];
        const apart = a.right + GAP <= c.left + 1e-6 || c.right + GAP <= a.left + 1e-6 || a.bottom + GAP <= c.top + 1e-6 || c.bottom + GAP <= a.top + 1e-6;
        assert.ok(apart, `${percent}%: las tarjetas ${i} y ${j} se pisan`);
      }
    }
  });

  test("las opciones por hoja van de más grande a más chica y sin repetir cantidad", () => {
    const options = cardSizeOptions(AREA.width, AREA.height, BASE.width, BASE.height, GAP);
    assert.deepEqual(options.map((option) => option.count), [6, 9, 12, 14, 17]);
    assert.equal(options[0].percent, 100);
    for (let i = 1; i < options.length; i++) assert.ok(options[i].percent < options[i - 1].percent);
  });
});
