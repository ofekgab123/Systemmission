import type { RecurrencePattern } from "@/generated/prisma/enums";
import { he } from "@/lib/i18n/he";

export type RecurrencePatternValue = RecurrencePattern;

export const RECURRENCE_PATTERN_OPTIONS: {
  value: RecurrencePatternValue;
  label: string;
  needsWeekday?: boolean;
}[] = [
  { value: "DAILY", label: he.recurrence.daily },
  { value: "WEEKLY", label: he.recurrence.weekly },
  { value: "BIWEEKLY", label: he.recurrence.biweekly },
  { value: "MONTHLY", label: he.recurrence.monthly },
  { value: "YEARLY", label: he.recurrence.yearly },
  { value: "WEEKDAY", label: he.recurrence.weekday, needsWeekday: true },
];

export const RECURRENCE_WEEKDAY_OPTIONS = he.recurrence.weekdays.map((label, value) => ({
  value,
  label,
}));

export function recurrenceNeedsWeekday(pattern: RecurrencePatternValue | null | undefined) {
  return pattern === "WEEKDAY";
}

export function formatRecurrenceLabel(
  pattern: RecurrencePatternValue | null | undefined,
  weekday?: number | null
): string | null {
  if (!pattern) return null;
  const option = RECURRENCE_PATTERN_OPTIONS.find((item) => item.value === pattern);
  if (!option) return null;
  if (pattern === "WEEKDAY" && weekday != null) {
    const day = RECURRENCE_WEEKDAY_OPTIONS.find((item) => item.value === weekday);
    return day ? `${option.label}: ${day.label}` : option.label;
  }
  return option.label;
}

export function recurrencePayload(
  enabled: boolean,
  pattern: RecurrencePatternValue | null,
  weekday: number | null
) {
  if (!enabled || !pattern) {
    return { recurrencePattern: null, recurrenceWeekday: null };
  }
  return {
    recurrencePattern: pattern,
    recurrenceWeekday: pattern === "WEEKDAY" ? weekday : null,
  };
}

export function isRecurrenceValid(
  enabled: boolean,
  pattern: RecurrencePatternValue | null,
  weekday: number | null
) {
  if (!enabled) return true;
  if (!pattern) return false;
  if (pattern === "WEEKDAY" && (weekday == null || weekday < 0 || weekday > 6)) return false;
  return true;
}
