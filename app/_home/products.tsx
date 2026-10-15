"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FiArrowUpRight, FiCheck, FiChevronLeft, FiChevronRight, FiLayers, FiLink, FiZap } from "react-icons/fi";

const PRODUCTS = [
  { id: "keychain", name: "Llavero", context: "PARA LLEVAR", line: "Tu negocio, siempre a mano.", description: "Compartí el enlace que elijas desde tus llaves o mochila.", use: "Contactos · eventos", directPrice: "$20.000", pagePrice: "$30.000", listPrice: "$38.000", examples: [
    { image: "/marketing/products/keychain-tattoo-v6.webp", label: "Tattoo · NFC" },
    { image: "/marketing/products/keychain-cafe-v6.webp", label: "Café · NFC" },
    { image: "/marketing/products/keychain-dental-v4.webp", label: "Odontología · QR + NFC" },
    { image: "/marketing/products/keychain-brand-v7.webp", label: "Tu marca · NFC" },
  ] },
  { id: "card", name: "Tarjeta", context: "PARA PRESENTARTE", line: "Una presentación que no se pierde.", description: "Compartí tu perfil profesional acercando la tarjeta al celular.", use: "Profesionales · equipos", directPrice: "$20.000", pagePrice: "$30.000", listPrice: "$38.000", examples: [
    { image: "/marketing/products/card-architect-v2.webp", label: "Arquitectura · NFC" },
    { image: "/marketing/products/card-dentist-v2.webp", label: "Odontología · QR" },
    { image: "/marketing/products/card-generic-v4.webp", label: "Tu nombre, negocio o empresa · QR + NFC" },
  ] },
  { id: "stand-small", name: "Mostrador pequeño", context: "4 × 6 CM", line: "Pequeño y siempre visible.", description: "Un formato compacto para mesas, cajas o escritorios.", use: "Mesas · recepciones", directPrice: "$20.000", pagePrice: "$30.000", listPrice: "$38.000", examples: [
    { image: "/marketing/products/stand-small-google-v5.webp", label: "Reseñas · QR + NFC" },
    { image: "/marketing/products/stand-small-whatsapp-v2.webp", label: "WhatsApp · QR + NFC" },
    { image: "/marketing/products/stand-small-instagram-v5.webp", label: "Instagram · QR + NFC" },
    { image: "/marketing/products/stand-small-brand-v4.webp", label: "Tu marca · QR + NFC" },
  ] },
  { id: "stand-large", name: "Mostrador grande", context: "9 × 14 CM", line: "El mensaje se entiende al instante.", description: "Más espacio para tu marca y una invitación clara a conectar.", use: "Locales · consultorios", directPrice: "$25.000", pagePrice: "$35.000", listPrice: "$44.000", examples: [
    { image: "/marketing/products/stand-large-google-v3.webp", label: "Reseñas · QR + NFC" },
    { image: "/marketing/products/stand-large-instagram-v3.webp", label: "Instagram · QR + NFC" },
    { image: "/marketing/products/stand-large-brand-v2.webp", label: "Tu marca · NFC" },
  ] },
];

type Product = typeof PRODUCTS[number];

