"use client";

import { AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
  formatMissingFields,
  getMissingFieldLabel,
  getTaskMissingFields,
} from "@/lib/task-completeness";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import type { TaskWithRelations } from "@/types";

export function TaskIncompleteIndicator({
  task,
  className,
}: {
  task: TaskWithRelations;
  className?: string;
}) {
  const missing = getTaskMissingFields(task);
  if (missing.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex shrink-0 rounded-sm text-status-yellow transition-opacity hover:opacity-80",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`${he.task.missingDetails}: ${formatMissingFields(missing)}`}
          />
        }
      >
        <AlertTriangle className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-auto max-w-xs text-start"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <PopoverHeader>
          <PopoverTitle className="text-sm">{he.task.missingDetails}</PopoverTitle>
        </PopoverHeader>
        <ul className="space-y-0.5 text-sm text-muted-foreground">
          {missing.map((field) => (
            <li key={field}>• {getMissingFieldLabel(field)}</li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
