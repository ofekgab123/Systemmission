import {
  isToday as _isToday,
  isTomorrow as _isTomorrow,
  isYesterday,
  isPast,
  isThisWeek as _isThisWeek,
  differenceInCalendarDays,
  differenceInDays,
  format,
  startOfDay,
  endOfDay,
  addDays,
} from "date-fns";
import { he } from "date-fns/locale";

export const dateLocale = he;

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  return isPast(d) && !_isToday(d);
}

export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return _isToday(new Date(date));
}

export function isTomorrow(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return _isTomorrow(new Date(date));
}

export function isThisWeek(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return _isThisWeek(new Date(date), { weekStartsOn: 0 });
}

export function daysSince(date: Date | string | null | undefined): number {
  if (!date) return Infinity;
  return differenceInCalendarDays(new Date(), new Date(date));
}

export function daysUntil(date: Date | string | null | undefined): number {
  if (!date) return Infinity;
  return differenceInCalendarDays(new Date(date), new Date());
}

export function formatDueLabel(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isOverdue(d)) {
    const days = Math.abs(differenceInDays(startOfDay(new Date()), startOfDay(d)));
    return days === 1 ? "באיחור יום" : `באיחור ${days} ימים`;
  }
  if (_isToday(d)) return "היום";
  if (_isTomorrow(d)) return "מחר";
  if (isYesterday(d)) return "אתמול";
  const days = differenceInCalendarDays(d, new Date());
  if (days > 0 && days <= 6) return format(d, "EEEE", { locale: he });
  return format(d, "d בMMM", { locale: he });
}

export function startOfToday(): Date {
  return startOfDay(new Date());
}

export function endOfToday(): Date {
  return endOfDay(new Date());
}

export function nextNDays(n: number): Date {
  return addDays(new Date(), n);
}

export function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "לילה טוב";
  if (hour < 12) return "בוקר טוב";
  if (hour < 18) return "צהריים טובים";
  return "ערב טוב";
}

export function formatFullDate(date: Date = new Date()): string {
  return format(date, "EEEE, d בMMMM", { locale: he });
}

export function formatDateTime(date: Date | string, withTime = false): string {
  const d = new Date(date);
  return format(d, withTime ? "d בMMM, HH:mm" : "d בMMM", { locale: he });
}
