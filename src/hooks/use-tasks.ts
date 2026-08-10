import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TaskWithRelations, TaskAttachment, TaskDetail } from "@/types";
import type { ImageUploadInput } from "@/lib/task-attachments";
import { areaFilterForApi } from "@/lib/areas";
import { useAreaStore } from "@/store/area-store";

export type { TaskDetail };

export interface TaskFilters {
  view?: string;
  status?: string;
  excludeStatus?: string;
  projectId?: string;
  areaId?: string;
  parentTaskId?: string;
  topLevel?: boolean;
  q?: string;
  tag?: string;
  limit?: number;
  from?: string;
  to?: string;
}

function buildQuery(filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function tasksQueryKey(filters: TaskFilters = {}) {
  return ["tasks", filters] as const;
}

export function useTasks(filters: TaskFilters = {}) {
  const selectedAreaId = useAreaStore((s) => s.selectedAreaId);
  const merged = { ...filters, ...areaFilterForApi(selectedAreaId) };

  return useQuery({
    queryKey: tasksQueryKey(merged),
    queryFn: async (): Promise<TaskWithRelations[]> => {
      const res = await fetch(`/api/tasks?${buildQuery(merged)}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json();
    },
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async (): Promise<TaskDetail> => {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) throw new Error("Failed to load task");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const getCreateAreaId = useAreaStore((s) => s.getCreateAreaId);
  return useMutation({
    mutationFn: async (
      data: Omit<Partial<TaskWithRelations>, "createdAt"> & {
        tagNames?: string[];
        createdAt?: string | Date;
        images?: ImageUploadInput[];
      }
    ) => {
      const areaId = data.areaId ?? getCreateAreaId() ?? undefined;
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, areaId }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json() as Promise<TaskWithRelations>;
    },
    onSuccess: (_task, variables) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      if (variables.parentTaskId) {
        qc.invalidateQueries({ queryKey: ["task", variables.parentTaskId] });
      }
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TaskWithRelations> & { tagNames?: string[]; note?: string; images?: ImageUploadInput[] };
    }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json() as Promise<TaskWithRelations>;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", task.id] });
      if (task.parentTaskId) {
        qc.invalidateQueries({ queryKey: ["task", task.parentTaskId] });
      }
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { message?: string; images?: ImageUploadInput[] };
    }) => {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update note");
      return res.json() as Promise<TaskDetail>;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", task.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to cancel task");
      return res.json();
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
