"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import {
  formatCalendarPeriodLabel,
  type CalendarViewMode,
} from "@/lib/calendar-utils";

const VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: he.calendar.viewDay },
  { id: "week", label: he.calendar.viewWeek },
  { id: "month", label: he.calendar.viewMonth },
];

export function CalendarToolbar({
  viewMode,
  onViewModeChange,
  anchorDate,
  onJumpToDate,
  onPrev,
  onNext,
  onToday,
}: {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  anchorDate: Date;
  onJumpToDate: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const [open, setOpen] = useState(true);
  const periodLabel = formatCalendarPeriodLabel(anchorDate, viewMode);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 p-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {VIEW_MODES.map((mode) => (
            <Button
              key={mode.id}
              variant={viewMode === mode.id ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => onViewModeChange(mode.id)}
            >
              {mode.label}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-expanded={open}
          aria-label={open ? he.actions.close : he.actions.more}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onPrev}
          aria-label={he.calendar.prevPeriod}
        >
          <ChevronRight className="size-4" />
        </Button>
        <h2 className="min-w-0 flex-1 text-center font-heading text-sm font-medium capitalize md:text-base">
          {periodLabel}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onNext}
          aria-label={he.calendar.nextPeriod}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t p-3 sm:flex-row sm:items-center md:p-4">
          <DateField
            value={anchorDate}
            onChange={(date) => date && onJumpToDate(date)}
            placeholder={he.calendar.jumpToDate}
            className="sm:max-w-xs"
          />
          <Button variant="outline" size="sm" className="h-11 sm:h-10" onClick={onToday}>
            {he.calendar.today}
          </Button>
        </div>
      )}
    </div>
  );
}

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
