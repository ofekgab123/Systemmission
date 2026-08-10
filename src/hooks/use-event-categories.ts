import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventCategoryRecord } from "@/types";

export function useEventCategories() {
  return useQuery({
    queryKey: ["event-categories"],
    queryFn: async (): Promise<EventCategoryRecord[]> => {
      const res = await fetch("/api/event-categories");
      if (!res.ok) throw new Error("Failed to load event categories");
      return res.json();
    },
  });
}

export function useCreateEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      const res = await fetch("/api/event-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create event category");
      return res.json() as Promise<EventCategoryRecord>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-categories"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string } }) => {
      const res = await fetch(`/api/event-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update event category");
      return res.json() as Promise<EventCategoryRecord>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-categories"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEventCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/event-categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event category");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-categories"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
