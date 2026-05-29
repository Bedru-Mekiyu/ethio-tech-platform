export async function compressImage(file: File, maxWidth = 512, quality = 0.8): Promise<File> {
  // Create an image bitmap for efficient decoding
  const img = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * ratio);
  const height = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(img, 0, 0, width, height);

  // Prefer webp if available for better compression
  const mime = typeof HTMLCanvasElement !== "undefined" && canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0 ? "image/webp" : "image/jpeg";

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((result: Blob | null) => resolve(result), mime, quality));
  if (!blob) throw new Error("Image compression failed");

  // Create a new File to preserve filename
  const ext = mime === "image/webp" ? "webp" : "jpg";
  const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + `.${ext}`, { type: mime });
  return newFile;
}
