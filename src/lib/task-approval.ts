import type { TaskWithRelations } from "@/types";
import type { UserTaskStatus } from "@/lib/task-meta";

/** Where an approved task lands after leaving the INBOX review queue. */
export function resolveApprovedStatus(
  task: Pick<TaskWithRelations, "waitingFor" | "blockedReason" | "status">
): UserTaskStatus {
  if (task.waitingFor?.trim()) return "WAITING";
  if (task.blockedReason?.trim()) return "BLOCKED";
  if (task.status === "SOMEDAY") return "SOMEDAY";
  return "READY";
}

export const REVIEW_QUEUE_STATUS = "INBOX" as const;
