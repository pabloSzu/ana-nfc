import Image from "next/image";
import { FiArrowUpRight, FiCheck, FiCpu, FiSmartphone } from "react-icons/fi";

const PRODUCTS = [
  { id: "carteleria", name: "Cartelería", craft: "cartelería", alt: "Cartel de acrílico personalizado con NFC" },
  { id: "grabados", name: "Grabados", craft: "grabados", alt: "Llaveros grabados en madera y otros materiales con NFC" },
  { id: "impresion3d", name: "Impresión 3D", craft: "impresión 3D", alt: "Soporte violeta impreso en 3D con NFC" },
  { id: "personalizados", name: "Personalizados", craft: "productos personalizados", alt: "Taza personalizada con la marca y acceso NFC" },
];

const STEPS = [
  { title: "Vos creás el producto", body: "Nos contás qué fabricás y qué querés que abra al acercar el celular." },
  { title: "Nosotros lo conectamos", body: "Definimos cómo integrar el NFC y configuramos el enlace o la página." },
  { title: "Tu cliente lo descubre", body: "Acerca su celular, toca el aviso y accede al contenido. También puede escanear un QR." },
];

export default function Makers({ whatsappNumber }: { whatsappNumber: string }) {
  const wa = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return <section id="para-talleres" className="bx-makers" aria-labelledby="makers-title">
    <div className="bx-section bx-makers-inner">
      <div className="bx-makers-main">
        <div className="bx-makers-copy">
          <p className="bx-section-kicker">PARA TALLERES, IMPRENTAS Y FABRICANTES</p>
          <h2 id="makers-title">Vos hacés<br />el producto.<span>Nosotros le sumamos <em>NFC</em> y una experiencia digital.</span></h2>
          <p className="bx-makers-lead">Lo que creás puede hacer más. Con un pequeño chip NFC, tu producto abre una página, un enlace o las reseñas de Google al acercar el celular.</p>
          <p className="bx-makers-promise"><FiCheck aria-hidden="true" />Tu diseño y tu marca. La parte digital, por nosotros.</p>
          <div className="bx-makers-actions">
            <a className="bx-btn bx-makers-cta" href={wa("Hola BioNFC, tengo un taller y quiero sumar NFC a mis productos. ¿Podemos conversar?")} target="_blank" rel="noreferrer">Quiero sumarle NFC <FiArrowUpRight aria-hidden="true" /></a>
            <p>Contanos qué fabricás. Lo pensamos con vos.</p>
          </div>
        </div>

        <div className="bx-makers-visual">
          <div className="bx-makers-visual-heading"><span>TU PRODUCTO, CON MÁS POSIBILIDADES</span><FiCpu aria-hidden="true" /></div>
          <ul className="bx-makers-products" aria-label="Ideas para sumar NFC a tus productos">
            {PRODUCTS.map((product) => <li key={product.id}>
              <a href={wa(`Hola BioNFC, hago ${product.craft} y me interesa sumarles NFC. ¿Podemos conversar?`)} target="_blank" rel="noreferrer" aria-label={`${product.name}: consultar por NFC en WhatsApp`}>
                <div className="bx-makers-product-art"><Image src={`/marketing/makers/${product.id}.webp`} alt={product.alt} width={960} height={720} sizes="(max-width: 760px) 45vw, (max-width: 1240px) 23vw, 260px" /></div>
                <span className="bx-makers-product-info"><strong>{product.name}</strong><FiArrowUpRight aria-hidden="true" /></span>
              </a>
            </li>)}
          </ul>
          <div className="bx-makers-result">
            <span className="bx-makers-result-icon"><FiSmartphone aria-hidden="true" /></span>
            <div><strong>Un toque. Y se abre tu mundo.</strong><p>Tu página · Reseñas de Google · El enlace que elijas</p></div>
          </div>
        </div>
      </div>

      <ol className="bx-makers-steps" aria-label="Cómo sumamos NFC a tus productos">
        {STEPS.map(({ title, body }, index) => <li key={title}>
          <span className="bx-makers-step-number" aria-hidden="true">0{index + 1}</span>
          <div><h3>{title}</h3><p>{body}</p></div>
        </li>)}
      </ol>
    </div>
  </section>;
}
