"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, Tag as TagIcon, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useCreateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { parseQuickAdd } from "@/lib/quick-add-parser";
import { formatDateTime } from "@/lib/date-utils";
import { EnumSelect } from "@/components/ui/enum-select";
import { PRIORITY_META } from "@/lib/task-meta";
import { he } from "@/lib/i18n/he";

const priorityOptions = Object.entries(PRIORITY_META).map(([value, meta]) => ({
  value: value as keyof typeof PRIORITY_META,
  label: meta.label,
}));

export function QuickAddModal() {
  const open = useUIStore((s) => s.quickAddOpen);
  const initialText = useUIStore((s) => s.quickAddInitialText);
  const close = useUIStore((s) => s.closeQuickAdd);
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);
  const createTask = useCreateTask();
  const { data: projects } = useProjects();
  const [text, setText] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priorityOverride, setPriorityOverride] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setProjectId(null);
      setPriorityOverride(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialText]);

  const parsed = useMemo(() => parseQuickAdd(text), [text]);

  const matchedProject = useMemo(() => {
    if (!parsed.projectHint || !projects) return null;
    return projects.find((p) => p.name.toLowerCase().includes(parsed.projectHint!.toLowerCase())) ?? null;
  }, [parsed.projectHint, projects]);

  const handleSubmit = () => {
    if (!parsed.title.trim()) return;
    createTask.mutate(
      {
        title: parsed.title,
        dueDate: parsed.dueDate ?? undefined,
        priority: (priorityOverride ?? parsed.priority ?? undefined) as never,
        projectId: projectId ?? matchedProject?.id ?? undefined,
        tagNames: parsed.tagNames,
        status: "INBOX",
      },
      {
        onSuccess: () => toast.success(he.task.addedToInbox),
      }
    );
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="fixed inset-x-0 bottom-0 top-auto flex max-h-[94dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 rounded-t-2xl border-t p-4 sm:inset-auto sm:top-1/2 sm:max-h-[90vh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" /> {he.quickAdd.title}
          </DialogTitle>
        </DialogHeader>

        <Textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={he.quickAdd.placeholder}
          className="min-h-20 resize-none text-base sm:min-h-16 sm:text-sm"
          dir="auto"
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
          {parsed.tagNames.map((t) => (
            <Chip key={t} icon={<TagIcon className="size-3" />}>
              #{t}
            </Chip>
          ))}
          {matchedProject && <Chip>{matchedProject.name}</Chip>}
        </div>

        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-1">
            <select
              value={projectId ?? matchedProject?.id ?? ""}
              onChange={(e) => setProjectId(e.target.value || null)}
              className="h-11 w-full rounded-md border bg-transparent px-2 text-sm outline-none sm:h-8 sm:text-xs"
            >
              <option value="">{he.task.noProject}</option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNewProjectOpen(true)}
              className="text-start text-xs text-primary hover:underline"
            >
              + {he.category.addNew}
            </button>
          </div>
          <EnumSelect
            value={(priorityOverride ?? parsed.priority) as never}
            onChange={(v) => setPriorityOverride(v)}
            options={priorityOptions}
            placeholder={he.task.priority}
            className="w-32"
          />
          <Button size="lg" className="h-11 w-full sm:h-8 sm:w-auto sm:size-default" onClick={handleSubmit} disabled={!parsed.title.trim()}>
            {he.actions.addTask}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">{he.quickAdd.tip}</p>
      </DialogContent>
    </Dialog>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
      {icon}
      {children}
    </span>
  );
}
