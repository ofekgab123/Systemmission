"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Ban, Clock, AlertTriangle, PlayCircle } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { computeAttentionScore } from "@/lib/project-insights";
import { countLongWaiting, buildInsightSentences } from "@/lib/dashboard-insights";
import { greetingForNow, formatFullDate } from "@/lib/date-utils";
import { TaskListSkeleton, EmptyState, TaskList } from "@/components/task/task-list";
import { ProjectCard } from "@/components/project/project-card";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { he } from "@/lib/i18n/he";

export default function HomePage() {
  const { data: inProgressTasks, isLoading: loadingInProgress } = useTasks({
    status: "IN_PROGRESS",
    topLevel: true,
    limit: 50,
  });
  const { data: waitingTasks } = useTasks({ view: "waiting" });
  const { data: blockedTasks } = useTasks({ view: "blocked" });
  const { data: upcomingTasks } = useTasks({ view: "upcoming" });
  const { data: projects, isLoading: loadingProjects } = useProjects();

  const now = new Date();

  const activeProjects = useMemo(
    () => (projects ?? []).filter((p) => p.status === "ACTIVE"),
    [projects]
  );

  const projectsAtRisk = useMemo(() => {
    return (projects ?? [])
      .filter((p) => p.status !== "ARCHIVED" && p.status !== "COMPLETED")
      .map((p) => ({ project: p, ...computeAttentionScore(p) }))
      .filter((p) => p.score >= 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [projects]);

  const longWaitingCount = countLongWaiting(waitingTasks ?? []);
  const overdueCount = (inProgressTasks ?? []).filter(
    (t) => t.dueDate && new Date(t.dueDate) < now
  ).length;

  const insights = buildInsightSentences({
    activeProjectsCount: activeProjects.length,
    waitingCount: (waitingTasks ?? []).length,
    overdueCount,
    overdueDevelopmentShare: 0.6,
  });

  return (
    <div className="page-shell">
      <div className="mb-6 flex items-center justify-between gap-3 md:mb-8">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">{greetingForNow()}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{formatFullDate()}</p>
        </div>
        <AddTaskButton className="gap-1.5" label={he.actions.new} size="sm" />
      </div>

      <div className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-medium">
          <PlayCircle className="size-5 text-primary" />
          {he.home.inProgress}
        </h2>

        {loadingInProgress ? (
          <TaskListSkeleton rows={4} />
        ) : inProgressTasks && inProgressTasks.length > 0 ? (
          <TaskList tasks={inProgressTasks} />
        ) : (
          <EmptyState
            title={he.home.inProgressEmpty}
            description={he.home.inProgressEmptyDesc}
            action={<AddTaskButton variant="outline" className="gap-2" />}
          />
        )}
      </div>

      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">{he.home.upcoming}</h2>
          <Link
            href="/tasks?view=upcoming"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {he.actions.viewAll} <ArrowRight className="size-3.5 rotate-180" />
          </Link>
        </div>
        {upcomingTasks && upcomingTasks.length > 0 ? (
          <TaskList tasks={upcomingTasks.slice(0, 8)} />
        ) : (
          <EmptyState title={he.empty.nothingScheduled} />
        )}
      </div>

      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">{he.project.activeProjects}</h2>
          <Link href="/projects" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {he.actions.viewAll} <ArrowRight className="size-3.5 rotate-180" />
          </Link>
        </div>
        {loadingProjects ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 w-64 shrink-0 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : activeProjects.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState title={he.empty.noProjects} description={he.empty.noProjectsDesc} />
        )}
      </div>

      <div className="mb-10">
        <h2 className="mb-4 font-heading text-lg font-medium">{he.attention.title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <AttentionTile
            href="/blocked"
            icon={<Ban className="size-4" />}
            color="text-status-red"
            count={(blockedTasks ?? []).length}
            label={he.attention.blocked}
          />
          <AttentionTile
            href="/tasks?view=overdue"
            icon={<AlertTriangle className="size-4" />}
            color="text-status-orange"
            count={overdueCount}
            label={he.attention.overdue}
          />
          <AttentionTile
            href="/waiting"
            icon={<Clock className="size-4" />}
            color="text-status-yellow"
            count={longWaitingCount}
            label={he.attention.waitingLong}
          />
        </div>
      </div>

      {projectsAtRisk.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 font-heading text-lg font-medium">{he.project.atRisk}</h2>
          <div className="flex flex-col gap-2">
            {projectsAtRisk.map(({ project, score, reasons }) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-xl border bg-card p-3.5 transition-smooth hover:bg-accent/50"
              >
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{reasons.join(" · ")}</p>
                </div>
                <span className="rounded-full bg-status-red/10 px-2 py-1 text-xs font-semibold text-status-red">
                  {score}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div className="mb-10 rounded-xl border bg-muted/40 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {he.insights.title}
          </p>
          <ul className="flex flex-col gap-1 text-sm text-foreground/80">
            {insights.map((s, i) => (
              <li key={i}>«{s}»</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AttentionTile({
  href,
  icon,
  color,
  count,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-smooth hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={color}>{icon}</div>
      <p className="text-2xl font-semibold tabular-nums">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}
