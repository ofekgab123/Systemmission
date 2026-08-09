"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { TaskList, TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { HealthBadge, MomentumBadge } from "@/components/project/health-badge";
import { computeProgress, computeHealth, computeMomentum } from "@/lib/project-insights";
import { resolveIcon } from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { he } from "@/lib/i18n/he";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: project, isLoading: loadingProject, isError } = useProject(id);
  const { data: tasks, isLoading: loadingTasks } = useTasks({ projectId: id, topLevel: true });

  if (loadingProject) {
    return (
      <div className="page-content">
        <Skeleton className="mb-6 h-24 rounded-xl" />
        <TaskListSkeleton rows={5} />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="page-content">
        <EmptyState
          title={he.project.notFound}
          description={he.project.notFoundDesc}
          action={
            <Link href="/projects" className="text-sm text-primary hover:underline">
              {he.project.backToProjects}
            </Link>
          }
        />
      </div>
    );
  }

  const Icon = resolveIcon(project.icon);
  const progress = computeProgress(project);
  const health = computeHealth(project);
  const momentum = computeMomentum(project);
  const openTasks = (tasks ?? []).filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length;

  return (
    <div>
      <div className="mb-4 px-1">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-3.5 rotate-180" />
          {he.project.backToProjects}
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        actions={<AddTaskButton className="gap-1.5" size="sm" />}
      />

      <div className="page-content">
        <div className="mb-8 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${project.color}1a`, color: project.color }}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {openTasks} {he.project.open} · {progress}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HealthBadge health={health} />
              <MomentumBadge momentum={momentum} />
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-smooth"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="mb-4 font-heading text-lg font-medium">{he.project.tasks}</h2>

        {loadingTasks ? (
          <TaskListSkeleton rows={5} />
        ) : tasks && tasks.length > 0 ? (
          <TaskList tasks={tasks} showProject={false} />
        ) : (
          <EmptyState
            title={he.project.noTasks}
            description={he.project.noTasksDesc}
            action={<AddTaskButton variant="outline" className="gap-2" />}
          />
        )}
      </div>
    </div>
  );
}
