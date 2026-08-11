"use client";

import { useMemo, useState } from "react";
import { eachDayOfInterval, set, startOfDay, startOfToday } from "date-fns";
import { toast } from "sonner";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { TimeGrid } from "@/components/calendar/time-grid";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { WeekStrip } from "@/components/calendar/week-strip";
import { CalendarQuickActions } from "@/components/calendar/calendar-quick-actions";
import { CalendarExternalDragProvider } from "@/components/calendar/calendar-external-drag";
import { EventFormDialog, type EventFormTarget } from "@/components/calendar/event-form-dialog";
import { EventPeekDialog } from "@/components/calendar/event-peek";
import { EventCategoriesManager } from "@/components/calendar/event-categories-manager";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useEvents, useUpdateEvent, type EventEditScope } from "@/hooks/use-events";
import { useUIStore } from "@/store/ui-store";
import { he } from "@/lib/i18n/he";
import {
  dayKey,
  getCalendarRange,
  shiftCalendarAnchor,
  type CalendarViewMode,
} from "@/lib/calendar-utils";
import { CAL } from "@/lib/calendar-theme";
import { filterEventsByCategory, filterTasksByProject } from "@/lib/calendar-category-filter";
import { TaskListSkeleton } from "@/components/task/task-list";
import type { EventOccurrence, TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/generated/prisma/enums";

type CalendarStatusFilter = Extract<TaskStatus, "DONE" | "BLOCKED" | "WAITING">;

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => startOfToday());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => startOfToday());
  const [statusFilters, setStatusFilters] = useState<Set<CalendarStatusFilter>>(new Set());
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(new Set());
  const [projectFilters, setProjectFilters] = useState<Set<string>>(new Set());
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

  const { data: backlogTasksRaw, isLoading: backlogLoading } = useTasks({
    view: "calendar-backlog",
    topLevel: true,
    limit: 200,
  });

  const { data: events, isLoading: eventsLoading } = useEvents({
    from: range.start.toISOString(),
    to: range.end.toISOString(),
  });

  const updateEvent = useUpdateEvent();
  const updateTask = useUpdateTask();

  const isLoading = tasksLoading || eventsLoading || backlogLoading;
  const allEvents = useMemo(() => events ?? [], [events]);
  const visibleEvents = useMemo(
    () => filterEventsByCategory(allEvents, categoryFilters),
    [allEvents, categoryFilters]
  );

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    return filterTasksByProject(
      tasks.filter((t) => {
        if (t.status === "CANCELLED") return false;
        if (statusFilters.size === 0) return t.status !== "DONE";
        return statusFilters.has(t.status as CalendarStatusFilter);
      }),
      projectFilters
    );
  }, [tasks, statusFilters, projectFilters]);

  const backlogTasks = useMemo(() => {
    if (!backlogTasksRaw) return [];
    return filterTasksByProject(
      backlogTasksRaw.filter((t) => {
        if (t.status === "CANCELLED") return false;
        if (statusFilters.size === 0) return t.status !== "DONE";
        return statusFilters.has(t.status as CalendarStatusFilter);
      }),
      projectFilters
    );
  }, [backlogTasksRaw, statusFilters, projectFilters]);

  const calendarTasks = useMemo(() => {
    const map = new Map<string, TaskWithRelations>();
    for (const task of visibleTasks) map.set(task.id, task);
    for (const task of backlogTasks) map.set(task.id, task);
    return [...map.values()];
  }, [visibleTasks, backlogTasks]);

  const tasksForCategoryCounts = useMemo(() => {
    const map = new Map<string, TaskWithRelations>();
    const baseFilter = (t: TaskWithRelations) => {
      if (t.status === "CANCELLED") return false;
      if (statusFilters.size === 0) return t.status !== "DONE";
      return statusFilters.has(t.status as CalendarStatusFilter);
    };
    for (const task of tasks ?? []) {
      if (baseFilter(task)) map.set(task.id, task);
    }
    for (const task of backlogTasksRaw ?? []) {
      if (baseFilter(task)) map.set(task.id, task);
    }
    return [...map.values()];
  }, [tasks, backlogTasksRaw, statusFilters]);

  const gridDays = useMemo(
    () =>
      viewMode === "day"
        ? [anchorDate]
        : eachDayOfInterval({ start: range.start, end: range.end }),
    [viewMode, anchorDate, range]
  );

  const toggleStatusFilter = (status: CalendarStatusFilter) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleCategoryFilter = (categoryKey: string) => {
    setCategoryFilters((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) next.delete(categoryKey);
      else next.add(categoryKey);
      return next;
    });
  };

  const toggleProjectFilter = (projectKey: string) => {
    setProjectFilters((prev) => {
      const next = new Set(prev);
      if (next.has(projectKey)) next.delete(projectKey);
      else next.add(projectKey);
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

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    if (mode === "day") {
      setAnchorDate(selectedDay ?? anchorDate);
    }
    if (mode === "month" && !selectedDay) {
      setSelectedDay(anchorDate);
    }
  };

  const handleStripSelectDay = (day: Date) => {
    setAnchorDate(day);
    setSelectedDay(day);
  };

  const openCreate = (defaults?: EventFormTarget["defaults"]) => {
    setFormTarget(defaults ? { defaults } : {});
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
    setFormTarget(scope ? { occurrence, scope } : { occurrence });
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

  const scheduleTaskAtTime = (task: TaskWithRelations, start: Date) => {
    const data: { scheduledAt: string; dueDate?: string } = {
      scheduledAt: start.toISOString(),
    };
    if (!task.dueDate || dayKey(new Date(task.dueDate)) !== dayKey(start)) {
      data.dueDate = startOfDay(start).toISOString();
    }
    updateTask.mutate(
      { id: task.id, data: data as never },
      {
        onSuccess: () => toast.success(he.calendar.scheduleTask),
        onError: () => toast.error(he.events.saveFailed),
      }
    );
  };

  const unscheduleTask = (task: TaskWithRelations, day: Date) => {
    const dayStart = startOfDay(day);
    const data: { scheduledAt: string | null; dueDate?: string } = { scheduledAt: null };

    if (task.dueDate) {
      if (dayKey(new Date(task.dueDate)) !== dayKey(day)) {
        data.dueDate = dayStart.toISOString();
      }
    } else {
      data.scheduledAt = dayStart.toISOString();
    }

    updateTask.mutate(
      { id: task.id, data: data as never },
      {
        onSuccess: () => toast.success(he.calendar.movedToAllDay),
        onError: () => toast.error(he.events.saveFailed),
      }
    );
  };

  const moveTaskToDay = (task: TaskWithRelations, day: Date) => {
    if (!task.dueDate && !task.scheduledAt) {
      updateTask.mutate(
        { id: task.id, data: { dueDate: startOfDay(day).toISOString() } as never },
        {
          onSuccess: () => toast.success(he.calendar.movedToDay),
          onError: () => toast.error(he.events.saveFailed),
        }
      );
      return;
    }

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
      {
        onSuccess: () => toast.success(he.calendar.movedToDay),
        onError: () => toast.error(he.events.saveFailed),
      }
    );
  };

  const assignUnscheduledTaskToDay = (taskId: string, day: Date) => {
    const task =
      backlogTasks.find((t) => t.id === taskId) ??
      calendarTasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate(
      { id: task.id, data: { dueDate: startOfDay(day).toISOString() } as never },
      {
        onSuccess: () => toast.success(he.calendar.movedToDay),
        onError: () => toast.error(he.events.saveFailed),
      }
    );
  };

  return (
    <CalendarExternalDragProvider>
    <div
      className="fixed inset-x-0 top-14 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-0 flex flex-col overflow-hidden md:relative md:inset-auto md:min-h-[calc(100dvh-4rem)]"
      style={{ backgroundColor: CAL.bg }}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-2 md:px-4 md:py-4">
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[20px] border shadow-[0_8px_32px_rgba(17,24,39,.08)] md:rounded-[24px]"
          style={{ borderColor: CAL.border, backgroundColor: CAL.surface }}
        >
          <CalendarControls
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            anchorDate={anchorDate}
            onJumpToDate={handleJumpToDate}
            onPrev={() => handleNavigate(-1)}
            onNext={() => handleNavigate(1)}
            onToday={handleToday}
            onNewEvent={() => openCreate()}
            backlogTasks={backlogTasks}
            onTaskClick={openTaskPanel}
            statusFilters={statusFilters}
            onToggleStatusFilter={toggleStatusFilter}
            tasks={tasksForCategoryCounts}
            projectFilters={projectFilters}
            onToggleProjectFilter={toggleProjectFilter}
            events={allEvents}
            categoryFilters={categoryFilters}
            onToggleCategoryFilter={toggleCategoryFilter}
          />

          {viewMode === "day" && (
            <WeekStrip
              anchorDate={anchorDate}
              selectedDay={anchorDate}
              onSelectDay={handleStripSelectDay}
              events={visibleEvents}
              tasks={visibleTasks}
            />
          )}

          {isLoading ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
              <TaskListSkeleton rows={8} />
            </div>
          ) : viewMode === "month" ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MonthCalendar
              anchorDate={anchorDate}
              events={visibleEvents}
              tasks={calendarTasks}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onTaskClick={openTaskPanel}
              onEventClick={setPeekOccurrence}
              onCreateAt={handleCreateAtDay}
              onMoveOccurrenceToDay={moveOccurrenceToDay}
              onMoveTaskToDay={moveTaskToDay}
              onAssignExternalTask={assignUnscheduledTaskToDay}
            />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <TimeGrid
              days={gridDays}
              events={visibleEvents}
              tasks={calendarTasks}
              onEventClick={setPeekOccurrence}
              onTaskClick={openTaskPanel}
              onCreateRange={handleCreateRange}
              onMoveOccurrence={moveOccurrence}
              onScheduleTask={scheduleTaskAtTime}
              onUnscheduleTask={unscheduleTask}
              onMoveTaskToDay={moveTaskToDay}
              hideDayHeader={viewMode === "day"}
              focusDay={viewMode !== "day" ? anchorDate : null}
            />
            </div>
          )}
        </div>
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
    </CalendarExternalDragProvider>
  );
}
