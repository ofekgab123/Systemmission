import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AreaWithCounts } from "@/types";

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: async (): Promise<AreaWithCounts[]> => {
      const res = await fetch("/api/areas");
      if (!res.ok) throw new Error("Failed to load areas");
      return res.json();
    },
  });
}

export function useArea(id: string | null) {
  return useQuery({
    queryKey: ["area", id],
    queryFn: async () => {
      const res = await fetch(`/api/areas/${id}`);
      if (!res.ok) throw new Error("Failed to load area");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create area");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
}
