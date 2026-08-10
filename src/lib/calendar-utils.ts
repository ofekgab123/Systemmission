import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, addDays, addWeeks, addMonths, isSameMonth, differenceInMinutes } from "date-fns";
import type { TaskWithRelations } from "@/types";
import type { Urgency, Priority } from "@/generated/prisma/enums";
import { PRIORITY_META, STATUS_COLOR_CLASSES, type StatusColor } from "@/lib/task-meta";

export type CalendarColorMode = "combined" | "project" | "urgency" | "priority";
export type CalendarViewMode = "day" | "workweek" | "week" | "month";

export function getCalendarRange(anchor: Date, mode: CalendarViewMode): { start: Date; end: Date } {
  if (mode === "day") {
    return { start: startOfDay(anchor), end: endOfDay(anchor) };
  }
  if (mode === "workweek") {
    const start = startOfWeek(anchor, { weekStartsOn: 0 });
    return { start, end: endOfDay(addDays(start, 4)) };
  }
  if (mode === "week") {
    return {
      start: startOfWeek(anchor, { weekStartsOn: 0 }),
      end: endOfWeek(anchor, { weekStartsOn: 0 }),
    };
  }
  return {
    start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 0 }),
  };
}

export function shiftCalendarAnchor(
  anchor: Date,
  mode: CalendarViewMode,
  direction: -1 | 1
): Date {
  if (mode === "day") return addDays(anchor, direction);
  if (mode === "week" || mode === "workweek") return addWeeks(anchor, direction);
  return addMonths(startOfMonth(anchor), direction);
}

export function formatCalendarPeriodLabel(anchor: Date, mode: CalendarViewMode): string {
  if (mode === "day") {
    return new Intl.DateTimeFormat("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(anchor);
  }
  if (mode === "week" || mode === "workweek") {
    const start = startOfWeek(anchor, { weekStartsOn: 0 });
    const end = mode === "workweek" ? addDays(start, 4) : endOfWeek(anchor, { weekStartsOn: 0 });
    const monthYear = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(start);
    if (isSameMonth(start, end)) {
      return `${start.getDate()}–${end.getDate()} ${monthYear}`;
    }
    const startLabel = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(start);
    const endLabel = new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(end);
    return `${startLabel} – ${endLabel}`;
  }
  return new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" }).format(anchor);
}

export function groupTasksByDay(
  tasks: TaskWithRelations[],
  showDone: boolean
): Map<string, TaskWithRelations[]> {
  const map = new Map<string, TaskWithRelations[]>();
  for (const task of tasks) {
    if (!showDone && task.status === "DONE") continue;
    const d = getTaskCalendarDate(task);
    if (!d) continue;
    const key = dayKey(d);
    const list = map.get(key) ?? [];
    list.push(task);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight);
  }
  return map;
}

const URGENCY_COLORS: Record<Urgency, StatusColor> = {
  HIGH: "red",
  MEDIUM: "orange",
  LOW: "blue",
};

export function getTaskCalendarDate(task: TaskWithRelations): Date | null {
  const raw = task.dueDate ?? task.scheduledAt;
  if (!raw) return null;
  return startOfDay(new Date(raw));
}

