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
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import {
  dayKey,
  getTaskCalendarDate,
  type CalendarColorMode,
} from "@/lib/calendar-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { he } from "@/lib/i18n/he";

const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const MAX_CHIPS_MOBILE = 2;
const MAX_CHIPS_DESKTOP = 4;

interface MonthCalendarProps {
  month: Date;
  onMonthChange: (date: Date) => void;
  tasks: TaskWithRelations[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
  colorMode: CalendarColorMode;
  onTaskClick: (taskId: string) => void;
  showDone: boolean;
}

export function MonthCalendar({
  month,
  onMonthChange,
  tasks,
  selectedDay,
  onSelectDay,
  colorMode,
  onTaskClick,
  showDone,
}: MonthCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    for (const task of tasks) {
      if (!showDone && task.status === "DONE") continue;
      const d = getTaskCalendarDate(task);
      if (!d) continue;
      const key = dayKey(d);
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight
      );
    }
    return map;
  }, [tasks, showDone]);

  const monthLabelHe = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(month);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            onMonthChange(
              new Date(month.getFullYear(), month.getMonth() - 1, 1)
            )
          }
          aria-label={he.calendar.prevMonth}
        >
          <ChevronRight className="size-4" />
        </Button>
        <h2 className="font-heading text-base font-medium capitalize md:text-lg">
          {monthLabelHe}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            onMonthChange(
              new Date(month.getFullYear(), month.getMonth() + 1, 1)
            )
          }
          aria-label={he.calendar.nextMonth}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-muted/50 py-2 text-center text-[10px] font-medium text-muted-foreground md:text-xs"
          >
            {d}
          </div>
        ))}

        {days.map((day) => {
          const key = dayKey(day);
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const selected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "flex min-h-[72px] flex-col gap-0.5 bg-card p-1 text-start transition-colors md:min-h-[100px] md:p-1.5",
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
                    colorMode={colorMode}
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
                {dayTasks.length > MAX_CHIPS_DESKTOP && (
                  <span className="px-1 text-[10px] text-muted-foreground">
                    +{dayTasks.length - MAX_CHIPS_DESKTOP}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 md:hidden">
                {dayTasks.slice(0, MAX_CHIPS_MOBILE).map((task) => (
                  <CalendarTaskChip
                    key={task.id}
                    task={task}
                    colorMode={colorMode}
                    onClick={() => onTaskClick(task.id)}
                  />
                ))}
                {dayTasks.length > MAX_CHIPS_MOBILE && (
                  <span className="text-[9px] text-muted-foreground">
                    +{dayTasks.length - MAX_CHIPS_MOBILE}
                  </span>
                )}
              </div>

              {dayTasks.length > 0 && (
                <span className="mt-auto hidden text-[9px] text-muted-foreground md:block">
                  {he.calendar.taskCount(dayTasks.length)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
