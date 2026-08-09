"use client";

import { TaskRow } from "@/components/task/task-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskWithRelations } from "@/types";
import { TASK_STATUS_META, STATUS_COLOR_CLASSES } from "@/lib/task-meta";
import type { TaskStatus } from "@/generated/prisma/enums";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

export function TaskListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b px-3 py-3 last:border-b-0">
          <Skeleton className="size-[18px] rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-5 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center">
      {icon}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function TaskListCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y divide-border">
      {children}
    </div>
  );
}

export function TaskList({
  tasks,
  showProject = true,
  showEnergy = false,
  emptyTitle = he.empty.nothingHere,
  emptyDescription,
  emptyAction,
}: {
  tasks: TaskWithRelations[];
  showProject?: boolean;
  showEnergy?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return (
    <TaskListCard>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} showProject={showProject} showEnergy={showEnergy} />
      ))}
    </TaskListCard>
  );
}

export function GroupedTaskList({
  tasks,
  groupBy = "status",
  showProject = true,
  emptyAction,
}: {
  tasks: TaskWithRelations[];
  groupBy?: "status";
  showProject?: boolean;
  emptyAction?: React.ReactNode;
}) {
  void groupBy;
  const order: TaskStatus[] = [
    "IN_PROGRESS",
    "READY",
    "PLANNED",
    "SCHEDULED",
    "WAITING",
    "BLOCKED",
    "REVIEW",
    "INBOX",
    "SOMEDAY",
    "DONE",
    "CANCELLED",
  ];
  const groups = order
    .map((status) => ({ status, items: tasks.filter((t) => t.status === status) }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <EmptyState
        title={he.empty.nothingHere}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => {
        const colors = STATUS_COLOR_CLASSES[TASK_STATUS_META[group.status].color];
        return (
          <section key={group.status}>
            <div
              className={cn(
                "mb-2 flex items-center gap-2 rounded-lg border px-3 py-2",
                colors.bg,
                colors.border
              )}
            >
              <span className={cn("text-sm font-medium", colors.text)}>
                {TASK_STATUS_META[group.status].label}
              </span>
              <span className={cn("rounded-full bg-background/70 px-2 py-0.5 text-xs tabular-nums", colors.text)}>
                {group.items.length}
              </span>
            </div>
            <TaskListCard>
              {group.items.map((task) => (
                <TaskRow key={task.id} task={task} showProject={showProject} />
              ))}
            </TaskListCard>
          </section>
        );
      })}
    </div>
  );
}
