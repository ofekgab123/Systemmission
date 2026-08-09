"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
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
  EDITABLE_TASK_STATUSES,
  normalizeTaskStatus,
} from "@/lib/task-meta";
import { useTask, useUpdateTask, useDeleteTask, useCreateTask, useUpdateActivity } from "@/hooks/use-tasks";
import { useTaskStatusChange } from "@/hooks/use-task-status-change";
import { useProjects } from "@/hooks/use-projects";
import { useUIStore } from "@/store/ui-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { FieldSelect } from "@/components/ui/field-select";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { startOfToday } from "@/lib/date-utils";
import { AddImagePicker } from "@/components/ui/add-image-picker";
import { TaskImageGallery } from "@/components/task/task-image-gallery";
import { pendingImagePayload, revokePendingImages, type PendingImage } from "@/lib/image-utils";
import type { TaskAttachment } from "@/types";
import { TaskRecurrenceFields } from "@/components/task/task-recurrence-fields";
import type { RecurrencePattern } from "@/generated/prisma/enums";
import { isRecurrenceValid, recurrencePayload } from "@/lib/task-recurrence";
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

const statusOptions = EDITABLE_TASK_STATUSES.map((value) => ({
  value,
  label: TASK_STATUS_META[value].label,
}));
const priorityOptions = SELECTABLE_PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_META[value].label,
}));

type EditTab = "edit" | "notes" | "subtasks";

