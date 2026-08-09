"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import type { TaskWithRelations } from "@/types";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import { dayKey, getTaskCalendarDate } from "@/lib/calendar-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { EmptyState } from "@/components/task/task-list";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

function formatDayRowLabel(day: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(day);
}

export function WeekCalendar({
  anchorDate,
  tasks,
  onTaskClick,
}: {
  anchorDate: Date;
  tasks: TaskWithRelations[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
  onTaskClick: (taskId: string) => void;
}) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set());

  const days = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: 0 });
    const end = endOfWeek(anchorDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [anchorDate]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    for (const day of days) {
      const key = dayKey(day);
      const dayTasks = tasks
        .filter((t) => {
          const d = getTaskCalendarDate(t);
          return d && dayKey(d) === key;
        })
        .sort((a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight);
      map.set(key, dayTasks);
    }
    return map;
  }, [days, tasks]);

  const weekHasTasks = useMemo(
    () => [...tasksByDay.values()].some((list) => list.length > 0),
    [tasksByDay]
  );

  const toggleDay = (key: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        {days.map((day) => {
          const key = dayKey(day);
          const dayTasks = tasksByDay.get(key) ?? [];
          const open = expandedDays.has(key);
          const today = isToday(day);

          return (
            <div key={key} className="border-b last:border-b-0">
              <button
                type="button"
                onClick={() => toggleDay(key)}
                aria-expanded={open}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-3 text-start transition-colors hover:bg-muted/40",
                  today && "bg-primary/[0.03]"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    today && "bg-primary text-primary-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
                <span className="min-w-0 flex-1 capitalize">
                  <span className="block truncate text-sm font-medium">{formatDayRowLabel(day)}</span>
                  {today && (
                    <span className="text-xs text-primary">{he.calendar.today}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {he.calendar.taskCount(dayTasks.length)}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180"
                  )}
                />
              </button>
              {open && (
                <div className="flex flex-col gap-1 border-t bg-muted/20 px-3 py-2">
                  {dayTasks.length > 0 ? (
                    dayTasks.map((task) => (
                      <CalendarTaskChip
                        key={task.id}
                        task={task}
                        showDate
                        onClick={() => onTaskClick(task.id)}
                      />
                    ))
                  ) : (
                    <p className="py-2 text-xs text-muted-foreground">{he.calendar.noTasksThisDay}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!weekHasTasks && (
        <EmptyState
          title={he.calendar.noTasksThisWeek}
          description={he.calendar.noTasksThisWeekDesc}
          action={<AddTaskButton variant="outline" className="gap-2" tab="form" />}
        />
      )}
    </div>
  );
}
