import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa6";

// La escena de las chapitas para mascotas (home y /mascotas): la chapita y la ficha son imágenes
// sacadas de las de verdad (TagFront del estudio de impresión y PetRenderer), así lo que se ve acá
// es lo que llega. Todo está en unidades del contenedor (cqw): escala como una sola imagen.
export default function PetProductVisual({ priority = false }: { priority?: boolean }) {
  return <div className="pps" role="img" aria-label="La chapita de Luna y su ficha abierta en un celular, con el aviso de WhatsApp que recibe su familia">
    <div className="pps-inner" aria-hidden="true">
      <span className="pps-halo" />
      <div className="pps-phone">
        <div className="pps-screen"><Image src="/marketing/pets/ficha-luna.webp" alt="" width={780} height={1688} sizes="(max-width: 760px) 50vw, 300px" priority={priority} /></div>
        <span className="pps-island" />
      </div>
      <div className="pps-tag">
        <span className="pps-ring" />
        <Image src="/marketing/pets/tag-luna.webp" alt="" width={560} height={560} sizes="(max-width: 760px) 40vw, 240px" priority={priority} />
      </div>
      <svg className="pps-waves" viewBox="0 0 40 40" fill="none" strokeLinecap="round"><path d="M10 14a9 9 0 0 1 0 12" /><path d="M16 9a16 16 0 0 1 0 22" /><path d="M22 4a23 23 0 0 1 0 32" /></svg>
      <div className="pps-toast">
        <span className="pps-toast-icon"><FaWhatsapp /></span>
        <span><b>Encontré a Luna 🐾</b><small>Está conmigo en la plaza. Te paso la ubicación.</small></span>
      </div>
    </div>
  </div>;
}

// Las chapitas de distintos colores y animalitos (las de verdad, como salen de la impresión).
export const PET_TAGS = [
  { src: "/marketing/pets/tag-luna.webp", name: "Luna", label: "Golden en violeta" },
  { src: "/marketing/pets/tag-milo.webp", name: "Milo", label: "Gato atigrado en naranja" },
  { src: "/marketing/pets/tag-toby.webp", name: "Toby", label: "Bulldog francés en azul" },
  { src: "/marketing/pets/tag-kira.webp", name: "Kira", label: "Salchicha en rosa" },
  { src: "/marketing/pets/tag-simba.webp", name: "Simba", label: "Gato naranja en verde" },
  { src: "/marketing/pets/tag-rainbow.webp", name: "Rocco", label: "Beagle en arcoíris" },
  { src: "/marketing/pets/tag-olivia.webp", name: "Olivia", label: "Gata negra en blanco" },
  { src: "/marketing/pets/tag-thor.webp", name: "Thor", label: "Husky en negro" },
  { src: "/marketing/pets/tag-nala.webp", name: "Nala", label: "Siamesa en arcoíris" },
  { src: "/marketing/pets/tag-coco.webp", name: "Coco", label: "Caniche en violeta" },
  { src: "/marketing/pets/tag-bruno.webp", name: "Bruno", label: "Labrador chocolate en amarillo" },
  { src: "/marketing/pets/tag-mia.webp", name: "Mía", label: "Maltés en negro" },
  { src: "/marketing/pets/tag-pancho.webp", name: "Pancho", label: "Pug en arcoíris" },
  { src: "/marketing/pets/tag-lola.webp", name: "Lola", label: "Gata tricolor en rosa claro" },
  { src: "/marketing/pets/tag-rayo.webp", name: "Rayo", label: "Dálmata en rojo" },
  { src: "/marketing/pets/tag-frida.webp", name: "Frida", label: "Schnauzer en turquesa" },
  { src: "/marketing/pets/tag-michi.webp", name: "Michi", label: "Gato negro y blanco en amarillo" },
  { src: "/marketing/pets/tag-max.webp", name: "Max", label: "Ovejero en blanco" },
  { src: "/marketing/pets/tag-generica.webp", name: "", label: "Corgi sin nombre, en azul" },
];
