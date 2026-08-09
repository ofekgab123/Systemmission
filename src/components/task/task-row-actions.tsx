"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  PlayCircle,
  StopCircle,
  Clock,
  Ban,
  CalendarClock,
  Trash2,
  Pencil,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useTaskStatusChange } from "@/hooks/use-task-status-change";
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

export function TaskRowActions({
  task,
  className,
}: {
  task: TaskWithRelations;
  className?: string;
}) {
  const [optimisticStarted, setOptimisticStarted] = useState(task.status === "IN_PROGRESS");
  const updateTask = useUpdateTask();
  const changeStatus = useTaskStatusChange();
  const deleteTask = useDeleteTask();
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);

  const done = task.status === "DONE";
  const started = task.status === "IN_PROGRESS" || optimisticStarted;

  const handlePlayStop = () => {
    if (done) return;

    if (started) {
      setOptimisticStarted(false);
      updateTask.mutate(
        { id: task.id, data: { status: "DONE" } },
        { onError: () => setOptimisticStarted(true) }
      );
      return;
    }

    setOptimisticStarted(true);
    updateTask.mutate(
      { id: task.id, data: { status: "IN_PROGRESS" } },
      { onError: () => setOptimisticStarted(false) }
    );
  };

  const setStatus = (status: TaskWithRelations["status"], extra?: Record<string, unknown>) => {
    changeStatus(task.id, status, task.status, extra);
    if (status === "IN_PROGRESS") setOptimisticStarted(true);
    else if (status !== "DONE") setOptimisticStarted(false);
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    toast(he.task.deleted);
  };

  return (
    <div
      className={cn("flex shrink-0 flex-nowrap items-center gap-0.5 self-start", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-muted-foreground sm:size-9 opacity-100 md:opacity-70 md:group-hover:opacity-100"
        aria-label={he.task.addNote}
        onClick={() => openTaskEdit(task.id, "notes")}
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
  );
}
