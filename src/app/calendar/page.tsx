"use client";

import { useMemo, useState } from "react";
import { eachDayOfInterval, isSameDay, set, startOfToday } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { TimeGrid } from "@/components/calendar/time-grid";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { EventChip } from "@/components/calendar/event-chip";
import { EventFormDialog, type EventFormTarget } from "@/components/calendar/event-form-dialog";
import { EventPeekDialog } from "@/components/calendar/event-peek";
import { EventCategoriesManager } from "@/components/calendar/event-categories-manager";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useEvents, useUpdateEvent, type EventEditScope } from "@/hooks/use-events";
import { useUIStore } from "@/store/ui-store";
import { he } from "@/lib/i18n/he";
import {
  dayKey,
  getCalendarRange,
  getTaskCalendarDate,
  shiftCalendarAnchor,
  type CalendarViewMode,
} from "@/lib/calendar-utils";
import { occurrencesForDay } from "@/lib/event-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import type { EventOccurrence, TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/generated/prisma/enums";

type CalendarStatusFilter = Extract<TaskStatus, "DONE" | "BLOCKED" | "WAITING">;

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => startOfToday());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfToday());
  const [statusFilters, setStatusFilters] = useState<Set<CalendarStatusFilter>>(new Set());
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);

  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<EventFormTarget | null>(null);
  const [peekOccurrence, setPeekOccurrence] = useState<EventOccurrence | null>(null);
  const [categoriesManagerOpen, setCategoriesManagerOpen] = useState(false);

  const range = useMemo(() => getCalendarRange(anchorDate, viewMode), [anchorDate, viewMode]);

  const { data: tasks, isLoading: tasksLoading } = useTasks({
    view: "calendar",
    from: range.start.toISOString(),
    to: range.end.toISOString(),
    topLevel: true,
    limit: 500,
  });

  const { data: events, isLoading: eventsLoading } = useEvents({
    from: range.start.toISOString(),
    to: range.end.toISOString(),
  });

  const updateEvent = useUpdateEvent();
  const updateTask = useUpdateTask();

  const isLoading = tasksLoading || eventsLoading;
  const visibleEvents = useMemo(() => events ?? [], [events]);

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (t.status === "CANCELLED") return false;
      if (statusFilters.size === 0) return t.status !== "DONE";
      return statusFilters.has(t.status as CalendarStatusFilter);
    });
  }, [tasks, statusFilters]);

  const noDateTasks = useMemo(
    () => visibleTasks.filter((t) => !getTaskCalendarDate(t)),
    [visibleTasks]
  );

  const gridDays = useMemo(
    () =>
      viewMode === "day"
        ? [anchorDate]
        : eachDayOfInterval({ start: range.start, end: range.end }),
    [viewMode, anchorDate, range]
  );

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const key = dayKey(selectedDay);
    return visibleTasks
      .filter((t) => {
        const d = getTaskCalendarDate(t);
        return d && dayKey(d) === key;
      })
      .sort((a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight);
  }, [visibleTasks, selectedDay]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const { allDay, timed } = occurrencesForDay(visibleEvents, selectedDay);
    return [
      ...allDay,
      ...timed.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    ];
  }, [visibleEvents, selectedDay]);

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

  const openCreate = (defaults?: EventFormTarget["defaults"]) => {
    setFormTarget({ defaults });
    setFormOpen(true);
  };

  const handleCreateRange = (start: Date, end: Date, allDay?: boolean) => {
    openCreate({ start, end, allDay });
  };

  const handleCreateAtDay = (day: Date) => {
    openCreate({
      start: set(day, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }),
      end: set(day, { hours: 9, minutes: 30, seconds: 0, milliseconds: 0 }),
    });
  };

  const handleEditOccurrence = (occurrence: EventOccurrence, scope?: EventEditScope) => {
    setPeekOccurrence(null);
    setFormTarget({ occurrence, scope });
    setFormOpen(true);
  };

  const moveOccurrence = (occurrence: EventOccurrence, newStart: Date, newEnd: Date) => {
    updateEvent.mutate(
      {
        id: occurrence.id,
        data: { start: newStart.toISOString(), end: newEnd.toISOString() },
        scope: occurrence.isRecurring ? "occurrence" : undefined,
        occurrenceStart: occurrence.isRecurring ? occurrence.occurrenceStart : undefined,
      },
      {
        onSuccess: () => toast.success(he.events.eventUpdated),
        onError: () => toast.error(he.events.saveFailed),
      }
    );
  };

  const moveOccurrenceToDay = (occurrence: EventOccurrence, day: Date) => {
    const start = new Date(occurrence.start);
    const end = new Date(occurrence.end);
    const newStart = set(day, {
      hours: start.getHours(),
      minutes: start.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });
    const newEnd = new Date(newStart.getTime() + (end.getTime() - start.getTime()));
    moveOccurrence(occurrence, newStart, newEnd);
  };

  const moveTaskToDay = (task: TaskWithRelations, day: Date) => {
    const field = task.dueDate ? "dueDate" : "scheduledAt";
    const original = task.dueDate ?? task.scheduledAt;
    const originalDate = original ? new Date(original) : new Date();
    const newDate = set(day, {
      hours: originalDate.getHours(),
      minutes: originalDate.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });
    updateTask.mutate(
      { id: task.id, data: { [field]: newDate.toISOString() } as never },
      { onError: () => toast.error(he.events.saveFailed) }
    );
  };

  return (
    <div>
      <PageHeader
        title={he.calendar.title}
        description={he.calendar.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content flex flex-col gap-6">
        <CalendarControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          anchorDate={anchorDate}
          onJumpToDate={handleJumpToDate}
          onPrev={() => handleNavigate(-1)}
          onNext={() => handleNavigate(1)}
          onToday={handleToday}
          onNewEvent={() => openCreate()}
          onManageCategories={() => setCategoriesManagerOpen(true)}
          statusFilters={statusFilters}
          onToggleStatusFilter={toggleStatusFilter}
          tasks={visibleTasks}
          onTaskClick={openTaskPanel}
        />

        {isLoading ? (
          <TaskListSkeleton rows={8} />
        ) : viewMode === "month" ? (
          <MonthCalendar
            anchorDate={anchorDate}
            events={visibleEvents}
            tasks={visibleTasks}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onTaskClick={openTaskPanel}
            onEventClick={setPeekOccurrence}
            onCreateAt={handleCreateAtDay}
            onMoveOccurrenceToDay={moveOccurrenceToDay}
            onMoveTaskToDay={moveTaskToDay}
          />
        ) : (
          <TimeGrid
            days={gridDays}
            events={visibleEvents}
            tasks={visibleTasks}
            onEventClick={setPeekOccurrence}
            onTaskClick={openTaskPanel}
            onCreateRange={handleCreateRange}
            onMoveOccurrence={moveOccurrence}
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
            {selectedDayEvents.length > 0 || selectedDayTasks.length > 0 ? (
              <div className="flex flex-col gap-1">
                {selectedDayEvents.map((occ) => (
                  <EventChip
                    key={occ.occurrenceId}
                    occurrence={occ}
                    onClick={() => setPeekOccurrence(occ)}
                  />
                ))}
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
      </div>

      <EventFormDialog
        open={formOpen}
        target={formTarget}
        onClose={() => setFormOpen(false)}
        onManageCategories={() => setCategoriesManagerOpen(true)}
      />
      <EventPeekDialog
        occurrence={peekOccurrence}
        onClose={() => setPeekOccurrence(null)}
        onEdit={handleEditOccurrence}
      />
      <EventCategoriesManager
        open={categoriesManagerOpen}
        onClose={() => setCategoriesManagerOpen(false)}
      />
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
