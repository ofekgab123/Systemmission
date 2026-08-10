"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addMinutes, differenceInMinutes, format, isToday, startOfDay } from "date-fns";
import { he as dateHe } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import {
  eventColor,
  formatEventTime,
  layoutDayEvents,
  occurrencesForDay,
} from "@/lib/event-utils";
import { EventChip } from "@/components/calendar/event-chip";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { TaskSchedulePopover } from "@/components/calendar/task-schedule-popover";
import {
  dayKey,
  getCalendarTaskStyle,
  getTaskDurationMinutes,
  hasTaskSpecificTime,
  layoutTimedTasks,
  splitTasksForDay,
  CALENDAR_TASK_DRAG_MIME,
} from "@/lib/calendar-utils";
import type { EventOccurrence, TaskWithRelations } from "@/types";

const HOUR_HEIGHT = 48;
const DAY_MINUTES = 24 * 60;
const SNAP = 15;
const DRAG_THRESHOLD_PX = 5;

interface CreateDrag {
  dayIndex: number;
  anchorMin: number;
  startMin: number;
  endMin: number;
  moved: boolean;
}

interface EventDrag {
  occurrence: EventOccurrence;
  mode: "move" | "resize";
  dayIndex: number;
  startMin: number;
  endMin: number;
  grabOffsetMin: number;
  moved: boolean;
  startClientX: number;
  startClientY: number;
}

interface TaskDrag {
  task: TaskWithRelations;
  fromAllDay: boolean;
  dayIndex: number;
  startMin: number;
  endMin: number;
  grabOffsetMin: number;
  moved: boolean;
  startClientX: number;
  startClientY: number;
}

function snap(min: number, step = SNAP): number {
  return Math.round(min / step) * step;
}

function clampMin(min: number): number {
  return Math.max(0, Math.min(DAY_MINUTES, min));
}

