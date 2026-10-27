// Chapita de mascota (lib/pet.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { cleanPet, cleanPhoneInput, formatPhone, newPet, petForEditing, phoneForInput, normalizePhone, petPhoneProblem, parsePet, petCallHref, petGendered, petHasContact, petHealthFields, petIsFemale, petLook, petMissing, petRows, petWhatsappHref, petAge, petAboutRows, petKindWord, PET_ABOUT_FIELDS, DEFAULT_PET_MESSAGE } from "../lib/pet.ts";

describe("datos de la chapita", () => {
  test("una chapita nueva arranca con el saludo, el mensaje y el WhatsApp cargado", () => {
    const pet = newPet("5493511234567");
    assert.equal(pet.message, DEFAULT_PET_MESSAGE);
    assert.deepEqual(pet.family, [{ name: "", phone: "5493511234567" }]);
    assert.equal(pet.lost, false);
    assert.equal(pet.look, "calido");
    assert.deepEqual(pet.photo, { x: 50, y: 50, zoom: 1 });
  });

  test("lo raro guardado se descarta", () => {
    const pet = parsePet({ pet: { look: "inventado", lost: "true", family: [{ phone: 123 }, { name: "Ana" }, { name: "B" }, { name: "C" }], about: { breed: 5, extra: "x" } } });
    assert.equal(pet.look, "calido");
    assert.equal(pet.lost, false);
    assert.equal(pet.family.length, 2);
    assert.equal(pet.family[0].phone, "");
    assert.equal(pet.about.breed, "");
    assert.equal("extra" in pet.about, false);
    assert.deepEqual(pet.photo, { x: 50, y: 50, zoom: 1 });
  });

  test("el encuadre de foto viejo o fuera de rango se normaliza sin migración", () => {
    assert.deepEqual(parsePet({ pet: { photo: { x: -20, y: 180, zoom: 9 } } }).photo, { x: 0, y: 100, zoom: 2.5 });
    assert.deepEqual(parsePet({ pet: {} }).photo, { x: 50, y: 50, zoom: 1 });
  });

  test("el mensaje viejo por defecto pasa al nuevo; uno escrito por el dueño se respeta", () => {
    assert.equal(parsePet({ pet: { message: "Si me encontraste solito, avisale a mi familia, por favor 🐾" } }).message, DEFAULT_PET_MESSAGE);
    assert.equal(parsePet({ pet: { message: "Soy re mimoso" } }).message, "Soy re mimoso");
    assert.equal(parsePet({ pet: { message: "" } }).message, "");
  });

  test("los textos se adaptan si es hembra; sin sexo cargado quedan en masculino", () => {
    const female = parsePet({ pet: { about: { sex: "Hembra" } } });
    const male = parsePet({ pet: { about: { sex: "Macho" } } });
    assert.equal(petIsFemale(female), true);
    assert.equal(petIsFemale(male), false);
    assert.equal(petIsFemale(parsePet({ pet: {} })), false);
    assert.equal(petGendered(female, "perdido", "perdida"), "perdida");
    assert.equal(petHealthFields(female).find((item) => item.key === "neutered")?.label, "Castrada");
    assert.equal(petHealthFields(male).find((item) => item.key === "neutered")?.label, "Castrado");
  });

  test("lo que falta completar: foto, datos y segundo contacto", () => {
    const empty = parsePet({ pet: { family: [{ name: "", phone: "5493511234567" }] } });
    assert.deepEqual(petMissing(empty, false), ["photo", "about", "family"]);
    const full = parsePet({ pet: { about: { sex: "Hembra" }, family: [{ name: "", phone: "5493511234567" }, { name: "Ana", phone: "5493517654321" }] } });
    assert.deepEqual(petMissing(full, true), []);
    assert.deepEqual(petMissing(parsePet({ pet: { health: { allergies: "Pollo" } } }), true), ["family"]);
  });

  test("el número se muestra con su característica de 2, 3 o 4 dígitos", () => {
    assert.equal(formatPhone("11 2345 6789"), "+54 9 11 2345-6789");
    assert.equal(formatPhone("0351 15 555-1234"), "+54 9 351 555-1234");
    assert.equal(formatPhone("3543 12-3456"), "+54 9 3543 12-3456");
    assert.equal(formatPhone("02266 15 41-2345"), "+54 9 2266 41-2345");
    assert.equal(normalizePhone("02266 15 41-2345"), "5492266412345");
    assert.equal(phoneForInput("5493515551234"), "351 555-1234");
    assert.equal(phoneForInput("+1 305 555 0100"), "+1 305 555 0100");
  });

  test("en el teléfono solo entran números, espacios, +, guiones y paréntesis", () => {
    assert.equal(cleanPhoneInput("351 abc 555-1234 ✨"), "351  555-1234 ");
    assert.equal(cleanPhoneInput("1".repeat(40)).length, 20);
  });

  test("los textos se limpian: sin saltos ni invisibles en los de una línea", () => {
    const pet = cleanPet({ ...newPet(), greeting: " ¡Hola!\n\nSoy ", lostZone: "Barrio​  Cofico\t", message: "Hola\r\n\n\n\nchau  ", family: [{ name: "Ana\n", phone: "351 555 1234" }] });
    assert.equal(pet.greeting, "¡Hola! Soy");
    assert.equal(pet.lostZone, "Barrio Cofico");
    assert.equal(pet.message, "Hola\n\nchau");
    assert.deepEqual(pet.family, [{ name: "Ana", phone: "5493515551234" }]);
    assert.deepEqual(petForEditing(pet).family, [{ name: "Ana", phone: "351 555-1234" }]);
  });

  test("al guardar se recortan espacios y se van las personas vacías", () => {
    const pet = cleanPet({ ...newPet(), family: [{ name: " Ana ", phone: " 351 " }, { name: "", phone: "  " }], finder: "  hola  " });
    assert.deepEqual(pet.family, [{ name: "Ana", phone: "351" }]);
    assert.equal(pet.finder, "hola");
  });

  test("la ficha muestra solo lo completado, en orden", () => {
    const pet = newPet();
    const rows = petRows({ ...pet.about, age: " 4 años ", breed: "Caniche" }, PET_ABOUT_FIELDS);
    assert.deepEqual(rows, [{ label: "Raza", value: "Caniche" }, { label: "Edad", value: "4 años" }]);
  });
});

