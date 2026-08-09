"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? attachments[activeIndex] : null;

  const showPrev = () => {
    if (activeIndex === null || attachments.length <= 1) return;
    setActiveIndex((activeIndex - 1 + attachments.length) % attachments.length);
  };

  const showNext = () => {
    if (activeIndex === null || attachments.length <= 1) return;
    setActiveIndex((activeIndex + 1) % attachments.length);
  };

  if (!attachments.length) return null;

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", className)}>
        {attachments.map((attachment, index) => (
          <button
            key={attachment.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="block size-16 overflow-hidden rounded-lg border bg-muted/30 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={he.image.view}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={attachment.data} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent
          showCloseButton
          className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 bg-black/95 p-0 shadow-none ring-0 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10"
        >
          <DialogTitle className="sr-only">{he.image.view}</DialogTitle>

          <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 pt-14">
            {active && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={active.data}
                alt=""
                className="max-h-[calc(100dvh-5rem)] max-w-full object-contain"
              />
            )}

            {attachments.length > 1 && activeIndex !== null && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute start-2 top-1/2 size-10 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                  onClick={showPrev}
                  aria-label={he.image.previous}
                >
                  <ChevronRight className="size-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute end-2 top-1/2 size-10 -translate-y-1/2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                  onClick={showNext}
                  aria-label={he.image.next}
                >
                  <ChevronLeft className="size-5" />
                </Button>
              </>
            )}
          </div>

          {attachments.length > 1 && activeIndex !== null && (
            <p className="pb-4 text-center text-xs text-white/70">
              {activeIndex + 1} / {attachments.length}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
