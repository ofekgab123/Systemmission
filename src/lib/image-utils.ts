const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export type ProcessedImage = {
  dataUrl: string;
  mimeType: string;
};

export type PendingImage = ProcessedImage & {
  id: string;
  previewUrl: string;
};

export function pendingImagePayload(images: PendingImage[]) {
  return images.map(({ dataUrl, mimeType }) => ({ data: dataUrl, mimeType }));
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Not an image");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image too large");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return { dataUrl, mimeType: "image/jpeg" };
}

export async function filesToPendingImages(files: FileList | File[]): Promise<PendingImage[]> {
  const list = Array.from(files);
  const results = await Promise.all(list.map(processImageFile));
  return results.map((image, index) => ({
    ...image,
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    previewUrl: image.dataUrl,
  }));
}

export function revokePendingImages(images: PendingImage[]) {
  for (const image of images) {
    if (image.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(image.previewUrl);
    }
  }
}
