"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AddTaskButton, AddTaskCaptureBar } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { TaskList, TaskListSkeleton } from "@/components/task/task-list";
import { he } from "@/lib/i18n/he";

export default function InboxPage() {
  const { data: tasks, isLoading } = useTasks({ view: "inbox" });

  return (
    <div>
      <PageHeader
        title={he.inbox.title}
        description={he.inbox.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content">
        <AddTaskCaptureBar className="mb-6 flex w-full items-center gap-2 rounded-xl border bg-card p-3 text-start text-sm transition-colors hover:bg-accent/40 active:bg-accent/60" />

        {isLoading ? (
          <TaskListSkeleton />
        ) : (
          <TaskList
            tasks={tasks ?? []}
            emptyTitle={he.empty.inboxZero}
            emptyDescription={he.empty.inboxZeroDesc}
            emptyAction={<AddTaskButton variant="outline" className="gap-2" />}
          />
        )}
      </div>
    </div>
  );
}
