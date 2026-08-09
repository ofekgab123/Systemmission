"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TaskCheckbox } from "@/components/task/task-checkbox";
import { TaskRowActions } from "@/components/task/task-row-actions";
import { TaskIncompleteIndicator } from "@/components/task/task-incomplete-indicator";
import { TaskRecurrenceBadge } from "@/components/task/task-recurrence-badge";
import { PriorityBadge } from "@/components/task/priority-badge";
import { DueDateLabel } from "@/components/task/due-date-label";
import { StatusBadge } from "@/components/task/status-badge";
import { resolveIcon } from "@/lib/icons";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import type { TaskWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";

export function TaskRow({
  task,
  showProject = true,
  dense = false,
}: {
  task: TaskWithRelations;
  showProject?: boolean;
  showEnergy?: boolean;
  dense?: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useState(task.status === "DONE");
  const updateTask = useUpdateTask();
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);

  const ProjectIcon = task.project ? resolveIcon(task.project.icon) : null;
  const done = task.status === "DONE" || optimisticDone;
  const started = task.status === "IN_PROGRESS";

  const handleToggleDone = (checked: boolean) => {
    setOptimisticDone(checked);
    updateTask.mutate(
      { id: task.id, data: { status: checked ? "DONE" : "READY" } },
      {
        onError: () => setOptimisticDone(!checked),
      }
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTaskPanel(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTaskPanel(task.id);
        }
      }}
      className={cn(
        "group flex cursor-pointer items-start gap-2 px-3 transition-colors hover:bg-accent/30 active:bg-accent/50",
        started && !done && "bg-primary/[0.03]",
        dense ? "py-2.5" : "py-3"
      )}
    >
      <div className="mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <TaskCheckbox checked={done} onCheckedChange={handleToggleDone} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-base leading-snug font-medium transition-smooth",
              done ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {task.title}
          </span>
          {!done && <TaskIncompleteIndicator task={task} className="mt-0.5" />}
          <TaskRecurrenceBadge task={task} className="mt-0.5" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} showIcon={false} className="text-xs" />

          {showProject && task.project && (
            <span
              className="inline-flex max-w-[9rem] items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
              style={{ borderColor: `${task.project.color}44`, color: task.project.color }}
            >
              {ProjectIcon && <ProjectIcon className="size-3 shrink-0" />}
              <span className="truncate">{task.project.name}</span>
            </span>
          )}

          {task.dueDate && <DueDateLabel date={task.dueDate} />}

          {task.subtasks.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
              {task.subtasks.filter((s) => s.status === "DONE").length}/{task.subtasks.length}
            </span>
          )}

          {task.status === "WAITING" && task.waitingFor && (
            <span className="max-w-[10rem] truncate rounded-full bg-status-yellow/10 px-2 py-0.5 text-xs text-status-yellow">
              {he.task.waitingFor}: {task.waitingFor}
            </span>
          )}

          {task.status === "BLOCKED" && task.blockedReason && (
            <span className="max-w-[10rem] truncate rounded-full bg-status-red/10 px-2 py-0.5 text-xs text-status-red">
              {task.blockedReason}
            </span>
          )}

          {task.status === "SOMEDAY" && task.somedayReason && (
            <span className="max-w-[10rem] truncate rounded-full bg-status-gray/10 px-2 py-0.5 text-xs text-status-gray">
              {task.somedayReason}
            </span>
          )}
        </div>
      </div>

      <TaskRowActions task={task} className="pt-0.5" />
    </div>
  );
}
