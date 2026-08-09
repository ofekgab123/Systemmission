"use client";

import { useMemo } from "react";
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
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { CalendarWeekdayHeader } from "@/components/calendar/calendar-toolbar";
import {
  dayKey,
  groupTasksByDay,
} from "@/lib/calendar-utils";
import { he } from "@/lib/i18n/he";

const MAX_CHIPS_MOBILE = 2;
const MAX_CHIPS_DESKTOP = 4;

interface MonthCalendarProps {
  anchorDate: Date;
  tasks: TaskWithRelations[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
  onTaskClick: (taskId: string) => void;
}

export function MonthCalendar({
  anchorDate,
  tasks,
  selectedDay,
  onSelectDay,
  onTaskClick,
}: MonthCalendarProps) {
  const month = startOfMonth(anchorDate);

  const days = useMemo(() => {
    const start = startOfWeek(month, { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => groupTasksByDay(tasks, true), [tasks]);

  return (
    <div className="overflow-hidden rounded-xl border bg-border">
      <CalendarWeekdayHeader />
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const key = dayKey(day);
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const selected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDay(day);
                }
              }}
              className={cn(
                "flex min-h-[72px] cursor-pointer flex-col gap-0.5 bg-card p-1 text-start transition-colors md:min-h-[100px] md:p-1.5",
                !inMonth && "bg-muted/20 text-muted-foreground/60",
                selected && "ring-2 ring-inset ring-primary",
                today && !selected && "bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  today && "bg-primary text-primary-foreground",
                  !today && "text-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              <div className="hidden min-h-0 flex-1 flex-col gap-0.5 overflow-hidden md:flex">
                {dayTasks.slice(0, MAX_CHIPS_DESKTOP).map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
                {dayTasks.length > MAX_CHIPS_DESKTOP && (
                  <span className="px-1 text-xs text-muted-foreground">
                    +{dayTasks.length - MAX_CHIPS_DESKTOP}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 md:hidden">
                {dayTasks.slice(0, MAX_CHIPS_MOBILE).map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
                {dayTasks.length > MAX_CHIPS_MOBILE && (
                  <span className="text-xs text-muted-foreground">
                    +{dayTasks.length - MAX_CHIPS_MOBILE}
                  </span>
                )}
              </div>

              {dayTasks.length > 0 && (
                <span className="mt-auto hidden text-xs text-muted-foreground md:block">
                  {he.calendar.taskCount(dayTasks.length)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
