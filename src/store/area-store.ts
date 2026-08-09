import { create } from "zustand";
import {
  ALL_AREAS_ID,
  persistSelectedAreaId,
  readStoredSelectedAreaId,
  SYSTEM_AREA_SLUGS,
  type AreaRecord,
} from "@/lib/areas";

interface AreaState {
  selectedAreaId: string;
  baseAreaId: string | null;
  setSelectedAreaId: (id: string) => void;
  setBaseAreaId: (id: string) => void;
  syncFromAreas: (areas: AreaRecord[]) => void;
  getCreateAreaId: () => string | null;
}

export const useAreaStore = create<AreaState>((set, get) => ({
  selectedAreaId: ALL_AREAS_ID,
  baseAreaId: null,

  setSelectedAreaId: (id) => {
    persistSelectedAreaId(id);
    set({ selectedAreaId: id });
  },

  setBaseAreaId: (id) => set({ baseAreaId: id }),

  syncFromAreas: (areas) => {
    const base = areas.find((area) => area.slug === SYSTEM_AREA_SLUGS.base);
    const stored = readStoredSelectedAreaId();
    const validIds = new Set([ALL_AREAS_ID, ...areas.map((area) => area.id)]);

    let selectedAreaId = stored && validIds.has(stored) ? stored : base?.id ?? ALL_AREAS_ID;
    if (!stored && base) selectedAreaId = base.id;

    persistSelectedAreaId(selectedAreaId);
    set({
      baseAreaId: base?.id ?? null,
      selectedAreaId,
    });
  },

  getCreateAreaId: () => {
    const { selectedAreaId, baseAreaId } = get();
    if (selectedAreaId === ALL_AREAS_ID) return baseAreaId;
    return selectedAreaId || baseAreaId;
  },
}));
