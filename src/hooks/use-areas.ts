import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AreaRecord } from "@/lib/areas";

export const areasQueryKey = ["areas"] as const;

export function useAreas() {
  return useQuery({
    queryKey: areasQueryKey,
    queryFn: async (): Promise<AreaRecord[]> => {
      const res = await fetch("/api/areas");
      if (!res.ok) throw new Error("Failed to load areas");
      return res.json();
    },
    staleTime: 60_000,
    retry: 2,
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; icon?: string; color?: string }) => {
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create area");
      return res.json() as Promise<AreaRecord>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: areasQueryKey }),
  });
}

export function useDeleteArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/areas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete area");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: areasQueryKey });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["sticky-notes"] });
    },
  });
}
