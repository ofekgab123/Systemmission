"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, ListTree, StickyNote, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DueDateSelect } from "@/components/ui/due-date-select";
import { StatusBadge } from "@/components/task/status-badge";
import { TaskCheckbox } from "@/components/task/task-checkbox";
import { useTask, useUpdateTask, useDeleteTask, useCreateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import { formatDistanceToNow } from "date-fns";
import { he as dateHe } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { startOfToday } from "@/lib/date-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ActionMode = null | "subtask" | "note";

export function TaskPanel() {
  const taskId = useUIStore((s) => s.taskPanelId);
  const taskPanelMode = useUIStore((s) => s.taskPanelMode);
  const setTaskPanelMode = useUIStore((s) => s.setTaskPanelMode);
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);
  const close = useUIStore((s) => s.closeTaskPanel);
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  const [mode, setMode] = useState<ActionMode>(null);

  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskDueDate, setSubtaskDueDate] = useState<Date | null>(null);
  const [subtaskNoDeadline, setSubtaskNoDeadline] = useState(false);
  const [subtaskCreatedDate, setSubtaskCreatedDate] = useState<Date | null>(startOfToday());
  const [subtaskSubmitted, setSubtaskSubmitted] = useState(false);

  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!taskId) {
      setMode(null);
      resetSubtaskForm();
      setNoteText("");
      return;
    }

    setMode(taskPanelMode);
    if (taskPanelMode !== "note") setNoteText("");
  }, [taskId, taskPanelMode]);

  const resetSubtaskForm = () => {
    setSubtaskTitle("");
    setSubtaskDueDate(null);
    setSubtaskNoDeadline(false);
    setSubtaskCreatedDate(startOfToday());
    setSubtaskSubmitted(false);
  };

  if (!taskId) return null;

  const handleClose = () => {
    close();
    setMode(null);
    resetSubtaskForm();
    setNoteText("");
  };

  const handleDelete = () => {
    deleteTask.mutate(taskId);
    handleClose();
    toast(he.task.deleted);
  };

  const subtaskValid =
    subtaskTitle.trim().length > 0 && (subtaskNoDeadline || subtaskDueDate !== null);

  const handleAddSubtask = () => {
    setSubtaskSubmitted(true);
    if (!subtaskValid) return;

    createTask.mutate(
      {
        title: subtaskTitle.trim(),
        parentTaskId: taskId,
        projectId: task?.projectId ?? undefined,
        dueDate: subtaskNoDeadline ? undefined : subtaskDueDate!,
        createdAt: subtaskNoDeadline ? (subtaskCreatedDate ?? startOfToday()) : undefined,
        status: "READY",
      },
      {
        onSuccess: () => {
          toast.success(he.task.subtaskAdded);
          resetSubtaskForm();
          setMode(null);
          handleClose();
          openTaskEdit(taskId, "subtasks");
        },
      }
    );
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    updateTask.mutate(
      { id: taskId, data: { note: noteText.trim() } },
      {
        onSuccess: () => {
          toast.success(he.task.noteAdded);
          setNoteText("");
          setMode(null);
          handleClose();
          openTaskEdit(taskId, "notes");
        },
      }
    );
  };

  const notes = (task?.activities ?? []).filter((a) => a.type === "NOTE_ADDED");

  return (
    <Dialog open={!!taskId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        {isLoading || !task ? (
          <div className="py-6 text-sm text-muted-foreground">{he.actions.loading}</div>
        ) : (
          <>
            <DialogHeader className="gap-3 text-start">
              <div className="flex items-center justify-between gap-2 pe-8">
                <StatusBadge status={task.status} />
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{he.task.deleteConfirm}</AlertDialogTitle>
                      <AlertDialogDescription>{he.task.deleteConfirmDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{he.actions.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>{he.actions.delete}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <DialogTitle className="text-start text-lg font-semibold leading-snug">
                {task.title}
              </DialogTitle>
            </DialogHeader>

            {mode === null && (
              <div className="flex flex-col gap-4">
                {task.subtasks.length > 0 && (
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ListTree className="size-3.5" /> {he.task.subtasks}
                    </Label>
                    <div className="flex flex-col gap-1">
                      {task.subtasks.map((sub) => (
                        <SubtaskRow key={sub.id} id={sub.id} title={sub.title} done={sub.status === "DONE"} />
                      ))}
                    </div>
                  </div>
                )}

                {notes.length > 0 && (
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <StickyNote className="size-3.5" /> {he.task.notes}
                    </Label>
                    <div className="flex flex-col gap-2">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                        >
                          <p>{note.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(note.createdAt), {
                              addSuffix: true,
                              locale: dateHe,
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <ActionTile
                    icon={ListTree}
                    label={he.task.addSubtaskAction}
                    onClick={() => {
                      setTaskPanelMode("subtask");
                      setMode("subtask");
                    }}
                  />
                  <ActionTile
                    icon={StickyNote}
                    label={he.task.addNote}
                    onClick={() => {
                      setTaskPanelMode("note");
                      setMode("note");
                    }}
                  />
                </div>
              </div>
            )}

            {mode === "subtask" && (
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1 px-0 text-muted-foreground hover:bg-transparent"
                  onClick={() => {
                    setTaskPanelMode(null);
                    setMode(null);
                    resetSubtaskForm();
                  }}
                >
                  <ArrowRight className="size-4" />
                  {he.actions.back}
                </Button>

                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-medium">{he.task.addSubtaskTitle}</Label>
                  <Input
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder={he.task.addSubtask}
                    autoFocus
                  />
                  {subtaskSubmitted && !subtaskTitle.trim() && (
                    <p className="text-xs text-destructive">{he.quickAdd.formTitlePlaceholder}</p>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">{he.task.dueDate}</Label>
                    <DueDateSelect
                      value={subtaskDueDate}
                      onChange={setSubtaskDueDate}
                      noDeadline={subtaskNoDeadline}
                      onNoDeadlineChange={setSubtaskNoDeadline}
                      createdDate={subtaskCreatedDate}
                      onCreatedDateChange={setSubtaskCreatedDate}
                      allowNoDeadline
                      invalid={subtaskSubmitted}
                    />
                  </div>

                  <Button
                    onClick={handleAddSubtask}
                    disabled={createTask.isPending}
                    className="w-full"
                  >
                    {he.actions.add}
                  </Button>
                </div>
              </div>
            )}

            {mode === "note" && (
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1 px-0 text-muted-foreground hover:bg-transparent"
                  onClick={() => {
                    setTaskPanelMode(null);
                    setMode(null);
                    setNoteText("");
                  }}
                >
                  <ArrowRight className="size-4" />
                  {he.actions.back}
                </Button>

                <div className="flex flex-col gap-3">
                  {notes.length > 0 && (
                    <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                        >
                          <p>{note.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(note.createdAt), {
                              addSuffix: true,
                              locale: dateHe,
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Label className="text-sm font-medium">{he.task.addNoteTitle}</Label>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={he.task.notePlaceholder}
                    className="min-h-28"
                    autoFocus
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || updateTask.isPending}
                    className="w-full"
                  >
                    {he.actions.save}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActionTile({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-4",
        "transition-colors hover:border-primary/40 hover:bg-accent/50"
      )}
    >
      <Icon className="size-8 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function SubtaskRow({ id, title, done }: { id: string; title: string; done: boolean }) {
  const updateTask = useUpdateTask();
  return (
    <div className="flex items-center gap-2 py-1">
      <TaskCheckbox
        checked={done}
        onCheckedChange={(checked) =>
          updateTask.mutate({ id, data: { status: checked ? "DONE" : "READY" } })
        }
      />
      <span className={cn("text-sm", done && "text-muted-foreground line-through")}>{title}</span>
    </div>
  );
}
