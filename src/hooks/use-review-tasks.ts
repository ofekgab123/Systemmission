import { useMemo } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { taskNeedsReview } from "@/lib/task-completeness";

export function useReviewTasks() {
  const query = useTasks({
    topLevel: true,
    excludeStatus: "CANCELLED",
    limit: 500,
  });

  const reviewTasks = useMemo(
    () => (query.data ?? []).filter((task) => task.status !== "DONE" && taskNeedsReview(task)),
    [query.data]
  );

  return {
    ...query,
    data: reviewTasks,
    count: reviewTasks.length,
  };
}
