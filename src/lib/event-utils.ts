import { differenceInMinutes, endOfDay, format, isSameDay, startOfDay } from "date-fns";
import type { EventOccurrence } from "@/types";

/** Outlook-like default calendar blue, used when an event has no category. */
export const DEFAULT_EVENT_COLOR = "#0f6cbd";

export function eventColor(event: Pick<EventOccurrence, "category">): string {
  return event.category?.color ?? DEFAULT_EVENT_COLOR;
}

export function formatEventTime(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

export function formatEventTimeRange(occ: Pick<EventOccurrence, "start" | "end" | "allDay">): string {
  if (occ.allDay) return "כל היום";
  return `${formatEventTime(occ.start)}–${formatEventTime(occ.end)}`;
}

/**
 * Splits occurrences into all-day items and timed items for a given day.
 * Multi-day timed events render as all-day banners on the days they cover,
 * like Outlook.
 */
export function occurrencesForDay(
  occurrences: EventOccurrence[],
  day: Date
): { allDay: EventOccurrence[]; timed: EventOccurrence[] } {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const allDay: EventOccurrence[] = [];
  const timed: EventOccurrence[] = [];

  for (const occ of occurrences) {
    const start = new Date(occ.start);
    const end = new Date(occ.end);
    if (start > dayEnd) continue;
    if (end <= dayStart && end.getTime() !== start.getTime()) continue;
    if (end < dayStart) continue;

    if (occ.allDay || !isSameDay(start, end)) allDay.push(occ);
    else timed.push(occ);
  }

  return { allDay, timed };
}

export interface PositionedEvent {
  occurrence: EventOccurrence;
  /** Minutes from midnight. */
  startMin: number;
  endMin: number;
  column: number;
  columns: number;
}

/**
 * Assigns side-by-side columns to overlapping events within a day,
 * the way Outlook lays out conflicting meetings.
 */
export function layoutDayEvents(occurrences: EventOccurrence[], day: Date): PositionedEvent[] {
  const dayStart = startOfDay(day);

  const items = occurrences
    .map((occurrence) => {
      const startMin = Math.max(0, differenceInMinutes(new Date(occurrence.start), dayStart));
      const rawEndMin = differenceInMinutes(new Date(occurrence.end), dayStart);
      const endMin = Math.min(24 * 60, Math.max(rawEndMin, startMin + 15));
      return { occurrence, startMin, endMin, column: 0, columns: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const result: PositionedEvent[] = [];
  let cluster: PositionedEvent[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    for (const item of cluster) item.columns = columnEnds.length;
    result.push(...cluster);
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (cluster.length > 0 && item.startMin >= clusterEnd) flushCluster();

    let column = columnEnds.findIndex((end) => end <= item.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.endMin);
    } else {
      columnEnds[column] = item.endMin;
    }

    item.column = column;
    cluster.push(item);
    clusterEnd = cluster.length === 1 ? item.endMin : Math.max(clusterEnd, item.endMin);
  }
  flushCluster();

  return result;
}

export const REMINDER_OPTIONS: { value: number | null; labelKey: string }[] = [
  { value: null, labelKey: "none" },
  { value: 0, labelKey: "atStart" },
  { value: 5, labelKey: "min5" },
  { value: 15, labelKey: "min15" },
  { value: 30, labelKey: "min30" },
  { value: 60, labelKey: "hour1" },
  { value: 1440, labelKey: "day1" },
];
