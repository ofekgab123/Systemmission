"use client";

import { useMemo } from "react";
import type { TaskWithRelations } from "@/types";
import {
  type CalendarColorMode,
  getUrgencyColor,
} from "@/lib/calendar-utils";
import { PRIORITY_META, STATUS_COLOR_CLASSES } from "@/lib/task-meta";
import type { Urgency } from "@/generated/prisma/enums";
import { he } from "@/lib/i18n/he";

const URGENCY_LABELS: Record<Urgency, string> = {
  HIGH: he.task.urgencyHigh,
  MEDIUM: he.task.urgencyMedium,
  LOW: he.task.urgencyLow,
};

export function CalendarLegend({
  tasks,
  colorMode,
}: {
  tasks: TaskWithRelations[];
  colorMode: CalendarColorMode;
}) {
  const projects = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const task of tasks) {
      if (task.project) {
        map.set(task.project.id, {
          name: task.project.name,
          color: task.project.color,
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [tasks]);

  if (colorMode === "project" || colorMode === "combined") {
    if (projects.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <span className="w-full text-xs font-medium text-muted-foreground md:w-auto">
          {he.calendar.legendProjects}
        </span>
        {projects.map((p) => (
          <span key={p.name} className="inline-flex items-center gap-1.5 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            {p.name}
          </span>
        ))}
      </div>
    );
  }

  if (colorMode === "urgency") {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <span className="w-full text-xs font-medium text-muted-foreground md:w-auto">
          {he.calendar.legendUrgency}
        </span>
        {(["HIGH", "MEDIUM", "LOW"] as Urgency[]).map((u) => {
          const color = STATUS_COLOR_CLASSES[getUrgencyColor(u, "P3")];
          return (
            <span key={u} className="inline-flex items-center gap-1.5 text-xs">
              <span className={`size-2.5 shrink-0 rounded-full ${color.dot}`} />
              {URGENCY_LABELS[u]}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <span className="w-full text-xs font-medium text-muted-foreground md:w-auto">
        {he.calendar.legendPriority}
      </span>
      {(["P0", "P1", "P2", "P3", "P4"] as const).map((p) => {
        const color = STATUS_COLOR_CLASSES[PRIORITY_META[p].color];
        return (
          <span key={p} className="inline-flex items-center gap-1.5 text-xs">
            <span className={`size-2.5 shrink-0 rounded-full ${color.dot}`} />
            {PRIORITY_META[p].short}
          </span>
        );
      })}
    </div>
  );
}
