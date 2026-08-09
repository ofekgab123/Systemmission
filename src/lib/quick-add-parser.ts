import { addDays, nextDay, setHours, setMinutes, startOfDay, type Day } from "date-fns";
import type { Priority } from "@/generated/prisma/enums";

export interface ParsedQuickAdd {
  title: string;
  dueDate: Date | null;
  hasTime: boolean;
  priority: Priority | null;
  projectHint: string | null;
}

const HE_WEEKDAYS: Record<string, Day> = {
  ראשון: 0,
  שני: 1,
  שלישי: 2,
  רביעי: 3,
  חמישי: 4,
  שישי: 5,
  שבת: 6,
};

const EN_WEEKDAYS: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Lightweight heuristic parser (no LLM) for the Universal Quick Add box.
 * Understands Hebrew + English relative dates, clock times, @project
 * mentions, and !p0-!p3 priority shorthand. Anything it can't confidently
 * parse is left in the title for the user to refine manually.
 */
export function parseQuickAdd(raw: string): ParsedQuickAdd {
  let text = ` ${raw.trim()} `;
  let dueDate: Date | null = null;
  let hasTime = false;
  let priority: Priority | null = null;
  let projectHint: string | null = null;

  const consume = (re: RegExp) => {
    const match = text.match(re);
    if (match) text = text.replace(re, " ");
    return match;
  };

  // Priority shorthand: !p0 .. !p3
  const priorityMatch = consume(/!p([0-3])/i);
  if (priorityMatch) priority = `P${priorityMatch[1]}` as Priority;

  // @project
  const projectMatch = consume(/@([\p{L}\p{N}_-]+)/u);
  if (projectMatch) projectHint = projectMatch[1];

  const today = () => startOfDay(new Date());

  // Hebrew relative dates
  if (consume(/מחרתיים/)) dueDate = addDays(today(), 2);
  else if (consume(/מחר/)) dueDate = addDays(today(), 1);
  else if (consume(/היום/)) dueDate = today();

  const inDaysHe = consume(/בעוד\s+(\d+)\s+ימים/);
  if (inDaysHe) dueDate = addDays(today(), parseInt(inDaysHe[1], 10));

  const inWeeksHe = consume(/בעוד\s+שבוע(?:יים)?/);
  if (inWeeksHe) dueDate = addDays(today(), inWeeksHe[0].includes("שבועיים") ? 14 : 7);

  for (const [name, dayIdx] of Object.entries(HE_WEEKDAYS)) {
    const re = new RegExp(`יום\\s+${name}|ב${name}`);
    if (re.test(text)) {
      dueDate = nextDay(today(), dayIdx);
      text = text.replace(re, " ");
      break;
    }
  }

  // English relative dates
  if (!dueDate) {
    if (consume(/\btomorrow\b/i)) dueDate = addDays(today(), 1);
    else if (consume(/\btoday\b/i)) dueDate = today();
    else {
      const inDaysEn = consume(/\bin\s+(\d+)\s+days?\b/i);
      if (inDaysEn) dueDate = addDays(today(), parseInt(inDaysEn[1], 10));
    }
  }

  if (!dueDate) {
    for (const [name, dayIdx] of Object.entries(EN_WEEKDAYS)) {
      const re = new RegExp(`\\bnext\\s+${name}\\b|\\b${name}\\b`, "i");
      if (re.test(text)) {
        dueDate = nextDay(today(), dayIdx);
        text = text.replace(re, " ");
        break;
      }
    }
  }

  // Time: "ב-10", "בשעה 10:00", "at 10am", "10:30"
  const timeHe = consume(/ב[־-]?שעה?\s*(\d{1,2})(?::(\d{2}))?/);
  const timeEn = consume(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  const timeMatch = timeHe || timeEn;
  if (timeMatch && dueDate) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    dueDate = setMinutes(setHours(dueDate, hour), minute);
    hasTime = true;
  } else if (timeMatch && !dueDate) {
    // Time mentioned without an explicit day => assume today
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    dueDate = setMinutes(setHours(today(), hour), minute);
    hasTime = true;
  }

  const title = text.replace(/\s+/g, " ").trim();

  return { title: title || raw.trim(), dueDate, hasTime, priority, projectHint };
}
