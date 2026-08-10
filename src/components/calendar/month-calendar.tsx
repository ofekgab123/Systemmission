"use client";

import { useMemo, useState } from "react";
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
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventOccurrence, TaskWithRelations } from "@/types";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { EventChip } from "@/components/calendar/event-chip";
import { CalendarWeekdayHeader } from "@/components/calendar/calendar-toolbar";
import { dayKey, groupTasksByDay } from "@/lib/calendar-utils";
import { occurrencesForDay } from "@/lib/event-utils";
import { he } from "@/lib/i18n/he";

const MAX_ITEMS_MOBILE = 2;
const MAX_ITEMS_DESKTOP = 4;

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
}: MonthCalendarProps) {
  const month = startOfMonth(anchorDate);
  const [dragging, setDragging] = useState<DragPayload | null>(null);

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
      <div className="overflow-hidden rounded-xl border bg-border">
        <CalendarWeekdayHeader />
        <div className="grid grid-cols-7 gap-px">
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
            />
          ))}
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
}) {
  const today = isToday(day);
  const { setNodeRef, isOver } = useDroppable({ id: day.toISOString() });
  const totalItems = dayEvents.length + dayTasks.length;

  const renderItems = (max: number) => {
    const eventSlice = dayEvents.slice(0, max);
    const taskSlice = dayTasks.slice(0, Math.max(0, max - eventSlice.length));
    const overflow = totalItems - eventSlice.length - taskSlice.length;
    return (
      <>
        {eventSlice.map((occ) => (
          <DraggableItem
            key={occ.occurrenceId}
            id={`event:${occ.occurrenceId}`}
            payload={{ type: "event", occurrence: occ }}
          >
            <EventChip occurrence={occ} onClick={() => onEventClick(occ)} />
          </DraggableItem>
        ))}
        {taskSlice.map((task) => (
          <DraggableItem key={task.id} id={`task:${task.id}`} payload={{ type: "task", task }}>
            <CalendarTaskChip task={task} onClick={() => onTaskClick(task.id)} />
          </DraggableItem>
        ))}
        {overflow > 0 && (
          <span className="px-1 text-xs text-muted-foreground">+{overflow}</span>
        )}
      </>
    );
  };

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelectDay(day)}
      onDoubleClick={() => onCreateAt(day)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectDay(day);
        }
      }}
      className={cn(
        "group flex min-h-[84px] cursor-pointer flex-col gap-0.5 bg-card p-1 text-start transition-colors md:min-h-[112px] md:p-1.5",
        !inMonth && "bg-muted/20 text-muted-foreground/60",
        selected && "ring-2 ring-inset ring-primary",
        today && !selected && "bg-primary/5",
        isOver && "bg-primary/10 ring-2 ring-inset ring-primary/50"
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
            today && "bg-primary text-primary-foreground",
            !today && "text-foreground"
          )}
        >
          {format(day, "d")}
        </span>
        <button
          type="button"
          aria-label={he.events.newEvent}
          title={he.events.newEvent}
          onClick={(e) => {
            e.stopPropagation();
            onCreateAt(day);
          }}
          className="hidden size-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 md:flex"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="hidden min-h-0 flex-1 flex-col gap-0.5 overflow-hidden md:flex">
        {renderItems(MAX_ITEMS_DESKTOP)}
      </div>
      <div className="flex flex-col gap-0.5 md:hidden">{renderItems(MAX_ITEMS_MOBILE)}</div>
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
