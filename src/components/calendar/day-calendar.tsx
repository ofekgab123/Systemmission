"use client";

import { isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";
import { CalendarTaskChip } from "@/components/calendar/calendar-task-chip";
import {
  dayKey,
  getTaskCalendarDate,
} from "@/lib/calendar-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { EmptyState } from "@/components/task/task-list";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { he } from "@/lib/i18n/he";

export function DayCalendar({
  day,
  tasks,
  onTaskClick,
}: {
  day: Date;
  tasks: TaskWithRelations[];
  onTaskClick: (taskId: string) => void;
}) {
  const key = dayKey(day);
  const dayTasks = tasks
    .filter((t) => {
      const d = getTaskCalendarDate(t);
      return d && dayKey(d) === key;
    })
    .sort((a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight);

  const dayLabel = new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(day);

  return (
    <section className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-heading text-sm font-medium capitalize">
        {dayLabel}
        {isToday(day) && (
          <span className="ms-2 text-xs font-normal text-primary">({he.calendar.today})</span>
        )}
      </h3>
      {dayTasks.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {dayTasks.map((task) => (
            <CalendarTaskChip
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
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
  );
}

export function DayCalendarMini({
  day,
  tasks,
  selected,
  onSelect,
  onTaskClick,
}: {
  day: Date;
  tasks: TaskWithRelations[];
  selected?: boolean;
  onSelect: (day: Date) => void;
  onTaskClick: (taskId: string) => void;
}) {
  const key = dayKey(day);
  const dayTasks = tasks.filter((t) => {
    const d = getTaskCalendarDate(t);
    return d && dayKey(d) === key;
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      className={cn(
        "flex min-h-[72px] flex-col gap-1 bg-card p-1.5 text-start transition-colors md:min-h-[100px] md:p-2",
        selected && "ring-2 ring-inset ring-primary",
        isToday(day) && !selected && "bg-primary/5"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isToday(day) && "bg-primary text-primary-foreground"
        )}
      >
        {day.getDate()}
      </span>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
        {dayTasks.slice(0, 4).map((task) => (
          <CalendarTaskChip
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task.id)}
          />
        ))}
        {dayTasks.length > 4 && (
          <span className="text-xs text-muted-foreground">+{dayTasks.length - 4}</span>
        )}
      </div>
    </button>
  );
}
