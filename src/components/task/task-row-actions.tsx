"use client";

import { useEffect, useState } from "react";
import { PlayCircle, StopCircle, Pencil, StickyNote, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeleteTask } from "@/hooks/use-tasks";
import { useTaskStatusChange } from "@/hooks/use-task-status-change";
import { useUIStore } from "@/store/ui-store";
import type { TaskWithRelations } from "@/types";
import {
  EDITABLE_TASK_STATUSES,
  STATUS_COLOR_CLASSES,
  TASK_STATUS_META,
  normalizeTaskStatus,
  type UserTaskStatus,
} from "@/lib/task-meta";
import { EnumSelect } from "@/components/ui/enum-select";
import { Button } from "@/components/ui/button";
import { he } from "@/lib/i18n/he";
import { toast } from "sonner";

const statusOptions = EDITABLE_TASK_STATUSES.map((value) => ({
  value,
  label: TASK_STATUS_META[value].label,
}));

export function TaskRowDeleteButton({
  task,
  className,
}: {
  task: Pick<TaskWithRelations, "id">;
  className?: string;
}) {
  const deleteTask = useDeleteTask();

  const handleDelete = () => {
    deleteTask.mutate(task.id);
    toast(he.task.deleted);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:size-9",
        className
      )}
      aria-label={he.actions.delete}
      onClick={(e) => {
        e.stopPropagation();
        handleDelete();
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

export function TaskRowActions({
  task,
  className,
}: {
  task: TaskWithRelations;
  className?: string;
}) {
  const [optimisticStarted, setOptimisticStarted] = useState(task.status === "IN_PROGRESS");
  const changeStatus = useTaskStatusChange();
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);

  const done = task.status === "DONE";
  const started = task.status === "IN_PROGRESS" || optimisticStarted;
  const currentStatus = normalizeTaskStatus(task.status);
  const statusColors = STATUS_COLOR_CLASSES[TASK_STATUS_META[currentStatus].color];

  useEffect(() => {
    setOptimisticStarted(task.status === "IN_PROGRESS");
  }, [task.status]);

  const handlePlayStop = () => {
    if (done) return;

    if (started) {
      setOptimisticStarted(false);
      changeStatus(task.id, "DONE", task.status);
      return;
    }

    setOptimisticStarted(true);
    changeStatus(task.id, "IN_PROGRESS", task.status);
  };

  const setStatus = (status: UserTaskStatus) => {
    changeStatus(task.id, status, task.status);
    if (status === "IN_PROGRESS") setOptimisticStarted(true);
    else if (status !== "DONE") setOptimisticStarted(false);
  };

  return (
    <div
      className={cn("flex shrink-0 flex-col items-end gap-1 self-start", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex min-w-[6.75rem] flex-col items-stretch gap-1 sm:min-w-[7rem]">
        <div className="flex items-center justify-end gap-0.5">
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
          size="icon"
          className={cn(
            "size-8 rounded-full sm:size-8",
            started && !done && "shadow-sm"
          )}
          onClick={handlePlayStop}
          disabled={done}
          aria-pressed={started && !done}
          aria-label={started && !done ? he.task.stopAndComplete : he.task.started}
        >
          {started && !done ? (
            <StopCircle className="size-4 shrink-0" />
          ) : (
            <PlayCircle className="size-4 shrink-0" />
          )}
        </Button>
        </div>

        <EnumSelect
          value={currentStatus}
          onChange={setStatus}
          options={statusOptions}
          className={cn(
            "h-8 w-full min-h-8 border-0 px-2 text-xs font-medium shadow-none sm:h-8 sm:min-h-8 sm:text-xs",
            statusColors.bg,
            statusColors.text
          )}
        />
      </div>
    </div>
  );
}
