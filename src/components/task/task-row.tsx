"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, PlayCircle, StopCircle, Clock, Ban, CalendarClock, Trash2, Pencil, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCheckbox } from "@/components/task/task-checkbox";
import { PriorityBadge } from "@/components/task/priority-badge";
import { DueDateLabel } from "@/components/task/due-date-label";
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
  const [optimisticStarted, setOptimisticStarted] = useState(task.status === "IN_PROGRESS");
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);

  const ProjectIcon = task.project ? resolveIcon(task.project.icon) : null;
  const done = task.status === "DONE" || optimisticDone;
  const started = task.status === "IN_PROGRESS" || optimisticStarted;

  const handleToggleDone = (checked: boolean) => {
    setOptimisticDone(checked);
    updateTask.mutate(
      { id: task.id, data: { status: checked ? "DONE" : "READY" } },
      {
        onError: () => setOptimisticDone(!checked),
      }
    );
  };

  const handlePlayStop = () => {
    if (done) return;

    if (started) {
      setOptimisticDone(true);
      setOptimisticStarted(false);
      updateTask.mutate(
        { id: task.id, data: { status: "DONE" } },
        {
          onError: () => {
            setOptimisticDone(false);
            setOptimisticStarted(true);
          },
        }
      );
      return;
    }

    setOptimisticStarted(true);
    updateTask.mutate(
      { id: task.id, data: { status: "IN_PROGRESS" } },
      {
        onError: () => setOptimisticStarted(false),
      }
    );
  };

  const setStatus = (status: TaskWithRelations["status"], extra?: Record<string, unknown>) => {
    updateTask.mutate({ id: task.id, data: { status, ...extra } });
    if (status === "IN_PROGRESS") setOptimisticStarted(true);
    else if (status !== "DONE") setOptimisticStarted(false);
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    toast(he.task.deleted);
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
        <span
          className={cn(
            "block truncate text-base leading-snug font-medium transition-smooth",
            done ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {task.title}
        </span>

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
        </div>
      </div>

      <div
        className="flex shrink-0 flex-nowrap items-center gap-0.5 self-start pt-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground sm:size-9 opacity-100 md:opacity-70 md:group-hover:opacity-100"
          aria-label={he.task.addNote}
          onClick={() => openTaskEdit(task.id, "notesSubtasks")}
        >
          <StickyNote className="size-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground sm:size-9 opacity-100 md:opacity-70 md:group-hover:opacity-100"
          aria-label={he.task.editTask}
          onClick={() => openTaskEdit(task.id)}
        >
          <Pencil className="size-4" />
        </Button>

        <Button
          type="button"
          variant={started && !done ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-8 shrink-0 gap-1 rounded-full px-2 text-xs font-medium sm:h-9 sm:px-3",
            started && !done && "shadow-sm"
          )}
          onClick={handlePlayStop}
          disabled={done}
          aria-pressed={started && !done}
          aria-label={started && !done ? he.task.stopAndComplete : he.task.started}
        >
          {started && !done ? (
            <StopCircle className="size-3.5 shrink-0" />
          ) : (
            <PlayCircle className="size-3.5 shrink-0" />
          )}
          <span className="hidden sm:inline">
            {started && !done ? he.task.stopAndComplete : he.task.started}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground sm:size-9 opacity-100 md:opacity-70 md:group-hover:opacity-100"
                aria-label={he.actions.more}
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-44">
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
  );
}