const COMBOS = [
  {
    id: "business",
    name: "Negocio completo",
    context: "EL MÁS COMPLETO",
    description: "Una solución completa para el local, el equipo y cada oportunidad de contacto.",
    comboPrice: "$69.000",
    pagePrice: "$79.000",
    listPrice: "$99.000",
    featured: true,
    products: ["Mostrador grande", "Mostrador pequeño", "Tarjeta personal", "Llavero personalizado"],
    images: [
      { src: "/marketing/combos/combo-negocio-burger-v5.webp", label: "Hamburguesería", alt: "Combo Fuego Burger: mostrador grande para pedidos por WhatsApp, mostrador pequeño para reseñas, tarjeta NFC sin QR para pedidos y delivery y llavero NFC de marca" },
      { src: "/marketing/combos/combo-negocio-cerrajeria-v10.webp", label: "Cerrajería", alt: "Combo Llave Maestra ilustrado: mostrador grande para urgencias por WhatsApp, mostrador pequeño para reseñas, tarjeta de servicio a domicilio y llavero con símbolo NFC" },
      { src: "/marketing/combos/combo-negocio-tu-marca-v7.webp", label: "Tu marca", alt: "Combo Tu Marca minimalista: mostrador grande con QR y NFC, mostrador pequeño para reseñas de Google, tarjeta de contacto sin QR y llavero NFC" },
    ],
  },
  {
    id: "professional",
    name: "Profesional",
    context: "PARA PRESENTARTE",
    description: "Dos formatos para compartir tu perfil, contacto o trabajo estés donde estés.",
    comboPrice: "$35.000",
    pagePrice: "$45.000",
    listPrice: "$56.000",
    products: ["Tarjeta personal", "Llavero personalizado"],
    images: [{ src: "/marketing/combos/combo-profesional-v2.webp", label: "Ana Duarte", alt: "Ejemplo del combo Profesional con tarjeta y llavero diseñados para Ana Duarte" }],
  },
  {
    id: "entrepreneur",
    name: "Emprendedor",
    context: "PARA EMPEZAR",
    description: "Tu marca en el mostrador y dos formatos para llevar, vender y cobrar.",
    comboPrice: "$49.000",
    pagePrice: "$59.000",
    listPrice: "$74.000",
    products: ["Mostrador pequeño", "Tarjeta personal", "Llavero personalizado"],
    images: [{ src: "/marketing/combos/combo-emprendedor-v1.webp", label: "Casa Oliva", alt: "Ejemplo del combo Emprendedor con mostrador, tarjeta y llavero diseñados para Casa Oliva" }],
  },
  {
    id: "local",
    name: "Local",
    context: "PARA TU NEGOCIO",
    description: "Tres formatos para conectar tu local con los destinos que más te sirvan.",
    comboPrice: "$55.000",
    pagePrice: "$65.000",
    listPrice: "$82.000",
    products: ["Mostrador grande", "Mostrador pequeño", "Llavero personalizado"],
    images: [{ src: "/marketing/combos/combo-local-v2.webp", label: "Norte Tattoo", alt: "Ejemplo del combo Local con dos mostradores y un llavero diseñados para Norte Tattoo" }],
  },
];

// La opción con página es la que queremos vender: va grande, con el precio de lista tachado y el
// de lanzamiento. La opción sin página queda como una fila chica debajo, para quien solo quiere
// que el producto abra un link. Lo que pasa después del primer año se explica una sola vez, en
// el bloque de renovación (#renovacion); acá solo se enlaza.
// El bloque de renovación está más abajo, después de los combos. Un salto de ancla común lo dejaba
// pegado al borde de arriba, tapado por el menú y con la sección oscura siguiente ocupando media
// pantalla. Por eso se centra en la pantalla y se resalta un momento.
function showRenewal(event: React.MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById("renovacion");
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.remove("is-flash");
  void target.offsetWidth;
  target.classList.add("is-flash");
}

