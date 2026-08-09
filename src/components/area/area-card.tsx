import Link from "next/link";
import { resolveIcon } from "@/lib/icons";
import type { AreaWithCounts } from "@/types";
import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/date-utils";
import { he } from "@/lib/i18n/he";

function areaHealth(area: AreaWithCounts) {
  const blocked = area.tasks.filter((t) => t.status === "BLOCKED").length;
  const overdue = area.tasks.filter(
    (t) => t.dueDate && daysUntil(t.dueDate) < 0 && t.status !== "DONE" && t.status !== "CANCELLED"
  ).length;
  if (blocked > 0) return { color: "bg-status-red", label: he.area.needsAttention(blocked) };
  if (overdue > 0) return { color: "bg-status-yellow", label: he.area.overdue(overdue) };
  return { color: "bg-status-green", label: he.area.onTrack };
}

export function AreaCard({ area }: { area: AreaWithCounts }) {
  const Icon = resolveIcon(area.icon);
  const openTasks = area.tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;
  const activeProjects = area.projects.filter((p) => p.status === "ACTIVE").length;
  const health = areaHealth(area);

  return (
    <Link
      href={`/areas/${area.id}`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-smooth hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex size-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${area.color}1a`, color: area.color }}
        >
          <Icon className="size-4.5" />
        </div>
        <span className={cn("size-2 rounded-full", health.color)} />
      </div>
      <div>
        <p className="font-medium">{area.name}</p>
        {area.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{area.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
        <span>{he.area.activeProjects(activeProjects)}</span>
        <span>{he.area.openTasks(openTasks)}</span>
      </div>
      <p className="text-xs text-muted-foreground">{health.label}</p>
    </Link>
  );
}
