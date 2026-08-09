"use client";

import { useEffect } from "react";
import { useAreas } from "@/hooks/use-areas";
import { useAreaStore } from "@/store/area-store";

export function AreaBootstrap() {
  const { data: areas } = useAreas();
  const syncFromAreas = useAreaStore((s) => s.syncFromAreas);

  useEffect(() => {
    if (areas?.length) syncFromAreas(areas);
  }, [areas, syncFromAreas]);

  return null;
}
