"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AddTaskButton } from "@/components/quick-add/add-task-button";
import { useTasks } from "@/hooks/use-tasks";
import { TaskRow } from "@/components/task/task-row";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import { formatDateTime } from "@/lib/date-utils";
import { he } from "@/lib/i18n/he";

export default function WaitingPage() {
  const { data: tasks, isLoading } = useTasks({ view: "waiting" });

  const groups = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const task of tasks ?? []) {
      const key = task.waitingFor?.trim() || he.waiting.unspecified;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return Array.from(map.entries()).sort((a, b) => (b[1]?.length ?? 0) - (a[1]?.length ?? 0));
  }, [tasks]);

  return (
    <div>
      <PageHeader
        title={he.waiting.title}
        description={he.waiting.description}
        actions={<AddTaskButton className="gap-2" />}
      />
      <div className="page-content">
        {isLoading ? (
          <TaskListSkeleton />
        ) : groups.length === 0 ? (
          <EmptyState
            title={he.empty.noWaiting}
            description={he.empty.noWaitingDesc}
            action={<AddTaskButton variant="outline" className="gap-2" />}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(([person, items]) => (
              <div key={person}>
                <div className="mb-2 flex items-center gap-2 px-2.5">
                  <span className="text-sm font-medium">{person}</span>
                  <span className="text-xs text-muted-foreground">
                    {he.waiting.waitingCount(items?.length ?? 0)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-1.5">
                  {items?.map((task) => (
                    <div key={task.id} className="flex flex-col">
                      <TaskRow task={task} />
                      {task.followUpDate && (
                        <p className="px-2.5 pb-1.5 text-xs text-muted-foreground">
                          {he.waiting.followUpOn} {formatDateTime(task.followUpDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
