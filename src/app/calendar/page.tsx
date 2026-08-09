"use client";

import { useMemo, useState } from "react";
import { isSameDay, startOfToday } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { DayCalendar } from "@/components/calendar/day-calendar";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import { useProjects } from "@/hooks/use-projects";
import { he } from "@/lib/i18n/he";
import {
  dayKey,
  getCalendarRange,
  getTaskCalendarDate,
  shiftCalendarAnchor,
  type CalendarViewMode,
} from "@/lib/calendar-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import type { TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/generated/prisma/enums";

type CalendarStatusFilter = Extract<TaskStatus, "DONE" | "BLOCKED" | "WAITING">;

const STATUS_FILTERS: { id: CalendarStatusFilter; label: string }[] = [
  { id: "DONE", label: he.views.completed },
  { id: "BLOCKED", label: he.views.blocked },
  { id: "WAITING", label: he.views.waiting },
];

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(() => startOfToday());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfToday());
  const [statusFilters, setStatusFilters] = useState<Set<CalendarStatusFilter>>(new Set());
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);

  const range = useMemo(() => getCalendarRange(anchorDate, viewMode), [anchorDate, viewMode]);

  const { data: tasks, isLoading } = useTasks({
    view: "calendar",
    from: range.start.toISOString(),
    to: range.end.toISOString(),
    topLevel: true,
    limit: 500,
  });

  const { data: projects } = useProjects();

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (t.status === "CANCELLED") return false;
      if (statusFilters.size === 0) return t.status !== "DONE";
      return statusFilters.has(t.status as CalendarStatusFilter);
    });
  }, [tasks, statusFilters]);

  const noDateTasks = useMemo(() => {
    if (!tasks) return [];
    return visibleTasks.filter((t) => !getTaskCalendarDate(t));
  }, [visibleTasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const key = dayKey(selectedDay);
    return visibleTasks
      .filter((t) => {
        const d = getTaskCalendarDate(t);
        return d && dayKey(d) === key;
      })
      .sort(
        (a, b) =>
          PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight
      );
  }, [visibleTasks, selectedDay]);

  const selectedDayLabelHe = selectedDay
    ? new Intl.DateTimeFormat("he-IL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(selectedDay)
    : "";

  const toggleStatusFilter = (status: CalendarStatusFilter) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const handleJumpToDate = (date: Date) => {
    setAnchorDate(date);
    setSelectedDay(date);
  };

  const handleToday = () => {
    const today = startOfToday();
    setAnchorDate(today);
    setSelectedDay(today);
  };

  const handleNavigate = (direction: -1 | 1) => {
    const next = shiftCalendarAnchor(anchorDate, viewMode, direction);
    setAnchorDate(next);
    if (viewMode === "day") {
      setSelectedDay(next);
    }
  };

  return (
    <div>
      <PageHeader
        title={he.calendar.title}
        description={he.calendar.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content flex flex-col gap-6">
        <CalendarToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          anchorDate={anchorDate}
          onJumpToDate={handleJumpToDate}
          onPrev={() => handleNavigate(-1)}
          onNext={() => handleNavigate(1)}
          onToday={handleToday}
        />

        <div className="flex flex-wrap items-center gap-1">
          <span className="me-2 text-xs text-muted-foreground">{he.calendar.filterBy}</span>
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.id}
              variant={statusFilters.has(filter.id) ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => toggleStatusFilter(filter.id)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <CalendarLegend tasks={visibleTasks} onTaskClick={openTaskPanel} />

        {isLoading ? (
          <TaskListSkeleton rows={8} />
        ) : viewMode === "day" ? (
          <DayCalendar day={anchorDate} tasks={visibleTasks} onTaskClick={openTaskPanel} />
        ) : viewMode === "week" ? (
          <WeekCalendar
            anchorDate={anchorDate}
            tasks={visibleTasks}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onTaskClick={openTaskPanel}
          />
        ) : (
          <MonthCalendar
            anchorDate={anchorDate}
            tasks={visibleTasks}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onTaskClick={openTaskPanel}
          />
        )}

        {viewMode === "month" && selectedDay && (
          <section className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 font-heading text-sm font-medium capitalize">
              {selectedDayLabelHe}
              {isSameDay(selectedDay, new Date()) && (
                <span className="ms-2 text-xs font-normal text-primary">
                  ({he.calendar.today})
                </span>
              )}
            </h3>
            {selectedDayTasks.length > 0 ? (
              <div className="flex flex-col gap-1">
                {selectedDayTasks.map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    task={task}
                    onClick={() => openTaskPanel(task.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={he.calendar.noTasksThisDay}
                description={he.calendar.noTasksThisDayDesc}
                action={<AddTaskButton variant="outline" className="gap-2" tab="form" />}
              />
            )}
          </section>
        )}

        {noDateTasks.length > 0 && (
          <section className="rounded-xl border border-dashed bg-muted/20 p-4">
            <h3 className="mb-3 font-heading text-sm font-medium">
              {he.calendar.noDate} ({noDateTasks.length})
            </h3>
            <div className="flex flex-col gap-1">
              {noDateTasks.slice(0, 12).map((task) => (
                <NoDateTaskRow key={task.id} task={task} onOpen={openTaskPanel} />
              ))}
              {noDateTasks.length > 12 && (
                <p className="text-xs text-muted-foreground">
                  {he.calendar.andMore(noDateTasks.length - 12)}
                </p>
              )}
            </div>
          </section>
        )}

        {projects && projects.length === 0 && !isLoading && (
          <p className="text-center text-xs text-muted-foreground">
            {he.calendar.noProjectsHint}
          </p>
        )}
      </div>
    </div>
  );
}

function NoDateTaskRow({
  task,
  onOpen,
}: {
  task: TaskWithRelations;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition-colors hover:bg-muted/50"
    >
      {task.project && (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: task.project.color }}
        />
      )}
      <span className={cn(task.status === "DONE" && "line-through opacity-50")}>
        {task.title}
      </span>
      {task.project && (
        <span className="ms-auto truncate text-xs text-muted-foreground">
          {task.project.name}
        </span>
      )}
    </button>
  );
}
