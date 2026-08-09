"use client";

import type { TaskWithRelations } from "@/types";
import {
  getCalendarTaskStyle,
  type CalendarColorMode,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { formatDueLabel, isOverdue } from "@/lib/date-utils";

export function CalendarTaskChip({
  task,
  colorMode = "combined",
  showDate = false,
  onClick,
}: {
  task: TaskWithRelations;
  colorMode?: CalendarColorMode;
  showDate?: boolean;
  onClick: () => void;
}) {
  const { className, style } = getCalendarTaskStyle(task, colorMode);
  const date = task.dueDate ?? task.scheduledAt;
  const overdue = task.status !== "DONE" && isOverdue(date);
  const dateLabel = date ? formatDueLabel(date) : null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        className,
        showDate && "flex items-center justify-between gap-2",
        "transition-opacity hover:opacity-80 active:scale-[0.98]",
        overdue && task.status !== "DONE" && "ring-1 ring-status-red/40"
      )}
      style={style}
      title={dateLabel ? `${task.title} · ${dateLabel}` : task.title}
    >
      <span className={cn("min-w-0", showDate ? "flex-1 truncate" : "block truncate")}>
        {task.title}
      </span>
      {showDate && dateLabel && (
        <span
          className={cn(
            "shrink-0 text-[10px] leading-none tabular-nums md:text-xs",
            overdue ? "font-medium text-status-red" : "text-muted-foreground"
          )}
        >
          {dateLabel}
        </span>
      )}
    </button>
  );
}
