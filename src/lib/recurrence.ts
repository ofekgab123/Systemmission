import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  getDate,
  getDaysInMonth,
  set,
  startOfWeek,
} from "date-fns";
import type { EventRecurrencePattern } from "@/generated/prisma/enums";

/** Safety cap on expanded instances per series. */
const MAX_OCCURRENCES = 730;

export interface RecurrenceFields {
  start: Date | string;
  end: Date | string;
  recurrencePattern: EventRecurrencePattern | null;
  recurrenceInterval: number;
  recurrenceWeekdays: number[];
  recurrenceUntil: Date | string | null;
  recurrenceCount: number | null;
  recurrenceExceptions: (Date | string)[];
}

export interface OccurrenceRange {
  start: Date;
  end: Date;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function withTimeOf(day: Date, source: Date): Date {
  return set(day, {
    hours: source.getHours(),
    minutes: source.getMinutes(),
    seconds: source.getSeconds(),
    milliseconds: source.getMilliseconds(),
  });
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

/**
 * Generates the concrete start dates of a recurring series, in order,
 * starting from the series start. Unbounded series are capped by
 * MAX_OCCURRENCES via the consumer loop.
 */
function* seriesStarts(event: RecurrenceFields): Generator<Date> {
  const seriesStart = toDate(event.start);
  const interval = Math.max(1, event.recurrenceInterval || 1);
  const pattern = event.recurrencePattern;

  if (pattern === "DAILY") {
    for (let i = 0; ; i++) {
      yield addDays(seriesStart, i * interval);
    }
  }

  if (pattern === "WEEKLY") {
    const weekdays =
      event.recurrenceWeekdays.length > 0
        ? [...new Set(event.recurrenceWeekdays)].sort((a, b) => a - b)
        : [seriesStart.getDay()];
    const firstWeek = startOfWeek(seriesStart, { weekStartsOn: 0 });
    for (let w = 0; ; w++) {
      const weekStart = addWeeks(firstWeek, w * interval);
      for (const weekday of weekdays) {
        const candidate = withTimeOf(addDays(weekStart, weekday), seriesStart);
        if (candidate < seriesStart) continue;
        yield candidate;
      }
    }
  }

  if (pattern === "MONTHLY") {
    const dayOfMonth = getDate(seriesStart);
    for (let m = 0; ; m++) {
      const monthAnchor = addMonths(seriesStart, m * interval);
      // Months without this day (e.g. the 31st) are skipped, like Outlook.
      if (getDaysInMonth(monthAnchor) < dayOfMonth) continue;
      yield set(monthAnchor, { date: dayOfMonth });
    }
  }

  if (pattern === "YEARLY") {
    for (let y = 0; ; y++) {
      const candidate = addYears(seriesStart, y * interval);
      // Feb 29 in non-leap years drifts to Feb 28 via addYears; skip those.
      if (getDate(candidate) !== getDate(seriesStart)) continue;
      yield candidate;
    }
  }
}

/**
 * Expands an event into concrete occurrences overlapping [rangeStart, rangeEnd].
 * Non-recurring events yield at most one occurrence. Deleted occurrences
 * (recurrenceExceptions) are skipped.
 */
export function expandEventOccurrences(
  event: RecurrenceFields,
  rangeStart: Date,
  rangeEnd: Date
): OccurrenceRange[] {
  const seriesStart = toDate(event.start);
  const durationMs = toDate(event.end).getTime() - seriesStart.getTime();

  if (!event.recurrencePattern) {
    const end = toDate(event.end);
    return rangesOverlap(seriesStart, end, rangeStart, rangeEnd)
      ? [{ start: seriesStart, end }]
      : [];
  }

  const until = event.recurrenceUntil ? endOfDay(toDate(event.recurrenceUntil)) : null;
  const maxCount = event.recurrenceCount ?? null;
  const exceptions = new Set(event.recurrenceExceptions.map((d) => toDate(d).getTime()));

  const result: OccurrenceRange[] = [];
  let produced = 0;

  for (const start of seriesStarts(event)) {
    if (produced >= MAX_OCCURRENCES) break;
    if (until && start > until) break;
    if (maxCount !== null && produced + 1 > maxCount) break;
    produced++;

    if (start > rangeEnd) break;
    if (exceptions.has(start.getTime())) continue;

    const end = new Date(start.getTime() + durationMs);
    if (rangesOverlap(start, end, rangeStart, rangeEnd)) {
      result.push({ start, end });
    }
  }

  return result;
}

/** True if the event repeats. */
export function isRecurringEvent(event: Pick<RecurrenceFields, "recurrencePattern">): boolean {
  return event.recurrencePattern !== null;
}
