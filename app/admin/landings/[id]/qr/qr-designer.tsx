"use client";

import { useEffect, useMemo, useState } from "react";
import { QR_DOT_STYLES, QR_EYE_STYLES, darkenUntilReadable, parseQrStyle, qrWarnings, renderQrSvg, type QrStyle } from "@/lib/qr";
import { saveQrStyle } from "./actions";

// El SVG se arma en el navegador y no en el servidor para que la vista previa sea inmediata:
// tocás un color y se redibuja, sin un viaje al servidor por cada cambio. Es exactamente el
// mismo renderQrSvg que usaría el servidor, así que lo que ves es lo que se descarga.
export default function QrDesigner({
  landingId, url, saved, logoDataUri, hasLogo, primaryColor, isLocal, host,
}: {
  landingId: string;
  url: string;
  saved: unknown;
  logoDataUri: string | null;
  hasLogo: boolean;
  primaryColor: string | null;
  isLocal: boolean;
  host: string;
}) {
  const [style, setStyle] = useState<QrStyle>(() => parseQrStyle(saved, { foreground: primaryColor }));
  const set = (patch: Partial<QrStyle>) => setStyle((current) => ({ ...current, ...patch }));

  // La forma real del logo se mide acá, cargando la imagen, en vez de parsear cabeceras de
  // PNG/JPEG/WebP en el servidor. El navegador ya sabe hacerlo y la imagen ya está en memoria
  // como data URI, así que no hay descarga extra. Sin esto la placa de fondo sale siempre
  // cuadrada y un logo apaisado queda con franjas blancas arriba y abajo.
  const [logoAspect, setLogoAspect] = useState(1);
  useEffect(() => {
    if (!logoDataUri) return;
    const image = new Image();
    image.onload = () => { if (image.naturalHeight > 0) setLogoAspect(image.naturalWidth / image.naturalHeight); };
    image.src = logoDataUri;
  }, [logoDataUri]);

  const svg = useMemo(
    () => renderQrSvg({ text: url, style, logoDataUri: hasLogo ? logoDataUri : null, logoAspect, size: 1024 }),
    [url, style, logoDataUri, hasLogo, logoAspect]
  );
  const warnings = useMemo(() => qrWarnings(style), [style]);
  const preview = useMemo(() => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`, [svg]);

  function download(name: string, blob: Blob) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
    URL.revokeObjectURL(href);
  }

  function downloadSvg() {
    download(`qr-${landingId}.svg`, new Blob([svg], { type: "image/svg+xml" }));
  }

  // El PNG se rasteriza desde el mismo SVG. 2048px es deliberadamente grande: a 300 dpi son
  // unos 17 cm, así que sirve para un cartel y no solo para una tarjeta.
  function downloadPng() {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 2048;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, 2048, 2048);
      canvas.toBlob((blob) => blob && download(`qr-${landingId}.png`, blob), "image/png");
    };
    image.src = preview;
  }

  return (
    <div className="qr-designer">
      <div className="qr-stage">
        {isLocal && (
          <div className="qr-local-warning" role="alert">
            <strong>Este QR no sirve para imprimir</strong>
            <p>Apunta a <code>{host}</code>, que es esta computadora. En el celular de otra persona no abre nada.</p>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qr-preview" src={preview} alt="Vista previa del código QR" />
        <p className="muted qr-url">{url}</p>
        {warnings.length > 0 && (
          <ul className="qr-warnings" role="alert">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        )}
      </div>

      <div className="qr-controls">
        <div className="qr-field">
          <span className="label">Color de los puntos</span>
          <div className="qr-colors">
            <input type="color" value={style.foreground} onChange={(event) => set({ foreground: event.target.value })} aria-label="Color de los puntos" />
            <input type="color" value={style.background} onChange={(event) => set({ background: event.target.value })} aria-label="Color del fondo" />
            <button type="button" className="btn secondary" onClick={() => set({ foreground: darkenUntilReadable(primaryColor || "#1f2937", "#ffffff"), background: "#ffffff" })}>
              Colores de la landing
            </button>
          </div>
        </div>

        <div className="qr-field">
          <span className="label">Puntos</span>
          <div className="qr-options">
            {QR_DOT_STYLES.map((option) => (
              <button key={option.id} type="button" className={style.dots === option.id ? "qr-option on" : "qr-option"} onClick={() => set({ dots: option.id })}>{option.label}</button>
            ))}
          </div>
        </div>

        <div className="qr-field">
          <span className="label">Esquinas</span>
          <div className="qr-options">
            {QR_EYE_STYLES.map((option) => (
              <button key={option.id} type="button" className={style.eyes === option.id ? "qr-option on" : "qr-option"} onClick={() => set({ eyes: option.id })}>{option.label}</button>
            ))}
          </div>
        </div>

        <div className="qr-field">
          <span className="label">Logo en el centro</span>
          {hasLogo ? (
            <>
              <label className="qr-check">
                <input type="checkbox" checked={style.logo} onChange={(event) => set({ logo: event.target.checked })} />
                Mostrar el logo de la landing
              </label>
              {style.logo && (
                <label className="qr-range">
                  Tamaño: {Math.round(style.logoScale * 100)}%
                  <input type="range" min={10} max={24} value={Math.round(style.logoScale * 100)} onChange={(event) => set({ logoScale: Number(event.target.value) / 100 })} />
                </label>
              )}
            </>
          ) : (
            <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>Esta landing no tiene logo cargado. Subí uno en el editor y aparece acá.</p>
          )}
        </div>

        <form action={saveQrStyle} className="qr-actions">
          <input type="hidden" name="id" value={landingId} />
          <input type="hidden" name="qr_style" value={JSON.stringify(style)} />
          <button className="btn full" type="submit">Guardar diseño</button>
        </form>

        <div className="qr-actions">
          <button className="btn secondary" type="button" onClick={downloadSvg}>Descargar SVG</button>
          <button className="btn secondary" type="button" onClick={downloadPng}>Descargar PNG</button>
        </div>
        <p className="muted" style={{ fontSize: "0.6875rem", marginTop: 6 }}>
          Para imprimir usá el SVG: es vectorial y no se pixela a ningún tamaño. El PNG sirve para pantalla o para quien no acepte vectores.
        </p>
      </div>
    </div>
  );
}