describe("contacto de la familia", () => {
  test("WhatsApp con el mensaje y el nombre de la mascota; llamar con +", () => {
    assert.equal(petWhatsappHref("+54 9 351 123-4567", "Lola"), "https://wa.me/5493511234567?text=" + encodeURIComponent("¡Hola! Encontré a Lola 🐾"));
    assert.equal(petCallHref("54 9 351 1234567"), "tel:+5493511234567");
    assert.equal(petWhatsappHref("", "Lola"), "");
  });

  test("para publicar hace falta un número completo", () => {
    assert.equal(petHasContact(newPet()), false);
    assert.equal(petHasContact(newPet("351")), false);
    assert.equal(petHasContact(newPet("5493511234567")), true);
  });

  test("cada diseño existe y el desconocido cae en el primero", () => {
    assert.equal(petLook("noche").dark, true);
    assert.equal(petLook("nada").id, "calido");
  });
});

describe("números de teléfono argentinos", () => {
  test("como lo escribe la gente queda en formato de WhatsApp (549 + característica + número)", () => {
    const cases: [string, string][] = [
      ["351 555 1234", "5493515551234"],
      ["0351 15 555-1234", "5493515551234"],
      ["351 15 5551234", "5493515551234"],
      ["+54 9 351 555 1234", "5493515551234"],
      ["54 351 555 1234", "5493515551234"],
      ["+54 351 15 555 1234", "5493515551234"],
      ["0054 9 351 5551234", "5493515551234"],
      ["11 2345-6789", "5491123456789"],
      ["011 15 2345 6789", "5491123456789"],
      ["3543 15 412345", "5493543412345"],
      ["(0261) 15-456-7890", "5492614567890"],
    ];
    for (const [typed, expected] of cases) assert.equal(normalizePhone(typed), expected, typed);
  });

  test("un número de otro país, con +, queda como está", () => {
    assert.equal(normalizePhone("+1 305 555 0100"), "13055550100");
    assert.equal(petPhoneProblem("+598 99 123 456"), null);
  });

  test("sin característica no sirve y se avisa", () => {
    assert.match(petPhoneProblem("555-1234") || "", /característica/);
    assert.match(petPhoneProblem("15 555 1234") || "", /característica/);
    assert.equal(petPhoneProblem("351 555 1234"), null);
  });

  test("el botón y la llamada salen bien aunque el número esté guardado como se escribió", () => {
    assert.equal(petCallHref("351 555 1234"), "tel:+5493515551234");
    assert.ok(petWhatsappHref("0351 15 555-1234", "Toby").startsWith("https://wa.me/5493515551234?"));
    assert.equal(petHasContact(newPet("351 555 1234")), true);
  });

  test("al guardar se guarda normalizado y se muestra prolijo", () => {
    assert.equal(cleanPet(newPet("0351 15 555-1234")).family[0].phone, "5493515551234");
    assert.equal(formatPhone("351 555 1234"), "+54 9 351 555-1234");
    assert.equal(formatPhone("11 2345 6789"), "+54 9 11 2345-6789");
  });
});

