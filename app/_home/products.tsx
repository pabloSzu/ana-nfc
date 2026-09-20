import Image from "next/image";
import { FiArrowUpRight, FiCheck, FiLayers, FiPlus } from "react-icons/fi";

const PRODUCTS = [
  { id: "keychain", name: "Llavero NFC", context: "PARA LLEVAR CON VOS", line: "Tu negocio sale con vos.", description: "En tus llaves, siempre a mano. Compartí tu página donde aparezca una oportunidad.", use: "Emprendedores · eventos · contactos", image: "/marketing/hero/keychain.webp", width: 475, height: 760 },
  { id: "card", name: "Tarjeta NFC", context: "PARA PRESENTARTE", line: "Una presentación que queda.", description: "Acercala al celular y compartí tu perfil profesional. La tarjeta vuelve a tu bolsillo.", use: "Profesionales · equipos · reuniones", image: "/marketing/hero/card.webp", width: 980, height: 603 },
  { id: "stand", name: "NFC de mostrador", context: "PARA TU LOCAL", line: "Tu mejor punto de encuentro.", description: "En la mesa o el mostrador. Tu menú, tus redes y tus reseñas, justo donde está tu cliente.", use: "Cafés · locales · consultorios", image: "/marketing/hero/stand.webp", width: 676, height: 1000 },
];

export default function Products({ whatsappNumber }: { whatsappNumber: string }) {
  const inquiry = (name: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola BioNFC, me interesa ${name}. Quiero conocer las opciones para mi negocio.`)}`;
  return <section id="productos" className="bx-shop">
    <div className="bx-section">
      <div className="bx-editorial-head"><div><p className="bx-section-kicker">ELEGÍ TU FORMATO</p><h2 className="bx-h2">La misma magia.<br /><span>Tres formas de llevarla.</span></h2></div><p>En el bolsillo, en tus llaves o en tu local. Elegí dónde querés que empiece la conexión.</p></div>
      <div className="bx-shop-grid">
        {PRODUCTS.map((product, index) => <article key={product.id} className={`bx-shop-card bx-shop-format-${product.id}`}>
          <div className="bx-shop-art"><span className="bx-shop-context">{product.context}</span><span className="bx-shop-index" aria-hidden="true">0{index + 1}</span><Image src={product.image} alt={product.name} width={product.width} height={product.height} sizes="(max-width: 760px) 300px, 340px" /><span className="bx-shop-art-label" aria-hidden="true">BIONFC / {product.id === "stand" ? "EN TU ESPACIO" : "CON VOS"}</span></div>
          <div className="bx-shop-info"><h3>{product.name}</h3><p className="bx-shop-line">{product.line}</p><p className="bx-shop-description">{product.description}</p><p className="bx-shop-use">{product.use}</p><a href={inquiry(product.name)} target="_blank" rel="noreferrer">Quiero este formato<FiArrowUpRight aria-hidden="true" /></a></div>
        </article>)}
      </div>
      <div className="bx-shop-included"><span><FiLayers aria-hidden="true" /> En todos los formatos</span><ul><li><FiCheck aria-hidden="true" /> Tu página personalizada</li><li><FiCheck aria-hidden="true" /> NFC + QR de respaldo</li><li><FiCheck aria-hidden="true" /> Links que podés actualizar</li></ul></div>
      <div className="bx-shop-custom"><span className="bx-shop-custom-symbol" aria-hidden="true"><FiPlus /></span><div><h3>¿Tenés otra idea en mente?</h3><p>Contanos dónde querés poner tu NFC. Buscamos un formato para vos.</p></div><a href={inquiry("un NFC personalizado")} target="_blank" rel="noreferrer">Hablemos de tu idea <FiArrowUpRight aria-hidden="true" /></a></div>
    </div>
  </section>;
}
