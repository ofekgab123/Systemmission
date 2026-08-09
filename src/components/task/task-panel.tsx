"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, X, ListTree } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EnumSelect } from "@/components/ui/enum-select";
import { DateField } from "@/components/ui/date-field";
import { StatusBadge } from "@/components/task/status-badge";
import { TaskCheckbox } from "@/components/task/task-checkbox";
import {
  TASK_STATUS_META,
  PRIORITY_META,
  IMPACT_META,
  URGENCY_META,
  ENERGY_META,
  CATEGORY_META,
  ESTIMATE_PRESETS,
} from "@/lib/task-meta";
import { useTask, useUpdateTask, useDeleteTask, useCreateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useAreas } from "@/hooks/use-areas";
import { useUIStore } from "@/store/ui-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { formatDistanceToNow } from "date-fns";
import { he as dateHe } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
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

const statusOptions = Object.entries(TASK_STATUS_META).map(([value, meta]) => ({
  value: value as keyof typeof TASK_STATUS_META,
  label: meta.label,
}));
const priorityOptions = Object.entries(PRIORITY_META).map(([value, meta]) => ({
  value: value as keyof typeof PRIORITY_META,
  label: meta.label,
}));
const impactOptions = Object.entries(IMPACT_META).map(([value, meta]) => ({
  value: value as keyof typeof IMPACT_META,
  label: meta.label,
}));
const urgencyOptions = Object.entries(URGENCY_META).map(([value, meta]) => ({
  value: value as keyof typeof URGENCY_META,
  label: meta.label,
}));
const energyOptions = Object.entries(ENERGY_META).map(([value, meta]) => ({
  value: value as keyof typeof ENERGY_META,
  label: `${meta.symbol} ${meta.label}`,
}));
const categoryOptions = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value: value as keyof typeof CATEGORY_META,
  label: meta.label,
}));

export function TaskPanel() {
  const taskId = useUIStore((s) => s.taskPanelId);
  const close = useUIStore((s) => s.closeTaskPanel);
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);
  const isMobile = useIsMobile();
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();
  const { data: projects } = useProjects();
  const { data: areas } = useAreas();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [newTag, setNewTag] = useState("");

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

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    createTask.mutate({
      title: newSubtask.trim(),
      parentTaskId: taskId,
      projectId: task?.projectId ?? undefined,
      areaId: task?.areaId ?? undefined,
    });
    setNewSubtask("");
  };

  const addTag = () => {
    if (!newTag.trim() || !task) return;
    const names = Array.from(new Set([...task.tags.map((t) => t.name), newTag.trim()]));
    patch({ tagNames: names });
    setNewTag("");
  };

  const removeTag = (name: string) => {
    if (!task) return;
    patch({ tagNames: task.tags.map((t) => t.name).filter((n) => n !== name) });
  };

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        className={cn(
          "w-full gap-0 overflow-y-auto p-0",
          isMobile
            ? "max-h-[94dvh] rounded-t-2xl border-t"
            : "sm:max-w-lg"
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
              <SheetTitle className="sr-only">{task.title}</SheetTitle>
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title.trim() && title !== task.title && patch({ title: title.trim() })}
                className="min-h-0 resize-none border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
                rows={1}
                dir="auto"
              />
            </SheetHeader>

            <div className="flex flex-col gap-5 px-6 py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={he.task.status}>
                  <EnumSelect value={task.status} onChange={(v) => patch({ status: v })} options={statusOptions} />
                </Field>
                <Field label={he.task.priority}>
                  <EnumSelect value={task.priority} onChange={(v) => patch({ priority: v })} options={priorityOptions} />
                </Field>
                <Field label={he.task.project}>
                  <div className="flex flex-col gap-1">
                    <Select
                      value={task.projectId}
                      onChange={(v) => patch({ projectId: v })}
                      options={[{ id: "", name: he.task.noProject }, ...(projects ?? [])]}
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
                <Field label={he.task.area}>
                  <Select
                    value={task.areaId}
                    onChange={(v) => patch({ areaId: v })}
                    options={[{ id: "", name: he.task.noArea }, ...(areas ?? [])]}
                  />
                </Field>
                <Field label={he.task.dueDate}>
                  <DateField value={task.dueDate} onChange={(d) => patch({ dueDate: d })} />
                </Field>
                <Field label={he.task.startDate}>
                  <DateField value={task.startDate} onChange={(d) => patch({ startDate: d })} />
                </Field>
                <Field label={he.task.impact}>
                  <EnumSelect
                    value={task.impact}
                    onChange={(v) => patch({ impact: v })}
                    options={impactOptions}
                    placeholder={he.task.setImpact}
                  />
                </Field>
                <Field label={he.task.urgency}>
                  <EnumSelect
                    value={task.urgency}
                    onChange={(v) => patch({ urgency: v })}
                    options={urgencyOptions}
                    placeholder={he.task.setUrgency}
                  />
                </Field>
                <Field label={he.task.energy}>
                  <EnumSelect
                    value={task.energy}
                    onChange={(v) => patch({ energy: v })}
                    options={energyOptions}
                    placeholder={he.task.setEnergy}
                  />
                </Field>
                <Field label={he.task.category}>
                  <EnumSelect
                    value={task.category}
                    onChange={(v) => patch({ category: v })}
                    options={categoryOptions}
                    placeholder={he.task.setCategory}
                  />
                </Field>
              </div>

              <Field label={he.task.estimatedTime}>
                <div className="flex flex-wrap gap-1.5">
                  {ESTIMATE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => patch({ estimatedMinutes: preset.minutes })}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-smooth hover:bg-accent",
                        task.estimatedMinutes === preset.minutes && "border-primary bg-primary/10 text-primary"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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

              <Field label={he.task.description}>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => description !== (task.description ?? "") && patch({ description })}
                  placeholder={he.task.descriptionPlaceholder}
                  className="min-h-20 text-sm"
                  dir="auto"
                />
              </Field>

              <div>
                <Label className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ListTree className="size-3.5" /> {he.task.subtasks}
                </Label>
                <div className="flex flex-col gap-1">
                  {task.subtasks.map((sub) => (
                    <SubtaskRow key={sub.id} id={sub.id} title={sub.title} done={sub.status === "DONE"} />
                  ))}
                </div>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder={he.task.addSubtask}
                    className="h-8 text-xs"
                    dir="auto"
                  />
                  <Button size="icon" variant="outline" className="size-8" onClick={addSubtask}>
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 text-xs text-muted-foreground">{he.task.tags}</Label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                      style={{ backgroundColor: `${tag.color}1a`, color: tag.color }}
                    >
                      #{tag.name}
                      <button onClick={() => removeTag(tag.name)}>
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    placeholder="+ תג"
                    className="h-6 w-20 border-none px-1 text-xs shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-2 text-xs text-muted-foreground">{he.task.activity}</Label>
                <div className="flex flex-col gap-2">
                  {(task.activities ?? []).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{activity.message}</span>
                      <span className="text-muted-foreground/60">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: dateHe })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
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

function Select({
  value,
  onChange,
  options,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  options: { id: string; name: string }[];
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  );
}

function SubtaskRow({ id, title, done }: { id: string; title: string; done: boolean }) {
  const updateTask = useUpdateTask();
  return (
    <div className="flex items-center gap-2 py-1">
      <TaskCheckbox
        checked={done}
        onCheckedChange={(checked) => updateTask.mutate({ id, data: { status: checked ? "DONE" : "READY" } })}
      />
      <span className={cn("text-sm", done && "text-muted-foreground line-through")}>{title}</span>
    </div>
  );
}
