/** Visual tokens from the mobile calendar mockup. */
export const CAL = {
  primary: "#2563EB",
  primaryHover: "#1d4ed8",
  primaryLight: "#E8F0FE",
  bg: "#F4F5F7",
  surface: "#ffffff",
  border: "#EDEFF3",
  borderLight: "#EFF1F5",
  muted: "#9CA3AF",
  mutedDark: "#8A90A0",
  text: "#111827",
  textSecondary: "#374151",
  now: "#E4483D",
  stripBg: "#F1F3F7",
  allDayBg: "#FBFCFD",
  selectedColBg: "#F8FAFF",
  monthSelectedBg: "#F3F7FF",
  hourLabel: "#A6ACBA",
  fabShadow: "0 10px 22px rgba(37,99,235,.38)",
} as const;

export const CAL_HOUR_HEIGHT = 58;

const WEEKDAY_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"] as const;

export function hebrewWeekdayLetter(date: Date): string {
  return WEEKDAY_HE[date.getDay()];
}

/** Tinted event/task block colors like the mockup palette. */
export function blockColors(hex: string): { bg: string; bar: string; text: string } {
  return {
    bg: `${hex}1f`,
    bar: hex,
    text: hex,
  };
}

export function eventBlockStyle(color: string): {
  backgroundColor: string;
  borderInlineEnd: string;
  color: string;
} {
  const { bg, bar, text } = blockColors(color);
  return {
    backgroundColor: bg,
    borderInlineEnd: `3px solid ${bar}`,
    color: text,
  };
}
