export const MOTIVATION_ALERTS_STORAGE_KEY = "mission-motivation-alerts-enabled";
export const MOTIVATION_ALERTS_CHANGE_EVENT = "mission-motivation-alerts-change";

export const MOTIVATION_ALERT_INTERVAL_MS = 5 * 60 * 1000;
export const MOTIVATION_ALERT_DISPLAY_MS = 60 * 1000;

export const MOTIVATION_QUOTES = [
  "את מסוגלת להרבה יותר ממה שאת מדמיינת.",
  "אל תחכי להזדמנות — תיצרי אותה.",
  "הדרך שלך להצלחה מתחילה בהחלטה לא לוותר.",
  "את מוצלחת — תמשיכי בדיוק ככה! ⭐",
  "כל צעד קטן מקרב אותך למשהו גדול.",
  "תכווני גבוה — ותוכיחי לעצמך שאת יכולה.",
  "החלומות שלך מחכים שתהפכי אותם למציאות.",
  "יש לך את זה — רואים שאת בדרך הנכונה! ⭐",
  "אל תפחדי לנסות, תפחדי להישאר במקום.",
  "ההצלחה מתחילה במקום שבו התירוצים נגמרים.",
  "תהיי האחת שלא ויתרה כשהיה קשה.",
  "את אלופה — העבודה שלך מדברת בעד עצמה! ⭐",
  "מה שנראה רחוק היום, יהיה ההישג שלך מחר.",
  "תעבדי בשקט — ותני לתוצאות לעשות רעש.",
  "אל תחפשי את הרגע המושלם — תהפכי את הרגע למושלם.",
  "את עושה עבודה מדהימה — תמשיכי בכל הכוח! ⭐",
  "הגבול היחיד שלך הוא זה שאת מסכימה לקבל.",
  "תאמיני בדרך, גם לפני שאת רואה את התוצאה.",
  "אל תעצרי כשקשה — תעצרי כשסיימת.",
  "העתיד שלך נבנה מהבחירות שאת עושה היום.",
] as const;

export function readMotivationAlertsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(MOTIVATION_ALERTS_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function persistMotivationAlertsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOTIVATION_ALERTS_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent(MOTIVATION_ALERTS_CHANGE_EVENT, { detail: enabled }));
  } catch {
    /* ignore */
  }
}

export function shuffleQuotes<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
