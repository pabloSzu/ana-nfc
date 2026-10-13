"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FiArrowUpRight, FiCheck, FiChevronLeft, FiChevronRight, FiLayers, FiZap } from "react-icons/fi";

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
    { image: "/marketing/products/stand-small-google-v3.webp", label: "Reseñas · QR + NFC" },
    { image: "/marketing/products/stand-small-instagram-v3.webp", label: "Instagram · QR + NFC" },
    { image: "/marketing/products/stand-small-brand-v2.webp", label: "Tu marca · QR + NFC" },
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
    example: "Tu marca, tus colores y tus destinos",
    description: "Una solución completa para el local, el equipo y cada oportunidad de contacto.",
    comboPrice: "$69.000",
    pagePrice: "$79.000",
    listPrice: "$99.000",
    featured: true,
    products: ["Mostrador grande", "Mostrador pequeño", "Tarjeta personal", "Llavero personalizado"],
    uses: ["Mostrador grande → reseñas de Google", "Mostrador pequeño → WhatsApp o pedidos", "Tarjeta → perfil o link de cobro", "Llavero → redes o catálogo"],
    image: "/marketing/combos/combo-negocio-v1.webp",
    imageAlt: "Combo Negocio completo con mostradores, tarjeta y llavero NFC personalizados con tu marca",
  },
  {
    id: "professional",
    name: "Profesional",
    context: "PARA PRESENTARTE",
    example: "Ejemplo: profesional independiente",
    description: "Dos formatos para compartir tu perfil, contacto o trabajo estés donde estés.",
    comboPrice: "$35.000",
    pagePrice: "$45.000",
    listPrice: "$56.000",
    products: ["Tarjeta personal", "Llavero personalizado"],
    uses: ["Tarjeta → perfil, contacto o link de cobro", "Llavero → WhatsApp, portfolio o redes"],
    image: "/marketing/combos/combo-profesional-v2.webp",
    imageAlt: "Combo Profesional de Ana Duarte con tarjeta personal y llavero NFC personalizados",
  },
  {
    id: "entrepreneur",
    name: "Emprendedor",
    context: "PARA EMPEZAR",
    example: "Ejemplo: emprendimiento gastronómico",
    description: "Tu marca en el mostrador y dos formatos para llevar, vender y cobrar.",
    comboPrice: "$49.000",
    pagePrice: "$59.000",
    listPrice: "$74.000",
    products: ["Mostrador pequeño", "Tarjeta personal", "Llavero personalizado"],
    uses: ["Mostrador pequeño → turnos o WhatsApp", "Tarjeta → perfil o link de cobro", "Llavero → Instagram o catálogo"],
    image: "/marketing/combos/combo-emprendedor-v1.webp",
    imageAlt: "Combo Emprendedor Casa Oliva con mostrador para WhatsApp, tarjeta Mercado Pago y llavero NFC",
  },
  {
    id: "local",
    name: "Local",
    context: "PARA TU NEGOCIO",
    example: "Ejemplo: estudio de tattoo",
    description: "Tres puntos de contacto para conseguir reseñas, recibir pedidos y sumar seguidores.",
    comboPrice: "$55.000",
    pagePrice: "$65.000",
    listPrice: "$82.000",
    products: ["Mostrador grande", "Mostrador pequeño", "Llavero personalizado"],
    uses: ["Mostrador grande → reseñas de Google", "Mostrador pequeño → menú o pedidos", "Llavero → Instagram o WhatsApp"],
    image: "/marketing/combos/combo-local-v2.webp",
    imageAlt: "Combo Local Norte Tattoo con mostradores para reseñas y turnos y llavero NFC",
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
  return <div className={dark ? "bx-price is-dark" : "bx-price"}>
    <div className="bx-price-main">
      <div className="bx-price-head"><span>Con página BIONFC</span><em>Precio de lanzamiento</em></div>
      <p className="bx-price-amount"><s aria-label={`Precio de lista ${listPrice}`}>{listPrice}</s><strong>{pagePrice}</strong></p>
      <ul>{includes.map((item) => <li key={item}><FiCheck aria-hidden="true" />{item}</li>)}<li><FiCheck aria-hidden="true" /><span>Primer año incluido · <a href="#renovacion" onClick={showRenewal}>¿y después?</a></span></li></ul>
    </div>
    <a className="bx-price-alt" href={directHref} target="_blank" rel="noreferrer"><span>Sin página BIONFC<small>{directNote}</small></span><strong>{directPrice}</strong><em>Quiero esta opción <FiArrowUpRight aria-hidden="true" /></em></a>
  </div>;
}

export default function Products({ whatsappNumber }: { whatsappNumber: string }) {
  const [selected, setSelected] = useState(0);
  const [activeExample, setActiveExample] = useState(0);
  const [selectedCombo, setSelectedCombo] = useState(0);
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
  const selectCombo = (index: number) => { setSelectedCombo(index); revealOnMobile(comboPanelRef); };
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
          <div><p className="bx-combos-kicker">COMBOS CON AHORRO</p><h3 id="combos-title">Más formas de conectar.<br /><span>Un solo diseño para tu marca.</span></h3></div>
          <p>Elegí una combinación lista o armamos la tuya. Cada objeto puede abrir un destino diferente.</p>
        </div>
        <div className="bx-combo-tabs" role="tablist" aria-label="Elegí un combo">
          {COMBOS.map((item, index) => <button key={item.id} id={`combo-tab-${item.id}`} type="button" role="tab" aria-selected={selectedCombo === index} aria-controls="combo-panel" className={selectedCombo === index ? "is-active" : ""} onClick={() => selectCombo(index)}>
            {item.featured && <em>Recomendado</em>}<span>{item.context}</span><strong>{item.name}</strong><small>{item.products.length} productos · {item.pagePrice} con página</small><span className="bx-combo-tab-action">Ver combo <FiChevronRight aria-hidden="true" /></span>
          </button>)}
        </div>
        <article ref={comboPanelRef} id="combo-panel" role="tabpanel" aria-labelledby={`combo-tab-${combo.id}`} className={`bx-combo-panel is-${combo.id}`}>
          <div className="bx-combo-art">
            <span className="bx-combo-example">{combo.example}</span>
            <div className="bx-combo-image"><Image src={combo.image} alt={combo.imageAlt} fill sizes="(max-width: 760px) 92vw, 620px" /></div>
            <p>Todos personalizados · NFC, QR o ambos</p>
          </div>
          <div className="bx-combo-info">
            <div className="bx-combo-title-row"><div><span>{combo.context}</span><h4>Combo {combo.name}</h4></div></div>
            <p>{combo.description}</p>
            <ul className="bx-combo-use-list">{combo.uses.map((use) => <li key={use}><FiCheck aria-hidden="true" />{use}</li>)}</ul>
            <PriceBlock dark listPrice={combo.listPrice} pagePrice={combo.pagePrice} directPrice={combo.comboPrice} includes={[`${combo.products.length} productos con tu marca`, "1 página con todos tus links"]} directNote="Cada producto abre un link" directHref={inquiry(`el Combo ${combo.name} sin página (con links directos)`)} />
            <a href={inquiry(`el Combo ${combo.name} con página BioNFC`)} target="_blank" rel="noreferrer">Quiero este combo con página<FiArrowUpRight aria-hidden="true" /></a>
          </div>
        </article>
        <p className="bx-combos-note">Cada producto del combo abre tu página o el link que elijas. El link de cobro no reemplaza un posnet. ¿Querés otra combinación? La armamos a medida.</p>
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
