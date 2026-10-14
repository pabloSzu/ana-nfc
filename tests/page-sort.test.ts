// Orden del listado de Páginas (lib/page-sort.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parsePageSort, relativeDay, sortPages } from "../lib/page-sort.ts";

const page = (name: string, createdAt: string, extra: Partial<{ updatedAt: string; expiresAt: string; views: number }> = {}) => ({
  name, createdAt, updatedAt: extra.updatedAt || createdAt, expiresAt: extra.expiresAt || "", views: { total: extra.views || 0 },
});
const rows = [
  page("Bar", "2026-10-01", { updatedAt: "2026-10-14", expiresAt: "2027-03-01", views: 5 }),
  page("árbol", "2026-10-10", { views: 20 }),
  page("Café", "2026-09-01", { expiresAt: "2026-11-01", views: 5 }),
];
const names = (list: { name: string }[]) => list.map((item) => item.name);

describe("orden del listado de páginas", () => {
  test("recientes, antiguas y editadas", () => {
    assert.deepEqual(names(sortPages(rows, "recent")), ["árbol", "Bar", "Café"]);
    assert.deepEqual(names(sortPages(rows, "oldest")), ["Café", "Bar", "árbol"]);
    assert.deepEqual(names(sortPages(rows, "edited")), ["Bar", "árbol", "Café"]);
  });

  test("nombre sin importar acentos ni mayúsculas", () => {
    assert.deepEqual(names(sortPages(rows, "name")), ["árbol", "Bar", "Café"]);
  });

  test("vencen primero: las sin vencimiento al final", () => {
    assert.deepEqual(names(sortPages(rows, "expiring")), ["Café", "Bar", "árbol"]);
  });

  test("más visitas, y a igual cantidad por nombre", () => {
    assert.deepEqual(names(sortPages(rows, "views")), ["árbol", "Bar", "Café"]);
  });

  test("valor desconocido: más recientes; no modifica el original", () => {
    assert.equal(parsePageSort("cualquiera"), "recent");
    sortPages(rows, "name");
    assert.equal(rows[0].name, "Bar");
  });
});

describe("fecha relativa", () => {
  const now = new Date("2026-10-14T15:00:00-03:00");
  test("hoy, ayer, días y semanas", () => {
    assert.equal(relativeDay("2026-10-14T01:00:00-03:00", now), "hoy");
    assert.equal(relativeDay("2026-10-13T23:30:00-03:00", now), "ayer");
    assert.equal(relativeDay("2026-10-10T12:00:00-03:00", now), "hace 4 días");
    assert.equal(relativeDay("2026-10-07T12:00:00-03:00", now), "hace 1 semana");
    assert.equal(relativeDay("2026-09-25T12:00:00-03:00", now), "hace 2 semanas");
  });
  test("más de un mes: la fecha; inválida: vacío", () => {
    assert.match(relativeDay("2026-08-01T12:00:00-03:00", now), /^el 1 ago 2026$/);
    assert.equal(relativeDay("", now), "");
  });
});