export function TaskEditSheet() {
  const taskId = useUIStore((s) => s.taskEditId);
  const editTab = useUIStore((s) => s.taskEditTab);
  const showEditTab = useUIStore((s) => s.taskEditShowEditTab);
  const setTaskEditTab = useUIStore((s) => s.setTaskEditTab);
  const close = useUIStore((s) => s.closeTaskEdit);
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);
  const isMobile = useIsMobile();
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const changeStatus = useTaskStatusChange();
  const deleteTask = useDeleteTask();
  const { data: projects } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [recurrenceWeekday, setRecurrenceWeekday] = useState<number | null>(null);
  const [tab, setTab] = useState<EditTab>("edit");

  useEffect(() => {
    if (taskId) setTab(editTab);
  }, [taskId, editTab]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setRecurring(!!task.recurrencePattern);
      setRecurrencePattern(task.recurrencePattern ?? null);
      setRecurrenceWeekday(task.recurrenceWeekday ?? null);
    }
  }, [task?.id, task?.title, task?.description, task?.recurrencePattern, task?.recurrenceWeekday]);

  const applyRecurrence = (
    enabled: boolean,
    pattern: RecurrencePattern | null,
    weekday: number | null
  ) => {
    if (!isRecurrenceValid(enabled, pattern, weekday)) return;
    patch(recurrencePayload(enabled, pattern, weekday));
  };

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
    setTaskEditTab(next);
  };

  const notes = (task?.activities ?? []).filter((a) => a.type === "NOTE_ADDED");
  const subtasks = (task?.subtasks ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    attachments?: TaskAttachment[];
  }>;
  const attachments = (task?.attachments ?? []) as TaskAttachment[];

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
                <TabsList className={cn("grid h-10 w-full", showEditTab ? "grid-cols-3" : "grid-cols-2")}>
                  {showEditTab && (
                    <TabsTrigger value="edit" className="text-xs sm:text-sm">
                      {he.task.tabEdit}
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm">
                    {he.task.tabNotes}
                    {notes.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                        {notes.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="subtasks" className="gap-1.5 text-xs sm:text-sm">
                    {he.task.tabSubtasks}
                    {subtasks.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                        {subtasks.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {showEditTab && (
              <TabsContent value="edit" className="px-6 py-5">
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={he.task.status}>
                      <EnumSelect
                        value={normalizeTaskStatus(task.status)}
                        onChange={(v) => changeStatus(taskId, v, task.status)}
                        options={statusOptions}
                      />
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

                  <Field label={he.quickAdd.formRecurring}>
                    <TaskRecurrenceFields
                      enabled={recurring}
                      onEnabledChange={(enabled) => {
                        const nextPattern = enabled ? recurrencePattern ?? "WEEKLY" : null;
                        setRecurring(enabled);
                        if (enabled && !recurrencePattern) setRecurrencePattern("WEEKLY");
                        if (!enabled) {
                          setRecurrencePattern(null);
                          setRecurrenceWeekday(null);
                        }
                        applyRecurrence(enabled, nextPattern, enabled ? recurrenceWeekday : null);
                      }}
                      pattern={recurrencePattern}
                      onPatternChange={(pattern) => {
                        setRecurrencePattern(pattern);
                        applyRecurrence(recurring, pattern, recurrenceWeekday);
                      }}
                      weekday={recurrenceWeekday}
                      onWeekdayChange={(weekday) => {
                        setRecurrenceWeekday(weekday);
                        applyRecurrence(recurring, recurrencePattern, weekday);
                      }}
                    />
                  </Field>

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

                  {task.status === "SOMEDAY" && (
                    <div className="rounded-lg border border-status-gray/20 bg-status-gray/5 p-3">
                      <Field label={he.task.somedayReason}>
                        <Input
                          defaultValue={task.somedayReason ?? ""}
                          placeholder={he.task.somedayReasonPlaceholder}
                          className="h-8 text-xs"
                          onBlur={(e) => patch({ somedayReason: e.target.value || null })}
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

                  <TaskImagesField taskId={taskId} attachments={attachments.filter((item) => !item.activityId)} />
                </div>
              </TabsContent>
              )}

              <TabsContent value="notes" className="px-6 py-5">
                <NotesSection taskId={taskId} notes={notes} attachments={attachments} />
              </TabsContent>

              <TabsContent value="subtasks" className="px-6 py-5">
                <SubtasksSection taskId={taskId} projectId={task.projectId} subtasks={subtasks} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TaskImagesField({
  taskId,
  attachments,
}: {
  taskId: string;
  attachments: TaskAttachment[];
}) {
  const updateTask = useUpdateTask();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const uploadImages = () => {
    if (!pendingImages.length) return;
    updateTask.mutate(
      { id: taskId, data: { images: pendingImagePayload(pendingImages) } },
      {
        onSuccess: () => {
          revokePendingImages(pendingImages);
          setPendingImages([]);
          toast.success(he.image.added);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <TaskImageGallery attachments={attachments} />
      <AddImagePicker images={pendingImages} onChange={setPendingImages} />
      {pendingImages.length > 0 && (
        <Button size="sm" className="w-full" onClick={uploadImages} disabled={updateTask.isPending}>
          {he.actions.save}
        </Button>
      )}
    </div>
  );
}

function NotesSection({
  taskId,
  notes,
  attachments,
}: {
  taskId: string;
  notes: { id: string; message: string; createdAt: string }[];
  attachments: TaskAttachment[];
}) {
  const updateTask = useUpdateTask();
  const [noteText, setNoteText] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const clearImages = () => {
    revokePendingImages(pendingImages);
    setPendingImages([]);
  };

  const handleAddNote = () => {
    if (!noteText.trim() && pendingImages.length === 0) return;

    updateTask.mutate(
      {
        id: taskId,
        data: {
          ...(noteText.trim() ? { note: noteText.trim() } : {}),
          images: pendingImagePayload(pendingImages),
        },
      },
      {
        onSuccess: () => {
          toast.success(he.task.noteAdded);
          setNoteText("");
          clearImages();
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {notes.length > 0 ? (
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {notes.map((note) => (
            <EditableNoteItem
              key={note.id}
              note={note}
              attachments={attachments.filter((item) => item.activityId === note.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{he.task.noNotes}</p>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={he.task.notePlaceholder}
          className="min-h-20 text-sm"
        />
        <AddImagePicker images={pendingImages} onChange={setPendingImages} />
        <Button
          onClick={handleAddNote}
          disabled={(!noteText.trim() && pendingImages.length === 0) || updateTask.isPending}
          size="sm"
          className="w-full"
        >
          {he.task.addNote}
        </Button>
      </div>
    </div>
  );
}

function SubtasksSection({
  taskId,
  projectId,
  subtasks,
}: {
  taskId: string;
  projectId: string | null;
  subtasks: { id: string; title: string; status: string; attachments?: TaskAttachment[] }[];
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskDueDate, setSubtaskDueDate] = useState<Date | null>(null);
  const [subtaskNoDeadline, setSubtaskNoDeadline] = useState(false);
  const [subtaskCreatedDate, setSubtaskCreatedDate] = useState<Date | null>(startOfToday());
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const clearImages = () => {
    revokePendingImages(pendingImages);
    setPendingImages([]);
  };

  const handleAddSubtask = () => {
    if (!subtaskTitle.trim() && pendingImages.length === 0) return;
    const title = subtaskTitle.trim() || he.quickAdd.defaultTitle;

    createTask.mutate(
      {
        title,
        parentTaskId: taskId,
        projectId: projectId ?? undefined,
        dueDate: subtaskNoDeadline ? undefined : subtaskDueDate ?? undefined,
        createdAt: subtaskNoDeadline ? (subtaskCreatedDate ?? startOfToday()) : undefined,
        status: "READY",
        images: pendingImagePayload(pendingImages),
      },
      {
        onSuccess: () => {
          toast.success(he.task.subtaskAdded);
          setSubtaskTitle("");
          setSubtaskDueDate(null);
          setSubtaskNoDeadline(false);
          setSubtaskCreatedDate(startOfToday());
          clearImages();
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {subtasks.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/20 p-2">
          {subtasks.map((sub) => (
            <EditableSubtaskItem key={sub.id} subtask={sub} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{he.task.noSubtasks}</p>
      )}

      <div className="flex flex-col gap-2">
        <Input
          value={subtaskTitle}
          onChange={(e) => setSubtaskTitle(e.target.value)}
          placeholder={he.task.addSubtask}
          className="h-9 text-sm"
        />
        <DueDateSelect
          value={subtaskDueDate}
          onChange={setSubtaskDueDate}
          noDeadline={subtaskNoDeadline}
          onNoDeadlineChange={setSubtaskNoDeadline}
          createdDate={subtaskCreatedDate}
          onCreatedDateChange={setSubtaskCreatedDate}
          allowNoDeadline
        />
        <AddImagePicker images={pendingImages} onChange={setPendingImages} />
        <Button
          onClick={handleAddSubtask}
          disabled={(!subtaskTitle.trim() && pendingImages.length === 0) || createTask.isPending}
          size="sm"
          className="w-full"
        >
          {he.task.addSubtaskAction}
        </Button>
      </div>
    </div>
  );
}

function EditableNoteItem({
  note,
  attachments,
}: {
  note: { id: string; message: string; createdAt: string };
  attachments: TaskAttachment[];
}) {
  const updateActivity = useUpdateActivity();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.message);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const cancel = () => {
    setDraft(note.message);
    revokePendingImages(pendingImages);
    setPendingImages([]);
    setEditing(false);
  };

  const save = () => {
    if (!draft.trim() && pendingImages.length === 0 && attachments.length === 0) return;

    updateActivity.mutate(
      {
        id: note.id,
        data: {
          message: draft.trim() || note.message,
          images: pendingImagePayload(pendingImages),
        },
      },
      {
        onSuccess: () => {
          toast.success(he.task.noteUpdated);
          revokePendingImages(pendingImages);
          setPendingImages([]);
          setEditing(false);
        },
      }
    );
  };

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-20 text-sm"
            autoFocus
          />
          <TaskImageGallery attachments={attachments} />
          <AddImagePicker images={pendingImages} onChange={setPendingImages} />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={save} disabled={updateActivity.isPending}>
              {he.actions.save}
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={cancel}>
              {he.actions.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            {note.message ? (
              <p className="min-w-0 flex-1 whitespace-pre-wrap">{note.message}</p>
            ) : (
              <p className="min-w-0 flex-1 text-muted-foreground italic">{he.task.noNotes}</p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              aria-label={he.actions.edit}
              onClick={() => {
                setDraft(note.message);
                setEditing(true);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
          <TaskImageGallery attachments={attachments} className={note.message ? "mt-2" : undefined} />
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(note.createdAt), {
              addSuffix: true,
              locale: dateHe,
            })}
          </p>
        </>
      )}
    </div>
  );
}

function EditableSubtaskItem({
  subtask,
}: {
  subtask: { id: string; title: string; status: string; attachments?: TaskAttachment[] };
}) {
  const updateTask = useUpdateTask();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.title);

  const save = () => {
    const title = draft.trim();
    if (!title) return;

    updateTask.mutate(
      { id: subtask.id, data: { title } },
      {
        onSuccess: () => {
          toast.success(he.task.subtaskUpdated);
          setEditing(false);
        },
      }
    );
  };

  const cancel = () => {
    setDraft(subtask.title);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1.5 py-1.5 px-1">
      {editing ? (
        <div className="flex flex-col gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-9 text-sm"
            autoFocus
          />
          <TaskImageGallery attachments={subtask.attachments ?? []} />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={save} disabled={!draft.trim() || updateTask.isPending}>
              {he.actions.save}
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={cancel}>
              {he.actions.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <TaskCheckbox
              checked={subtask.status === "DONE"}
              onCheckedChange={(checked) =>
                updateTask.mutate({ id: subtask.id, data: { status: checked ? "DONE" : "READY" } })
              }
            />
            <span
              className={cn(
                "min-w-0 flex-1 text-sm",
                subtask.status === "DONE" && "text-muted-foreground line-through"
              )}
            >
              {subtask.title}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground"
              aria-label={he.actions.edit}
              onClick={() => {
                setDraft(subtask.title);
                setEditing(true);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
          <TaskImageGallery attachments={subtask.attachments ?? []} className="ms-7" />
        </>
      )}
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