function PriceBlock({ listPrice, pagePrice, directPrice, includes, directNote, directHref, dark }: { listPrice: string; pagePrice: string; directPrice: string; includes: string[]; directNote: string; directHref: string; dark?: boolean }) {
  const comboSaving = Number(listPrice.replace(/\D/g, "")) - Number(pagePrice.replace(/\D/g, ""));
  return <div className={dark ? "bx-price is-dark" : "bx-price"}>
    <div className="bx-price-main">
      <div className="bx-price-head"><span>Con página BIONFC</span><em>{dark ? `Ahorrás $${new Intl.NumberFormat("es-AR").format(comboSaving)}` : "Precio de lanzamiento"}</em></div>
      <p className="bx-price-amount"><s aria-label={`Precio de lista ${listPrice}`}>{listPrice}</s><strong>{pagePrice}</strong></p>
      <ul>{includes.map((item) => <li key={item}><FiCheck aria-hidden="true" />{/página/i.test(item) && !/link que elijas/.test(item) ? <span>{item} · <a href="#ejemplos" onClick={() => { if (window.location.hash === "#ejemplos") window.dispatchEvent(new HashChangeEvent("hashchange")); }}>ver ejemplos</a></span> : item}</li>)}<li><FiCheck aria-hidden="true" /><span>Primer año incluido · <a href="#renovacion" onClick={showRenewal}>¿y después?</a></span></li></ul>
    </div>
    <a className="bx-price-alt" href={directHref} target="_blank" rel="noreferrer"><span>{dark ? "Sin página" : "Sin página BIONFC"}<small>{directNote}</small></span><strong>{directPrice}</strong><em>Quiero esta opción <FiArrowUpRight aria-hidden="true" /></em></a>
  </div>;
}

