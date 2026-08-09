import { useQuery } from "@tanstack/react-query";
import type { TaskWithRelations, ProjectWithRelations } from "@/types";
import { areaFilterForApi } from "@/lib/areas";
import { useAreaStore } from "@/store/area-store";

export interface SearchResults {
  tasks: TaskWithRelations[];
  projects: ProjectWithRelations[];
}

export function useSearch(q: string) {
  const selectedAreaId = useAreaStore((s) => s.selectedAreaId);
  const areaFilter = areaFilterForApi(selectedAreaId);

  return useQuery({
    queryKey: ["search", q, areaFilter.areaId ?? null],
    queryFn: async (): Promise<SearchResults> => {
      const params = new URLSearchParams({ q });
      if (areaFilter.areaId) params.set("areaId", areaFilter.areaId);
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: q.trim().length > 0,
  });
}
