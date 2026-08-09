export const ALL_AREAS_ID = "__all__";
export const SELECTED_AREA_STORAGE_KEY = "mission-selected-area";

export const SYSTEM_AREA_SLUGS = {
  base: "base",
  personal: "personal",
} as const;

export type SystemAreaSlug = (typeof SYSTEM_AREA_SLUGS)[keyof typeof SYSTEM_AREA_SLUGS];

export interface AreaRecord {
  id: string;
  name: string;
  slug: string | null;
  icon: string;
  color: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export function isSystemAreaSlug(slug: string | null | undefined): slug is SystemAreaSlug {
  return slug === SYSTEM_AREA_SLUGS.base || slug === SYSTEM_AREA_SLUGS.personal;
}

export function areaFilterForApi(selectedAreaId: string): { areaId?: string } {
  if (!selectedAreaId || selectedAreaId === ALL_AREAS_ID) return {};
  return { areaId: selectedAreaId };
}

export function readStoredSelectedAreaId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SELECTED_AREA_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistSelectedAreaId(areaId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SELECTED_AREA_STORAGE_KEY, areaId);
  } catch {
    /* ignore */
  }
}

export function sortAreasForDisplay(areas: AreaRecord[]): AreaRecord[] {
  const order = (slug: string | null) => {
    if (slug === SYSTEM_AREA_SLUGS.base) return 0;
    if (slug === SYSTEM_AREA_SLUGS.personal) return 1;
    return 2;
  };

  return [...areas].sort((a, b) => {
    const byOrder = order(a.slug) - order(b.slug);
    if (byOrder !== 0) return byOrder;
    return a.name.localeCompare(b.name, "he");
  });
}
