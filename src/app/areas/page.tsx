"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAreas } from "@/hooks/use-areas";
import { AreaCard } from "@/components/area/area-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/task/task-list";
import { he } from "@/lib/i18n/he";

export default function AreasPage() {
  const { data: areas, isLoading } = useAreas();

  return (
    <div>
      <PageHeader title={he.nav.areas} description="תחומי חיים ועבודה — ארגון ברמה הגבוהה." />
      <div className="page-content">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : areas && areas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <AreaCard key={area.id} area={area} />
            ))}
          </div>
        ) : (
          <EmptyState title="אין תחומים עדיין" description="צור תחום ראשון כדי לארגן את העבודה." />
        )}
      </div>
    </div>
  );
}
