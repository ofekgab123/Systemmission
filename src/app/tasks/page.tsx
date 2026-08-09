"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { GroupedTaskList, TaskList, TaskListSkeleton } from "@/components/task/task-list";
import { he } from "@/lib/i18n/he";

const VIEWS = [
  { value: "all", label: he.views.all },
  { value: "today", label: he.views.today },
  { value: "upcoming", label: he.views.upcoming },
  { value: "overdue", label: he.views.overdue },
  { value: "waiting", label: he.views.waiting },
  { value: "blocked", label: he.views.blocked },
  { value: "no-deadline", label: he.views.noDeadline },
  { value: "stale", label: he.views.stale },
  { value: "completed", label: he.views.completed },
];

function TasksContent() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") ?? "all";

  const isAll = view === "all";
  const { data: tasks, isLoading } = useTasks(
    isAll
      ? { topLevel: true, excludeStatus: "CANCELLED", limit: 500 }
      : { view, topLevel: true, limit: 500 }
  );

  return (
    <>
      <Tabs
        value={view}
        onValueChange={(v) => router.push(v === "all" ? "/tasks" : `/tasks?view=${v}`)}
        className="mb-5"
      >
        <TabsList className="flex-wrap justify-start bg-transparent p-0">
          {VIEWS.map((v) => (
            <TabsTrigger key={v.value} value={v.value} className="data-[state=active]:bg-accent">
              {v.label}
            </TabsTrigger>
          ))}
        </TabsList>
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
