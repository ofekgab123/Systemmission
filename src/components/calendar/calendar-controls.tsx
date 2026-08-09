"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import {
  formatCalendarPeriodLabel,
  type CalendarViewMode,
} from "@/lib/calendar-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import type { TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/generated/prisma/enums";

const VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: he.calendar.viewDay },
  { id: "week", label: he.calendar.viewWeek },
  { id: "month", label: he.calendar.viewMonth },
];

type CalendarStatusFilter = Extract<TaskStatus, "DONE" | "BLOCKED" | "WAITING">;

const STATUS_FILTERS: { id: CalendarStatusFilter; label: string }[] = [
  { id: "DONE", label: he.views.completed },
  { id: "BLOCKED", label: he.views.blocked },
  { id: "WAITING", label: he.views.waiting },
];

const NO_PROJECT_ID = "__none__";

interface ProjectGroup {
  id: string;
  name: string;
  color: string;
  tasks: TaskWithRelations[];
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
    .map((group) => ({
      ...group,
      tasks: [...group.tasks].sort(
        (a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight
      ),
    }))
    .sort((a, b) => {
      if (a.id === NO_PROJECT_ID) return 1;
      if (b.id === NO_PROJECT_ID) return -1;
      return a.name.localeCompare(b.name, "he");
    });
}

export function CalendarControls({
  viewMode,
  onViewModeChange,
  anchorDate,
  onJumpToDate,
  onPrev,
  onNext,
  onToday,
  statusFilters,
  onToggleStatusFilter,
  tasks,
  onTaskClick,
}: {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  anchorDate: Date;
  onJumpToDate: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  statusFilters: Set<CalendarStatusFilter>;
  onToggleStatusFilter: (status: CalendarStatusFilter) => void;
  tasks: TaskWithRelations[];
  onTaskClick: (taskId: string) => void;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const periodLabel = formatCalendarPeriodLabel(anchorDate, viewMode);
  const projectGroups = useMemo(() => groupTasksByProject(tasks), [tasks]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-1 p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onPrev}
          aria-label={he.calendar.prevPeriod}
        >
          <ChevronRight className="size-4" />
        </Button>

        <span className="min-w-[6.5rem] flex-1 truncate text-center text-sm font-medium capitalize">
          {periodLabel}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onNext}
          aria-label={he.calendar.nextPeriod}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" aria-hidden />

        {VIEW_MODES.map((mode) => (
          <Button
            key={mode.id}
            type="button"
            variant={viewMode === mode.id ? "secondary" : "ghost"}
            size="sm"
            className="h-8 shrink-0 px-2.5 text-xs"
            onClick={() => onViewModeChange(mode.id)}
          >
            {mode.label}
          </Button>
        ))}

        <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" aria-hidden />

        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.id}
            type="button"
            variant={statusFilters.has(filter.id) ? "secondary" : "outline"}
            size="sm"
            className="h-8 shrink-0 px-2.5 text-xs"
            onClick={() => onToggleStatusFilter(filter.id)}
          >
            {filter.label}
          </Button>
        ))}

        {projectGroups.length > 0 && (
          <Button
            type="button"
            variant={categoriesOpen ? "secondary" : "outline"}
            size="sm"
            className="h-8 shrink-0 px-2.5 text-xs"
            aria-expanded={categoriesOpen}
            onClick={() => setCategoriesOpen((v) => !v)}
          >
            {he.calendar.legendProjects}
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-expanded={dateOpen}
          aria-label={he.calendar.jumpToDate}
          onClick={() => setDateOpen((v) => !v)}
        >
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              dateOpen && "rotate-180"
            )}
          />
        </Button>
      </div>

      {dateOpen && (
        <div className="flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center">
          <DateField
            value={anchorDate}
            onChange={(date) => date && onJumpToDate(date)}
            placeholder={he.calendar.jumpToDate}
            className="sm:max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" className="h-10" onClick={onToday}>
            {he.calendar.today}
          </Button>
        </div>
      )}

      {categoriesOpen && projectGroups.length > 0 && (
        <div className="border-t">
          {projectGroups.map((group) => {
            const open = expandedCategories.has(group.id);
            return (
              <div key={group.id} className="border-b last:border-b-0">
                <Button
                  type="button"
                  variant="ghost"
                  aria-expanded={open}
                  onClick={() => toggleCategory(group.id)}
                  className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2.5 font-normal hover:bg-muted/40"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-start text-sm font-medium">
                    {group.name}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {he.calendar.taskCount(group.tasks.length)}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      open && "rotate-180"
                    )}
                  />
                </Button>
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
      )}
    </div>
  );
}
