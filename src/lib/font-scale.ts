export const FONT_SCALE_LEVELS = [-2, -1, 0, 1, 2, 3] as const;
export type FontScaleLevel = (typeof FONT_SCALE_LEVELS)[number];

export const FONT_SCALE_STORAGE_KEY = "mission-font-scale";

const MULTIPLIERS: Record<FontScaleLevel, number> = {
  [-2]: 0.85,
  [-1]: 0.925,
  [0]: 1,
  [1]: 1.075,
  [2]: 1.15,
  [3]: 1.25,
};

export function isFontScaleLevel(value: unknown): value is FontScaleLevel {
  return typeof value === "number" && FONT_SCALE_LEVELS.includes(value as FontScaleLevel);
}

export function readStoredFontScale(): FontScaleLevel {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = Number.parseInt(raw, 10);
    return isFontScaleLevel(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

export function applyFontScale(level: FontScaleLevel) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--font-scale", String(MULTIPLIERS[level]));
  document.documentElement.dataset.fontScale = String(level);
}

export function persistFontScale(level: FontScaleLevel) {
  try {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(level));
  } catch {
    /* ignore */
  }
  applyFontScale(level);
}

export function fontScaleLabel(level: FontScaleLevel): string {
  if (level === 0) return "100%";
  if (level > 0) return `+${level}`;
  return String(level);
}

export function fontScalePercentLabel(level: FontScaleLevel): string {
  return `${Math.round(MULTIPLIERS[level] * 100)}%`;
}
