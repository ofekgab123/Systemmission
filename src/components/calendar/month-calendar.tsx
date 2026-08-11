"use client";

import { useMemo, useState, useEffect } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  isToday,
} from "date-fns";
import { he as dateHe } from "date-fns/locale";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { EventOccurrence, TaskWithRelations } from "@/types";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { EventChip } from "@/components/calendar/event-chip";
import { CalendarWeekdayHeader } from "@/components/calendar/calendar-toolbar";
import { dayKey, groupTasksByDay, CALENDAR_TASK_DRAG_MIME } from "@/lib/calendar-utils";
import { occurrencesForDay, eventColor, formatEventTimeRange } from "@/lib/event-utils";
import { CAL } from "@/lib/calendar-theme";
import { he } from "@/lib/i18n/he";
import { useCalendarExternalDragOptional } from "@/components/calendar/calendar-external-drag";
import { EmptyState } from "@/components/task/task-list";
import { AddTaskButton } from "@/components/quick-add/add-task-button";

const MAX_CHIPS = 2;

interface MonthCalendarProps {
  anchorDate: Date;
  events: EventOccurrence[];
  tasks: TaskWithRelations[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
  onTaskClick: (taskId: string) => void;
  onEventClick: (occurrence: EventOccurrence) => void;
  onCreateAt: (day: Date) => void;
  onMoveOccurrenceToDay: (occurrence: EventOccurrence, day: Date) => void;
  onMoveTaskToDay: (task: TaskWithRelations, day: Date) => void;
  onAssignExternalTask?: (taskId: string, day: Date) => void;
}

type DragPayload =
  | { type: "event"; occurrence: EventOccurrence }
  | { type: "task"; task: TaskWithRelations };

export function MonthCalendar({
  anchorDate,
  events,
  tasks,
  selectedDay,
  onSelectDay,
  onTaskClick,
  onEventClick,
  onCreateAt,
  onMoveOccurrenceToDay,
  onMoveTaskToDay,
  onAssignExternalTask,
}: MonthCalendarProps) {
  const month = startOfMonth(anchorDate);
  const [dragging, setDragging] = useState<DragPayload | null>(null);
  const externalDrag = useCalendarExternalDragOptional();

  useEffect(() => {
    if (!externalDrag) return;

    const handler = (task: TaskWithRelations, clientX: number, clientY: number) => {
      const el = document
        .elementFromPoint(clientX, clientY)
        ?.closest<HTMLElement>("[data-calendar-day]");
      if (!el) return false;
      const dayIso = el.dataset.calendarDay;
      if (!dayIso) return false;
      const day = new Date(dayIso);
      if (!task.dueDate && !task.scheduledAt) {
        onAssignExternalTask?.(task.id, day);
      } else {
        onMoveTaskToDay(task, day);
      }
      return true;
    };

    externalDrag.registerDropHandler("month-calendar", handler);
    return () => externalDrag.unregisterDropHandler("month-calendar");
  }, [externalDrag, onAssignExternalTask, onMoveTaskToDay]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const days = useMemo(() => {
    const start = startOfWeek(month, { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => groupTasksByDay(tasks, true), [tasks]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventOccurrence[]>();
    for (const day of days) {
      const { allDay, timed } = occurrencesForDay(events, day);
      const sorted = [
        ...allDay,
        ...timed.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      ];
      if (sorted.length > 0) map.set(dayKey(day), sorted);
    }
    return map;
  }, [days, events]);

  const agendaDay = selectedDay ?? anchorDate;
  const agendaEvents = useMemo(() => {
    const { allDay, timed } = occurrencesForDay(events, agendaDay);
    return [
      ...allDay,
      ...timed.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    ];
  }, [events, agendaDay]);

  const agendaTasks = useMemo(() => {
    const key = dayKey(agendaDay);
    return tasksByDay.get(key) ?? [];
  }, [tasksByDay, agendaDay]);

  const agendaTitle = useMemo(() => {
    const dateLabel = format(agendaDay, "d MMMM", { locale: dateHe });
    const count = agendaEvents.length + agendaTasks.length;
    return he.calendar.agendaTitle(dateLabel, count);
  }, [agendaDay, agendaEvents.length, agendaTasks.length]);

  const handleDragStart = (e: DragStartEvent) => {
    setDragging((e.active.data.current as DragPayload | undefined) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const payload = e.active.data.current as DragPayload | undefined;
    setDragging(null);
    if (!payload || !e.over) return;
    const day = new Date(e.over.id as string);

    if (payload.type === "event") {
      if (isSameDay(new Date(payload.occurrence.start), day)) return;
      onMoveOccurrenceToDay(payload.occurrence, day);
    } else {
      const current = payload.task.dueDate ?? payload.task.scheduledAt;
      if (current && isSameDay(new Date(current), day)) return;
      onMoveTaskToDay(payload.task, day);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <CalendarWeekdayHeader />
        <div
          className="grid shrink-0 grid-cols-7"
          style={{ gridAutoRows: "64px" }}
        >
          {days.map((day) => (
            <DayCell
              key={dayKey(day)}
              day={day}
              inMonth={isSameMonth(day, month)}
              selected={!!selectedDay && isSameDay(day, selectedDay)}
              dayEvents={eventsByDay.get(dayKey(day)) ?? []}
              dayTasks={tasksByDay.get(dayKey(day)) ?? []}
              onSelectDay={onSelectDay}
              onTaskClick={onTaskClick}
              onEventClick={onEventClick}
              onCreateAt={onCreateAt}
              onAssignExternalTask={onAssignExternalTask}
            />
          ))}
        </div>

        {/* Agenda panel */}
        <div
          className="flex min-h-0 flex-1 flex-col border-t-8"
          style={{ borderColor: CAL.bg, backgroundColor: CAL.bg }}
        >
          <div className="shrink-0 bg-white px-4 pb-1.5 pt-3">
            <h3 className="text-[13px] font-bold capitalize text-[#111827]">{agendaTitle}</h3>
          </div>
          <div className="cal-scroll min-h-0 flex-1 overflow-y-auto bg-white px-3 pb-4 pt-1">
            {agendaEvents.length > 0 || agendaTasks.length > 0 ? (
              <div className="flex flex-col gap-2">
                {agendaEvents.map((occ) => (
                  <AgendaRow
                    key={occ.occurrenceId}
                    color={eventColor(occ)}
                    title={occ.title || he.events.noTitle}
                    meta={formatEventTimeRange(occ)}
                    onClick={() => onEventClick(occ)}
                  />
                ))}
                {agendaTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border bg-white p-2.5"
                    style={{ borderColor: CAL.border }}
                  >
                    <CalendarTaskChip task={task} onClick={() => onTaskClick(task.id)} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={he.calendar.noTasksThisDay}
                description={he.calendar.noTasksThisDayDesc}
                action={<AddTaskButton variant="outline" className="gap-2" tab="form" />}
              />
            )}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging?.type === "event" ? (
          <EventChip occurrence={dragging.occurrence} onClick={() => {}} className="shadow-lg" />
        ) : dragging?.type === "task" ? (
          <CalendarTaskChip task={dragging.task} onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function AgendaRow({
  color,
  title,
  meta,
  onClick,
}: {
  color: string;
  title: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-xl border bg-white p-2.5 text-start transition-colors hover:bg-[#FAFBFD]"
      style={{ borderColor: CAL.border }}
    >
      <span
        className="mt-0.5 w-1 shrink-0 self-stretch rounded-sm"
        style={{ backgroundColor: color, minHeight: 34 }}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#111827]">{title}</span>
        <span className="mt-0.5 block text-xs text-[#8A90A0]">{meta}</span>
      </span>
    </button>
  );
}

function DayCell({
  day,
  inMonth,
  selected,
  dayEvents,
  dayTasks,
  onSelectDay,
  onTaskClick,
  onEventClick,
  onCreateAt,
  onAssignExternalTask,
}: {
  day: Date;
  inMonth: boolean;
  selected: boolean;
  dayEvents: EventOccurrence[];
  dayTasks: TaskWithRelations[];
  onSelectDay: (day: Date) => void;
  onTaskClick: (taskId: string) => void;
  onEventClick: (occurrence: EventOccurrence) => void;
  onCreateAt: (day: Date) => void;
  onAssignExternalTask?: (taskId: string, day: Date) => void;
}) {
  const today = isToday(day);
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  const [externalOver, setExternalOver] = useState(false);
  const totalItems = dayEvents.length + dayTasks.length;
  const chips = [
    ...dayEvents.slice(0, MAX_CHIPS),
    ...dayTasks.slice(0, Math.max(0, MAX_CHIPS - dayEvents.length)),
  ];
  const overflow = totalItems - chips.length;

  return (
    <div
      ref={setNodeRef}
      data-calendar-day={day.toISOString()}
      role="button"
      tabIndex={0}
      onClick={() => onSelectDay(day)}
      onDoubleClick={() => onCreateAt(day)}
      onDragEnter={(e) => {
        const types = e.dataTransfer.types;
        if (types.includes(CALENDAR_TASK_DRAG_MIME) || types.includes("text/plain")) {
          setExternalOver(true);
        }
      }}
      onDragLeave={() => setExternalOver(false)}
      onDragOver={(e) => {
        const types = e.dataTransfer.types;
        if (!types.includes(CALENDAR_TASK_DRAG_MIME) && !types.includes("text/plain")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setExternalOver(false);
        const taskId =
          e.dataTransfer.getData(CALENDAR_TASK_DRAG_MIME) ||
          e.dataTransfer.getData("text/plain");
        if (taskId && onAssignExternalTask) onAssignExternalTask(taskId, day);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectDay(day);
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-0.5 overflow-hidden px-0.5 pt-1.5 text-start transition-colors",
        !inMonth && "opacity-40",
        (isOver || externalOver) && "bg-[#E8F0FE]"
      )}
      style={{
        borderBottom: `1px solid ${CAL.borderLight}`,
        borderInlineStart: `1px solid ${CAL.borderLight}`,
        backgroundColor: selected ? CAL.monthSelectedBg : inMonth ? CAL.surface : CAL.allDayBg,
      }}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-lg text-[13px]",
          selected && "font-bold text-white",
          !selected && today && "font-bold text-[#2563EB]",
          !selected && !today && "font-medium text-[#374151]"
        )}
        style={{ backgroundColor: selected ? CAL.primary : undefined }}
      >
        {inMonth ? format(day, "d") : ""}
      </span>
      <div className="flex w-full flex-col gap-0.5 px-1 pb-1">
        {dayEvents.slice(0, MAX_CHIPS).map((occ) => (
          <DraggableItem
            key={occ.occurrenceId}
            id={`event:${occ.occurrenceId}`}
            payload={{ type: "event", occurrence: occ }}
          >
            <EventChip occurrence={occ} compact showTime={false} onClick={() => onEventClick(occ)} />
          </DraggableItem>
        ))}
        {dayTasks.slice(0, Math.max(0, MAX_CHIPS - dayEvents.length)).map((task) => (
          <DraggableItem key={task.id} id={`task:${task.id}`} payload={{ type: "task", task }}>
            <CalendarTaskChip task={task} onClick={() => onTaskClick(task.id)} />
          </DraggableItem>
        ))}
        {overflow > 0 && (
          <span className="px-0.5 text-[9px] font-medium text-[#9CA3AF]">+{overflow}</span>
        )}
      </div>
    </div>
  );
}

function DraggableItem({
  id,
  payload,
  children,
}: {
  id: string;
  payload: DragPayload;
  children: React.ReactNode;
}) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id,
    data: payload,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("min-w-0", isDragging && "opacity-40")}
    >
      {children}
    </div>
  );
}
