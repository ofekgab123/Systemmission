import {
  TaskStatus,
  Priority,
  Impact,
  Urgency,
  EnergyLevel,
  TaskCategory,
  ProjectStatus,
} from "@/generated/prisma/enums";
import {
  Inbox,
  CalendarClock,
  CircleDot,
  PlayCircle,
  Clock,
  Ban,
  Eye,
  CalendarDays,
  Archive,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type StatusColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "gray";

export const STATUS_COLOR_CLASSES: Record<
  StatusColor,
  { text: string; bg: string; border: string; dot: string }
> = {
  red: {
    text: "text-status-red",
    bg: "bg-status-red/10",
    border: "border-status-red/20",
    dot: "bg-status-red",
  },
  orange: {
    text: "text-status-orange",
    bg: "bg-status-orange/10",
    border: "border-status-orange/20",
    dot: "bg-status-orange",
  },
  yellow: {
    text: "text-status-yellow",
    bg: "bg-status-yellow/10",
    border: "border-status-yellow/20",
    dot: "bg-status-yellow",
  },
  green: {
    text: "text-status-green",
    bg: "bg-status-green/10",
    border: "border-status-green/20",
    dot: "bg-status-green",
  },
  blue: {
    text: "text-status-blue",
    bg: "bg-status-blue/10",
    border: "border-status-blue/20",
    dot: "bg-status-blue",
  },
  purple: {
    text: "text-status-purple",
    bg: "bg-status-purple/10",
    border: "border-status-purple/20",
    dot: "bg-status-purple",
  },
  gray: {
    text: "text-status-gray",
    bg: "bg-status-gray/10",
    border: "border-status-gray/20",
    dot: "bg-status-gray",
  },
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; color: StatusColor; icon: LucideIcon; description: string }
> = {
  INBOX: {
    label: "תיבת נכנס",
    color: "gray",
    icon: Inbox,
    description: "עדיין לא סודר",
  },
  PLANNED: {
    label: "מתוכנן",
    color: "gray",
    icon: CalendarClock,
    description: "מתוכנן, טרם התחיל",
  },
  READY: {
    label: "מוכן",
    color: "blue",
    icon: CircleDot,
    description: "מוכן להתחלה",
  },
  IN_PROGRESS: {
    label: "בביצוע",
    color: "blue",
    icon: PlayCircle,
    description: "מתבצע כרגע",
  },
  WAITING: {
    label: "ממתין",
    color: "yellow",
    icon: Clock,
    description: "מחכה לאדם אחר",
  },
  BLOCKED: {
    label: "חסום",
    color: "red",
    icon: Ban,
    description: "לא ניתן להתקדם",
  },
  REVIEW: {
    label: "בבדיקה",
    color: "purple",
    icon: Eye,
    description: "הושלם, דורש בדיקה",
  },
  SCHEDULED: {
    label: "מתוזמן",
    color: "blue",
    icon: CalendarDays,
    description: "מתוזמן לזמן מסוים",
  },
  SOMEDAY: {
    label: "מושהה",
    color: "gray",
    icon: Archive,
    description: "לא פעיל כרגע",
  },
  DONE: {
    label: "הושלם",
    color: "green",
    icon: CheckCircle2,
    description: "הושלם",
  },
  CANCELLED: {
    label: "בוטל",
    color: "gray",
    icon: XCircle,
    description: "בוטל",
  },
};

export const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  "INBOX",
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "WAITING",
  "BLOCKED",
  "REVIEW",
  "SCHEDULED",
];

/** סטטוסים לבחירה ב-UI (ללא SOMEDAY) */
export const SELECTABLE_TASK_STATUSES: TaskStatus[] = ACTIVE_TASK_STATUSES;

export const SELECTABLE_PRIORITIES: Priority[] = ["P0", "P1", "P2", "P3"];

export const PRIORITY_META: Record<
  Priority,
  { label: string; short: string; color: StatusColor; weight: number }
> = {
  P0: { label: "P0 · קריטי", short: "P0", color: "red", weight: 5 },
  P1: { label: "P1 · גבוה", short: "P1", color: "orange", weight: 4 },
  P2: { label: "P2 · בינוני", short: "P2", color: "yellow", weight: 3 },
  P3: { label: "P3 · נמוך", short: "P3", color: "blue", weight: 2 },
  P4: { label: "P4 · נמוך מאוד", short: "P4", color: "gray", weight: 1 },
};

export const IMPACT_META: Record<Impact, { label: string; weight: number }> = {
  VERY_HIGH: { label: "גבוהה מאוד", weight: 4 },
  HIGH: { label: "גבוהה", weight: 3 },
  MEDIUM: { label: "בינונית", weight: 2 },
  LOW: { label: "נמוכה", weight: 1 },
};

export const URGENCY_META: Record<Urgency, { label: string; weight: number }> = {
  HIGH: { label: "גבוהה", weight: 3 },
  MEDIUM: { label: "בינונית", weight: 2 },
  LOW: { label: "נמוכה", weight: 1 },
};

export const ENERGY_META: Record<
  EnergyLevel,
  { label: string; symbol: string }
> = {
  LOW: { label: "אנרגיה נמוכה", symbol: "⚡" },
  MEDIUM: { label: "אנרגיה בינונית", symbol: "⚡⚡" },
  DEEP: { label: "מיקוד עמוק", symbol: "⚡⚡⚡" },
};

export const CATEGORY_META: Record<TaskCategory, { label: string }> = {
  DEVELOPMENT: { label: "פיתוח" },
  RESEARCH: { label: "מחקר" },
  MEETING: { label: "פגישה" },
  ADMINISTRATION: { label: "ניהול" },
  PURCHASE: { label: "קנייה" },
  COMMUNICATION: { label: "תקשורת" },
  BUG: { label: "באג" },
  PLANNING: { label: "תכנון" },
  FINANCE: { label: "כספים" },
  PERSONAL: { label: "אישי" },
  OTHER: { label: "אחר" },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; color: StatusColor }
> = {
  PLANNING: { label: "תכנון", color: "gray" },
  ACTIVE: { label: "פעיל", color: "blue" },
  ON_HOLD: { label: "מושהה", color: "yellow" },
  WAITING: { label: "ממתין", color: "yellow" },
  BLOCKED: { label: "חסום", color: "red" },
  COMPLETED: { label: "הושלם", color: "green" },
  ARCHIVED: { label: "בארכיון", color: "gray" },
};

export const ESTIMATE_PRESETS = [
  { label: "5 דק'", minutes: 5 },
  { label: "15 דק'", minutes: 15 },
  { label: "30 דק'", minutes: 30 },
  { label: "שעה", minutes: 60 },
  { label: "2 שעות", minutes: 120 },
  { label: "חצי יום", minutes: 240 },
  { label: "יום שלם", minutes: 480 },
];

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} דק'`;
  const hours = minutes / 60;
  if (hours % 1 === 0) return `${hours} ש'`;
  return `${Math.floor(hours)} ש' ${minutes % 60} דק'`;
}
