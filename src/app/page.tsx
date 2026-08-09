"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Ban, Clock, AlertTriangle, PlayCircle, StickyNote } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { countLongWaiting, buildInsightSentences } from "@/lib/dashboard-insights";
import { greetingForNow, formatFullDate } from "@/lib/date-utils";
import { TaskListSkeleton, EmptyState, TaskList } from "@/components/task/task-list";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { StickyNoteCapture, StickyNotesGrid } from "@/components/sticky-notes/sticky-notes-grid";
import { CollapsibleSection } from "@/components/home/collapsible-section";
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
  const { data: projects } = useProjects();

  const now = new Date();

  const activeProjects = useMemo(
    () => (projects ?? []).filter((p) => p.status === "ACTIVE"),
    [projects]
  );

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

      <CollapsibleSection
        title={he.home.dontForget}
        icon={<StickyNote className="size-5 text-status-yellow" />}
        action={
          <Link
            href="/dont-forget"
            className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {he.actions.viewAll} <ArrowRight className="size-3.5 rotate-180" />
          </Link>
        }
      >
        <StickyNoteCapture className="mb-4" />
        <StickyNotesGrid compact limit={3} />
      </CollapsibleSection>

      <CollapsibleSection
        title={he.home.inProgress}
        icon={<PlayCircle className="size-5 text-primary" />}
      >
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
      </CollapsibleSection>

      <CollapsibleSection
        title={he.home.upcoming}
        action={
          <Link
            href="/tasks?view=upcoming"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {he.actions.viewAll} <ArrowRight className="size-3.5 rotate-180" />
          </Link>
        }
      >
        {upcomingTasks && upcomingTasks.length > 0 ? (
          <TaskList tasks={upcomingTasks.slice(0, 8)} />
        ) : (
          <EmptyState title={he.empty.nothingScheduled} />
        )}
      </CollapsibleSection>

      <CollapsibleSection title={he.attention.title}>
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
      </CollapsibleSection>

      {insights.length > 0 && (
        <CollapsibleSection title={he.insights.title}>
          <div className="rounded-xl border bg-muted/40 p-4">
            <ul className="flex flex-col gap-1 text-sm text-foreground/80">
              {insights.map((s, i) => (
                <li key={i}>«{s}»</li>
              ))}
            </ul>
          </div>
        </CollapsibleSection>
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
