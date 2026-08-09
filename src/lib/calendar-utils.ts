import { startOfDay, format } from "date-fns";
import type { TaskWithRelations } from "@/types";
import type { Urgency, Priority } from "@/generated/prisma/enums";
import { PRIORITY_META, STATUS_COLOR_CLASSES, type StatusColor } from "@/lib/task-meta";

export type CalendarColorMode = "combined" | "project" | "urgency" | "priority";

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
  return ["w-full truncate rounded px-1.5 py-0.5 text-start text-[10px] leading-tight md:text-[11px]", ...parts]
    .filter(Boolean)
    .join(" ");
}
