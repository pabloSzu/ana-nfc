import sharp from "sharp";

// Foto de perfil para el contacto descargable: se baja la imagen del logo/foto de la tarjeta, se
// recorta cuadrada a 300 px y se pasa a JPEG (las agendas de iPhone y Android no leen WebP). Queda
// en unos 15-25 KB. Si algo falla (sin foto, imagen rota, demora), el contacto sale igual sin foto.
export async function contactPhotoBase64(logoUrl: string | null | undefined, requestUrl: string): Promise<string> {
  const source = (logoUrl || "").trim();
  if (!source) return "";
  try {
    const url = new URL(source, requestUrl);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) return "";
    const input = Buffer.from(await response.arrayBuffer());
    const jpeg = await sharp(input).rotate().resize(300, 300, { fit: "cover" }).flatten({ background: "#ffffff" }).jpeg({ quality: 78 }).toBuffer();
    return jpeg.toString("base64");
  } catch {
    return "";
  }
}
