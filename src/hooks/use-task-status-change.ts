"use client";

import { useCallback } from "react";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import { statusNeedsContextPrompt } from "@/lib/task-status-prompt";
import type { TaskWithRelations } from "@/types";

export function useTaskStatusChange() {
  const updateTask = useUpdateTask();
  const openStatusPrompt = useUIStore((s) => s.openStatusPrompt);

  return useCallback(
    (
      taskId: string,
      newStatus: TaskWithRelations["status"],
      currentStatus?: TaskWithRelations["status"],
      extra?: Record<string, unknown>
    ) => {
      updateTask.mutate({ id: taskId, data: { status: newStatus, ...extra } });
      if (currentStatus !== newStatus && statusNeedsContextPrompt(newStatus)) {
        openStatusPrompt(taskId, newStatus);
      }
    },
    [updateTask, openStatusPrompt]
  );
}
