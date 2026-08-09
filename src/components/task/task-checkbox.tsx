"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

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
      aria-label={checked ? he.task.markIncomplete : he.task.markComplete}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex size-[22px] shrink-0 items-center justify-center rounded-full border transition-smooth",
        checked
          ? "border-status-green bg-status-green text-white"
          : "border-muted-foreground/40 bg-background hover:border-primary hover:bg-primary/5",
        className
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}
