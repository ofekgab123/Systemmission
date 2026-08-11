"use client";

import { format, isSameDay, isToday, startOfWeek, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { CAL, hebrewWeekdayLetter } from "@/lib/calendar-theme";
import { dayKey } from "@/lib/calendar-utils";
import type { EventOccurrence, TaskWithRelations } from "@/types";
import { getTaskCalendarDate } from "@/lib/calendar-utils";

interface WeekStripProps {
  anchorDate: Date;
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  events: EventOccurrence[];
  tasks: TaskWithRelations[];
  /** Number of days to show (7 for week, 5 for workweek). */
  dayCount?: number;
}

export function WeekStrip({
  anchorDate,
  selectedDay,
  onSelectDay,
  events,
  tasks,
  dayCount = 7,
}: WeekStripProps) {
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 0 });
  const days = Array.from({ length: dayCount }, (_, i) => addDays(weekStart, i));

  const hasItemsOnDay = (day: Date) => {
    const key = dayKey(day);
    const taskHit = tasks.some((t) => {
      const d = getTaskCalendarDate(t);
      return d && dayKey(d) === key;
    });
    if (taskHit) return true;
    return events.some((e) => isSameDay(new Date(e.start), day));
  };

  return (
    <div
      className="border-b bg-white px-2 py-2 shadow-[0_1px_3px_rgba(17,24,39,.04)]"
      style={{ borderColor: CAL.border }}
    >
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const selected = isSameDay(day, selectedDay);
          const today = isToday(day);
          const hasItems = hasItemsOnDay(day);

          return (
            <button
              key={dayKey(day)}
              type="button"
              onClick={() => onSelectDay(day)}
              className="flex flex-col items-center gap-1 rounded-xl px-0 py-1 transition-colors hover:bg-[#F1F3F7]"
            >
              <span
                className="text-[11px] font-semibold"
                style={{ color: selected ? CAL.primary : CAL.muted }}
              >
                {hebrewWeekdayLetter(day)}
              </span>
              <span
                className={cn(
                  "flex size-[34px] items-center justify-center rounded-xl text-base font-bold transition-colors",
                  selected && "text-white",
                  !selected && today && "text-[#2563EB]",
                  !selected && !today && "text-[#374151]"
                )}
                style={{
                  backgroundColor: selected
                    ? CAL.primary
                    : today
                      ? CAL.primaryLight
                      : "transparent",
                }}
              >
                {format(day, "d")}
              </span>
              <span
                className="size-1 rounded-full"
                style={{
                  backgroundColor: hasItems
                    ? selected
                      ? CAL.primary
                      : "#C3C8D4"
                    : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
