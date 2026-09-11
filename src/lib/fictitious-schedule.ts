import { startOfDay } from "date-fns";
import type { EventOccurrence, TaskWithRelations } from "@/types";

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
/** Bump when seed roster content must refresh for everyone. */
export const FICTITIOUS_SEED_VERSION = "2026-09-11-tohan-visit-details";

const LEGACY_STORAGE_KEY = "mission-fictitious-schedule";
const LEGACY_RESET_KEY = "mission-fictitious-schedule-reset";

export type FictitiousOwnerSource = {
  owners?: string[] | null;
  owner?: string | null;
};

export function fictitiousOwnersOf(block: FictitiousOwnerSource) {
  const fromList = (block.owners ?? []).map((name) => name.trim()).filter(Boolean);
  if (fromList.length > 0) return [...new Set(fromList)];
  const legacy = block.owner?.trim();
  return [legacy || FICTITIOUS_OWNER_POODI];
}

export function fictitiousOwnerOf(block: FictitiousOwnerSource) {
  return fictitiousOwnersOf(block)[0] ?? FICTITIOUS_OWNER_POODI;
}

export function fictitiousOwnerColor(owner: string) {
  return FICTITIOUS_OWNER_COLORS[owner] ?? "#6366F1";
}

export function listFictitiousOwners(blocks: FictitiousOwnerSource[]) {
  const seen = new Set<string>(FICTITIOUS_KNOWN_OWNERS);
  for (const block of blocks) {
    for (const name of fictitiousOwnersOf(block)) seen.add(name);
  }
  return [...seen];
}

export function filterByFictitiousOwner<T extends FictitiousOwnerSource>(
  items: T[],
  ownerFilters: Set<string>
) {
  if (ownerFilters.size === 0) return items;
  return items.filter((item) => fictitiousOwnersOf(item).some((name) => ownerFilters.has(name)));
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

export type FictitiousCategory = {
  id: string;
  name: string;
  color: string;
};

export type FictitiousBlock = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string | null;
  description?: string | null;
  /** When true, the description is painted on the draft square. */
  showDescription?: boolean;
  color?: string | null;
  /** Optional shared category — its color paints the square when set. */
  categoryId?: string | null;
  variant?: FictitiousBlockVariant;
  /** Title size in px; omitted uses the grid default. */
  fontSize?: number | null;
  /** People this draft block belongs to, e.g. ["פודי", "תומר"]. */
  owners?: string[] | null;
  /** @deprecated Prefer `owners`. Kept so older localStorage drafts still load. */
  owner?: string | null;
};

export type FictitiousTaskPlacement = {
  taskId: string;
  start: string;
};

export type FictitiousScheduleState = {
  blocks: FictitiousBlock[];
  placements: FictitiousTaskPlacement[];
  categories?: FictitiousCategory[];
  seedVersion?: string;
};

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

const SEED_16_TOHAN_VISIT_DETAILS = [
  "לו״ז יום ביקור מפקד 108 הנכנס:",
  "13:00-13:15 - פתיחה + נושאים למיקוד",
  "13:15-14:00 - פ״ע ממ״ח משאבים וקו״מ",
  "14:00-15:30 - סיור ביחידה",
  "15:30-15:50 - אפיון שיפוץ לשכת 108 — סיכום תכולות ויציאה לדרך",
  "15:50-16:00 - סיכום",
  "",
  "תחנות הסיור:",
  "14:00 - מחלקת תחום מכני",
  "14:15 - תחום מכני הנדסה",
  "14:30 - חוות שרתים ומחלקות מחשוב",
  "14:45 - מחסן מצ״מ",
  "15:00 - מחסן אוטומטי",
  "15:30 - מחסן בלק",
  "",
  "רלוונטיים לשיפוץ: תומר מבורך, אוהד שמריהו, אלכסיי שמובסקי, אור מיכאלי",
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
    owners: [FICTITIOUS_OWNER_TOMER],
  },
  {
    id: "fictitious-16-tomer-pa-mmh",
    title: "פ״ע ממ״ח משאבים וקו״מ אבא״ו",
    start: at(2026, 9, 16, 10, 45),
    end: at(2026, 9, 16, 11, 30),
    color: OUTLOOK_COLORS.ink,
    location: "משרד מבורך; בארי בוטנרו",
    description: "התוכן של פעילות זו התעדכן",
    owners: [FICTITIOUS_OWNER_TOMER],
  },
  {
    id: "fictitious-16-tomer-status-tatam",
    title: "סטטוס ת״ע ת״מ",
    start: at(2026, 9, 16, 12, 0),
    end: at(2026, 9, 16, 13, 0),
    color: OUTLOOK_COLORS.burgundy,
    location: "מפקד תוה״ן; בסיס 108/תוה״ן/מפקד",
    owners: [FICTITIOUS_OWNER_TOMER],
  },
  {
    id: "fictitious-16-tomer-tohan-visit",
    title: "המשך ביקור יחידת תוה״ן",
    start: at(2026, 9, 16, 13, 0),
    end: at(2026, 9, 16, 16, 0),
    color: OUTLOOK_COLORS.ink,
    location: "יחידת תוה״ן · בארי בוטנרו",
    description: SEED_16_TOHAN_VISIT_DETAILS,
    owners: [FICTITIOUS_OWNER_TOMER],
  },
];

