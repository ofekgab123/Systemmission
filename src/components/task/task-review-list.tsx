"use client";

import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { TaskRow } from "@/components/task/task-row";
import { formatMissingFields, getTaskMissingFields } from "@/lib/task-completeness";
import { useApproveTask } from "@/hooks/use-review-tasks";
import type { TaskWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";
import { EmptyState } from "@/components/task/task-list";
import { Button } from "@/components/ui/button";

export function TaskReviewList({
  tasks,
  emptyAction,
}: {
  tasks: TaskWithRelations[];
  emptyAction?: React.ReactNode;
}) {
  const approveTask = useApproveTask();

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={he.empty.noReviewTasks}
        description={he.empty.noReviewTasksDesc}
        action={emptyAction}
      />
    );
  }

  const handleApprove = (task: TaskWithRelations) => {
    approveTask.mutate(task, {
      onError: () => toast.error(he.task.approveFailed),
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y divide-border">
      {tasks.map((task) => {
        const missing = getTaskMissingFields(task);
        return (
          <div key={task.id} className="bg-status-yellow/[0.03]">
            <TaskRow task={task} />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-status-yellow/15 px-3 py-2">
              {missing.length > 0 ? (
                <p className="text-xs text-status-yellow">
                  {he.task.missingPrefix}: {formatMissingFields(missing)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">מוכנה לאישור</p>
              )}
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => handleApprove(task)}
                disabled={approveTask.isPending}
              >
                <CheckCircle2 className="size-3.5" />
                {he.task.approve}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
