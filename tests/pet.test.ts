// Chapita de mascota (lib/pet.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { cleanPet, newPet, parsePet, petCallHref, petHasContact, petLook, petRows, petWhatsappHref, PET_ABOUT_FIELDS, DEFAULT_PET_MESSAGE } from "../lib/pet.ts";

describe("datos de la chapita", () => {
  test("una chapita nueva arranca con el saludo, el mensaje y el WhatsApp cargado", () => {
    const pet = newPet("5493511234567");
    assert.equal(pet.message, DEFAULT_PET_MESSAGE);
    assert.deepEqual(pet.family, [{ name: "", phone: "5493511234567" }]);
    assert.equal(pet.lost, false);
    assert.equal(pet.look, "calido");
  });

  test("lo raro guardado se descarta", () => {
    const pet = parsePet({ pet: { look: "inventado", lost: "true", family: [{ phone: 123 }, { name: "Ana" }, { name: "B" }, { name: "C" }], about: { breed: 5, extra: "x" } } });
    assert.equal(pet.look, "calido");
    assert.equal(pet.lost, false);
    assert.equal(pet.family.length, 2);
    assert.equal(pet.family[0].phone, "");
    assert.equal(pet.about.breed, "");
    assert.equal("extra" in pet.about, false);
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
