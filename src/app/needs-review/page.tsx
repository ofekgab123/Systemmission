"use client";

import { PageHeader } from "@/components/layout/page-header";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useReviewTasks } from "@/hooks/use-review-tasks";
import { TaskReviewList } from "@/components/task/task-review-list";
import { TaskListSkeleton } from "@/components/task/task-list";
import { he } from "@/lib/i18n/he";

export default function NeedsReviewPage() {
  const { data: tasks, isLoading } = useReviewTasks();

  return (
    <div>
      <PageHeader
        title={he.needsReview.title}
        description={he.needsReview.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content">
        {isLoading ? (
          <TaskListSkeleton rows={8} />
        ) : (
          <TaskReviewList
            tasks={tasks ?? []}
            emptyAction={<AddTaskButton variant="outline" className="gap-2" />}
          />
        )}
      </div>
    </div>
  );
}
