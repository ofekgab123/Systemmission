"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { EnumSelect } from "@/components/ui/enum-select";
import { DateField } from "@/components/ui/date-field";
import { StatusBadge } from "@/components/task/status-badge";
import {
  TASK_STATUS_META,
  PRIORITY_META,
  SELECTABLE_PRIORITIES,
} from "@/lib/task-meta";
import { useTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useUIStore } from "@/store/ui-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { FieldSelect } from "@/components/ui/field-select";
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

export function TaskEditSheet() {
  const taskId = useUIStore((s) => s.taskEditId);
  const close = useUIStore((s) => s.closeTaskEdit);
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);
  const isMobile = useIsMobile();
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projects } = useProjects();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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

            <div className="flex flex-col gap-5 px-6 py-5">
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
