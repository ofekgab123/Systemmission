"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, ListTree, StickyNote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he as dateHe } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EnumSelect } from "@/components/ui/enum-select";
import { DateField } from "@/components/ui/date-field";
import { DueDateSelect } from "@/components/ui/due-date-select";
import { StatusBadge } from "@/components/task/status-badge";
import { TaskCheckbox } from "@/components/task/task-checkbox";
import {
  TASK_STATUS_META,
  PRIORITY_META,
  SELECTABLE_PRIORITIES,
} from "@/lib/task-meta";
import { useTask, useUpdateTask, useDeleteTask, useCreateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useUIStore } from "@/store/ui-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { FieldSelect } from "@/components/ui/field-select";
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

const statusOptions = Object.entries(TASK_STATUS_META)
  .filter(([value]) => value !== "SOMEDAY")
  .map(([value, meta]) => ({
    value: value as keyof typeof TASK_STATUS_META,
    label: meta.label,
  }));
const priorityOptions = SELECTABLE_PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_META[value].label,
}));

type EditTab = "details" | "notes" | "subtasks";

export function TaskEditSheet() {
  const taskId = useUIStore((s) => s.taskEditId);
  const editTab = useUIStore((s) => s.taskEditTab);
  const openTaskEdit = useUIStore((s) => s.openTaskEdit);
  const close = useUIStore((s) => s.closeTaskEdit);
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);
  const isMobile = useIsMobile();
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projects } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tab, setTab] = useState<EditTab>("details");

  useEffect(() => {
    if (taskId) setTab(editTab);
  }, [taskId, editTab]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
    }
  }, [task?.id, task?.title, task?.description]);

  if (!taskId) return null;

  const patch = (data: Record<string, unknown>) => {
    updateTask.mutate({ id: taskId, data });
  };

  const handleDelete = () => {
    deleteTask.mutate(taskId);
    close();
    toast(he.task.deleted);
  };

  const handleTabChange = (value: string) => {
    const next = value as EditTab;
    setTab(next);
    openTaskEdit(taskId, next);
  };

  const notes = (task?.activities ?? []).filter((a) => a.type === "NOTE_ADDED");
  const subtasks = task?.subtasks ?? [];

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        className={cn(
          "w-full gap-0 overflow-y-auto p-0",
          isMobile ? "max-h-[94dvh] rounded-t-2xl border-t" : "sm:max-w-lg"
        )}
      >
        {isLoading || !task ? (
          <div className="p-6 text-sm text-muted-foreground">{he.actions.loading}</div>
        ) : (
          <>
            <SheetHeader className="gap-3 border-b px-6 pb-4">
              <div className="flex items-center justify-between">
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
              <SheetTitle className="sr-only">{he.task.editTask}</SheetTitle>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title.trim() && title !== task.title && patch({ title: title.trim() })}
                className="min-h-0 resize-none border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
                rows={1}
              />
            </SheetHeader>

            <Tabs value={tab} onValueChange={handleTabChange} className="flex flex-col gap-0">
              <div className="border-b px-6 py-3">
                <TabsList className="grid h-10 w-full grid-cols-3">
                  <TabsTrigger value="details" className="gap-1.5 text-xs sm:text-sm">
                    {he.task.tabDetails}
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm">
                    <StickyNote className="size-3.5" />
                    {he.task.notes}
                    {notes.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                        {notes.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="subtasks" className="gap-1.5 text-xs sm:text-sm">
                    <ListTree className="size-3.5" />
                    {he.task.subtasks}
                    {subtasks.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                        {subtasks.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="px-6 py-5">
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={he.task.status}>
                      <EnumSelect value={task.status} onChange={(v) => patch({ status: v })} options={statusOptions} />
                    </Field>
                    <Field label={he.task.priority}>
                      <EnumSelect
                        value={task.priority}
                        onChange={(v) => patch({ priority: v })}
                        options={priorityOptions}
                      />
                    </Field>
                    <Field label={he.task.project}>
                      <div className="flex flex-col gap-1">
                        <ProjectSelect
                          value={task.projectId}
                          onChange={(v) => patch({ projectId: v })}
                          projects={projects ?? []}
                        />
                        <button
                          type="button"
                          onClick={() => setNewProjectOpen(true)}
                          className="text-start text-xs text-primary hover:underline"
                        >
                          + {he.category.addNew}
                        </button>
                      </div>
                    </Field>
                    <Field label={he.task.dueDate}>
                      <DateField value={task.dueDate} onChange={(d) => patch({ dueDate: d })} />
                    </Field>
                  </div>

                  {task.status === "WAITING" && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-status-yellow/20 bg-status-yellow/5 p-3">
                      <Field label={he.task.waitingFor}>
                        <Input
                          defaultValue={task.waitingFor ?? ""}
                          placeholder={he.task.waitingForWho}
                          className="h-8 text-xs"
                          onBlur={(e) => patch({ waitingFor: e.target.value })}
                        />
                      </Field>
                      <Field label={he.task.followUp}>
                        <DateField value={task.followUpDate} onChange={(d) => patch({ followUpDate: d })} />
                      </Field>
                    </div>
                  )}

                  {task.status === "BLOCKED" && (
                    <div className="rounded-lg border border-status-red/20 bg-status-red/5 p-3">
                      <Field label={he.task.blockedReason}>
                        <Input
                          defaultValue={task.blockedReason ?? ""}
                          placeholder={he.task.blockedReasonPlaceholder}
                          className="h-8 text-xs"
                          onBlur={(e) => patch({ blockedReason: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}

                  <Field label={he.task.description}>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => description !== (task.description ?? "") && patch({ description })}
                      placeholder={he.task.descriptionPlaceholder}
                      className="min-h-20 text-sm"
                    />
                  </Field>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="px-6 py-5">
                <NotesTab taskId={taskId} notes={notes} />
              </TabsContent>

              <TabsContent value="subtasks" className="px-6 py-5">
                <SubtasksTab taskId={taskId} projectId={task.projectId} subtasks={subtasks} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function NotesTab({
  taskId,
  notes,
}: {
  taskId: string;
  notes: { id: string; message: string; createdAt: string }[];
}) {
  const updateTask = useUpdateTask();
  const [noteText, setNoteText] = useState("");

  const handleAddNote = () => {
    if (!noteText.trim()) return;

    updateTask.mutate(
      { id: taskId, data: { note: noteText.trim() } },
      {
        onSuccess: () => {
          toast.success(he.task.noteAdded);
          setNoteText("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {notes.length > 0 ? (
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
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
      ) : (
        <p className="text-sm text-muted-foreground">{he.task.noNotes}</p>
      )}

      <div className="flex flex-col gap-2 border-t pt-4">
        <Label className="text-sm font-medium">{he.task.addNoteTitle}</Label>
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={he.task.notePlaceholder}
          className="min-h-24 text-sm"
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
  );
}

function SubtasksTab({
  taskId,
  projectId,
  subtasks,
}: {
  taskId: string;
  projectId: string | null;
  subtasks: { id: string; title: string; status: string }[];
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskDueDate, setSubtaskDueDate] = useState<Date | null>(null);
  const [subtaskNoDeadline, setSubtaskNoDeadline] = useState(false);
  const [subtaskCreatedDate, setSubtaskCreatedDate] = useState<Date | null>(startOfToday());

  const handleAddSubtask = () => {
    const title = subtaskTitle.trim() || he.quickAdd.defaultTitle;

    createTask.mutate(
      {
        title,
        parentTaskId: taskId,
        projectId: projectId ?? undefined,
        dueDate: subtaskNoDeadline ? undefined : subtaskDueDate ?? undefined,
        createdAt: subtaskNoDeadline ? (subtaskCreatedDate ?? startOfToday()) : undefined,
        status: "READY",
      },
      {
        onSuccess: () => {
          toast.success(he.task.subtaskAdded);
          setSubtaskTitle("");
          setSubtaskDueDate(null);
          setSubtaskNoDeadline(false);
          setSubtaskCreatedDate(startOfToday());
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {subtasks.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg border bg-card p-2">
          {subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2 py-1.5 px-1">
              <TaskCheckbox
                checked={sub.status === "DONE"}
                onCheckedChange={(checked) =>
                  updateTask.mutate({ id: sub.id, data: { status: checked ? "DONE" : "READY" } })
                }
              />
              <span
                className={cn(
                  "text-sm",
                  sub.status === "DONE" && "text-muted-foreground line-through"
                )}
              >
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{he.task.noSubtasks}</p>
      )}

      <div className="flex flex-col gap-3 border-t pt-4">
        <Label className="text-sm font-medium">{he.task.addSubtaskTitle}</Label>
        <Input
          value={subtaskTitle}
          onChange={(e) => setSubtaskTitle(e.target.value)}
          placeholder={he.task.addSubtask}
        />
        <Field label={he.task.dueDate}>
          <DueDateSelect
            value={subtaskDueDate}
            onChange={setSubtaskDueDate}
            noDeadline={subtaskNoDeadline}
            onNoDeadlineChange={setSubtaskNoDeadline}
            createdDate={subtaskCreatedDate}
            onCreatedDateChange={setSubtaskCreatedDate}
            allowNoDeadline
          />
        </Field>
        <Button onClick={handleAddSubtask} disabled={createTask.isPending} className="w-full">
          {he.actions.add}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ProjectSelect({
  value,
  onChange,
  projects,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  projects: { id: string; name: string }[];
}) {
  const selectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <FieldSelect
      value={value ?? ""}
      onChange={(v) => onChange(v || null)}
      options={selectOptions}
      placeholder={he.task.noProject}
      className="h-11 sm:h-8"
    />
  );
}
