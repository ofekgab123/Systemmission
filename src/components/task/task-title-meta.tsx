"use client";

import type { TaskWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";

export function TaskTitleMeta({ task }: { task: TaskWithRelations }) {
  const noteCount = task.activities?.length ?? 0;
  const subtaskCount = task.subtasks.length;
  const parts: string[] = [];

  if (noteCount > 0) {
    parts.push(`${noteCount} ${he.task.notes}`);
  }

  if (subtaskCount > 0) {
    parts.push(`${subtaskCount} ${he.task.subtasks}`);
  }

  if (parts.length === 0) return null;

  return <p className="text-xs text-muted-foreground">{parts.join(" · ")}</p>;
}
