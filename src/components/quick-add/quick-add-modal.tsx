"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, Sparkles, ClipboardList } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DueDateSelect } from "@/components/ui/due-date-select";
import { FieldSelect } from "@/components/ui/field-select";
import { useUIStore } from "@/store/ui-store";
import { useCreateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { parseQuickAdd } from "@/lib/quick-add-parser";
import { formatDateTime, startOfToday } from "@/lib/date-utils";
import { EnumSelect } from "@/components/ui/enum-select";
import { PRIORITY_META, SELECTABLE_PRIORITIES } from "@/lib/task-meta";
import { he } from "@/lib/i18n/he";
import { QuickAddHelp } from "@/components/quick-add/quick-add-help";
import { AddImagePicker } from "@/components/ui/add-image-picker";
import { pendingImagePayload, revokePendingImages, type PendingImage } from "@/lib/image-utils";
import { TaskRecurrenceFields } from "@/components/task/task-recurrence-fields";
import type { RecurrencePattern } from "@/generated/prisma/enums";
import {
  isRecurrenceValid,
  recurrencePayload,
} from "@/lib/task-recurrence";

const priorityOptions = SELECTABLE_PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_META[value].label,
}));

type QuickAddTab = "quick" | "form";

export function QuickAddModal() {
  const open = useUIStore((s) => s.quickAddOpen);
  const initialText = useUIStore((s) => s.quickAddInitialText);
  const initialTab = useUIStore((s) => s.quickAddInitialTab);
  const close = useUIStore((s) => s.closeQuickAdd);
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);
  const createTask = useCreateTask();
  const { data: projects } = useProjects();

  const [tab, setTab] = useState<QuickAddTab>("quick");
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priorityOverride, setPriorityOverride] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formDueDate, setFormDueDate] = useState<Date | null>(null);
  const [formNoDeadline, setFormNoDeadline] = useState(false);
  const [formCreatedDate, setFormCreatedDate] = useState<Date | null>(null);
  const [formProjectId, setFormProjectId] = useState("");
  const [formPriority, setFormPriority] = useState<string | null>(null);
  const [formRecurring, setFormRecurring] = useState(false);
  const [formRecurrencePattern, setFormRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [formRecurrenceWeekday, setFormRecurrenceWeekday] = useState<number | null>(null);
  const [quickRecurring, setQuickRecurring] = useState(false);
  const [quickRecurrencePattern, setQuickRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [quickRecurrenceWeekday, setQuickRecurrenceWeekday] = useState<number | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  const clearPendingImages = () => {
    revokePendingImages(pendingImages);
    setPendingImages([]);
  };

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setText(initialText);
      setProjectId(null);
      setPriorityOverride(null);
      setFormTitle(initialText.trim() ? initialText : "");
      setFormContent("");
      setFormDueDate(null);
      setFormNoDeadline(false);
      setFormCreatedDate(null);
      setFormProjectId("");
      setFormPriority(null);
      setFormRecurring(false);
      setFormRecurrencePattern(null);
      setFormRecurrenceWeekday(null);
      setQuickRecurring(false);
      setQuickRecurrencePattern(null);
      setQuickRecurrenceWeekday(null);
      setPendingImages((prev) => {
        revokePendingImages(prev);
        return [];
      });
      setTimeout(() => {
        if (initialTab === "form") titleRef.current?.focus();
        else if (initialText.trim()) inputRef.current?.focus();
        else inputRef.current?.focus();
      }, 50);
    }
  }, [open, initialText, initialTab]);

  const parsed = useMemo(() => parseQuickAdd(text), [text]);

  const matchedProject = useMemo(() => {
    if (!parsed.projectHint || !projects) return null;
    return projects.find((p) => p.name.toLowerCase().includes(parsed.projectHint!.toLowerCase())) ?? null;
  }, [parsed.projectHint, projects]);

  const handleQuickSubmit = () => {
    if (!parsed.title.trim()) return;
    if (!isRecurrenceValid(quickRecurring, quickRecurrencePattern, quickRecurrenceWeekday)) {
      toast.error(he.recurrence.selectFrequency);
      return;
    }
    createTask.mutate(
      {
        title: parsed.title,
        dueDate: parsed.dueDate ?? undefined,
        priority: (priorityOverride ?? parsed.priority ?? undefined) as never,
        projectId: projectId ?? matchedProject?.id ?? undefined,
        status: "READY",
        images: pendingImagePayload(pendingImages),
        ...recurrencePayload(quickRecurring, quickRecurrencePattern, quickRecurrenceWeekday),
      },
      {
        onSuccess: () => {
          toast.success(he.task.addedToInbox);
          clearPendingImages();
        },
      }
    );
    close();
  };

  const handleFormSubmit = () => {
    const title =
      formTitle.trim() ||
      formContent.trim().split("\n")[0]?.trim() ||
      he.quickAdd.defaultTitle;

    if (!isRecurrenceValid(formRecurring, formRecurrencePattern, formRecurrenceWeekday)) {
      toast.error(he.recurrence.selectFrequency);
      return;
    }

    createTask.mutate(
      {
        title,
        description: formContent.trim() || undefined,
        dueDate: formNoDeadline ? undefined : formDueDate ?? undefined,
        createdAt: formNoDeadline ? (formCreatedDate ?? startOfToday()) : undefined,
        projectId: formProjectId || undefined,
        priority: (formPriority ?? undefined) as never,
        status: "READY",
        images: pendingImagePayload(pendingImages),
        ...recurrencePayload(formRecurring, formRecurrencePattern, formRecurrenceWeekday),
      },
      {
        onSuccess: () => {
          toast.success(he.task.addedToInbox);
          clearPendingImages();
        },
      }
    );
    close();
  };

  const projectOptions = useMemo(
    () => (projects ?? []).map((p) => ({ value: p.id, label: p.name })),
    [projects]
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="fixed inset-x-0 bottom-0 top-auto flex max-h-[94dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl border-t p-0 sm:inset-auto sm:top-1/2 sm:max-h-[90vh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:gap-4 sm:rounded-xl sm:border sm:p-4"
        showCloseButton={false}
      >
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as QuickAddTab)}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 pt-4 sm:gap-4 sm:p-0"
        >
          <div className="flex shrink-0 flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" /> {he.quickAdd.title}
              </DialogTitle>
            </DialogHeader>

            <TabsList className="grid h-11 w-full grid-cols-2">
              <TabsTrigger value="quick" className="gap-1.5 text-sm">
                <Sparkles className="size-3.5" />
                {he.quickAdd.tabQuick}
              </TabsTrigger>
              <TabsTrigger value="form" className="gap-1.5 text-sm">
                <ClipboardList className="size-3.5" />
                {he.quickAdd.tabForm}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="quick"
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{he.quickAdd.help.subtitle}</p>
              <QuickAddHelp />
            </div>
            <Textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickSubmit();
                }
              }}
              placeholder={he.quickAdd.placeholder}
              className="min-h-24 resize-none text-base sm:min-h-20 sm:text-sm"
            />

            <div className="flex min-h-6 flex-wrap items-center gap-1.5">
              {parsed.dueDate && (
                <Chip icon={<CalendarDays className="size-3" />}>
                  {formatDateTime(parsed.dueDate, parsed.hasTime)}
                </Chip>
              )}
              {parsed.hasTime && !parsed.dueDate && (
                <Chip icon={<Clock className="size-3" />}>{he.quickAdd.timeDetected}</Chip>
              )}
              {matchedProject && <Chip>{matchedProject.name}</Chip>}
            </div>

            <div className="flex flex-col gap-3 border-t pt-3">
              <FieldSelect
                value={projectId ?? matchedProject?.id ?? ""}
                onChange={(v) => setProjectId(v || null)}
                options={projectOptions}
                placeholder={he.task.noProject}
              />
              <button
                type="button"
                onClick={() => setNewProjectOpen(true)}
                className="text-start text-xs text-primary hover:underline"
              >
                + {he.category.addNew}
              </button>
              <EnumSelect
                value={(priorityOverride ?? parsed.priority) as never}
                onChange={(v) => setPriorityOverride(v)}
                options={priorityOptions}
                placeholder={he.task.priority}
                className="w-full"
              />
              <AddImagePicker images={pendingImages} onChange={setPendingImages} />
              <FormField label={he.quickAdd.formRecurring}>
                <TaskRecurrenceFields
                  enabled={quickRecurring}
                  onEnabledChange={setQuickRecurring}
                  pattern={quickRecurrencePattern}
                  onPatternChange={setQuickRecurrencePattern}
                  weekday={quickRecurrenceWeekday}
                  onWeekdayChange={setQuickRecurrenceWeekday}
                />
              </FormField>
              <Button
                size="lg"
                className="h-11 w-full"
                onClick={handleQuickSubmit}
                disabled={!parsed.title.trim()}
              >
                {he.actions.addTask}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{he.quickAdd.tip}</p>
          </TabsContent>

          <TabsContent value="form" className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain pb-2">
              <FormField label={he.quickAdd.formTitle}>
                <Input
                  ref={titleRef}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={he.quickAdd.formTitlePlaceholder}
                  className="h-11 text-base sm:h-10 sm:text-sm"
                />
              </FormField>

              <FormField label={he.quickAdd.formContent}>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder={he.quickAdd.formContentPlaceholder}
                  className="min-h-24 resize-none text-sm"
                />
              </FormField>

              <FormField
                label={formNoDeadline ? he.quickAdd.formDateNoDeadline : he.quickAdd.formDate}
              >
                <DueDateSelect
                  allowNoDeadline
                  value={formDueDate}
                  onChange={setFormDueDate}
                  noDeadline={formNoDeadline}
                  onNoDeadlineChange={setFormNoDeadline}
                  createdDate={formCreatedDate}
                  onCreatedDateChange={setFormCreatedDate}
                />
              </FormField>

              <FormField label={he.quickAdd.formCategory}>
                <FieldSelect
                  value={formProjectId}
                  onChange={setFormProjectId}
                  options={projectOptions}
                  placeholder={he.quickAdd.formCategoryPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setNewProjectOpen(true)}
                  className="text-start text-xs text-primary hover:underline"
                >
                  + {he.category.addNew}
                </button>
              </FormField>

              <FormField label={he.task.priority}>
                <EnumSelect
                  value={formPriority as never}
                  onChange={(v) => setFormPriority(v)}
                  options={priorityOptions}
                  placeholder={he.task.priority}
                  className="w-full"
                />
              </FormField>

              <FormField label={he.quickAdd.formRecurring}>
                <TaskRecurrenceFields
                  enabled={formRecurring}
                  onEnabledChange={setFormRecurring}
                  pattern={formRecurrencePattern}
                  onPatternChange={setFormRecurrencePattern}
                  weekday={formRecurrenceWeekday}
                  onWeekdayChange={setFormRecurrenceWeekday}
                />
              </FormField>
            </div>

            <div className="shrink-0 border-t pt-3 pb-[env(safe-area-inset-bottom,0px)]">
              <AddImagePicker images={pendingImages} onChange={setPendingImages} className="mb-3" />
              <Button
                size="lg"
                className="h-11 w-full sm:h-10"
                onClick={handleFormSubmit}
                disabled={createTask.isPending}
              >
                {he.quickAdd.formSubmit}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {icon}
      {children}
    </span>
  );
}
