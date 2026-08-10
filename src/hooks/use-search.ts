import { useEffect, useState } from "react";
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
  const [debouncedQ, setDebouncedQ] = useState(q.trim());

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [q]);

  return useQuery({
    queryKey: ["search", debouncedQ, areaFilter.areaId ?? null],
    queryFn: async (): Promise<SearchResults> => {
      const params = new URLSearchParams({ q: debouncedQ });
      if (areaFilter.areaId) params.set("areaId", areaFilter.areaId);
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQ.length > 0,
  });
}
