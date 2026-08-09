"use client";

import { TaskRow } from "@/components/task/task-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskWithRelations } from "@/types";
import { TASK_STATUS_META } from "@/lib/task-meta";
import type { TaskStatus } from "@/generated/prisma/enums";
import { he } from "@/lib/i18n/he";

export function TaskListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2">
          <Skeleton className="size-[18px] rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
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
    <div className="flex flex-col gap-0.5">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} showProject={showProject} showEnergy={showEnergy} />
      ))}
    </div>
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
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.status}>
          <div className="mb-1 flex items-center gap-2 px-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              {TASK_STATUS_META[group.status].label}
            </span>
            <span className="text-xs text-muted-foreground/60">{group.items.length}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {group.items.map((task) => (
              <TaskRow key={task.id} task={task} showProject={showProject} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
