"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useTasks, useCreateTask } from "@/hooks/use-tasks";
import { TaskList, TaskListSkeleton } from "@/components/task/task-list";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { he } from "@/lib/i18n/he";

export default function InboxPage() {
  const { data: tasks, isLoading } = useTasks({ view: "inbox" });
  const createTask = useCreateTask();
  const [capture, setCapture] = useState("");

  const handleCapture = () => {
    if (!capture.trim()) return;
    createTask.mutate(
      { title: capture.trim(), status: "INBOX" },
      { onSuccess: () => toast.success(he.inbox.captured) }
    );
    setCapture("");
  };

  return (
    <div>
      <PageHeader title={he.inbox.title} description={he.inbox.description} />
      <div className="page-content">
        <div className="mb-6 flex items-end gap-2 rounded-xl border bg-card p-3">
          <Textarea
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCapture();
              }
            }}
            placeholder={he.inbox.placeholder}
            className="min-h-10 resize-none border-none px-1 shadow-none focus-visible:ring-0"
            rows={1}
            dir="auto"
          />
          <Button size="icon" onClick={handleCapture} disabled={!capture.trim()}>
            <Send className="size-4" />
          </Button>
        </div>

        {isLoading ? (
          <TaskListSkeleton />
        ) : (
          <TaskList
            tasks={tasks ?? []}
            emptyTitle={he.empty.inboxZero}
            emptyDescription={he.empty.inboxZeroDesc}
          />
        )}
      </div>
    </div>
  );
}
