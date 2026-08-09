"use client";

import { cn } from "@/lib/utils";

export function CalendarWeekdayHeader({ className }: { className?: string }) {
  const WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
  return (
    <div className={cn("grid grid-cols-7 gap-px", className)}>
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className="bg-muted/50 py-2 text-center text-xs font-medium text-muted-foreground md:text-sm"
        >
          {d}
        </div>
      ))}
    </div>
  );
}
