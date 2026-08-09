"use client";

import type { TaskWithRelations } from "@/types";
import {
  getCalendarTaskStyle,
  type CalendarColorMode,
} from "@/lib/calendar-utils";
import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/date-utils";

export function CalendarTaskChip({
  task,
  colorMode,
  onClick,
}: {
  task: TaskWithRelations;
  colorMode: CalendarColorMode;
  onClick: () => void;
}) {
  const { className, style } = getCalendarTaskStyle(task, colorMode);
  const overdue =
    task.status !== "DONE" && isOverdue(task.dueDate ?? task.scheduledAt);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        className,
        "transition-opacity hover:opacity-80 active:scale-[0.98]",
        overdue && task.status !== "DONE" && "ring-1 ring-status-red/40"
      )}
      style={style}
      title={task.title}
    >
      {task.title}
    </button>
  );
}
