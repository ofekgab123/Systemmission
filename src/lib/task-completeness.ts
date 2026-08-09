import type { TaskWithRelations } from "@/types";
import { he } from "@/lib/i18n/he";

export type TaskMissingField =
  | "description"
  | "dueDate"
  | "project"
  | "waitingFor"
  | "blockedReason";

const REVIEW_EXCLUDED_STATUSES = new Set(["DONE", "CANCELLED"]);

export function getTaskMissingFields(
  task: Pick<
    TaskWithRelations,
    "status" | "description" | "dueDate" | "projectId" | "waitingFor" | "blockedReason"
  >
): TaskMissingField[] {
  if (REVIEW_EXCLUDED_STATUSES.has(task.status)) return [];

  const missing: TaskMissingField[] = [];

  if (!task.description?.trim()) missing.push("description");
  if (!task.dueDate) missing.push("dueDate");
  if (!task.projectId) missing.push("project");
  if (task.status === "WAITING" && !task.waitingFor?.trim()) missing.push("waitingFor");
  if (task.status === "BLOCKED" && !task.blockedReason?.trim()) missing.push("blockedReason");

  return missing;
}

export function taskNeedsReview(task: TaskWithRelations): boolean {
  return getTaskMissingFields(task).length > 0;
}

export function getMissingFieldLabel(field: TaskMissingField): string {
  const labels: Record<TaskMissingField, string> = {
    description: he.task.description,
    dueDate: he.task.dueDate,
    project: he.task.project,
    waitingFor: he.task.waitingForWho,
    blockedReason: he.task.blockedReason,
  };
  return labels[field];
}

export function formatMissingFields(fields: TaskMissingField[]): string {
  return fields.map(getMissingFieldLabel).join(", ");
}
