"use client";

import Script from "next/script";

type TallyWindow = Window & { Tally?: { loadEmbeds: () => void } };

// El iframe arranca sin src y con data-tally-src: es el patrón oficial de Tally. Su script lo
// carga y además le ajusta la altura al contenido (dynamicHeight), así el formulario no queda
// con una barra de scroll propia adentro de la página. Si el script no carga —bloqueador de
// anuncios, red caída— se le pone el src a mano y el formulario igual aparece, solo que con
// altura fija.
export default function TallyEmbed({ src }: { src: string }) {
  function load() {
    const tally = (window as TallyWindow).Tally;
    if (tally) {
      tally.loadEmbeds();
      return;
    }
    document.querySelectorAll<HTMLIFrameElement>("iframe[data-tally-src]:not([src])").forEach((frame) => {
      frame.src = frame.dataset.tallySrc || "";
    });
  }

  return (
    <>
      <iframe
        data-tally-src={src}
        loading="lazy"
        width="100%"
        height={720}
        title="Formulario de pedido"
        className="pedido-frame"
      />
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" onLoad={load} onError={load} />
    </>
  );
}
