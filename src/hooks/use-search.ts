import { useQuery } from "@tanstack/react-query";
import type { TaskWithRelations, ProjectWithRelations, AreaWithCounts } from "@/types";

export interface SearchResults {
  tasks: TaskWithRelations[];
  projects: ProjectWithRelations[];
  areas: AreaWithCounts[];
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async (): Promise<SearchResults> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: q.trim().length > 0,
  });
}