export default function Products({ whatsappNumber }: { whatsappNumber: string }) {
  const [selected, setSelected] = useState(0);
  const [activeExample, setActiveExample] = useState(0);
  const [selectedCombo, setSelectedCombo] = useState(0);
  const [comboImage, setComboImage] = useState(0);
  const productPanelRef = useRef<HTMLElement>(null);
  const comboPanelRef = useRef<HTMLElement>(null);
  const product: Product = PRODUCTS[selected];
  const combo = COMBOS[selectedCombo];
  const moveExample = (direction: number) => setActiveExample((current) => (current + direction + product.examples.length) % product.examples.length);
  const revealOnMobile = (panel: React.RefObject<HTMLElement | null>) => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    window.setTimeout(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const selectProduct = (index: number) => { setSelected(index); setActiveExample(0); revealOnMobile(productPanelRef); };
  const selectCombo = (index: number) => { setSelectedCombo(index); setComboImage(0); revealOnMobile(comboPanelRef); };
  const inquiry = (name: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola BioNFC, me interesa ${name}. Quiero conocer las opciones para mi negocio.`)}`;
  return <section id="productos" className="bx-shop">
    <div className="bx-section">
      <div className="bx-editorial-head"><div><p className="bx-section-kicker">PRODUCTOS NFC + QR</p><h2 className="bx-h2">Elegí el formato.<br /><span>Nosotros lo dejamos listo.</span></h2></div><p>Personalizamos el producto con tu marca y lo conectamos al destino que más te sirva.</p></div>
      <div className="bx-shop-tabs" role="tablist" aria-label="Elegí un formato">
        {PRODUCTS.map((item, index) => <button key={item.id} id={`product-tab-${item.id}`} type="button" role="tab" aria-selected={selected === index} aria-controls="product-panel" className={selected === index ? "is-active" : ""} onClick={() => selectProduct(index)}>
          <span>0{index + 1} · {item.context}</span><strong>{item.name}</strong><small>{item.pagePrice} con página</small><span className="bx-shop-tab-action">Ver <FiChevronRight aria-hidden="true" /></span>
        </button>)}
      </div>
      <article ref={productPanelRef} id="product-panel" role="tabpanel" aria-labelledby={`product-tab-${product.id}`} className={`bx-shop-explorer bx-shop-format-${product.id}`}>
        <div className="bx-shop-art">
          <span className="bx-shop-context">{product.context}</span><span className="bx-shop-index" aria-hidden="true">0{selected + 1} / 04</span>
          <div className="bx-shop-example-images">
            {product.examples.map((example, exampleIndex) => <Image key={example.image} className={exampleIndex === activeExample ? "is-active" : ""} src={example.image} alt={`Diseño de ${product.name} para ${example.label}`} width={900} height={900} sizes="(max-width: 760px) 88vw, (max-width: 1100px) 52vw, 620px" />)}
          </div>
          <button className="bx-shop-example-arrow is-prev" type="button" onClick={() => moveExample(-1)} aria-label={`Ver diseño anterior de ${product.name}`}><FiChevronLeft aria-hidden="true" /></button>
          <button className="bx-shop-example-arrow is-next" type="button" onClick={() => moveExample(1)} aria-label={`Ver diseño siguiente de ${product.name}`}><FiChevronRight aria-hidden="true" /></button>
          <div className="bx-shop-example-nav"><span>{product.examples[activeExample].label}</span><div>{product.examples.map((example, exampleIndex) => <button key={example.image} className={exampleIndex === activeExample ? "is-active" : ""} type="button" onClick={() => setActiveExample(exampleIndex)} aria-label={`Ver ${example.label}`} aria-pressed={exampleIndex === activeExample} />)}</div></div>
        </div>
        <div className="bx-shop-info">
          <p className="bx-shop-detail-kicker">FORMATO 0{selected + 1}</p><h3>{product.name}</h3><p className="bx-shop-line">{product.line}</p><p className="bx-shop-description">{product.description}</p>
          <p className="bx-shop-use">Ideal para {product.use.toLowerCase()}</p>
          <PriceBlock listPrice={product.listPrice} pagePrice={product.pagePrice} directPrice={product.directPrice} includes={["Diseño con tu marca", "Tu página con todos tus links"]} directNote="Abre un solo link" directHref={inquiry(`${product.name} sin página (con link directo)`)} />
          <a className="bx-shop-cta" href={inquiry(`${product.name} con página BioNFC`)} target="_blank" rel="noreferrer">Quiero este formato con página<FiArrowUpRight aria-hidden="true" /></a>
          <button className="bx-shop-more" type="button" onClick={() => moveExample(1)}>Ver otro diseño <FiChevronRight aria-hidden="true" /></button>
        </div>
      </article>
      <p className="bx-shop-note">Precios por unidad. ¿No tenés logo? Usamos un diseño BIONFC con tu nombre. Envío a cargo del comprador.</p>
      <div className="bx-shop-included"><span><FiLayers aria-hidden="true" /> Lo armamos con vos</span><ul><li><FiCheck aria-hidden="true" /> Tu identidad de marca</li><li><FiCheck aria-hidden="true" /> QR, NFC o ambos</li><li><FiCheck aria-hidden="true" /> El destino que vos elijas</li></ul></div>
      <section id="combos" className="bx-combos" aria-labelledby="combos-title">
        <div className="bx-combos-head">
          <div><p className="bx-combos-kicker">COMBOS</p><h3 id="combos-title">Combos con ahorro</h3><p>Llevás varias piezas con tu marca y pagás menos que por separado.</p></div>
        </div>
        <p className="bx-combo-explain"><FiLink aria-hidden="true" /><span>Lo armás como quieras. <b>Con página BIONFC:</b> los objetos abren tu página (o alguno, un link aparte). <b>Sin página:</b> cada objeto abre el link que vos elijas, como reseñas, WhatsApp o Instagram.</span></p>
        <div className="bx-combo-tabs" role="tablist" aria-label="Elegí un combo">
          {COMBOS.map((item, index) => <button key={item.id} id={`combo-tab-${item.id}`} type="button" role="tab" aria-selected={selectedCombo === index} aria-controls="combo-panel" className={selectedCombo === index ? "is-active" : ""} onClick={() => selectCombo(index)}>
            {item.featured && <em>Recomendado</em>}<span>{item.context}</span><strong>{item.name}</strong><small>{item.products.length} piezas · desde {item.comboPrice}</small><span className="bx-combo-tab-action">Ver combo <FiChevronRight aria-hidden="true" /></span>
          </button>)}
        </div>
        <article ref={comboPanelRef} id="combo-panel" role="tabpanel" aria-labelledby={`combo-tab-${combo.id}`} className={`bx-combo-panel is-${combo.id}`}>
          <div className="bx-combo-art">
            <span className="bx-combo-example">Ejemplo de diseño · {combo.images[comboImage].label}</span>
            <div className="bx-combo-image"><Image key={combo.images[comboImage].src} src={combo.images[comboImage].src} alt={combo.images[comboImage].alt} fill sizes="(max-width: 760px) 92vw, 620px" /></div>
            {combo.images.length > 1 ? <div className="bx-combo-variants" aria-label="Ejemplos de diseño">{combo.images.map((image, index) => <button key={image.src} type="button" className={index === comboImage ? "is-active" : ""} aria-pressed={index === comboImage} onClick={() => setComboImage(index)}>{image.label}</button>)}</div> : <p>Ejemplo ilustrativo · lo hacemos con tu marca</p>}
          </div>
          <div className="bx-combo-info">
            <div className="bx-combo-title-row"><div><span>{combo.context}</span><h4>Combo {combo.name}</h4></div></div>
            <p>{combo.description}</p>
            <p className="bx-combo-includes-title">El combo incluye</p>
            <ul className="bx-combo-use-list">{combo.products.map((product) => <li key={product}><FiCheck aria-hidden="true" />{product}</li>)}</ul>
            <PriceBlock dark listPrice={combo.listPrice} pagePrice={combo.pagePrice} directPrice={combo.comboPrice} includes={[`${combo.products.length} piezas con tu marca`, "1 página para todo el combo", "Cada objeto abre tu página o el link que elijas"]} directNote="Cada objeto abre el link que elijas" directHref={inquiry(`el Combo ${combo.name} sin página BIONFC, con un link directo a elección para cada pieza`)} />
            <a href={inquiry(`el Combo ${combo.name} con una página BioNFC compartida y destinos a elección por pieza`)} target="_blank" rel="noreferrer">Armar este combo con página<FiArrowUpRight aria-hidden="true" /></a>
          </div>
        </article>
        <p className="bx-combos-note">Las imágenes son ejemplos de diseño; sus QR son ilustrativos. Definimos con vos la marca y el destino real de cada pieza. ¿Querés otra combinación? La armamos a medida.</p>
      </section>
      <section id="renovacion" className="bx-renewal" aria-labelledby="renewal-title">
        <p className="bx-section-kicker">DESPUÉS DEL PRIMER AÑO</p>
        <h3 id="renewal-title">Tu producto sigue funcionando.<br /><span>Vos elegís cómo.</span></h3>
        <div className="bx-renewal-options">
          <div className="is-featured"><span>Renovás tu página</span><strong>$10.000 <small>por año</small></strong><p>Menos de $1.000 por mes. Seguís con tu página y con cambios de links, textos o fotos.</p></div>
          <div><span>No renovás</span><strong>Un solo link</strong><p>Tu producto pasa a abrir el link que elijas: tus reseñas, tu Instagram o tu WhatsApp. Sin costo.</p></div>
        </div>
      </section>
      <article className="bx-shop-custom">
        <div className="bx-shop-custom-copy">
          <p className="bx-partners-eyebrow"><FiZap aria-hidden="true" /> OPCIÓN PERSONALIZADA</p>
          <h3>¿Tenés otra idea?<br />La hacemos posible.</h3>
          <p>Podemos integrar NFC en otros objetos y desarrollar accesos, validaciones, registros o experiencias pensadas para tu negocio.</p>
          <ul><li>Identificación</li><li>Accesos</li><li>Eventos</li><li>Productos a medida</li></ul>
          <a href={inquiry("una solución NFC personalizada")} target="_blank" rel="noreferrer">Contanos tu idea<FiArrowUpRight aria-hidden="true" /></a>
        </div>
        <div className="bx-shop-custom-art"><Image src="/marketing/products/custom-solutions-v1.webp" alt="Ejemplos de soluciones NFC personalizadas: identificación, acceso, pulsera y placa para mascotas" width={1400} height={933} sizes="(max-width: 760px) 92vw, 540px" /></div>
      </article>
    </div>
  </section>;
}
