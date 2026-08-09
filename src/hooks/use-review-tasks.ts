import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTasks } from "@/hooks/use-tasks";
import { resolveApprovedStatus } from "@/lib/task-approval";
import { he } from "@/lib/i18n/he";
import type { TaskWithRelations } from "@/types";

export function useReviewTasks() {
  const query = useTasks({
    view: "needs-review",
    topLevel: true,
    limit: 500,
  });

  const tasks = query.data ?? [];

  return {
    ...query,
    data: tasks,
    count: tasks.length,
  };
}

export function useApproveTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (task: TaskWithRelations) => {
      const status = resolveApprovedStatus(task);
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to approve task");
      const approved = (await res.json()) as TaskWithRelations;

      for (const sub of task.subtasks ?? []) {
        if (sub.status !== "INBOX") continue;
        const subStatus = resolveApprovedStatus(sub);
        const subRes = await fetch(`/api/tasks/${sub.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: subStatus }),
        });
        if (!subRes.ok) throw new Error("Failed to approve subtask");
      }

      return approved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(he.task.approved);
    },
  });
}
