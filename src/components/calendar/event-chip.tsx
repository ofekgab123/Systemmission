"use client";

import { Repeat } from "lucide-react";
import type { EventOccurrence } from "@/types";
import { eventColor, formatEventTime } from "@/lib/event-utils";
import { eventBlockStyle, outlookEventBlockStyle } from "@/lib/calendar-theme";
import {
  FICTITIOUS_FONT_DEFAULT,
  fictitiousOccurrenceVariant,
  isFictitiousOccurrence,
} from "@/lib/fictitious-schedule";
import { FictitiousOwnerTag } from "@/components/today/fictitious-owner-tag";
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
  const outlook = isFictitiousOccurrence(occurrence);
  const variant = fictitiousOccurrenceVariant(occurrence);
  const block = outlook ? outlookEventBlockStyle(color, variant) : eventBlockStyle(color);

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
      style={{
        ...block,
        ...(outlook
          ? { fontSize: `${occurrence.fontSize ?? FICTITIOUS_FONT_DEFAULT}px` }
          : null),
      }}
      title={[occurrence.owner, occurrence.title].filter(Boolean).join(" · ")}
    >
      {showTime && !occurrence.allDay && !compact && (
        <span className="shrink-0 tabular-nums opacity-70">
          {formatEventTime(occurrence.start)}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{occurrence.title}</span>
      {outlook && (
        <FictitiousOwnerTag
          owner={occurrence.owner}
          ghost={variant === "ghost"}
          compact
          className="pointer-events-none shrink-0"
        />
      )}
      {occurrence.isRecurring && !compact && (
        <Repeat className="size-3 shrink-0 opacity-60" />
      )}
    </button>
  );
}
