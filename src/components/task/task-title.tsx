"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

export function TaskTitle({
  title,
  done = false,
  className,
}: {
  title: string;
  done?: boolean;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "block min-w-0 max-w-full truncate text-start text-base leading-snug font-medium transition-smooth hover:opacity-80",
              done ? "text-muted-foreground line-through" : "text-foreground",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${he.task.fullTitle}: ${title}`}
          />
        }
      >
        {title}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="max-w-sm text-start"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm leading-relaxed font-medium text-foreground">{title}</p>
      </PopoverContent>
    </Popover>
  );
}
