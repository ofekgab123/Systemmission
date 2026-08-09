"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TaskWithRelations } from "@/types";
import { PRIORITY_META } from "@/lib/task-meta";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

const NO_PROJECT_ID = "__none__";

interface ProjectGroup {
  id: string;
  name: string;
  color: string;
  tasks: TaskWithRelations[];
}

function sortTasks(tasks: TaskWithRelations[]) {
  return [...tasks].sort(
    (a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight
  );
}

function groupTasksByProject(tasks: TaskWithRelations[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();

  for (const task of tasks) {
    const id = task.project?.id ?? NO_PROJECT_ID;
    const existing = map.get(id);
    if (existing) {
      existing.tasks.push(task);
      continue;
    }
    map.set(id, {
      id,
      name: task.project?.name ?? he.task.noProject,
      color: task.project?.color ?? "#94a3b8",
      tasks: [task],
    });
  }

  return [...map.values()]
    .map((group) => ({ ...group, tasks: sortTasks(group.tasks) }))
    .sort((a, b) => {
      if (a.id === NO_PROJECT_ID) return 1;
      if (b.id === NO_PROJECT_ID) return -1;
      return a.name.localeCompare(b.name, "he");
    });
}

function CategoryCollapseList({
  groups,
  onTaskClick,
}: {
  groups: ProjectGroup[];
  onTaskClick: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">
        {he.calendar.legendProjects}
      </div>
      {groups.map((group) => {
        const open = expanded.has(group.id);
        return (
          <div key={group.id} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start transition-colors hover:bg-muted/40"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{group.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {he.calendar.taskCount(group.tasks.length)}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </button>
            {open && (
              <div className="flex flex-col gap-1 border-t bg-muted/20 px-3 py-2">
                {group.tasks.map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    task={task}
                    showDate
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CalendarLegend({
  tasks,
  onTaskClick,
}: {
  tasks: TaskWithRelations[];
  onTaskClick: (taskId: string) => void;
}) {
  const projectGroups = useMemo(() => groupTasksByProject(tasks), [tasks]);

  if (projectGroups.length === 0) return null;

  return <CategoryCollapseList groups={projectGroups} onTaskClick={onTaskClick} />;
}
