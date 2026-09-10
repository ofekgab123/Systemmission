"use client";

import { useEffect, useMemo, useState } from "react";
import { eachDayOfInterval, set, startOfDay, startOfToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { TimeGrid } from "@/components/calendar/time-grid";
import { WeekStrip } from "@/components/calendar/week-strip";
import { CalendarQuickActions } from "@/components/calendar/calendar-quick-actions";
import { CalendarExternalDragProvider } from "@/components/calendar/calendar-external-drag";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { useUIStore } from "@/store/ui-store";
import { useAreaStore } from "@/store/area-store";
import { he } from "@/lib/i18n/he";
import { CAL } from "@/lib/calendar-theme";
import { cn } from "@/lib/utils";
import {
  formatCalendarPeriodLabel,
  getCalendarRange,
  shiftCalendarAnchor,
  type CalendarViewMode,
} from "@/lib/calendar-utils";
import {
  applyFictitiousPlacement,
  blockToOccurrence,
  newFictitiousBlockId,
  OUTLOOK_COLORS,
  persistFictitiousSchedule,
  readFictitiousSchedule,
  type FictitiousBlock,
  type FictitiousScheduleState,
  type FictitiousTaskPlacement,
} from "@/lib/fictitious-schedule";
import {
  FictitiousBlockDialog,
  type FictitiousBlockTarget,
} from "@/components/today/fictitious-block-dialog";
import type { EventOccurrence, TaskWithRelations } from "@/types";

const VIEW_MODES: { id: Extract<CalendarViewMode, "day" | "week">; label: string }[] = [
  { id: "day", label: he.calendar.viewDay },
  { id: "week", label: he.calendar.viewWeek },
];

export function FictitiousScheduleTab({ tasks }: { tasks: TaskWithRelations[] }) {
  const areaId = useAreaStore((s) => s.selectedAreaId);
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);

  const [viewMode, setViewMode] = useState<Extract<CalendarViewMode, "day" | "week">>("day");
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(new Date(2026, 8, 16)));
  const [state, setState] = useState<FictitiousScheduleState>({ blocks: [], placements: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<FictitiousBlockTarget | null>(null);

  useEffect(() => {
    setState(readFictitiousSchedule(areaId));
  }, [areaId]);

  const commit = (next: FictitiousScheduleState) => {
    setState(next);
    persistFictitiousSchedule(areaId, next);
  };

  const range = useMemo(() => getCalendarRange(anchorDate, viewMode), [anchorDate, viewMode]);
  const gridDays = useMemo(
    () =>
      viewMode === "day"
        ? [anchorDate]
        : eachDayOfInterval({ start: range.start, end: range.end }),
    [viewMode, anchorDate, range]
  );

  const events = useMemo(
    () => state.blocks.map(blockToOccurrence),
    [state.blocks]
  );

  const placementByTask = useMemo(() => {
    const map = new Map<string, FictitiousTaskPlacement>();
    for (const placement of state.placements) map.set(placement.taskId, placement);
    return map;
  }, [state.placements]);

  const scheduledTasks = useMemo(
    () =>
      tasks
        .filter((task) => placementByTask.has(task.id))
        .map((task) => applyFictitiousPlacement(task, placementByTask.get(task.id))),
    [tasks, placementByTask]
  );

  const backlogTasks = useMemo(
    () => tasks.filter((task) => !placementByTask.has(task.id)),
    [tasks, placementByTask]
  );

  const openCreate = (defaults?: { start: Date; end: Date; allDay?: boolean }) => {
    const start =
      defaults?.start ??
      set(anchorDate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });
    const end =
      defaults?.end ??
      set(anchorDate, { hours: 9, minutes: 30, seconds: 0, milliseconds: 0 });
    setFormTarget({ mode: "create", start, end, allDay: defaults?.allDay });
    setFormOpen(true);
  };

  const handleSaveBlock = (draft: Omit<FictitiousBlock, "id"> & { id?: string }) => {
    const previous = draft.id ? state.blocks.find((item) => item.id === draft.id) : undefined;
    const block: FictitiousBlock = {
      variant: "solid",
      color: OUTLOOK_COLORS.navy,
      ...previous,
      ...draft,
      id: draft.id ?? newFictitiousBlockId(),
    };
    const exists = state.blocks.some((item) => item.id === block.id);
    commit({
      ...state,
      blocks: exists
        ? state.blocks.map((item) => (item.id === block.id ? block : item))
        : [...state.blocks, block],
    });
    toast.success(exists ? he.today.fictitiousUpdated : he.today.fictitiousSaved);
  };

  const handleDeleteBlock = (id: string) => {
    commit({
      ...state,
      blocks: state.blocks.filter((block) => block.id !== id),
    });
    toast.success(he.today.fictitiousDeleted);
  };

  const moveOccurrence = (occurrence: EventOccurrence, newStart: Date, newEnd: Date) => {
    commit({
      ...state,
      blocks: state.blocks.map((block) =>
        block.id === occurrence.id
          ? { ...block, start: newStart.toISOString(), end: newEnd.toISOString() }
          : block
      ),
    });
  };

  const upsertPlacement = (taskId: string, start: Date) => {
    const next: FictitiousTaskPlacement = { taskId, start: start.toISOString() };
    commit({
      ...state,
      placements: state.placements.some((item) => item.taskId === taskId)
        ? state.placements.map((item) => (item.taskId === taskId ? next : item))
        : [...state.placements, next],
    });
  };

  const handleEventClick = (occurrence: EventOccurrence) => {
    const block = state.blocks.find((item) => item.id === occurrence.id);
    if (!block) return;
    setFormTarget({ mode: "edit", block });
    setFormOpen(true);
  };

  return (
    <CalendarExternalDragProvider>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{he.today.fictitiousSubtitle}</p>

        <div
          className="flex h-[min(80dvh,860px)] min-h-[36rem] flex-col overflow-hidden rounded-[20px] border shadow-[0_8px_32px_rgba(17,24,39,.08)]"
          style={{ borderColor: CAL.border, backgroundColor: CAL.surface }}
        >
          <div
            className="flex flex-wrap items-center gap-2 border-b px-3 py-2"
            style={{ borderColor: CAL.border }}
          >
            <div
              role="tablist"
              aria-label={he.calendar.viewModeLabel}
              className="flex gap-1 rounded-[11px] p-[3px]"
              style={{ backgroundColor: CAL.stripBg }}
            >
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  aria-selected={viewMode === mode.id}
                  className={cn(
                    "rounded-[9px] px-2.5 py-1.5 text-[13px] font-semibold transition-all",
                    viewMode === mode.id
                      ? "bg-white text-[#111827] shadow-[0_1px_3px_rgba(17,24,39,.12)]"
                      : "text-[#8A90A0] hover:text-[#374151]"
                  )}
                  onClick={() => setViewMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={he.calendar.prevPeriod}
                onClick={() => setAnchorDate(shiftCalendarAnchor(anchorDate, viewMode, -1))}
              >
                <ChevronRight className="size-4" />
              </Button>
              <DateField
                value={anchorDate}
                onChange={(date) => date && setAnchorDate(startOfDay(date))}
                className="h-8 min-w-[10rem] max-w-[14rem] justify-center text-[13px] font-semibold"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={he.calendar.nextPeriod}
                onClick={() => setAnchorDate(shiftCalendarAnchor(anchorDate, viewMode, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setAnchorDate(startOfToday())}
            >
              {he.calendar.today}
            </Button>
          </div>

          <div className="px-3 pt-1 pb-0 text-center text-[12px] font-medium text-[#8A90A0]">
            {formatCalendarPeriodLabel(anchorDate, viewMode)}
          </div>

          <CalendarQuickActions
            backlogTasks={backlogTasks}
            onTaskClick={openTaskPanel}
            onNewEvent={() => openCreate()}
          />

          {viewMode === "day" && (
            <WeekStrip
              anchorDate={anchorDate}
              selectedDay={anchorDate}
              onSelectDay={setAnchorDate}
              events={events}
              tasks={scheduledTasks}
            />
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <TimeGrid
              days={gridDays}
              events={events}
              tasks={scheduledTasks}
              onEventClick={handleEventClick}
              onTaskClick={openTaskPanel}
              onCreateRange={(start, end, allDay) => openCreate({ start, end, allDay })}
              onMoveOccurrence={moveOccurrence}
              onScheduleTask={(task, start) => {
                upsertPlacement(task.id, start);
                toast.success(he.today.fictitiousTaskPlaced);
              }}
              onUnscheduleTask={(task, day) => {
                upsertPlacement(task.id, startOfDay(day));
                toast.success(he.calendar.movedToAllDay);
              }}
              onMoveTaskToDay={(task, day) => {
                const current = placementByTask.get(task.id);
                const original = current ? new Date(current.start) : day;
                const next = set(day, {
                  hours: original.getHours(),
                  minutes: original.getMinutes(),
                  seconds: 0,
                  milliseconds: 0,
                });
                upsertPlacement(task.id, next);
                toast.success(he.calendar.movedToDay);
              }}
              hideDayHeader={viewMode === "day"}
              focusDay={viewMode !== "day" ? anchorDate : null}
              appearance="outlook"
            />
          </div>
        </div>
      </div>

      <FictitiousBlockDialog
        open={formOpen}
        target={formTarget}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
      />
    </CalendarExternalDragProvider>
  );
}
