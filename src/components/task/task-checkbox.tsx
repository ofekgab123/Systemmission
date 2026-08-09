"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskCheckbox({
  checked,
  onCheckedChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-smooth",
        checked
          ? "border-status-green bg-status-green text-white"
          : "border-muted-foreground/40 hover:border-primary",
        className
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}
