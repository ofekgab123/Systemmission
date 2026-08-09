import Link from "next/link";
import { resolveIcon } from "@/lib/icons";
import { computeProgress, computeHealth, computeMomentum } from "@/lib/project-insights";
import { HealthBadge, MomentumBadge } from "@/components/project/health-badge";
import { PriorityDot } from "@/components/task/priority-dot";
import type { ProjectWithRelations } from "@/types";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

export function ProjectCard({
  project,
  className,
}: {
  project: ProjectWithRelations;
  className?: string;
}) {
  const Icon = resolveIcon(project.icon);
  const progress = computeProgress(project);
  const health = computeHealth(project);
  const momentum = computeMomentum(project);
  const openTasks = project.tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-3 rounded-xl border bg-card p-4 transition-smooth hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex size-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${project.color}1a`, color: project.color }}
        >
          <Icon className="size-4" />
        </div>
        <PriorityDot priority={project.priority} />
      </div>

      <div>
        <p className="truncate text-sm font-medium">{project.name}</p>
        {project.area && (
          <p className="truncate text-xs text-muted-foreground">{project.area.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-smooth"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{openTasks} {he.project.open}</span>
          <span>{progress}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-2.5">
        <HealthBadge health={health} />
        <MomentumBadge momentum={momentum} />
      </div>
    </Link>
  );
}
