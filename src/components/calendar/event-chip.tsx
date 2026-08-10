"use client";

import { Repeat } from "lucide-react";
import type { EventOccurrence } from "@/types";
import { eventColor, formatEventTime } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

/** Compact event pill used in the month grid and all-day rows, Outlook-style. */
export function EventChip({
  occurrence,
  showTime = true,
  className,
  onClick,
}: {
  occurrence: EventOccurrence;
  showTime?: boolean;
  className?: string;
  onClick: () => void;
}) {
  const color = eventColor(occurrence);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 truncate rounded px-1.5 py-0.5 text-start text-xs leading-tight transition-opacity hover:opacity-80 active:scale-[0.98] md:text-sm",
        className
      )}
      style={{
        backgroundColor: `${color}26`,
        borderInlineStart: `3px solid ${color}`,
      }}
      title={occurrence.title}
    >
      {showTime && !occurrence.allDay && (
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground md:text-xs">
          {formatEventTime(occurrence.start)}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-medium">{occurrence.title}</span>
      {occurrence.isRecurring && (
        <Repeat className="size-3 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}
