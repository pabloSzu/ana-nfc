"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

// Los 3 cuadros de "Cómo funciona", contados con distintos negocios: cada historia muestra un
// producto y un destino distinto (página, link directo, tarjeta personal). Solo se ofrecen las
// historias marcadas como listas (con sus 3 fotos en public/marketing/how-it-works/); con una
// sola lista, no se muestran pestañas. Las fotos de una historia se cargan recién al elegirla.
type Story = {
  id: string;
  label: string;
  ready: boolean;
  steps: { image: string; alt: string; title: ReactNode; description: ReactNode }[];
};

const STORIES: Story[] = [
  {
    id: "cafe",
    label: "Cafetería",
    ready: true,
    steps: [
      { image: "/marketing/how-it-works/paso-1-producto.webp", alt: "Mostrador acrílico de Café Nube con QR y NFC sobre la barra de una cafetería", title: <>Tu producto, con tu marca</>, description: "Tarjeta, llavero o mostrador con NFC y QR, diseñado para tu negocio." },
      { image: "/marketing/how-it-works/paso-2-acercar.webp", alt: "Una clienta acerca su celular al mostrador NFC de Café Nube y aparece el aviso para abrir el enlace", title: <>Acercan el celular</>, description: "Sin apps: es el mismo chip que usás para pagar con el celu. Si no tiene NFC, escanean el QR." },
      { image: "/marketing/how-it-works/paso-3-pagina.webp", alt: "El celular muestra la página personalizada de Café Nube con menú, reservas y ubicación", title: <>Se abre tu <mark>página personalizada</mark></>, description: <>Con WhatsApp, reseñas, turnos, menú y redes. <b>O el link único que vos elijas:</b> tus reseñas de Google, tu WhatsApp o tu Instagram.</> },
    ],
  },
  {
    id: "resenas",
    label: "Reseñas",
    ready: true,
    steps: [
      { image: "/marketing/how-it-works/resenas-1-producto.webp", alt: "Mostrador de reseñas de Google de una barbería sobre el mostrador del local", title: <>Tu mostrador de reseñas</>, description: "Con tu marca, QR y NFC, a la vista de cada cliente." },
      { image: "/marketing/how-it-works/resenas-2-acercar.webp", alt: "Un cliente acerca su celular al mostrador de reseñas de la barbería", title: <>Acercan el celular</>, description: "Sin apps y sin buscar tu negocio en Google." },
      { image: "/marketing/how-it-works/resenas-3-destino.webp", alt: "El celular abre directo la ventana para calificar la barbería con 5 estrellas en Google", title: <>Abre directo tus <mark>reseñas de Google</mark></>, description: "Un link directo: califican en segundos y sumás reseñas todos los días." },
    ],
  },
  {
    id: "profesional",
    label: "Profesional",
    ready: true,
    steps: [
      { image: "/marketing/how-it-works/profesional-1-producto.webp", alt: "Tarjeta personal NFC de una profesional sobre un escritorio", title: <>Tu tarjeta personal</>, description: "Con tu nombre, tu marca, QR y NFC. Una sola tarjeta para siempre." },
      { image: "/marketing/how-it-works/profesional-2-acercar.webp", alt: "Una persona acerca su celular a la tarjeta personal NFC en una reunión", title: <>La acercan al celular</>, description: "En una reunión o en un evento: un toque y listo." },
      { image: "/marketing/how-it-works/profesional-3-destino.webp", alt: "El celular muestra la tarjeta digital de la profesional con el botón Guardar contacto", title: <>Se abre tu <mark>tarjeta digital</mark></>, description: "Guardan tu contacto con un toque y ven tu WhatsApp, tu email y tus redes." },
    ],
  },
];

export default function HowItWorksStories() {
  const stories = STORIES.filter((story) => story.ready);
  const [active, setActive] = useState(stories[0].id);
  const story = stories.find((item) => item.id === active) || stories[0];

  return <>
    {stories.length > 1 && <div className="bx-journey-tabs" role="tablist" aria-label="Ejemplos">
      {stories.map((item) => <button key={item.id} type="button" role="tab" aria-selected={item.id === story.id} className={item.id === story.id ? "is-active" : ""} onClick={() => setActive(item.id)}>{item.label}</button>)}
    </div>}
    <ol className="bx-journey-steps" key={story.id}>
      {story.steps.map((step, index) => (
        <li key={step.image}>
          <div className="bx-journey-photo">
            <Image src={step.image} alt={step.alt} width={1000} height={1250} sizes="(max-width: 800px) 78vw, 360px" />
            <span className="bx-journey-number" aria-hidden="true">{index + 1}</span>
          </div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
        </li>
      ))}
    </ol>
  </>;
}