function normalizeBlocks(blocks: FictitiousBlock[]): FictitiousBlock[] {
  return blocks.map((block) => {
    const owners = fictitiousOwnersOf(block);
    return { ...block, owners, owner: owners[0] ?? FICTITIOUS_OWNER_POODI };
  });
}

export function emptyFictitiousSchedule(): FictitiousScheduleState {
  return { blocks: [], placements: [], categories: [], seedVersion: FICTITIOUS_SEED_VERSION };
}

export function newFictitiousCategoryId() {
  return crypto.randomUUID();
}

export function sanitizeFictitiousCategory(raw: unknown): FictitiousCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<FictitiousCategory>;
  const id = typeof value.id === "string" ? value.id.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const color =
    typeof value.color === "string" && /^#([0-9a-fA-F]{6})$/.test(value.color.trim())
      ? value.color.trim().toUpperCase()
      : "";
  if (!id || !name || !color) return null;
  return { id, name, color };
}

export function sanitizeFictitiousCategories(raw: unknown): FictitiousCategory[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const categories: FictitiousCategory[] = [];
  for (const item of raw) {
    const category = sanitizeFictitiousCategory(item);
    if (!category || seen.has(category.id)) continue;
    seen.add(category.id);
    categories.push(category);
  }
  return categories;
}

export function findFictitiousCategory(
  categories: FictitiousCategory[] | null | undefined,
  categoryId: string | null | undefined
) {
  if (!categoryId) return null;
  return categories?.find((category) => category.id === categoryId) ?? null;
}

export function resolveFictitiousBlockColor(
  block: Pick<FictitiousBlock, "color" | "categoryId" | "variant">,
  categories: FictitiousCategory[] | null | undefined
): string | null {
  if ((block.variant ?? "solid") === "ghost") return null;
  const fromCategory = findFictitiousCategory(categories, block.categoryId)?.color;
  if (fromCategory) return fromCategory;
  return block.color ?? FICTITIOUS_BLOCK_COLOR;
}

