export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    // JPEG has no alpha channel — encoding a transparent PNG/WebP through it turns every
    // transparent pixel solid black. Only formats that never had transparency to begin with
    // (JPEG sources) get the smaller lossy output; anything that could carry an alpha channel
    // stays PNG so a logo with a transparent background actually stays transparent.
    const preserveAlpha = file.type === "image/png" || file.type === "image/webp";
    const outputType = preserveAlpha ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, outputType, preserveAlpha ? undefined : quality));
    bitmap.close();
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, preserveAlpha ? ".png" : ".jpg"), { type: outputType });
  } catch {
    return file;
  }
}
