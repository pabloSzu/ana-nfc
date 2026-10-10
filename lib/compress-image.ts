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
    // WebP keeps PNG/WebP transparency while shrinking photographic covers and backgrounds
    // dramatically. The previous PNG fallback ignored `quality`, which is why a small mobile
    // landing could end up downloading several multi-megabyte images.
    const outputType = "image/webp";
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    bitmap.close();
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: outputType });
  } catch {
    return file;
  }
}
