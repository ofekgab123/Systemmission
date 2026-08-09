export const STICKY_NOTE_COLORS = ["#fef08a", "#fbcfe8", "#bfdbfe", "#bbf7d0", "#fed7aa"] as const;

export const SNOOZE_OPTIONS = [
  { minutes: 30, labelKey: "minutes30" as const },
  { minutes: 60, labelKey: "hour1" as const },
  { minutes: 180, labelKey: "hours3" as const },
  { minutes: -1, labelKey: "tomorrow" as const },
] as const;

export function snoozeUntil(minutes: number, from = new Date()) {
  if (minutes === -1) {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
    return next;
  }
  return addMinutes(from, minutes);
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function defaultNextAlertAt(from = new Date()) {
  return addMinutes(from, 60);
}

export function pickStickyColor(index: number) {
  return STICKY_NOTE_COLORS[index % STICKY_NOTE_COLORS.length];
}
