"use client";

import { cn } from "@/lib/utils";

export type TaskAttachmentView = {
  id: string;
  mimeType: string;
  data: string;
};

export function TaskImageGallery({
  attachments,
  className,
}: {
  attachments: TaskAttachmentView[];
  className?: string;
}) {
  if (!attachments.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.data}
          target="_blank"
          rel="noopener noreferrer"
          className="block size-16 overflow-hidden rounded-lg border bg-muted/30 transition-opacity hover:opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={attachment.data} alt="" className="size-full object-cover" />
        </a>
      ))}
    </div>
  );
}
