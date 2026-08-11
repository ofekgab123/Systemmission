"use client";

import { Repeat } from "lucide-react";
import type { EventOccurrence } from "@/types";
import { eventColor, formatEventTime } from "@/lib/event-utils";
import { eventBlockStyle } from "@/lib/calendar-theme";
import { cn } from "@/lib/utils";

/** Compact event pill used in the month grid and all-day rows. */
export function EventChip({
  occurrence,
  showTime = true,
  className,
  onClick,
  compact = false,
}: {
  occurrence: EventOccurrence;
  showTime?: boolean;
  className?: string;
  onClick: () => void;
  compact?: boolean;
}) {
  const color = eventColor(occurrence);
  const block = eventBlockStyle(color);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 truncate rounded-md py-0.5 text-start leading-tight transition-opacity hover:opacity-85 active:scale-[0.98]",
        compact ? "px-1 text-[8.5px] font-semibold" : "px-2 text-[11.5px] font-semibold md:text-xs",
        className
      )}
      style={block}
      title={occurrence.title}
    >
      {showTime && !occurrence.allDay && !compact && (
        <span className="shrink-0 text-[10px] tabular-nums opacity-70 md:text-xs">
          {formatEventTime(occurrence.start)}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{occurrence.title}</span>
      {occurrence.isRecurring && !compact && (
        <Repeat className="size-3 shrink-0 opacity-60" />
      )}
    </button>
  );
}
