import { useQuery } from "@tanstack/react-query";

export interface TagWithCount {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async (): Promise<TagWithCount[]> => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to load tags");
      return res.json();
    },
  });
}
