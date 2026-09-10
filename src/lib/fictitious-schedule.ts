import { startOfDay } from "date-fns";
import type { EventOccurrence, TaskWithRelations } from "@/types";

const STORAGE_KEY = "mission-fictitious-schedule";
const RESET_KEY = "mission-fictitious-schedule-reset";
const RESET_VERSION = "2026-09-10-owners-poodi-tomer";
export const FICTITIOUS_BLOCK_COLOR = "#1F4E79";
export const FICTITIOUS_FONT_MIN = 8;
export const FICTITIOUS_FONT_MAX = 24;
export const FICTITIOUS_FONT_DEFAULT = 8;
export const FICTITIOUS_OWNER_POODI = "פודי";
export const FICTITIOUS_OWNER_TOMER = "תומר";
export const FICTITIOUS_KNOWN_OWNERS = [FICTITIOUS_OWNER_POODI, FICTITIOUS_OWNER_TOMER] as const;
export const FICTITIOUS_OWNER_COLORS: Record<string, string> = {
  [FICTITIOUS_OWNER_POODI]: "#0EA5E9",
  [FICTITIOUS_OWNER_TOMER]: "#F59E0B",
};

export function fictitiousOwnerOf(block: { owner?: string | null }) {
  const owner = block.owner?.trim();
  return owner || FICTITIOUS_OWNER_POODI;
}

export function fictitiousOwnerColor(owner: string) {
  return FICTITIOUS_OWNER_COLORS[owner] ?? "#6366F1";
}

export function listFictitiousOwners(blocks: { owner?: string | null }[]) {
  const seen = new Set<string>(FICTITIOUS_KNOWN_OWNERS);
  for (const block of blocks) seen.add(fictitiousOwnerOf(block));
  return [...seen];
}

export function filterByFictitiousOwner<T extends { owner?: string | null }>(
  items: T[],
  ownerFilters: Set<string>
) {
  if (ownerFilters.size === 0) return items;
  return items.filter((item) => ownerFilters.has(fictitiousOwnerOf(item)));
}

export function stepFictitiousFontSize(current: number, delta: -1 | 1) {
  return Math.min(FICTITIOUS_FONT_MAX, Math.max(FICTITIOUS_FONT_MIN, current + delta));
}

export const OUTLOOK_COLORS = {
  navy: "#1F4E79",
  olive: "#C4A035",
  gray: "#9A9A9A",
  green: "#92D050",
  yellow: "#EAB308",
  ink: "#111827",
  burgundy: "#7F1D1D",
} as const;

export type FictitiousBlockVariant = "solid" | "ghost";

export type FictitiousBlock = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string | null;
  description?: string | null;
  color?: string | null;
  variant?: FictitiousBlockVariant;
  /** Title size in px; omitted uses the grid default. */
  fontSize?: number | null;
  /** Person this draft block belongs to, e.g. "פודי". */
  owner?: string | null;
};

export type FictitiousTaskPlacement = {
  taskId: string;
  start: string;
};

export type FictitiousScheduleState = {
  blocks: FictitiousBlock[];
  placements: FictitiousTaskPlacement[];
};

type StoredSchedules = Record<string, FictitiousScheduleState>;

function emptyState(): FictitiousScheduleState {
  return { blocks: [], placements: [] };
}

function resetStoredScheduleOnce() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(RESET_KEY) === RESET_VERSION) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(RESET_KEY, RESET_VERSION);
  } catch {
    /* ignore quota / private mode */
  }
}

function readAll(): StoredSchedules {
  if (typeof window === "undefined") return {};
  resetStoredScheduleOnce();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredSchedules;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: StoredSchedules) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