/** True when the task has a concrete hour/minute (via scheduledAt). */
export function hasTaskSpecificTime(task: TaskWithRelations): boolean {
  if (!task.scheduledAt) return false;
  const d = new Date(task.scheduledAt);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

export function getTaskTimedStart(task: TaskWithRelations): Date | null {
  if (!hasTaskSpecificTime(task)) return null;
  return new Date(task.scheduledAt!);
}

/** Default block length on the hour grid (minutes). */
export function getTaskDurationMinutes(task: TaskWithRelations): number {
  return Math.max(15, task.estimatedMinutes ?? 30);
}

export function splitTasksForDay(
  tasks: TaskWithRelations[],
  day: Date
): { allDay: TaskWithRelations[]; timed: TaskWithRelations[] } {
  const key = dayKey(day);
  const allDay: TaskWithRelations[] = [];
  const timed: TaskWithRelations[] = [];
  for (const task of tasks) {
    const calDate = getTaskCalendarDate(task);
    if (!calDate || dayKey(calDate) !== key) continue;
    if (hasTaskSpecificTime(task)) timed.push(task);
    else allDay.push(task);
  }
  return { allDay, timed };
}

export interface PositionedTask {
  task: TaskWithRelations;
  startMin: number;
  endMin: number;
  column: number;
  columns: number;
}

/** Lay out timed tasks side-by-side when they overlap, like Outlook events. */
export function layoutTimedTasks(tasks: TaskWithRelations[], day: Date): PositionedTask[] {
  const dayStart = startOfDay(day);
  const items = tasks
    .map((task) => {
      const start = getTaskTimedStart(task)!;
      const startMin = Math.max(0, differenceInMinutes(start, dayStart));
      const endMin = Math.min(24 * 60, startMin + getTaskDurationMinutes(task));
      return { task, startMin, endMin, column: 0, columns: 1 };
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const result: PositionedTask[] = [];
  let cluster: PositionedTask[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    for (const item of cluster) item.columns = columnEnds.length;
    result.push(...cluster);
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (cluster.length > 0 && item.startMin >= clusterEnd) flushCluster();

    let column = columnEnds.findIndex((end) => end <= item.startMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.endMin);
    } else {
      columnEnds[column] = item.endMin;
    }

    item.column = column;
    cluster.push(item);
    clusterEnd = cluster.length === 1 ? item.endMin : Math.max(clusterEnd, item.endMin);
  }
  flushCluster();
  return result;
}

export function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getUrgencyColor(urgency: Urgency | null, priority: Priority): StatusColor {
  if (urgency) return URGENCY_COLORS[urgency];
  return PRIORITY_META[priority].color;
}

export interface CalendarTaskStyle {
  className: string;
  style?: React.CSSProperties;
}

export function getCalendarTaskStyle(
  task: TaskWithRelations,
  mode: CalendarColorMode
): CalendarTaskStyle {
  const done = task.status === "DONE";
  const muted = done ? "opacity-50 line-through" : "";

  if (mode === "project") {
    const color = task.project?.color ?? "#94a3b8";
    return {
      className: cnBase(muted),
      style: {
        backgroundColor: `${color}22`,
        borderInlineStart: `3px solid ${color}`,
      },
    };
  }

  if (mode === "urgency") {
    const colorKey = getUrgencyColor(task.urgency, task.priority);
    const colors = STATUS_COLOR_CLASSES[colorKey];
    return {
      className: cnBase(muted, colors.bg, colors.border, "border-s-2"),
    };
  }

  if (mode === "priority") {
    const colors = STATUS_COLOR_CLASSES[PRIORITY_META[task.priority].color];
    return {
      className: cnBase(muted, colors.bg, colors.border, "border-s-2"),
    };
  }

  // combined: project fill + urgency/priority border
  const projectColor = task.project?.color ?? "#94a3b8";
  const borderColor = getAccentCssColor(task);
  return {
    className: cnBase(muted),
    style: {
      backgroundColor: `${projectColor}22`,
      borderInlineStart: `3px solid ${borderColor}`,
    },
  };
}

function getAccentCssColor(task: TaskWithRelations): string {
  const colorKey = getUrgencyColor(task.urgency, task.priority);
  const map: Record<StatusColor, string> = {
    red: "var(--status-red)",
    orange: "var(--status-orange)",
    yellow: "var(--status-yellow)",
    green: "var(--status-green)",
    blue: "var(--status-blue)",
    purple: "var(--status-purple)",
    gray: "var(--status-gray)",
  };
  return map[colorKey];
}

function cnBase(...parts: (string | undefined)[]): string {
  return ["w-full truncate rounded px-1.5 py-0.5 text-start text-xs leading-tight md:text-sm", ...parts]
    .filter(Boolean)
    .join(" ");
}
