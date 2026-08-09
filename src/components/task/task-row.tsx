"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, PlayCircle, Clock, Ban, CalendarClock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCheckbox } from "@/components/task/task-checkbox";
import { PriorityDot } from "@/components/task/priority-dot";
import { DueDateLabel } from "@/components/task/due-date-label";
import { EnergyBadge } from "@/components/task/energy-badge";
import { StatusBadge } from "@/components/task/status-badge";
import { resolveIcon } from "@/lib/icons";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import type { TaskWithRelations } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { he } from "@/lib/i18n/he";
import { formatMinutes } from "@/lib/task-meta";

export function TaskRow({
  task,
  showProject = true,
  showEnergy = false,
  dense = false,
}: {
  task: TaskWithRelations;
  showProject?: boolean;
  showEnergy?: boolean;
  dense?: boolean;
}) {
  const [optimisticDone, setOptimisticDone] = useState(task.status === "DONE");
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);

  const ProjectIcon = task.project ? resolveIcon(task.project.icon) : null;
  const done = task.status === "DONE" || optimisticDone;

  const handleToggleDone = (checked: boolean) => {
    setOptimisticDone(checked);
    updateTask.mutate(
      { id: task.id, data: { status: checked ? "DONE" : "READY" } },
      {
        onError: () => setOptimisticDone(!checked),
      }
    );
  };

  const setStatus = (status: TaskWithRelations["status"], extra?: Record<string, unknown>) => {
    updateTask.mutate({ id: task.id, data: { status, ...extra } });
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    toast(he.task.deleted);
  };

  return (
    <div
      className={cn(
        "group rounded-xl px-2.5 transition-smooth active:bg-accent/60 md:hover:bg-accent/60",
        dense ? "py-2" : "py-2.5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <TaskCheckbox checked={done} onCheckedChange={handleToggleDone} />
        </div>

        <button
          type="button"
          onClick={() => openTaskPanel(task.id)}
          className="min-w-0 flex-1 text-start"
        >
          <span
            className={cn(
              "block text-base leading-snug transition-smooth",
              done ? "text-muted-foreground line-through" : "text-foreground"
            )}
          >
            {task.title}
          </span>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={task.status} className="md:hidden" showIcon={false} />
            {showProject && task.project && (
              <span
                className="inline-flex max-w-[140px] items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                style={{ color: task.project.color }}
              >
                {ProjectIcon && <ProjectIcon className="size-3 shrink-0" />}
                <span className="truncate">{task.project.name}</span>
              </span>
            )}
            {task.subtasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {task.subtasks.filter((s) => s.status === "DONE").length}/{task.subtasks.length}
              </span>
            )}
            {task.dueDate && (
              <span className="md:hidden">
                <DueDateLabel date={task.dueDate} />
              </span>
            )}
            {task.status === "WAITING" && task.waitingFor && (
              <span className="text-xs text-status-yellow md:hidden">
                {he.task.waitingFor}: {task.waitingFor}
              </span>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <div className="hidden items-center gap-2 md:flex">
            {task.status === "WAITING" && task.waitingFor && (
              <span className="max-w-[120px] truncate text-xs text-status-yellow">
                {he.task.waitingFor}: {task.waitingFor}
              </span>
            )}
            {task.status === "BLOCKED" && task.blockedReason && (
              <span className="max-w-[140px] truncate text-xs text-status-red">
                {task.blockedReason}
              </span>
            )}
            {showEnergy && task.energy && <EnergyBadge energy={task.energy} />}
            {task.estimatedMinutes ? (
              <span className="text-xs text-muted-foreground">{formatMinutes(task.estimatedMinutes)}</span>
            ) : null}
            <DueDateLabel date={task.dueDate} />
          </div>
          <PriorityDot priority={task.priority} />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 opacity-100 md:size-7 md:opacity-0 md:group-hover:opacity-100"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-44">
              <DropdownMenuItem onClick={() => setStatus("IN_PROGRESS")}>
                <PlayCircle className="size-4" /> {he.actions.start}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus("WAITING")}>
                <Clock className="size-4" /> {he.task.markWaiting}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatus("BLOCKED")}>
                <Ban className="size-4" /> {he.task.markBlocked}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setStatus("SCHEDULED", {
                    dueDate: new Date(new Date().setHours(0, 0, 0, 0) + 86400000),
                  })
                }
              >
                <CalendarClock className="size-4" /> {he.task.scheduleTomorrow}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" /> {he.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
