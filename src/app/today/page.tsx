"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { sortByScore } from "@/lib/task-score";
import { TaskRow } from "@/components/task/task-row";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import { TodayPlanTab } from "@/components/today/today-plan-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { greetingForNow, formatFullDate } from "@/lib/date-utils";
import { Clock, AlertTriangle, CalendarClock, Target, ListOrdered } from "lucide-react";
import { he } from "@/lib/i18n/he";

const WORKABLE_EXCLUDE = "DONE,CANCELLED,SOMEDAY,WAITING,BLOCKED,INBOX";

function TodayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "plan" ? "plan" : "overview";

  const { data: activeTasks, isLoading } = useTasks({
    excludeStatus: WORKABLE_EXCLUDE,
    topLevel: true,
    limit: 300,
  });
  const { data: todayTasks } = useTasks({ view: "today" });
  const { data: overdueTasks } = useTasks({ view: "overdue" });
  const { data: waitingTasks } = useTasks({ view: "waiting" });

  const ranked = useMemo(() => (activeTasks ? sortByScore(activeTasks) : []), [activeTasks]);
  const focusTasks = ranked.slice(0, 3);
  const scheduledToday = (todayTasks ?? []).filter((t) => t.scheduledAt);

  const setTab = (value: string) => {
    router.replace(value === "plan" ? "/today?tab=plan" : "/today", { scroll: false });
  };

  return (
    <div>
      <PageHeader
        title={greetingForNow()}
        description={formatFullDate()}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content flex flex-col gap-6 md:gap-8">
        <Tabs value={tab} onValueChange={setTab} className="gap-6 md:gap-8">
          <TabsList className="grid h-10 w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="gap-1.5">
              <Target className="size-4" />
              {he.today.tabOverview}
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-1.5">
              <ListOrdered className="size-4" />
              {he.today.tabPlan}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-6 md:gap-8">
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

            {scheduledToday.length > 0 && (
              <Section icon={<CalendarClock className="size-4" />} title={he.today.scheduled}>
                <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-1.5">
                  {scheduledToday.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              </Section>
            )}

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
          </TabsContent>

          <TabsContent value="plan">
            <TodayPlanTab tasks={activeTasks ?? []} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<TaskListSkeleton rows={6} />}>
      <TodayPageContent />
    </Suspense>
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
        <h2 className="font-heading text-lg font-medium">{title}</h2>
        {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}
