"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCheckbox } from "@/components/task/task-checkbox";
import { TaskRowActions } from "@/components/task/task-row-actions";
import { PriorityBadge } from "@/components/task/priority-badge";
import { StatusBadge } from "@/components/task/status-badge";
import { TaskIncompleteIndicator } from "@/components/task/task-incomplete-indicator";
import { TaskListSkeleton, EmptyState } from "@/components/task/task-list";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import { useAreaStore } from "@/store/area-store";
import {
  applyPlanOrder,
  persistTodayPlanOrder,
  readTodayPlanOrder,
  todayPlanDateKey,
} from "@/lib/today-plan-order";
import { sortByScore } from "@/lib/task-score";
import { he } from "@/lib/i18n/he";
import type { TaskWithRelations } from "@/types";

function SortablePlanRow({
  task,
  index,
}: {
  task: TaskWithRelations;
  index: number;
}) {
  const [optimisticDone, setOptimisticDone] = useState(task.status === "DONE");
  const updateTask = useUpdateTask();
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const done = task.status === "DONE" || optimisticDone;
  const started = task.status === "IN_PROGRESS";

  useEffect(() => {
    setOptimisticDone(task.status === "DONE");
  }, [task.status]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleDone = (checked: boolean) => {
    setOptimisticDone(checked);
    updateTask.mutate(
      { id: task.id, data: { status: checked ? "DONE" : "READY" } },
      { onError: () => setOptimisticDone(!checked) }
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-start gap-2 rounded-lg border bg-card px-2 py-2.5 shadow-sm",
        started && !done && "bg-primary/[0.03]",
        isDragging && "z-10 opacity-90 shadow-md ring-2 ring-primary/20"
      )}
    >
      <button
        type="button"
        className="mt-0.5 flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:bg-accent active:cursor-grabbing"
        aria-label={he.today.planDragHandle}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums text-muted-foreground">
        {index + 1}
      </span>

      <div className="mt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <TaskCheckbox checked={done} onCheckedChange={handleToggleDone} />
      </div>

      <button
        type="button"
        onClick={() => openTaskPanel(task.id)}
        className="min-w-0 flex-1 pt-0.5 text-start"
      >
        <span
          className={cn(
            "block truncate text-sm font-medium",
            done ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          {task.title}
        </span>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} showIcon={false} className="text-xs" />
          {!done && <TaskIncompleteIndicator task={task} />}
        </div>
      </button>

      <TaskRowActions task={task} className="pt-0.5" />
    </div>
  );
}

export function TodayPlanTab({
  tasks,
  isLoading,
}: {
  tasks: TaskWithRelations[];
  isLoading: boolean;
}) {
  const areaId = useAreaStore((s) => s.selectedAreaId);
  const dateKey = todayPlanDateKey();
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    const saved = readTodayPlanOrder(dateKey, areaId) ?? [];
    const merged = applyPlanOrder(tasks, saved.length > 0 ? saved : null, sortByScore).map(
      (task) => task.id
    );
    setOrder(merged);
    persistTodayPlanOrder(dateKey, areaId, merged);
  }, [tasks, dateKey, areaId]);

  const sortedTasks = useMemo(() => {
    const byId = new Map(tasks.map((task) => [task.id, task]));
    return order.map((id) => byId.get(id)).filter(Boolean) as TaskWithRelations[];
  }, [tasks, order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedTasks.findIndex((task) => task.id === active.id);
    const newIndex = sortedTasks.findIndex((task) => task.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextIds = arrayMove(
      sortedTasks.map((task) => task.id),
      oldIndex,
      newIndex
    );
    setOrder(nextIds);
    persistTodayPlanOrder(dateKey, areaId, nextIds);
  };

  if (isLoading) {
    return <TaskListSkeleton rows={6} />;
  }

  if (sortedTasks.length === 0) {
    return (
      <EmptyState
        title={he.empty.noPlanTasks}
        description={he.empty.noPlanTasksDesc}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{he.today.planSubtitle}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {sortedTasks.map((task, index) => (
              <SortablePlanRow key={task.id} task={task} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