export function TimeGrid({
  days,
  events,
  tasks,
  onEventClick,
  onTaskClick,
  onCreateRange,
  onMoveOccurrence,
  onScheduleTask,
  onUnscheduleTask,
  onMoveTaskToDay,
}: {
  days: Date[];
  events: EventOccurrence[];
  tasks: TaskWithRelations[];
  onEventClick: (occurrence: EventOccurrence) => void;
  onTaskClick: (taskId: string) => void;
  onCreateRange: (start: Date, end: Date, allDay?: boolean) => void;
  onMoveOccurrence: (occurrence: EventOccurrence, newStart: Date, newEnd: Date) => void;
  onScheduleTask: (task: TaskWithRelations, start: Date) => void;
  onUnscheduleTask: (task: TaskWithRelations, day: Date) => void;
  onMoveTaskToDay: (task: TaskWithRelations, day: Date) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const allDayRowRef = useRef<HTMLDivElement>(null);
  const allDayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [createDrag, setCreateDrag] = useState<CreateDrag | null>(null);
  const [eventDrag, setEventDrag] = useState<EventDrag | null>(null);
  const [taskDrag, setTaskDrag] = useState<TaskDrag | null>(null);
  const [taskDragOverAllDay, setTaskDragOverAllDay] = useState<number | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<{
    task: TaskWithRelations;
    day: Date;
  } | null>(null);

  const colPct = 100 / days.length;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, []);

  const perDay = useMemo(
    () =>
      days.map((day) => {
        const { allDay: allDayEvents, timed } = occurrencesForDay(events, day);
        const { allDay: allDayTasks, timed: timedTasks } = splitTasksForDay(tasks, day);
        return {
          day,
          allDayEvents,
          allDayTasks,
          positionedEvents: layoutDayEvents(timed, day),
          positionedTasks: layoutTimedTasks(timedTasks, day),
        };
      }),
    [days, events, tasks]
  );

  const isOverGrid = (clientX: number, clientY: number) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return (
      clientY >= rect.top &&
      clientY <= rect.bottom &&
      clientX >= rect.left &&
      clientX <= rect.right
    );
  };

  const getAllDayDropIndex = (clientX: number, clientY: number): number | null => {
    const row = allDayRowRef.current;
    if (!row) return null;
    const rowRect = row.getBoundingClientRect();
    if (
      clientY < rowRect.top ||
      clientY > rowRect.bottom ||
      clientX < rowRect.left ||
      clientX > rowRect.right
    ) {
      return null;
    }
    for (let i = 0; i < allDayColumnRefs.current.length; i++) {
      const col = allDayColumnRefs.current[i];
      if (!col) continue;
      const rect = col.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return i;
    }
    return null;
  };

  const pointerToPosition = (clientX: number, clientY: number) => {
    const rect = gridRef.current!.getBoundingClientRect();
    const colWidth = rect.width / days.length;
    const dayIndex = Math.max(
      0,
      Math.min(days.length - 1, Math.floor((rect.right - clientX) / colWidth))
    );
    const minute = clampMin(((clientY - rect.top) / HOUR_HEIGHT) * 60);
    return { dayIndex, minute };
  };

  const resolveExternalTask = (e: React.DragEvent) => {
    const id = e.dataTransfer.getData(CALENDAR_TASK_DRAG_MIME);
    if (!id) return null;
    return tasks.find((t) => t.id === id) ?? null;
  };

  const handleExternalDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(CALENDAR_TASK_DRAG_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleGridExternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const task = resolveExternalTask(e);
    if (!task) return;
    const { dayIndex, minute } = pointerToPosition(e.clientX, e.clientY);
    onScheduleTask(task, addMinutes(startOfDay(days[dayIndex]), snap(minute)));
  };

  const handleAllDayExternalDrop = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    const task = resolveExternalTask(e);
    if (!task) return;
    const day = days[dayIndex];
    if (hasTaskSpecificTime(task)) {
      onUnscheduleTask(task, day);
    } else {
      onMoveTaskToDay(task, day);
    }
  };

  const handleCreatePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || eventDrag || taskDrag) return;
    const { dayIndex, minute } = pointerToPosition(e.clientX, e.clientY);
    const anchor = snap(minute, 30) === minute ? minute : Math.floor(minute / 30) * 30;
    const drag: CreateDrag = {
      dayIndex,
      anchorMin: anchor,
      startMin: anchor,
      endMin: anchor + 30,
      moved: false,
    };
    setCreateDrag(drag);

    const handleMove = (ev: PointerEvent) => {
      const { minute: cur } = pointerToPosition(ev.clientX, ev.clientY);
      const snapped = snap(cur);
      setCreateDrag((prev) => {
        if (!prev) return prev;
        const moved = prev.moved || Math.abs(snapped - prev.anchorMin) >= SNAP;
        if (!moved) return prev;
        const startMin = Math.min(prev.anchorMin, snapped);
        let endMin = Math.max(prev.anchorMin, snapped);
        if (endMin - startMin < SNAP) endMin = startMin + SNAP;
        return { ...prev, moved, startMin, endMin };
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setCreateDrag((prev) => {
        if (prev) {
          const day = startOfDay(days[prev.dayIndex]);
          const start = addMinutes(day, prev.startMin);
          const end = addMinutes(day, prev.moved ? prev.endMin : prev.startMin + 30);
          onCreateRange(start, end);
        }
        return null;
      });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const beginEventDrag = (
    e: React.PointerEvent,
    occurrence: EventOccurrence,
    dayIndex: number,
    startMin: number,
    endMin: number,
    mode: "move" | "resize"
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const { minute } = pointerToPosition(e.clientX, e.clientY);
    const initial: EventDrag = {
      occurrence,
      mode,
      dayIndex,
      startMin,
      endMin,
      grabOffsetMin: minute - startMin,
      moved: false,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
    setEventDrag(initial);

    const handleMove = (ev: PointerEvent) => {
      const { dayIndex: curDay, minute: cur } = pointerToPosition(ev.clientX, ev.clientY);
      setEventDrag((prev) => {
        if (!prev) return prev;
        const moved =
          prev.moved ||
          Math.abs(ev.clientX - prev.startClientX) > DRAG_THRESHOLD_PX ||
          Math.abs(ev.clientY - prev.startClientY) > DRAG_THRESHOLD_PX;
        if (!moved) return prev;

        if (prev.mode === "resize") {
          return {
            ...prev,
            moved,
            endMin: Math.max(prev.startMin + SNAP, snap(cur)),
          };
        }

        const duration = endMin - startMin;
        const rawStart = clampMin(snap(cur - prev.grabOffsetMin));
        const newStart = Math.min(rawStart, DAY_MINUTES - duration);
        return {
          ...prev,
          moved,
          dayIndex: curDay,
          startMin: newStart,
          endMin: newStart + duration,
        };
      });
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setEventDrag((prev) => {
        if (prev) {
          if (!prev.moved) {
            onEventClick(prev.occurrence);
          } else {
            const day = startOfDay(days[prev.dayIndex]);
            onMoveOccurrence(
              prev.occurrence,
              addMinutes(day, prev.startMin),
              addMinutes(day, prev.endMin)
            );
          }
        }
        return null;
      });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const beginTaskDrag = (
    e: React.PointerEvent,
    task: TaskWithRelations,
    dayIndex: number,
    startMin: number,
    endMin: number,
    fromAllDay: boolean
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const duration = endMin - startMin;
    const grabOffsetMin = fromAllDay
      ? duration / 2
      : isOverGrid(e.clientX, e.clientY)
        ? pointerToPosition(e.clientX, e.clientY).minute - startMin
        : 0;
    const initial: TaskDrag = {
      task,
      fromAllDay,
      dayIndex,
      startMin,
      endMin,
      grabOffsetMin,
      moved: false,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };
    setTaskDrag(initial);

    const handleMove = (ev: PointerEvent) => {
      const allDayIdx = getAllDayDropIndex(ev.clientX, ev.clientY);
      setTaskDragOverAllDay(allDayIdx);

      const overGrid = isOverGrid(ev.clientX, ev.clientY);
      if (!overGrid && allDayIdx === null) return;

      setTaskDrag((prev) => {
        if (!prev) return prev;
        const moved =
          prev.moved ||
          Math.abs(ev.clientX - prev.startClientX) > DRAG_THRESHOLD_PX ||
          Math.abs(ev.clientY - prev.startClientY) > DRAG_THRESHOLD_PX;
        if (!moved) return prev;
        if (!overGrid) return { ...prev, moved: true };

        const { dayIndex: curDay, minute: cur } = pointerToPosition(ev.clientX, ev.clientY);
        const snapped = snap(cur - prev.grabOffsetMin);
        const newStart = clampMin(Math.min(snapped, DAY_MINUTES - duration));
        return {
          ...prev,
          moved: true,
          dayIndex: curDay,
          startMin: newStart,
          endMin: newStart + duration,
        };
      });
    };

    const handleUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      setTaskDragOverAllDay(null);
      setTaskDrag((prev) => {
        if (!prev) return null;

        const allDayIdx = getAllDayDropIndex(ev.clientX, ev.clientY);

        if (prev.moved && allDayIdx !== null && !prev.fromAllDay) {
          onUnscheduleTask(prev.task, days[allDayIdx]);
        } else if (prev.moved && isOverGrid(ev.clientX, ev.clientY)) {
          const day = startOfDay(days[prev.dayIndex]);
          onScheduleTask(prev.task, addMinutes(day, prev.startMin));
        } else if (
          prev.moved &&
          prev.fromAllDay &&
          allDayIdx !== null &&
          allDayIdx !== prev.dayIndex
        ) {
          onMoveTaskToDay(prev.task, days[allDayIdx]);
        } else if (!prev.moved && prev.fromAllDay) {
          setScheduleTarget({ task: prev.task, day: days[dayIndex] });
        } else if (!prev.moved && !prev.fromAllDay) {
          onTaskClick(prev.task.id);
        }
        return null;
      });
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const nowMin = differenceInMinutes(now, startOfDay(now));
  const hasTimedTasks = perDay.some(({ positionedTasks }) => positionedTasks.length > 0);
  const hasAllDayContent = perDay.some(
    ({ allDayEvents, allDayTasks }) => allDayEvents.length > 0 || allDayTasks.length > 0
  );
  const showAllDayRow = hasAllDayContent || hasTimedTasks || taskDrag !== null;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex border-b">
        <div className="w-12 shrink-0 sm:w-14" />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={dayKey(day)}
              className="flex flex-1 items-center justify-center gap-1.5 border-s py-2 text-sm"
            >
              <span className={cn("text-muted-foreground", today && "font-medium text-primary")}>
                {format(day, "EEEE", { locale: dateHe })}
              </span>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-sm font-medium",
                  today && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {showAllDayRow && (
        <div ref={allDayRowRef} className="flex border-b bg-muted/20">
          <div className="flex w-12 shrink-0 items-start justify-center pt-1.5 text-[10px] text-muted-foreground sm:w-14">
            {he.calendar.allDaySection}
          </div>
          {perDay.map(({ day, allDayEvents, allDayTasks }, dayIndex) => (
            <div
              key={dayKey(day)}
              ref={(el) => {
                allDayColumnRefs.current[dayIndex] = el;
              }}
              className={cn(
                "flex min-h-8 flex-1 flex-col gap-0.5 border-s p-1 transition-colors",
                taskDragOverAllDay === dayIndex && "bg-primary/15 ring-2 ring-inset ring-primary/40"
              )}
              onDragOver={handleExternalDragOver}
              onDrop={(e) => handleAllDayExternalDrop(e, dayIndex)}
            >
              {allDayEvents.map((occ) => (
                <EventChip
                  key={occ.occurrenceId}
                  occurrence={occ}
                  showTime={false}
                  onClick={() => onEventClick(occ)}
                />
              ))}
              {allDayTasks.map((task) => {
                const isOpen =
                  scheduleTarget?.task.id === task.id &&
                  dayKey(scheduleTarget.day) === dayKey(day);
                const duration = getTaskDurationMinutes(task);
                const isDragged = taskDrag?.moved && taskDrag.task.id === task.id;
                return (
                  <TaskSchedulePopover
                    key={task.id}
                    task={task}
                    day={day}
                    open={isOpen}
                    onOpenChange={(open) => {
                      if (!open) setScheduleTarget(null);
                    }}
                    onSchedule={(start) => onScheduleTask(task, start)}
                    onOpenTask={() => onTaskClick(task.id)}
                  >
                    <div
                      className={cn(
                        "cursor-grab touch-none active:cursor-grabbing",
                        isDragged && "opacity-30"
                      )}
                      title={he.calendar.dragToMove}
                      onPointerDown={(e) =>
                        beginTaskDrag(
                          e,
                          task,
                          dayIndex,
                          9 * 60,
                          9 * 60 + duration,
                          true
                        )
                      }
                    >
                      <CalendarTaskChip task={task} onClick={() => {}} />
                    </div>
                  </TaskSchedulePopover>
                );
              })}
              {taskDrag?.moved &&
                taskDragOverAllDay === dayIndex &&
                (!taskDrag.fromAllDay || taskDrag.dayIndex !== dayIndex) && (
                  <div
                    className={cn(
                      "pointer-events-none truncate rounded px-1.5 py-0.5 text-xs font-medium opacity-70",
                      getCalendarTaskStyle(taskDrag.task, "combined").className
                    )}
                    style={getCalendarTaskStyle(taskDrag.task, "combined").style}
                  >
                    {taskDrag.task.title}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="max-h-[65dvh] overflow-y-auto overscroll-contain">
        <div className="flex">
          <div className="relative w-12 shrink-0 sm:w-14" style={{ height: 24 * HOUR_HEIGHT }}>
            {Array.from({ length: 24 }, (_, h) => (
              <span
                key={h}
                className="absolute end-1.5 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground sm:text-xs"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {h > 0 && `${String(h).padStart(2, "0")}:00`}
              </span>
            ))}
          </div>

          <div
            ref={gridRef}
            className="relative flex-1 cursor-pointer touch-pan-y select-none"
            style={{ height: 24 * HOUR_HEIGHT }}
            onPointerDown={handleCreatePointerDown}
            onDragOver={handleExternalDragOver}
            onDrop={handleGridExternalDrop}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h}>
                <div
                  className="pointer-events-none absolute inset-x-0 border-t"
                  style={{ top: h * HOUR_HEIGHT }}
                />
                <div
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/50"
                  style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                />
              </div>
            ))}

            {days.map((day, i) => (
              <div
                key={dayKey(day)}
                className="pointer-events-none absolute inset-y-0 border-s"
                style={{ insetInlineStart: `${i * colPct}%` }}
              />
            ))}

            {perDay.map(({ positionedEvents }, dayIndex) =>
              positionedEvents.map(({ occurrence, startMin, endMin, column, columns }) => {
                const isDragged =
                  eventDrag?.moved && eventDrag.occurrence.occurrenceId === occurrence.occurrenceId;
                const color = eventColor(occurrence);
                const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                const widthPct = colPct / columns;
                return (
                  <div
                    key={occurrence.occurrenceId}
                    className={cn(
                      "absolute z-10 cursor-grab touch-none overflow-hidden rounded-md px-1.5 py-1 text-xs leading-tight shadow-sm transition-opacity",
                      isDragged && "opacity-30"
                    )}
                    style={{
                      top: (startMin / 60) * HOUR_HEIGHT,
                      height: Math.max(height, 18),
                      insetInlineStart: `calc(${dayIndex * colPct + column * widthPct}% + 2px)`,
                      width: `calc(${widthPct}% - 5px)`,
                      backgroundColor: `${color}2b`,
                      borderInlineStart: `3px solid ${color}`,
                    }}
                    onPointerDown={(e) =>
                      beginEventDrag(e, occurrence, dayIndex, startMin, endMin, "move")
                    }
                    title={`${occurrence.title} · ${formatEventTime(occurrence.start)}–${formatEventTime(occurrence.end)}`}
                  >
                    <p className="truncate font-medium text-foreground">
                      {occurrence.title || he.events.noTitle}
                    </p>
                    {height >= 34 && (
                      <p className="truncate tabular-nums text-muted-foreground">
                        {formatEventTime(occurrence.start)}–{formatEventTime(occurrence.end)}
                      </p>
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
                      onPointerDown={(e) =>
                        beginEventDrag(e, occurrence, dayIndex, startMin, endMin, "resize")
                      }
                    />
                  </div>
                );
              })
            )}

            {perDay.map(({ positionedTasks }, dayIndex) =>
              positionedTasks.map(({ task, startMin, endMin, column, columns }) => {
                const isDragged = taskDrag?.moved && taskDrag.task.id === task.id;
                const { className, style } = getCalendarTaskStyle(task, "combined");
                const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                const widthPct = colPct / columns;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "absolute z-10 cursor-grab touch-none overflow-hidden rounded-md px-1.5 py-1 text-xs leading-tight shadow-sm transition-opacity",
                      className,
                      isDragged && "opacity-30"
                    )}
                    style={{
                      ...style,
                      top: (startMin / 60) * HOUR_HEIGHT,
                      height: Math.max(height, 18),
                      insetInlineStart: `calc(${dayIndex * colPct + column * widthPct}% + 2px)`,
                      width: `calc(${widthPct}% - 5px)`,
                    }}
                    onPointerDown={(e) =>
                      beginTaskDrag(e, task, dayIndex, startMin, endMin, false)
                    }
                    title={`${task.title} · ${he.calendar.dragToMove}`}
                  >
                    <p className="truncate font-medium">{task.title}</p>
                    {height >= 34 && (
                      <p className="truncate tabular-nums text-muted-foreground">
                        {formatEventTime(addMinutes(startOfDay(days[dayIndex]), startMin))}
                      </p>
                    )}
                  </div>
                );
              })
            )}

            {eventDrag?.moved && (
              <div
                className="pointer-events-none absolute z-20 overflow-hidden rounded-md px-1.5 py-1 text-xs leading-tight shadow-md ring-2 ring-primary/40"
                style={{
                  top: (eventDrag.startMin / 60) * HOUR_HEIGHT,
                  height: Math.max(
                    ((eventDrag.endMin - eventDrag.startMin) / 60) * HOUR_HEIGHT,
                    18
                  ),
                  insetInlineStart: `calc(${eventDrag.dayIndex * colPct}% + 2px)`,
                  width: `calc(${colPct}% - 5px)`,
                  backgroundColor: `${eventColor(eventDrag.occurrence)}40`,
                  borderInlineStart: `3px solid ${eventColor(eventDrag.occurrence)}`,
                }}
              >
                <p className="truncate font-medium">{eventDrag.occurrence.title}</p>
              </div>
            )}

            {taskDrag?.moved && taskDragOverAllDay === null && (
              <div
                className="pointer-events-none absolute z-20 overflow-hidden rounded-md px-1.5 py-1 text-xs leading-tight shadow-md ring-2 ring-primary/40"
                style={{
                  top: (taskDrag.startMin / 60) * HOUR_HEIGHT,
                  height: Math.max(
                    ((taskDrag.endMin - taskDrag.startMin) / 60) * HOUR_HEIGHT,
                    18
                  ),
                  insetInlineStart: `calc(${taskDrag.dayIndex * colPct}% + 2px)`,
                  width: `calc(${colPct}% - 5px)`,
                  ...(getCalendarTaskStyle(taskDrag.task, "combined").style ?? {}),
                }}
              >
                <p className="truncate font-medium">{taskDrag.task.title}</p>
                <p className="tabular-nums text-muted-foreground">
                  {formatEventTime(addMinutes(startOfDay(days[taskDrag.dayIndex]), taskDrag.startMin))}
                </p>
              </div>
            )}

            {createDrag && (
              <div
                className="pointer-events-none absolute z-20 rounded-md border-2 border-dashed border-primary/60 bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                style={{
                  top: (createDrag.startMin / 60) * HOUR_HEIGHT,
                  height: Math.max(
                    ((createDrag.endMin - createDrag.startMin) / 60) * HOUR_HEIGHT,
                    12
                  ),
                  insetInlineStart: `calc(${createDrag.dayIndex * colPct}% + 2px)`,
                  width: `calc(${colPct}% - 5px)`,
                }}
              >
                <span className="tabular-nums">
                  {formatEventTime(addMinutes(startOfDay(days[0]), createDrag.startMin))}–
                  {formatEventTime(addMinutes(startOfDay(days[0]), createDrag.endMin))}
                </span>
              </div>
            )}

            {days.map(
              (day, i) =>
                isToday(day) && (
                  <div
                    key={`now-${dayKey(day)}`}
                    className="pointer-events-none absolute z-30"
                    style={{
                      top: (nowMin / 60) * HOUR_HEIGHT,
                      insetInlineStart: `${i * colPct}%`,
                      width: `${colPct}%`,
                    }}
                  >
                    <div className="relative border-t-2 border-status-red">
                      <span className="absolute -top-[5px] start-0 size-2 rounded-full bg-status-red" />
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
