"use client";

import { TaskRow } from "@/components/task/task-row";
import { formatMissingFields, getTaskMissingFields } from "@/lib/task-completeness";
import type { TaskWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";
import { EmptyState } from "@/components/task/task-list";

export function TaskReviewList({
  tasks,
  emptyAction,
}: {
  tasks: TaskWithRelations[];
  emptyAction?: React.ReactNode;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title={he.empty.noReviewTasks}
        description={he.empty.noReviewTasksDesc}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y divide-border">
      {tasks.map((task) => {
        const missing = getTaskMissingFields(task);
        return (
          <div key={task.id} className="bg-status-yellow/[0.03]">
            <TaskRow task={task} />
            <div className="border-t border-status-yellow/15 px-3 py-2">
              <p className="text-xs text-status-yellow">
                {he.task.missingPrefix}: {formatMissingFields(missing)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
