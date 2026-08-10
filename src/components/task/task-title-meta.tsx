"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import type { TaskWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";

export function TaskTitleMeta({
  task,
  className,
}: {
  task: TaskWithRelations;
  className?: string;
}) {
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);
  const noteCount = task.activities?.length ?? 0;
  const subtaskCount = task.subtasks.length;

  if (noteCount === 0 && subtaskCount === 0) return null;

  return (
    <p
      className={cn("flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {noteCount > 0 && (
        <button
          type="button"
          className="hover:text-foreground hover:underline"
          onClick={() => openTaskEdit(task.id, "notes")}
        >
          {noteCount} {he.task.notes}
        </button>
      )}
      {noteCount > 0 && subtaskCount > 0 && <span aria-hidden>·</span>}
      {subtaskCount > 0 && (
        <button
          type="button"
          className="hover:text-foreground hover:underline"
          onClick={() => openTaskEdit(task.id, "subtasks")}
        >
          {subtaskCount} {he.task.subtasks}
        </button>
      )}
    </p>
  );
}