/** Colors already used on blocks/categories, most frequent first. */
export function collectUsedFictitiousColors(
  blocks: FictitiousBlock[],
  categories: FictitiousCategory[] | null | undefined = []
): string[] {
  const counts = new Map<string, number>();
  const bump = (raw: string | null | undefined) => {
    if (!raw) return;
    const hex = raw.trim().toUpperCase();
    if (!/^#([0-9A-F]{6})$/.test(hex)) return;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  };

  for (const category of categories ?? []) bump(category.color);
  for (const block of blocks) {
    if ((block.variant ?? "solid") === "ghost") continue;
    bump(resolveFictitiousBlockColor(block, categories) ?? block.color);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([color]) => color);
}

export function upsertFictitiousCategory(
  categories: FictitiousCategory[],
  next: FictitiousCategory
): FictitiousCategory[] {
  const exists = categories.some((category) => category.id === next.id);
  return exists
    ? categories.map((category) => (category.id === next.id ? next : category))
    : [...categories, next];
}

export function removeFictitiousCategory(
  state: FictitiousScheduleState,
  categoryId: string
): FictitiousScheduleState {
  return {
    ...state,
    categories: (state.categories ?? []).filter((category) => category.id !== categoryId),
    blocks: state.blocks.map((block) =>
      block.categoryId === categoryId ? { ...block, categoryId: null } : block
    ),
  };
}

/** Adds any seed blocks that are still missing (does not overwrite edits). */
export function mergeFictitiousSeed(state: FictitiousScheduleState): FictitiousScheduleState {
  const existingIds = new Set(state.blocks.map((block) => block.id));
  const missing = FICTITIOUS_SEED_BLOCKS.filter((block) => !existingIds.has(block.id));
  return {
    ...state,
    blocks: normalizeBlocks([...state.blocks, ...missing]),
    categories: sanitizeFictitiousCategories(state.categories),
    seedVersion: state.seedVersion ?? FICTITIOUS_SEED_VERSION,
  };
}

/**
 * When seed version changes, refresh built-in seed blocks from code while keeping
 * custom (non-seed) blocks and task placements.
 */
export function applyFictitiousSeedVersion(
  state: FictitiousScheduleState
): { state: FictitiousScheduleState; changed: boolean } {
  const currentVersion = state.seedVersion ?? "";
  if (currentVersion === FICTITIOUS_SEED_VERSION) {
    const merged = mergeFictitiousSeed(state);
    const changed =
      merged.blocks.length !== state.blocks.length ||
      merged.seedVersion !== state.seedVersion;
    return { state: { ...merged, seedVersion: FICTITIOUS_SEED_VERSION }, changed };
  }

  const seedIds = new Set(FICTITIOUS_SEED_BLOCKS.map((block) => block.id));
  const custom = state.blocks.filter((block) => !seedIds.has(block.id));
  return {
    state: {
      ...state,
      blocks: normalizeBlocks([...FICTITIOUS_SEED_BLOCKS, ...custom]),
      categories: sanitizeFictitiousCategories(state.categories),
      seedVersion: FICTITIOUS_SEED_VERSION,
    },
    changed: true,
  };
}

export function sanitizeFictitiousSchedule(raw: unknown): FictitiousScheduleState {
  if (!raw || typeof raw !== "object") return emptyFictitiousSchedule();
  const value = raw as Partial<FictitiousScheduleState>;
  return {
    blocks: Array.isArray(value.blocks) ? (value.blocks as FictitiousBlock[]) : [],
    placements: Array.isArray(value.placements)
      ? (value.placements as FictitiousTaskPlacement[])
      : [],
    categories: sanitizeFictitiousCategories(value.categories),
    seedVersion: typeof value.seedVersion === "string" ? value.seedVersion : "",
  };
}

/** One-time: pull a browser-local draft so it can be uploaded to the shared DB. */
export function takeLegacyLocalFictitiousSchedule(areaId: string): FictitiousScheduleState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entry = parsed?.[areaId];
    if (!entry) return null;
    const state = sanitizeFictitiousSchedule(entry);
    if (state.blocks.length === 0 && state.placements.length === 0) return null;
    delete parsed[areaId];
    if (Object.keys(parsed).length === 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_RESET_KEY);
    } else {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(parsed));
    }
    return state;
  } catch {
    return null;
  }
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

export function blockToOccurrence(
  block: FictitiousBlock,
  categories?: FictitiousCategory[] | null
): EventOccurrence {
  const start = new Date(block.start);
  const end = new Date(block.end);
  const variant = block.variant ?? "solid";
  const color = resolveFictitiousBlockColor(block, categories);
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
    categoryId: block.categoryId ?? null,
    category: {
      id: variant === "ghost" ? "fictitious-ghost" : "fictitious-solid",
      name: findFictitiousCategory(categories, block.categoryId)?.name ?? "פיקטיבי",
      color: color ?? FICTITIOUS_BLOCK_COLOR,
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
    owners: fictitiousOwnersOf(block),
    owner: fictitiousOwnerOf(block),
    showDescription: !!block.showDescription,
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
