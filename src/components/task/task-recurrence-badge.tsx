"use client";

import { Repeat } from "lucide-react";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { formatRecurrenceLabel } from "@/lib/task-recurrence";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { TaskWithRelations } from "@/types";

export function TaskRecurrenceBadge({
  task,
  className,
}: {
  task: Pick<TaskWithRelations, "recurrencePattern" | "recurrenceWeekday">;
  className?: string;
}) {
  const label = formatRecurrenceLabel(task.recurrencePattern, task.recurrenceWeekday);
  if (!label) return null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 rounded-sm text-primary transition-opacity hover:opacity-80",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${he.recurrence.enabled}: ${label}`}
          />
        }
      >
        <Repeat className="size-3.5" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-auto max-w-xs text-start"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <PopoverHeader>
          <PopoverTitle className="text-sm">{he.recurrence.enabled}</PopoverTitle>
        </PopoverHeader>
        <p className="text-sm text-muted-foreground">{label}</p>
      </PopoverContent>
    </Popover>
  );
}
