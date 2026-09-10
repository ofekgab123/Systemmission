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

function hexLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  if (raw.length < 6) return 0;
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Solid Outlook-style event tile (or ghost text with no card). */
export function outlookEventBlockStyle(
  color: string | null | undefined,
  variant: "solid" | "ghost" = "solid"
): {
  backgroundColor: string;
  border: string;
  boxShadow: string;
  color: string;
} {
  if (variant === "ghost" || !color) {
    return {
      backgroundColor: "transparent",
      border: "none",
      boxShadow: "none",
      color: "#1F2937",
    };
  }
  return {
    backgroundColor: color,
    border: "1px solid rgba(0,0,0,.14)",
    boxShadow: "0 1px 1px rgba(0,0,0,.08)",
    color: hexLuminance(color) > 0.62 ? "#1F2937" : "#FFFFFF",
  };
}
