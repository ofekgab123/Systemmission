import type { Prisma } from "@/generated/prisma/client";

export type ImageUploadInput = {
  data: string;
  mimeType: string;
};

export function parseImageUploads(value: unknown): ImageUploadInput[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is ImageUploadInput =>
        !!item &&
        typeof item === "object" &&
        typeof (item as ImageUploadInput).data === "string" &&
        typeof (item as ImageUploadInput).mimeType === "string" &&
        (item as ImageUploadInput).data.startsWith("data:image/")
    )
    .slice(0, 8);
}

export function attachmentCreates(
  taskId: string,
  images: ImageUploadInput[],
  activityId?: string | null
): Prisma.TaskAttachmentCreateManyInput[] {
  return images.map((image) => ({
    taskId,
    activityId: activityId ?? null,
    mimeType: image.mimeType,
    data: image.data,
  }));
}
