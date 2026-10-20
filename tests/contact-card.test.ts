// Contacto descargable de la tarjeta personal (lib/contact-card.ts). `npm test`.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildContactCard, phoneFromInput } from "../lib/contact-card.ts";

const landing = { business_name: "Lucía Ferreyra", description: "Estudio Ferreyra", title_style: { eyebrow: "Arquitecta" }, button_style: {} };
const lines = (card: string) => card.trim().split("\r\n");

describe("números pegados de cualquier forma", () => {
  test("links de WhatsApp, tel: y números con espacios", () => {
    assert.equal(phoneFromInput("https://wa.me/5493511234567"), "5493511234567");
    assert.equal(phoneFromInput("https://api.whatsapp.com/send?phone=5493511234567&text=hola"), "5493511234567");
    assert.equal(phoneFromInput("tel:+54 351 123-4567"), "+543511234567");
    assert.equal(phoneFromInput("+54 9 (351) 123 4567"), "+5493511234567");
    assert.equal(phoneFromInput("351 1234567"), "3511234567");
    assert.equal(phoneFromInput(""), "");
  });
});

describe("archivo de contacto", () => {
  test("nombre y apellido separados, cargo y empresa", () => {
    const card = lines(buildContactCard(landing, [], "https://bionfc.com/go/1"));
    assert.ok(card.includes("FN:Lucía Ferreyra"));
    assert.ok(card.includes("N:Ferreyra;Lucía;;;"));
    assert.ok(card.includes("TITLE:Arquitecta"));
    assert.ok(card.includes("ORG:Estudio Ferreyra"));
  });

  test("un WhatsApp pegado como link queda como número, no como link", () => {
    const card = buildContactCard(landing, [{ type: "whatsapp", url: "https://wa.me/5493511234567" }], "https://bionfc.com/go/1");
    assert.match(card, /item\d+\.TEL:\+5493511234567/);
    assert.doesNotMatch(card, /TEL[^\r]*https/);
    assert.match(card, /item\d+\.URL:https:\/\/wa\.me\/5493511234567/);
  });

  test("mismo número de teléfono y WhatsApp: no se repite", () => {
    const card = buildContactCard(landing, [{ type: "phone", url: "+54 9 351 123 4567" }, { type: "whatsapp", url: "5493511234567" }], "https://bionfc.com/go/1");
    assert.equal((card.match(/TEL/g) || []).length, 1);
  });

  test("la foto va plegada en renglones cortos", () => {
    const card = buildContactCard(landing, [], "https://bionfc.com/go/1", "A".repeat(500));
    const photoLines = card.split("\r\n").filter((line) => line.startsWith("PHOTO") || line.startsWith(" "));
    assert.ok(photoLines[0].startsWith("PHOTO;ENCODING=b;TYPE=JPEG:"));
    assert.ok(photoLines.length > 5 && photoLines.every((line) => line.length <= 75));
    assert.ok(card.trim().endsWith("END:VCARD"));
  });

  test("\"Sobre mí\" va como nota", () => {
    const card = buildContactCard({ ...landing, button_style: { contactBio: "Diseño casas, con calma." } }, [], "https://bionfc.com/go/1");
    assert.ok(lines(card).includes("NOTE:Diseño casas\\, con calma."));
  });

  test("cada link tiene su etiqueta y no se repite", () => {
    const card = buildContactCard(landing, [
      { type: "website", url: "https://estudio.com" },
      { type: "instagram", url: "@lucia.arq" },
      { type: "website", url: "https://estudio.com" },
    ], "https://bionfc.com/go/1");
    assert.match(card, /item1\.URL:https:\/\/bionfc\.com\/go\/1\r\nitem1\.X-ABLabel:Tarjeta digital/);
    assert.match(card, /X-ABLabel:Sitio web/);
    assert.match(card, /URL:https:\/\/(www\.)?instagram\.com\/lucia\.arq\r\nitem\d+\.X-ABLabel:Instagram/);
    assert.equal((card.match(/estudio\.com/g) || []).length, 1);
  });
});
