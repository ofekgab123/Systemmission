"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { TaskRow } from "@/components/task/task-row";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import { he } from "@/lib/i18n/he";

export default function ReadyPage() {
  const { data: tasks, isLoading } = useTasks({ view: "ready" });

  return (
    <div>
      <PageHeader
        title={he.ready.title}
        description={he.ready.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content">
        {isLoading ? (
          <TaskListSkeleton />
        ) : tasks && tasks.length > 0 ? (
          <div className="flex flex-col gap-0.5 rounded-xl border border-status-blue/20 bg-status-blue/5 p-1.5">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={he.empty.noReady}
            description={he.empty.noReadyDesc}
            action={<AddTaskButton variant="outline" className="gap-2" />}
          />
        )}
      </div>
    </div>
  );
}
