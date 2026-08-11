"use client";

import { useRef, useState } from "react";
import { ListTodo, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { CAL } from "@/lib/calendar-theme";
import {
  CALENDAR_TASK_DRAG_MIME,
  getCalendarTaskStyle,
} from "@/lib/calendar-utils";
import { useCalendarExternalDragOptional } from "@/components/calendar/calendar-external-drag";
import { EmptyState } from "@/components/task/task-list";
import type { TaskWithRelations } from "@/types";

const DRAG_THRESHOLD_PX = 8;

export function CalendarQuickActions({
  backlogTasks,
  onTaskClick,
  onNewEvent,
}: {
  backlogTasks: TaskWithRelations[];
  onTaskClick: (taskId: string) => void;
  onNewEvent: () => void;
}) {
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const didDragRef = useRef(false);
  const externalDrag = useCalendarExternalDragOptional();

  const handleHtmlDragStart = (e: React.DragEvent, taskId: string) => {
    didDragRef.current = true;
    e.dataTransfer.setData(CALENDAR_TASK_DRAG_MIME, taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    setBacklogOpen(false);
  };

  const handleHtmlDragEnd = () => {
    setIsDragging(false);
    setBacklogOpen(false);
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const handleTaskClick = (taskId: string) => {
    if (didDragRef.current) return;
    onTaskClick(taskId);
    setBacklogOpen(false);
  };

  const handleTaskPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    task: TaskWithRelations
  ) => {
    if (e.button !== 0 || !externalDrag || e.pointerType === "mouse") return;
    const startX = e.clientX;
    const startY = e.clientY;
    let started = false;

    const handleMove = (ev: PointerEvent) => {
      if (!started && Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD_PX) {
        return;
      }
      if (!started) {
        started = true;
        setIsDragging(true);
        setBacklogOpen(false);
        externalDrag.startDrag(task, ev.clientX, ev.clientY);
      } else {
        externalDrag.moveDrag(ev.clientX, ev.clientY);
      }
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      if (started) {
        didDragRef.current = true;
        externalDrag.endDrag();
        setIsDragging(false);
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      } else {
        handleTaskClick(task.id);
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className="relative border-b px-4 py-2"
      style={{ borderColor: CAL.border, backgroundColor: CAL.surface }}
    >
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label={he.calendar.backlogFabLabel}
          aria-expanded={backlogOpen}
          onClick={() => setBacklogOpen((v) => !v)}
          className={cn(
            "relative flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]",
            backlogOpen && "ring-2 ring-[#2563EB]/40 ring-offset-1"
          )}
          style={{ backgroundColor: "#111827" }}
        >
          <ListTodo className="size-3.5 stroke-[2.5]" />
          <span>{he.calendar.backlogShort}</span>
          {backlogTasks.length > 0 && (
            <span
              className="flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ backgroundColor: CAL.primary }}
            >
              {backlogTasks.length > 99 ? "99+" : backlogTasks.length}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label={he.events.newEvent}
          onClick={onNewEvent}
          className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98]"
          style={{ backgroundColor: CAL.primary, boxShadow: CAL.fabShadow }}
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>{he.events.newEvent}</span>
        </button>
      </div>

      {backlogOpen && (
        <>
          <button
            type="button"
            aria-label={he.calendar.backlogClose}
            className={cn(
              "fixed inset-0 z-30 bg-black/20",
              isDragging && "pointer-events-none bg-transparent"
            )}
            onClick={() => setBacklogOpen(false)}
          />
          <div
            className={cn(
              "absolute end-0 top-full z-40 mt-1.5 flex max-h-[min(360px,50dvh)] w-[min(100%,20rem)] flex-col overflow-hidden rounded-[16px] border shadow-[0_12px_32px_rgba(17,24,39,.16)]",
              isDragging && "invisible"
            )}
            style={{ borderColor: CAL.border, backgroundColor: CAL.surface }}
          >
            <div
              className="flex shrink-0 items-center justify-between border-b px-3 py-2.5"
              style={{ borderColor: CAL.border }}
            >
              <div>
                <h3 className="text-xs font-bold text-[#111827]">{he.calendar.backlogTitle}</h3>
                <p className="mt-0.5 text-[10px] text-[#8A90A0]">{he.calendar.backlogHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setBacklogOpen(false)}
                className="flex size-7 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F1F3F7]"
                aria-label={he.calendar.backlogClose}
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="cal-scroll min-h-0 flex-1 overflow-y-auto p-2.5">
              {backlogTasks.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {backlogTasks.map((task) => {
                    const { className, style } = getCalendarTaskStyle(task, "combined");
                    return (
                      <div
                        key={task.id}
                        draggable
                        title={he.calendar.dragToMove}
                        className="cursor-grab rounded-xl border p-1 active:cursor-grabbing"
                        style={{ borderColor: CAL.borderLight }}
                        onClick={() => handleTaskClick(task.id)}
                        onPointerDown={(e) => handleTaskPointerDown(e, task)}
                        onDragStart={(e) => handleHtmlDragStart(e, task.id)}
                        onDragEnd={handleHtmlDragEnd}
                      >
                        <div
                          className={cn(className, "block w-full truncate text-start text-xs select-none")}
                          style={style}
                        >
                          {task.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title={he.calendar.backlogEmpty}
                  description={he.calendar.backlogEmptyDesc}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
