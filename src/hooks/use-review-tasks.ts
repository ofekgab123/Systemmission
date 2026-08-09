import { useQuery } from "@tanstack/react-query";
import type { TaskWithRelations } from "@/types";

/** Review queue is disabled; missing-field warnings still show on task rows. */
export function useReviewTasks() {
  const query = useQuery({
    queryKey: ["review-tasks"],
    queryFn: async (): Promise<TaskWithRelations[]> => [],
    staleTime: Infinity,
  });

  return {
    ...query,
    data: [] as TaskWithRelations[],
    count: 0,
  };
}
