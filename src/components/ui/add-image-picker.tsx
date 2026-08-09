"use client";

import { useRef } from "react";
import { Camera, ImagePlus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { filesToPendingImages, revokePendingImages, type PendingImage } from "@/lib/image-utils";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AddImagePicker({
  images,
  onChange,
  disabled,
  className,
}: {
  images: PendingImage[];
  onChange: (images: PendingImage[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const next = await filesToPendingImages(files);
      onChange([...images, ...next].slice(0, 8));
    } catch {
      toast.error(he.image.error);
    }
  };

  const removeImage = (id: string) => {
    const removed = images.find((image) => image.id === id);
    if (removed) revokePendingImages([removed]);
    onChange(images.filter((image) => image.id !== id));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || images.length >= 8}
              className="w-fit gap-1.5"
            />
          }
        >
          <Plus className="size-3.5" />
          {he.image.add}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuItem onClick={() => galleryRef.current?.click()}>
            <ImagePlus className="size-4" />
            {he.image.fromGallery}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => cameraRef.current?.click()}>
            <Camera className="size-4" />
            {he.image.fromCamera}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative size-16 overflow-hidden rounded-lg border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute top-0.5 left-0.5 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm"
                aria-label={he.actions.delete}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