function at(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

const SEED_16_TOUR_DETAILS = [
  "12:00-12:45 - ארוחת צהריים (חד״א נגדים)",
  "12:45-13:00 - נסיעה לחד״ת מופ״ת",
  "13:00-13:30 - הצגת בסיס 108 ע״י מב״ס (חד״ת מופ״ת)",
  "13:30-15:00 - סיור במחלקות: פיתוח תקשוב, קרנות, מערכת בדיקות REI, הנדסת מכונות, אינטגרציה",
  "15:00-15:30 - סיכום ושאלות (חד״ת מופ״ת)",
].join("\n");

/** Draft roster for 16 Sep 2026 — Outlook-colored blocks. */
export const FICTITIOUS_SEED_BLOCKS: FictitiousBlock[] = [
  {
    id: "fictitious-16-kabat",
    title: "FW: קאבט״ר - כנס מצטיינים",
    start: at(2026, 9, 16, 8, 0),
    end: at(2026, 9, 16, 17, 0),
    color: OUTLOOK_COLORS.green,
    description: "יישלח בהמשך",
  },
  {
    id: "fictitious-16-status-tasks",
    title: "המשך סטטוס מעקב מטלות",
    start: at(2026, 9, 16, 8, 30),
    end: at(2026, 9, 16, 9, 30),
    color: OUTLOOK_COLORS.navy,
    location: "חד״ן מפקד 108, בסיס 108/מפקד · VC-578-3518",
  },
  {
    id: "fictitious-16-sihat-heteh",
    title: "שיחת חתך - קבע מובהק",
    start: at(2026, 9, 16, 10, 0),
    end: at(2026, 9, 16, 11, 0),
    color: OUTLOOK_COLORS.navy,
    location: "חד״ן מפקד 108, בסיס 108/מפקד · 578-3518",
  },
  {
    id: "fictitious-16-taahkir",
    title: "תחקיר ״שאגת הארי״ - העמקה בסוגיית השונות",
    start: at(2026, 9, 16, 10, 30),
    end: at(2026, 9, 16, 11, 45),
    color: OUTLOOK_COLORS.olive,
    location: "חד״ן לכל״א",
  },
  {
    id: "fictitious-16-doctrine",
    title: "דיון הכנה - דוקטרינת רלצ״ד",
    start: at(2026, 9, 16, 11, 30),
    end: at(2026, 9, 16, 12, 0),
    color: OUTLOOK_COLORS.navy,
  },
  {
    id: "fictitious-16-siur",
    title: "סיור קורס אודם מפא״ת",
    start: at(2026, 9, 16, 12, 0),
    end: at(2026, 9, 16, 15, 30),
    color: OUTLOOK_COLORS.gray,
    location: "בסיס 108 / בסיס 108/מפקד",
    description: SEED_16_TOUR_DETAILS,
  },
  {
    id: "fictitious-16-lunch",
    title: "ארוחת צהריים",
    start: at(2026, 9, 16, 12, 0),
    end: at(2026, 9, 16, 12, 45),
    color: OUTLOOK_COLORS.navy,
    location: "חד״א נגדים",
  },
  {
    id: "fictitious-16-external",
    title: "אירוע חיצוני, מפא״ת - סיור קורס אודם",
    start: at(2026, 9, 16, 12, 0),
    end: at(2026, 9, 16, 15, 30),
    color: OUTLOOK_COLORS.green,
    location: "חד״ת מופ״ת · בח״א צריפין / תוכנית תקופתית",
    description: "איש קשר: משולם פנחס, 052-9217113",
  },
  {
    id: "fictitious-16-mabas",
    title: "הצגת בסיס 108 ע״י מב״ס",
    start: at(2026, 9, 16, 13, 0),
    end: at(2026, 9, 16, 13, 30),
    color: OUTLOOK_COLORS.navy,
    location: "חד״ת מופ״ת",
  },
  {
    id: "fictitious-16-binuy",
    title: "דיון סטטוס בינוי",
    start: at(2026, 9, 16, 13, 45),
    end: at(2026, 9, 16, 14, 45),
    color: OUTLOOK_COLORS.navy,
    location: "חד״ן מפקד 108, בסיס 108/מפקד · VC-578-3518",
  },
  {
    id: "fictitious-16-hizdalf-pikud",
    title: "החלפת פיקוד מפקד ביסל״א 883",
    start: at(2026, 9, 16, 17, 0),
    end: at(2026, 9, 16, 18, 0),
    variant: "ghost",
    color: null,
    location: "ביסל״א 883/מפקד",
  },
  {
    id: "fictitious-16-tomer-f151a",
    title: "תוכנית F151A — היערכות לסקר תשתיות",
    start: at(2026, 9, 16, 10, 0),
    end: at(2026, 9, 16, 10, 45),
    color: OUTLOOK_COLORS.yellow,
    location: "צפי מועד 9, חד״ן רמ״ה תוכניות והנדסת כלי טיס",
    description: "התנעת קבוצות עבודה\nהטכנולוגי / תוכניות והנדסת כלי טיס",
    owner: FICTITIOUS_OWNER_TOMER,
  },
  {
    id: "fictitious-16-tomer-pa-mmh",
    title: "פ״ע ממ״ח משאבים וקו״מ אבא״ו",
    start: at(2026, 9, 16, 10, 45),
    end: at(2026, 9, 16, 11, 30),
    color: OUTLOOK_COLORS.ink,
    location: "משרד מבורך; בארי בוטנרו",
    description: "התוכן של פעילות זו התעדכן",
    owner: FICTITIOUS_OWNER_TOMER,
  },
  {
    id: "fictitious-16-tomer-status-tatam",
    title: "סטטוס ת״ע ת״מ",
    start: at(2026, 9, 16, 12, 0),
    end: at(2026, 9, 16, 13, 0),
    color: OUTLOOK_COLORS.burgundy,
    location: "מפקד תוה״ן; בסיס 108/תוה״ן/מפקד",
    owner: FICTITIOUS_OWNER_TOMER,
  },
  {
    id: "fictitious-16-tomer-tohan-visit",
    title: "המשך ביקור יחידת תוה״ן",
    start: at(2026, 9, 16, 13, 0),
    end: at(2026, 9, 16, 16, 0),
    color: OUTLOOK_COLORS.ink,
    location: "יחידת תוה״ן · בארי בוטנרו",
    description: [
      "13:00-15:30 - ביקור יחידת תוה״ן",
      "15:30-16:00 - סיכום תכולות ויציאה לדרך — אפיון שיפוץ לשכת 108",
      "רלוונטיים: תומר מבורך, אוהד שמריהו, אלכסיי שמובסקי, אור מיכאלי",
    ].join("\n"),
    owner: FICTITIOUS_OWNER_TOMER,
  },
];

export function mergeFictitiousSeed(state: FictitiousScheduleState): FictitiousScheduleState {
  const existingIds = new Set(state.blocks.map((block) => block.id));
  const missing = FICTITIOUS_SEED_BLOCKS.filter((block) => !existingIds.has(block.id));
  const blocks = [...state.blocks, ...missing].map((block) => ({
    ...block,
    owner: fictitiousOwnerOf(block),
  }));
  return { ...state, blocks };
}

export function readFictitiousSchedule(areaId: string): FictitiousScheduleState {
  const stored = readAll()[areaId];
  const base = stored
    ? {
        blocks: Array.isArray(stored.blocks) ? stored.blocks : [],
        placements: Array.isArray(stored.placements) ? stored.placements : [],
      }
    : emptyState();
  return mergeFictitiousSeed(base);
}

export function persistFictitiousSchedule(areaId: string, state: FictitiousScheduleState) {
  const all = readAll();
  all[areaId] = state;
  writeAll(all);
}

export function newFictitiousBlockId() {
  return crypto.randomUUID();
}

export function isFictitiousOccurrence(occurrence: Pick<EventOccurrence, "category">): boolean {
  return occurrence.category?.id.startsWith("fictitious") ?? false;
}

export function fictitiousOccurrenceVariant(
  occurrence: Pick<EventOccurrence, "category">
): FictitiousBlockVariant {
  return occurrence.category?.id === "fictitious-ghost" ? "ghost" : "solid";
}

export function blockToOccurrence(block: FictitiousBlock): EventOccurrence {
  const start = new Date(block.start);
  const end = new Date(block.end);
  const variant = block.variant ?? "solid";
  return {
    id: block.id,
    title: block.title,
    description: block.description ?? null,
    location: block.location ?? null,
    start,
    end,
    allDay: !!block.allDay,
    showAs: variant === "ghost" ? "FREE" : "TENTATIVE",
    reminderMinutes: null,
    recurrencePattern: null,
    recurrenceInterval: 1,
    recurrenceWeekdays: [],
    recurrenceUntil: null,
    recurrenceCount: null,
    recurrenceExceptions: [],
    seriesId: null,
    originalStart: null,
    categoryId: null,
    category: {
      id: variant === "ghost" ? "fictitious-ghost" : "fictitious-solid",
      name: "פיקטיבי",
      color: block.color ?? FICTITIOUS_BLOCK_COLOR,
      createdAt: start,
    },
    areaId: null,
    area: null,
    createdAt: start,
    updatedAt: start,
    occurrenceId: block.id,
    occurrenceStart: start.toISOString(),
    isRecurring: false,
    seriesStart: start,
    seriesEnd: end,
    fontSize: block.fontSize ?? null,
    owner: fictitiousOwnerOf(block),
  };
}

export function applyFictitiousPlacement(
  task: TaskWithRelations,
  placement: FictitiousTaskPlacement | undefined
): TaskWithRelations {
  if (!placement) {
    return { ...task, scheduledAt: null, dueDate: null };
  }
  const start = new Date(placement.start);
  return {
    ...task,
    scheduledAt: start,
    dueDate: startOfDay(start),
  };
}
