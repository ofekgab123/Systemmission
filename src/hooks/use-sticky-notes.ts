import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { areaFilterForApi } from "@/lib/areas";
import { useAreaStore } from "@/store/area-store";

export interface StickyNote {
  id: string;
  content: string;
  color: string;
  dismissed: boolean;
  nextAlertAt: string;
  createdAt: string;
  updatedAt: string;
  areaId?: string | null;
}

export const stickyNotesQueryKey = (filters?: { active?: boolean; due?: boolean; areaId?: string }) =>
  ["sticky-notes", filters ?? {}] as const;

export function useStickyNotes(options: { active?: boolean; due?: boolean } = {}) {
  const { active = true, due } = options;
  const selectedAreaId = useAreaStore((s) => s.selectedAreaId);
  const areaFilter = areaFilterForApi(selectedAreaId);
  const params = new URLSearchParams();
  if (active === false) params.set("active", "false");
  if (due) params.set("due", "true");
  if (areaFilter.areaId) params.set("areaId", areaFilter.areaId);

  return useQuery({
    queryKey: stickyNotesQueryKey({ active, due, areaId: areaFilter.areaId }),
    queryFn: async (): Promise<StickyNote[]> => {
      const res = await fetch(`/api/sticky-notes?${params}`);
      if (!res.ok) throw new Error("Failed to load sticky notes");
      return res.json();
    },
    refetchInterval: due ? 60_000 : false,
  });
}

export function useCreateStickyNote() {
  const qc = useQueryClient();
  const getCreateAreaId = useAreaStore((s) => s.getCreateAreaId);
  return useMutation({
    mutationFn: async (content: string) => {
      const areaId = getCreateAreaId() ?? undefined;
      const res = await fetch("/api/sticky-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, areaId }),
      });
      if (!res.ok) throw new Error("Failed to create sticky note");
      return res.json() as Promise<StickyNote>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sticky-notes"] }),
  });
}

export function useUpdateStickyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      content?: string;
      dismissed?: boolean;
      action?: "dismiss" | "snooze" | "reset-alert";
      minutes?: number;
    }) => {
      const res = await fetch(`/api/sticky-notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update sticky note");
      return res.json() as Promise<StickyNote>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sticky-notes"] }),
  });
}

export function useDeleteStickyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sticky-notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete sticky note");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sticky-notes"] }),
  });
}
