"use client";

import { useState } from "react";
import { set } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { he } from "@/lib/i18n/he";
import type { TaskWithRelations } from "@/types";

function defaultTimeForDay(day: Date): string {
  const now = new Date();
  if (now.toDateString() === day.toDateString()) {
    const nextHour = now.getHours() + 1;
    return `${String(Math.min(nextHour, 23)).padStart(2, "0")}:00`;
  }
  return "09:00";
}

export function TaskSchedulePopover({
  task,
  day,
  open,
  onOpenChange,
  onSchedule,
  onOpenTask,
  children,
}: {
  task: TaskWithRelations;
  day: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (start: Date) => void;
  onOpenTask: () => void;
  children: React.ReactElement;
}) {
  const [time, setTime] = useState(() => defaultTimeForDay(day));

  const handleSchedule = () => {
    const [hours = 9, minutes = 0] = time.split(":").map(Number);
    const start = set(day, { hours, minutes, seconds: 0, milliseconds: 0 });
    onSchedule(start);
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={children} />
      <PopoverContent className="w-72" align="start" dir="rtl">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium leading-snug">{task.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{he.calendar.scheduleTaskHint}</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-9 flex-1 tabular-nums"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSchedule();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={handleSchedule}>
              {he.calendar.scheduleTask}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => {
                onOpenChange(false);
                onOpenTask();
              }}
            >
              <ExternalLink className="size-3.5" />
              {he.calendar.openTask}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