describe("qué es y cuándo nació", () => {
  const now = new Date(2026, 9, 27);
  test("la edad se calcula sola a partir de la fecha", () => {
    assert.equal(petAge("2022-03", false, now), "4 años");
    assert.equal(petAge("2025-10", false, now), "1 año");
    assert.equal(petAge("2026-02", false, now), "8 meses");
    assert.equal(petAge("2026-09", false, now), "1 mes");
    assert.equal(petAge("2026-10", false, now), "Menos de 1 mes");
    assert.equal(petAge("2021", false, now), "5 años");
    assert.equal(petAge("2026", false, now), "Menos de 1 año");
    assert.equal(petAge("2021", true, now), "Aprox. 5 años");
    assert.equal(petAge("2027", false, now), "");
    assert.equal(petAge("hace mucho", false, now), "");
  });
  test("se leen bien y se descarta lo raro", () => {
    assert.deepEqual([parsePet({}).kind, parsePet({}).birth, parsePet({}).birthApprox], ["", "", false]);
    const pet = parsePet({ pet: { kind: "Gato", birth: "2020-13", birthApprox: true } });
    assert.equal(pet.kind, "Gato");
    assert.equal(pet.birth, "");
    assert.equal(parsePet({ pet: { kind: "Dragón" } }).kind, "");
  });
  test("con la fecha cargada se borra la edad escrita a mano", () => {
    const pet = cleanPet({ ...newPet(), birth: "2022", about: { ...newPet().about, age: "4 años" } });
    assert.equal(pet.about.age, "");
    assert.equal(cleanPet({ ...newPet(), birthApprox: true }).birthApprox, false);
  });
  test("Sobre mí muestra la especie y la edad calculada; las de antes, la edad escrita", () => {
    const rows = petAboutRows({ ...newPet(), kind: "Perro", birth: "2022-03" }, now);
    assert.deepEqual(rows.slice(0, 2), [{ label: "Especie", value: "Perro" }, { label: "Edad", value: "4 años" }]);
    assert.deepEqual(petAboutRows({ ...newPet(), kind: "Otro", about: { ...newPet().about, age: "3 años" } }, now), [{ label: "Edad", value: "3 años" }]);
  });
  test("perro, perra, gato o gata", () => {
    const female = { ...newPet().about, sex: "Hembra" };
    assert.equal(petKindWord({ ...newPet(), kind: "Perro" }), "perro");
    assert.equal(petKindWord({ ...newPet(), kind: "Gato", about: female }), "gata");
    assert.equal(petKindWord({ ...newPet(), kind: "Otro" }), "");
  });
});
