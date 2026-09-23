import Image from "next/image";
import { FiArrowDown, FiArrowRight, FiArrowUpRight, FiCheck, FiSmartphone } from "react-icons/fi";

const PRODUCTS = [
  { id: "carteleria", name: "Cartelería", craft: "cartelería", alt: "Cartel de acrílico personalizado con NFC" },
  { id: "grabados", name: "Grabados", craft: "grabados", alt: "Llaveros grabados en madera y otros materiales con NFC" },
  { id: "impresion3d", name: "Impresión 3D", craft: "impresión 3D", alt: "Soporte violeta impreso en 3D con NFC" },
  { id: "personalizados", name: "Personalizados", craft: "productos personalizados", alt: "Taza personalizada con la marca y acceso NFC" },
];

export default function Makers({ whatsappNumber }: { whatsappNumber: string }) {
  const wa = (message: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return <section id="para-talleres" className="bx-makers" aria-labelledby="makers-title">
    <div className="bx-section bx-makers-inner">
      <div className="bx-makers-copy">
        <div>
          <p className="bx-section-kicker">PARA TALLERES, IMPRENTAS Y FABRICANTES</p>
          <h2 id="makers-title">Vos hacés el producto.<span>Nosotros le sumamos <em>NFC</em><br className="bx-makers-title-break" /> y una experiencia digital.</span></h2>
        </div>
        <div className="bx-makers-intro">
          <p className="bx-makers-lead">De lo que fabricás a lo que querés compartir. Integramos un chip NFC para abrir tu página, tus reseñas o un sistema personalizado al acercar el celular.</p>
          <p className="bx-makers-promise"><FiCheck aria-hidden="true" />Tu diseño y tu marca. La parte digital, por nosotros.</p>
          <div className="bx-makers-actions">
            <a className="bx-btn bx-makers-cta" href={wa("Hola BioNFC, tengo un taller y quiero sumar NFC a mis productos. ¿Podemos conversar?")} target="_blank" rel="noreferrer">Quiero sumarle NFC <FiArrowUpRight aria-hidden="true" /></a>
            <p>Contanos qué fabricás. Lo pensamos con vos.</p>
          </div>
        </div>
      </div>

      <div className="bx-makers-flow" aria-label="Del producto físico a la experiencia digital">
        <div className="bx-makers-physical">
          <h3 className="bx-makers-stage-title"><span>01</span> Tu producto</h3>
          <ul className="bx-makers-products" aria-label="Ideas para sumar NFC a tus productos">
            {PRODUCTS.map((product) => <li key={product.id}>
              <a href={wa(`Hola BioNFC, hago ${product.craft} y me interesa sumarles NFC. ¿Podemos conversar?`)} target="_blank" rel="noreferrer" aria-label={`${product.name}: consultar por NFC en WhatsApp`}>
                <div className="bx-makers-product-art"><Image src={`/marketing/makers/${product.id}.webp`} alt={product.alt} width={960} height={720} sizes="(max-width: 760px) 45vw, (max-width: 1240px) 18vw, 200px" /></div>
                <span className="bx-makers-product-info"><strong>{product.name}</strong><FiArrowUpRight aria-hidden="true" /></span>
              </a>
            </li>)}
          </ul>
          <p className="bx-makers-stage-note">Lo que vos creás, con tu identidad.</p>
        </div>

        <div className="bx-makers-connection">
          <h3 className="bx-makers-stage-title"><span>02</span> Le sumamos NFC</h3>
          <div className="bx-makers-tap-art" aria-hidden="true">
            <FiArrowRight className="bx-makers-flow-arrow bx-makers-arrow-in" />
            <div className="bx-makers-rings"><div className="bx-makers-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9a5 5 0 0 1 0 6M9 6a9 9 0 0 1 0 12M14 3a13 13 0 0 1 0 18" /></svg>
              <strong>NFC</strong>
            </div></div>
            <div className="bx-makers-tap-phone"><FiSmartphone /><span>Acercá<br />tu celular</span></div>
            <FiArrowRight className="bx-makers-flow-arrow bx-makers-arrow-out" />
          </div>
          <p className="bx-makers-tap-caption">Un pequeño chip.<br /><strong>Una nueva posibilidad.</strong></p>
          <p className="bx-makers-tap-help">Acercás el celular y tocás el aviso para abrir el contenido.</p>
          <FiArrowDown className="bx-makers-mobile-arrow" aria-hidden="true" />
        </div>

        <div className="bx-makers-digital">
          <h3 className="bx-makers-stage-title"><span>03</span> Se abre la experiencia</h3>
          <div className="bx-makers-phones">
            <figure>
              <div className="bx-makers-phone-art"><Image src="/marketing/makers/phone-brand.webp" alt="Página de Tu Marca en un celular, con productos, Instagram y contacto" width={1086} height={1448} sizes="(max-width: 760px) 65vw, 240px" /></div>
              <figcaption><strong>Tu página</strong><span>Tu marca y todos tus links</span></figcaption>
            </figure>
            <figure>
              <div className="bx-makers-phone-art"><Image src="/marketing/makers/phone-review.webp" alt="Celular con una invitación a compartir tu experiencia y dejar una reseña en Google" width={1086} height={1448} sizes="(max-width: 760px) 65vw, 240px" /></div>
              <figcaption><strong>Reseñas de Google</strong><span>Más fácil dejar su opinión</span></figcaption>
            </figure>
            <figure className="bx-makers-phone-custom">
              <div className="bx-makers-phone-art"><Image src="/marketing/makers/phone-custom.webp" alt="Ejemplo de sistema personalizado en un celular, con accesos, registro de visitantes, turnos y catálogo" width={1086} height={1448} sizes="(max-width: 760px) 65vw, 240px" /></div>
              <figcaption><strong>Página o sistema a medida</strong><span>Tu idea, hecha realidad</span></figcaption>
            </figure>
          </div>
          <p className="bx-makers-custom-note"><strong>¿Tenés otra idea? La desarrollamos con vos.</strong> Creamos páginas y sistemas personalizados: turnos, catálogos, registro de visitantes y más.</p>
        </div>
      </div>
      <p className="bx-makers-footer-note"><FiCheck aria-hidden="true" />También podés sumar un QR para abrir el mismo contenido.</p>
    </div>
  </section>;
}
