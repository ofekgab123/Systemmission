import { PRIORITY_META, IMPACT_META, URGENCY_META } from "@/lib/task-meta";
import { daysSince, daysUntil } from "@/lib/date-utils";
import type { TaskWithRelations } from "@/types";

/**
 * Task Score (0-100): a heuristic blend of priority, urgency, impact, deadline
 * proximity, age, and energy fit, used to power "Recommended Now" / "Now & Next".
 * Not shown to the user by default — used to rank & surface what matters.
 */
export function computeTaskScore(
  task: Pick<
    TaskWithRelations,
    "priority" | "impact" | "urgency" | "dueDate" | "status" | "createdAt" | "energy" | "estimatedMinutes" | "project"
  >,
  opts?: { availableMinutes?: number; energy?: "LOW" | "MEDIUM" | "DEEP" }
): number {
  let score = 0;

  score += PRIORITY_META[task.priority].weight * 10; // 10-50

  if (task.impact) score += IMPACT_META[task.impact].weight * 5; // up to 20
  if (task.urgency) score += URGENCY_META[task.urgency].weight * 4; // up to 12

  if (task.dueDate) {
    const days = daysUntil(task.dueDate);
    if (days < 0) score += 25; // overdue
    else if (days === 0) score += 20;
    else if (days <= 2) score += 14;
    else if (days <= 7) score += 6;
  }

  const age = daysSince(task.createdAt);
  if (age > 30) score += 8;
  else if (age > 14) score += 5;
  else if (age > 7) score += 2;

  if (task.project?.priority) {
    score += PRIORITY_META[task.project.priority].weight * 2; // up to 10
  }

  if (opts?.energy && task.energy) {
    if (opts.energy === task.energy) score += 8;
    else if (
      (opts.energy === "MEDIUM" && task.energy !== "DEEP") ||
      (opts.energy === "DEEP" && task.energy === "DEEP")
    ) {
      score += 3;
    }
  }

  if (opts?.availableMinutes && task.estimatedMinutes) {
    if (task.estimatedMinutes <= opts.availableMinutes) score += 6;
    else score -= 10;
  }

  if (task.status === "BLOCKED") score -= 40;
  if (task.status === "WAITING") score -= 30;
  if (task.status === "SOMEDAY") score -= 50;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function sortByScore<
  T extends Pick<
    TaskWithRelations,
    "priority" | "impact" | "urgency" | "dueDate" | "status" | "createdAt" | "energy" | "estimatedMinutes" | "project"
  >
>(tasks: T[], opts?: { availableMinutes?: number; energy?: "LOW" | "MEDIUM" | "DEEP" }): T[] {
  return [...tasks].sort((a, b) => computeTaskScore(b, opts) - computeTaskScore(a, opts));
}
