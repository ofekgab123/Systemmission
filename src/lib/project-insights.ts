import { daysSince, daysUntil } from "@/lib/date-utils";
import type { ProjectWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";

type ProjectTasks = ProjectWithRelations["tasks"];

export function computeProgress(
  project: Pick<ProjectWithRelations, "progressMode" | "progress" | "tasks">
): number {
  if (project.progressMode === "MANUAL") return project.progress;

  const tasks = project.tasks.filter((t) => t.status !== "CANCELLED");
  if (tasks.length === 0) return project.progress ?? 0;

  if (project.progressMode === "WEIGHTED") {
    const weight = (est: number | null) => {
      if (!est) return 1;
      if (est <= 30) return 1;
      if (est <= 120) return 2;
      return 5;
    };
    const total = tasks.reduce((sum, t) => sum + weight(t.estimatedMinutes), 0);
    const done = tasks
      .filter((t) => t.status === "DONE")
      .reduce((sum, t) => sum + weight(t.estimatedMinutes), 0);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }

  const done = tasks.filter((t) => t.status === "DONE").length;
  return Math.round((done / tasks.length) * 100);
}

export type HealthStatus = "on-track" | "needs-attention" | "at-risk" | "paused";

export function computeHealth(project: {
  status: ProjectWithRelations["status"];
  targetDate: ProjectWithRelations["targetDate"];
  updatedAt: ProjectWithRelations["updatedAt"];
  tasks: ProjectTasks;
}): HealthStatus {
  if (project.status === "ON_HOLD" || project.status === "ARCHIVED") return "paused";

  const blockedCount = project.tasks.filter((t) => t.status === "BLOCKED").length;
  const overdueCount = project.tasks.filter(
    (t) => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "DONE" && t.status !== "CANCELLED"
  ).length;
  const inactiveDays = daysSince(project.updatedAt);
  const deadlineSoon = project.targetDate ? daysUntil(project.targetDate) : Infinity;

  if (blockedCount >= 2 || overdueCount >= 2 || (deadlineSoon < 3 && deadlineSoon >= 0 && overdueCount > 0)) {
    return "at-risk";
  }
  if (blockedCount >= 1 || overdueCount >= 1 || inactiveDays > 7 || (deadlineSoon < 3 && deadlineSoon >= 0)) {
    return "needs-attention";
  }
  return "on-track";
}

export type Momentum = "high" | "moving" | "slow" | "stalled";

export function computeMomentum(project: {
  updatedAt: ProjectWithRelations["updatedAt"];
  tasks: ProjectTasks;
}): Momentum {
  const inactiveDays = daysSince(project.updatedAt);
  const recentlyCompleted = project.tasks.filter(
    (t) => t.completedAt && daysSince(t.completedAt) <= 7
  ).length;

  if (inactiveDays > 14) return "stalled";
  if (recentlyCompleted >= 3 && inactiveDays <= 2) return "high";
  if (recentlyCompleted >= 1 || inactiveDays <= 4) return "moving";
  return "slow";
}

export function computeAttentionScore(project: {
  priority: ProjectWithRelations["priority"];
  targetDate: ProjectWithRelations["targetDate"];
  updatedAt: ProjectWithRelations["updatedAt"];
  tasks: ProjectTasks;
}): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const priorityWeight: Record<string, number> = { P0: 25, P1: 18, P2: 10, P3: 5, P4: 0 };
  score += priorityWeight[project.priority] ?? 0;
  if (project.priority === "P0" || project.priority === "P1") {
    reasons.push("קטגוריה בעדיפות גבוהה");
  }

  const blockedCount = project.tasks.filter((t) => t.status === "BLOCKED").length;
  if (blockedCount > 0) {
    score += blockedCount * 15;
    reasons.push(`${blockedCount} משימות תקועות`);
  }

  const overdueCount = project.tasks.filter(
    (t) => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "DONE" && t.status !== "CANCELLED"
  ).length;
  if (overdueCount > 0) {
    score += overdueCount * 12;
    reasons.push(`${overdueCount} משימות באיחור`);
  }

  if (project.targetDate) {
    const days = daysUntil(project.targetDate);
    if (days >= 0 && days <= 3) {
      score += 20;
      reasons.push("דדליין מתקרב");
    } else if (days < 0) {
      score += 25;
      reasons.push("עבר תאריך היעד");
    }
  }

  const inactiveDays = daysSince(project.updatedAt);
  if (inactiveDays > 1) {
    score += Math.min(inactiveDays * 2, 20);
    if (inactiveDays > 3) reasons.push(`ללא פעילות ${inactiveDays} ימים`);
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}
