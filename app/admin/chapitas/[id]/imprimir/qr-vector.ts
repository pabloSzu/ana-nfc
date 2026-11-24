import QRCode from "qrcode";
import type { VectorQr } from "./tag-face";

// QR en vector, armados en el navegador a partir de los links que manda el servidor. Antes viajaban
// ya dibujados (PNG de 480 px para la tarjetita): con 96 chapitas eran ~3,5 s de servidor y una
// página de 1,5 MB. Usa la misma librería, sin servicios de terceros: los links (el de activación
// tiene un secreto de un solo uso) no salen de BIONFC.

// Un único path con una tira por cada tramo oscuro de cada fila: no se pixela en el PDF ni al
// escalarlo, y evita cientos de <rect> por unidad.
export function vectorQr(text: string): VectorQr {
  const matrix = QRCode.create(text, { errorCorrectionLevel: "M" }).modules;
  const path: string[] = [];
  for (let y = 0; y < matrix.size; y += 1) {
    let start = -1;
    for (let x = 0; x <= matrix.size; x += 1) {
      const dark = x < matrix.size && Boolean(matrix.data[y * matrix.size + x]);
      if (dark && start < 0) start = x;
      if (!dark && start >= 0) {
        const width = x - start;
        path.push(`M${start} ${y}h${width}v1h-${width}z`);
        start = -1;
      }
    }
  }
  return { modules: matrix.size, path: path.join("") };
}

// El de la tarjetita va en un <img>: un SVG sin fondo (el blanco lo pone la caja del diseño).
export function qrImage(text: string): string {
  const { modules, path } = vectorQr(text);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${modules} ${modules}" shape-rendering="crispEdges"><path fill="#1d1410" d="${path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
