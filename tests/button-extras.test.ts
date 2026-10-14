// Reglas de los botones especiales (lib/button-extras.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { defaultHours, formatRating, formatReviews, localClock, openStatus, parseButtonExtra, type DayHours } from "../lib/button-extras.ts";

// Fechas en hora de Argentina (UTC-3). El 13/10/2026 es martes.
const at = (isoLocal: string) => new Date(`${isoLocal}-03:00`);
const week = (day: (index: number) => DayHours): DayHours[] => Array.from({ length: 7 }, (_, index) => day(index));

describe("parseButtonExtra", () => {
  test("acepta valores válidos y redondea", () => {
    assert.deepEqual(parseButtonExtra({ featured: true, rating: 4.86, reviews: 128.7, online: true, status: "  Respondemos rápido  " }), { featured: true, rating: 4.9, reviews: 128, online: true, status: "Respondemos rápido" });
  });

  test("descarta lo inválido", () => {
    assert.deepEqual(parseButtonExtra({ featured: "sí", rating: 7, reviews: -3, online: 1, status: "" }), {});
    assert.deepEqual(parseButtonExtra(null), {});
    assert.deepEqual(parseButtonExtra([1, 2]), {});
  });

  test("horarios: exige 7 días, horas válidas y como máximo 2 turnos", () => {
    const hours = parseButtonExtra({ hours: [
      { closed: false, ranges: [["09:00", "13:00"], ["17:00", "21:00"], ["22:00", "23:00"]] },
      { closed: false, ranges: [["25:00", "26:00"]] },
      { closed: true, ranges: [["09:00", "19:00"]] },
      { closed: false, ranges: [["09:00", "09:00"]] },
      {}, {}, {},
    ] }).hours!;
    assert.equal(hours[0].ranges.length, 2);
    assert.equal(hours[1].closed, true, "un día sin horas válidas queda cerrado");
    assert.equal(hours[2].closed, true);
    assert.equal(hours[3].closed, true, "abre y cierra a la misma hora: inválido");
    assert.equal(parseButtonExtra({ hours: [{}, {}] }).hours, undefined, "menos de 7 días: se ignora");
  });
});

describe("localClock", () => {
  test("usa la hora de Argentina y la semana empieza el lunes", () => {
    assert.deepEqual(localClock(at("2026-10-13T10:30:00")), { day: 1, minutes: 630 });
    assert.deepEqual(localClock(at("2026-10-18T23:59:00")), { day: 6, minutes: 1439 });
  });
});

describe("openStatus", () => {
  const shop = week((index) => ({ closed: index === 6, ranges: [["09:00", "13:00"], ["17:00", "21:00"]] }));

  test("abierto en el turno de la mañana y de la tarde", () => {
    assert.deepEqual(openStatus(shop, at("2026-10-13T10:00:00")), { open: true, label: "Abierto ahora · cierra 13:00" });
    assert.deepEqual(openStatus(shop, at("2026-10-13T18:30:00")), { open: true, label: "Abierto ahora · cierra 21:00" });
  });

  test("al mediodía, cerrado y abre hoy a la tarde", () => {
    assert.deepEqual(openStatus(shop, at("2026-10-13T14:00:00")), { open: false, label: "Cerrado · abre hoy 17:00" });
  });

  test("los bordes: a la hora de abrir está abierto, a la de cerrar ya no", () => {
    assert.equal(openStatus(shop, at("2026-10-13T09:00:00"))!.open, true);
    assert.equal(openStatus(shop, at("2026-10-13T13:00:00"))!.open, false);
  });

  test("de noche, abre mañana; el sábado a la noche, abre el lunes", () => {
    assert.deepEqual(openStatus(shop, at("2026-10-13T22:00:00")), { open: false, label: "Cerrado · abre mañana 9:00" });
    assert.deepEqual(openStatus(shop, at("2026-10-17T22:00:00")), { open: false, label: "Cerrado · abre el lunes 9:00" });
  });

  test("un bar que cierra después de medianoche", () => {
    const bar = week((index) => ({ closed: index < 3, ranges: [["20:00", "03:00"]] }));
    assert.deepEqual(openStatus(bar, at("2026-10-15T23:00:00")), { open: true, label: "Abierto ahora · cierra 3:00" }, "jueves 23 h");
    assert.deepEqual(openStatus(bar, at("2026-10-16T01:30:00")), { open: true, label: "Abierto ahora · cierra 3:00" }, "viernes 1:30, sigue el turno del jueves");
    assert.deepEqual(openStatus(bar, at("2026-10-16T04:00:00")), { open: false, label: "Cerrado · abre hoy 20:00" });
    assert.deepEqual(openStatus(bar, at("2026-10-13T01:00:00")), { open: false, label: "Cerrado · abre el jueves 20:00" }, "martes de madrugada: el lunes estaba cerrado");
  });

  test("sin horarios cargados o todo cerrado, no muestra nada", () => {
    assert.equal(openStatus(undefined, at("2026-10-13T10:00:00")), null);
    assert.equal(openStatus(week(() => ({ closed: true, ranges: [] })), at("2026-10-13T10:00:00")), null);
  });

  test("los horarios por defecto: lunes a sábado de 9 a 19", () => {
    assert.equal(openStatus(defaultHours(), at("2026-10-13T12:00:00"))!.open, true);
    assert.deepEqual(openStatus(defaultHours(), at("2026-10-18T12:00:00")), { open: false, label: "Cerrado · abre mañana 9:00" });
  });
});

describe("formatos", () => {
  test("nota con coma y reseñas en singular o plural", () => {
    assert.equal(formatRating(4.9), "4,9");
    assert.equal(formatRating(5), "5,0");
    assert.equal(formatReviews(1), "1 reseña");
    assert.equal(formatReviews(1280), "1.280 reseñas");
  });
});
