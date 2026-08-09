"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useTasks } from "@/hooks/use-tasks";
import { sortByScore } from "@/lib/task-score";
import { TaskRow } from "@/components/task/task-row";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import { greetingForNow, formatFullDate } from "@/lib/date-utils";
import { Zap, Clock, AlertTriangle, CalendarClock, Target } from "lucide-react";
import { he } from "@/lib/i18n/he";

export default function TodayPage() {
  const { data: activeTasks, isLoading } = useTasks({
    excludeStatus: "DONE,CANCELLED,SOMEDAY,WAITING,BLOCKED,INBOX",
    topLevel: true,
    limit: 300,
  });
  const { data: todayTasks } = useTasks({ view: "today" });
  const { data: overdueTasks } = useTasks({ view: "overdue" });
  const { data: waitingTasks } = useTasks({ view: "waiting" });
  const { data: quickWins } = useTasks({ view: "quick-wins" });

  const ranked = useMemo(() => (activeTasks ? sortByScore(activeTasks) : []), [activeTasks]);
  const focusTasks = ranked.slice(0, 3);
  const nextTasks = ranked.slice(3, 8);
  const scheduledToday = (todayTasks ?? []).filter((t) => t.scheduledAt);

  return (
    <div>
      <PageHeader title={greetingForNow()} description={formatFullDate()} />
      <div className="page-content flex flex-col gap-6 md:gap-8">
        <Section icon={<Target className="size-4" />} title={he.today.focus} subtitle={he.today.focusSubtitle}>
          {isLoading ? (
            <TaskListSkeleton rows={3} />
          ) : focusTasks.length > 0 ? (
            <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-1.5">
              {focusTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState title={he.empty.noFocus} description={he.empty.noFocusDesc} />
          )}
        </Section>

        <Section icon={<Zap className="size-4" />} title={he.today.recommended}>
          {nextTasks.length > 0 ? (
            <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-1.5">
              {nextTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState title={he.empty.nothingRecommended} />
          )}
        </Section>

        {scheduledToday.length > 0 && (
          <Section icon={<CalendarClock className="size-4" />} title={he.today.scheduled}>
            <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-1.5">
              {scheduledToday.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </Section>
        )}

        <Section icon={<Zap className="size-4" />} title={he.today.quickWins} subtitle={he.today.quickWinsSubtitle}>
          {quickWins && quickWins.length > 0 ? (
            <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-1.5">
              {quickWins.slice(0, 6).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState title={he.empty.noQuickWins} />
          )}
        </Section>

        <Section icon={<Clock className="size-4" />} title={he.today.waiting} subtitle={he.today.waitingSubtitle}>
          {waitingTasks && waitingTasks.length > 0 ? (
            <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-1.5">
              {waitingTasks.slice(0, 6).map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <EmptyState title={he.empty.noWaiting} description={he.empty.noWaitingDesc} />
          )}
        </Section>

        {overdueTasks && overdueTasks.length > 0 && (
          <Section icon={<AlertTriangle className="size-4 text-status-red" />} title={he.today.overdue}>
            <div className="flex flex-col gap-0.5 rounded-xl border border-status-red/20 bg-status-red/5 p-1.5">
              {overdueTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="font-heading text-base font-medium">{title}</h2>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}
