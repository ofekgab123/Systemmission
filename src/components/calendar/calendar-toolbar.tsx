"use client";

import { cn } from "@/lib/utils";
import { CAL } from "@/lib/calendar-theme";

export function CalendarWeekdayHeader({ className }: { className?: string }) {
  const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
  return (
    <div
      className={cn("grid grid-cols-7 border-b", className)}
      style={{ borderColor: CAL.border, backgroundColor: CAL.allDayBg }}
    >
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className="py-1.5 text-center text-[10.5px] font-semibold"
          style={{ color: CAL.muted }}
        >
          {d}
        </div>
      ))}
    </div>
  );
}
