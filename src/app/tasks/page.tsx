"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { GroupedTaskList, TaskList, TaskListSkeleton } from "@/components/task/task-list";
import {
  TASK_FILTER_STATUSES,
  TASK_STATUS_META,
  taskStatusToViewSlug,
} from "@/lib/task-meta";
import { he } from "@/lib/i18n/he";

const VIEW_GROUPS = [
  {
    label: he.tasks.filters.time,
    views: [
      { value: "all", label: he.views.all },
      { value: "today", label: he.views.today },
      { value: "upcoming", label: he.views.upcoming },
      { value: "overdue", label: he.views.overdue },
      { value: "no-deadline", label: he.views.noDeadline },
    ],
  },
  {
    label: he.tasks.filters.status,
    views: TASK_FILTER_STATUSES.map((status) => ({
      value: taskStatusToViewSlug(status),
      label: TASK_STATUS_META[status].label,
    })),
  },
] as const;

function TasksContent() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") ?? "all";

  useEffect(() => {
    const currentView = params.get("view");
    if (currentView === "needs-review") {
      router.replace("/needs-review");
      return;
    }
    if (currentView === "completed") {
      router.replace("/tasks?view=done");
    }
  }, [params, router]);

  const isAll = view === "all";
  const { data: tasks, isLoading } = useTasks(
    isAll
      ? { topLevel: true, excludeStatus: "CANCELLED,INBOX", limit: 500 }
      : { view, topLevel: true, limit: 500 }
  );

  return (
    <>
      <Tabs
        value={view}
        onValueChange={(v) => router.push(v === "all" ? "/tasks" : `/tasks?view=${v}`)}
        className="mb-6 flex flex-col gap-3"
      >
        {VIEW_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <span className="px-1 text-xs font-medium text-muted-foreground">{group.label}</span>
            <TabsList className="flex h-auto w-full flex-wrap items-center justify-start gap-1.5 rounded-xl border bg-muted/50 p-1.5">
              {group.views.map((v) => (
                <TabsTrigger
                  key={v.value}
                  value={v.value}
                  className="h-9 flex-none shrink-0 rounded-lg px-3.5 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ))}
      </Tabs>

      {isLoading ? (
        <TaskListSkeleton rows={8} />
      ) : isAll ? (
        <GroupedTaskList
          tasks={tasks ?? []}
          emptyAction={<AddTaskButton variant="outline" />}
        />
      ) : (
        <TaskList
          tasks={tasks ?? []}
          emptyTitle={he.empty.nothingHere}
          emptyAction={<AddTaskButton variant="outline" className="gap-2" />}
        />
      )}
    </>
  );
}

export default function TasksPage() {
  return (
    <div>
      <PageHeader
        title={he.tasks.title}
        description={he.tasks.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content">
        <Suspense fallback={<TaskListSkeleton rows={8} />}>
          <TasksContent />
        </Suspense>
      </div>
    </div>
  );
}
