"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import { useProjects } from "@/hooks/use-projects";
import { he } from "@/lib/i18n/he";
import {
  dayKey,
  getTaskCalendarDate,
  type CalendarColorMode,
} from "@/lib/calendar-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import type { TaskWithRelations } from "@/types";

const COLOR_MODES: { id: CalendarColorMode; label: string }[] = [
  { id: "combined", label: he.calendar.combined },
  { id: "project", label: he.calendar.byProject },
  { id: "urgency", label: he.calendar.byUrgency },
  { id: "priority", label: he.calendar.byPriority },
];

export default function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date());
  const [colorMode, setColorMode] = useState<CalendarColorMode>("combined");
  const [showDone, setShowDone] = useState(false);
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });

  const { data: tasks, isLoading } = useTasks({
    view: "calendar",
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
    topLevel: true,
    limit: 500,
  });

  const { data: projects } = useProjects();

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    return showDone ? tasks : tasks.filter((t) => t.status !== "DONE");
  }, [tasks, showDone]);

  const noDateTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => !getTaskCalendarDate(t) && t.status !== "CANCELLED");
  }, [tasks]);

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

  return (
    <div>
      <PageHeader
        title={he.calendar.title}
        description={he.calendar.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            <span className="me-2 self-center text-xs text-muted-foreground">
              {he.calendar.colorBy}
            </span>
            {COLOR_MODES.map((mode) => (
              <Button
                key={mode.id}
                variant={colorMode === mode.id ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setColorMode(mode.id)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
          <Button
            variant={showDone ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowDone((v) => !v)}
          >
            {he.calendar.showDone}
          </Button>
        </div>

        {colorMode === "combined" && (
          <p className="text-xs text-muted-foreground">{he.calendar.combinedHint}</p>
        )}

        <CalendarLegend tasks={visibleTasks} colorMode={colorMode} />

        {isLoading ? (
          <TaskListSkeleton rows={8} />
        ) : (
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            tasks={visibleTasks}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            colorMode={colorMode}
            onTaskClick={openTaskPanel}
            showDone={showDone}
          />
        )}

        {selectedDay && (
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
                    colorMode={colorMode}
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
