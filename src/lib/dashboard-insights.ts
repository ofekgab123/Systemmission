import { daysSince } from "@/lib/date-utils";
import type { TaskWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";

export function countLongWaiting(tasks: TaskWithRelations[], thresholdDays = 5): number {
  return tasks.filter((t) => t.status === "WAITING" && daysSince(t.updatedAt) >= thresholdDays).length;
}

export function buildInsightSentences(opts: {
  activeProjectsCount: number;
  waitingCount: number;
  overdueCount: number;
  overdueDevelopmentShare: number;
}): string[] {
  const sentences: string[] = [];
  if (opts.activeProjectsCount > 0) {
    sentences.push(he.insights.activeProjects(opts.activeProjectsCount));
  }
  if (opts.waitingCount > 0) {
    sentences.push(he.insights.waitingTasks(opts.waitingCount));
  }
  if (opts.overdueCount > 0 && opts.overdueDevelopmentShare > 0.5) {
    sentences.push(he.insights.overdueDev);
  }
  return sentences;
}
