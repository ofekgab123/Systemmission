"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Tags,
  SlidersHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { he as dateHe } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import { formatCalendarPeriodLabel, type CalendarViewMode } from "@/lib/calendar-utils";
import { CAL } from "@/lib/calendar-theme";
import { DEFAULT_EVENT_COLOR } from "@/lib/event-utils";
import { useEventCategories } from "@/hooks/use-event-categories";
import { useProjects } from "@/hooks/use-projects";
import { CalendarQuickActions } from "@/components/calendar/calendar-quick-actions";
import type { EventOccurrence, TaskWithRelations } from "@/types";
import type { TaskStatus } from "@/generated/prisma/enums";

const VIEW_MODES: { id: CalendarViewMode; label: string }[] = [
  { id: "day", label: he.calendar.viewDay },
  { id: "workweek", label: he.calendar.viewWorkWeek },
  { id: "week", label: he.calendar.viewWeek },
  { id: "month", label: he.calendar.viewMonth },
];

type CalendarStatusFilter = Extract<TaskStatus, "DONE" | "BLOCKED" | "WAITING">;

const STATUS_FILTERS: { id: CalendarStatusFilter; label: string }[] = [
  { id: "DONE", label: he.views.completed },
  { id: "BLOCKED", label: he.views.blocked },
  { id: "WAITING", label: he.views.waiting },
];

import { UNCategorized_CATEGORY_KEY, NO_PROJECT_KEY } from "@/lib/calendar-category-filter";

function ViewModeSwitcher({
  viewMode,
  onViewModeChange,
}: {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
}) {
  return (
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
            "flex-1 rounded-[9px] px-2 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all",
            viewMode === mode.id
              ? "bg-white text-[#111827] shadow-[0_1px_3px_rgba(17,24,39,.12)]"
              : "text-[#8A90A0] hover:text-[#374151]"
          )}
          onClick={() => onViewModeChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function CategoryChip({
  name,
  color,
  count,
  active,
  onClick,
}: {
  name: string;
  color: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
        active
          ? "border-transparent text-white shadow-sm"
          : "border-[#DDE1E9] bg-white text-[#374151] hover:bg-[#F1F3F7]"
      )}
      style={active ? { backgroundColor: color } : undefined}
      title={he.calendar.eventCount(count)}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{
          backgroundColor: active ? "rgba(255,255,255,0.9)" : color,
          boxShadow: active ? undefined : `0 0 0 1px ${color}40`,
        }}
      />
      <span className="max-w-[8rem] truncate">{name}</span>
      <span className={cn("tabular-nums", active ? "text-white/85" : "text-[#9CA3AF]")}>
        {count}
      </span>
    </button>
  );
}

export function CalendarControls({
  viewMode,
  onViewModeChange,
  anchorDate,
  onJumpToDate,
  onPrev,
  onNext,
  onToday,
  onNewEvent,
  backlogTasks,
  onTaskClick,
  statusFilters,
  onToggleStatusFilter,
  tasks,
  projectFilters,
  onToggleProjectFilter,
  events,
  categoryFilters,
  onToggleCategoryFilter,
}: {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  anchorDate: Date;
  onJumpToDate: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent: () => void;
  backlogTasks: TaskWithRelations[];
  onTaskClick: (taskId: string) => void;
  statusFilters: Set<CalendarStatusFilter>;
  onToggleStatusFilter: (status: CalendarStatusFilter) => void;
  tasks: TaskWithRelations[];
  projectFilters: Set<string>;
  onToggleProjectFilter: (projectKey: string) => void;
  events: EventOccurrence[];
  categoryFilters: Set<string>;
  onToggleCategoryFilter: (categoryKey: string) => void;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      if (!v) {
        setDateOpen(false);
        setFiltersOpen(false);
        setCategoriesOpen(false);
      }
      return !v;
    });
  };

  const currentViewLabel = VIEW_MODES.find((m) => m.id === viewMode)?.label ?? "";

  const { data: categories = [] } = useEventCategories();
  const { data: projects = [] } = useProjects({ status: "ACTIVE" });
  const monthLabel = format(anchorDate, "MMMM yyyy", { locale: dateHe });
  const periodLabel = formatCalendarPeriodLabel(anchorDate, viewMode);
  const activeFilterCount = statusFilters.size;
  const activeCategoryCount = projectFilters.size + categoryFilters.size;

  const taskCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) {
      const key = task.projectId ?? NO_PROJECT_KEY;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const eventCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const occ of events) {
      const key = occ.categoryId ?? UNCategorized_CATEGORY_KEY;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name, "he")),
    [projects]
  );

  const hasCategoryLegend =
    sortedProjects.length > 0 || categories.length > 0 || tasks.length > 0 || events.length > 0;

  return (
    <div className="bg-white">
      <div
        className={cn("border-b px-4 pt-1.5", collapsed ? "pb-2" : "pb-2.5")}
        style={{ borderColor: CAL.border }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              aria-expanded={!collapsed}
              aria-label={collapsed ? he.calendar.expandControls : he.calendar.collapseControls}
              onClick={toggleCollapsed}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F1F3F7]"
            >
              <ChevronUp
                className={cn(
                  "size-4 transition-transform duration-200",
                  collapsed && "rotate-180"
                )}
              />
            </button>

            <button
              type="button"
              aria-expanded={dateOpen}
              onClick={() => !collapsed && setDateOpen((v) => !v)}
              className="flex min-w-0 items-center gap-1.5 text-start"
            >
              <span
                className={cn(
                  "truncate font-bold capitalize text-[#111827]",
                  collapsed ? "text-base" : "text-[21px]"
                )}
              >
                {viewMode === "month" ? monthLabel : periodLabel}
              </span>
              {!collapsed && (
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 text-[#6B7280] transition-transform duration-200",
                    dateOpen && "rotate-180"
                  )}
                />
              )}
            </button>

            {collapsed && (
              <span className="shrink-0 rounded-full bg-[#F1F3F7] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                {currentViewLabel}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onToday}
              className="flex h-7 items-center rounded-full border bg-white px-2.5 text-xs font-semibold text-[#374151] transition-colors hover:bg-[#F1F3F7]"
              style={{ borderColor: "#DDE1E9" }}
            >
              {he.calendar.today}
            </button>

            <div
              className="flex items-center rounded-[10px] p-0.5"
              style={{ backgroundColor: CAL.stripBg }}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-lg"
                onClick={onPrev}
                aria-label={he.calendar.prevPeriod}
              >
                <ChevronRight className="size-4 text-[#374151]" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-lg"
                onClick={onNext}
                aria-label={he.calendar.nextPeriod}
              >
                <ChevronLeft className="size-4 text-[#374151]" />
              </Button>
            </div>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-3">
            <ViewModeSwitcher viewMode={viewMode} onViewModeChange={onViewModeChange} />
          </div>
        )}
      </div>

      {!collapsed && (
        <>
      {/* Status filters */}
      <div
        className="flex flex-wrap items-center gap-2 border-b px-4 py-2"
        style={{ borderColor: CAL.border, backgroundColor: CAL.allDayBg }}
      >
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
            filtersOpen || activeFilterCount > 0
              ? "border-[#2563EB]/30 bg-[#E8F0FE] text-[#2563EB]"
              : "border-[#DDE1E9] bg-white text-[#374151]"
          )}
        >
          <SlidersHorizontal className="size-3.5" />
          {he.calendar.filterBy}
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {filtersOpen &&
          STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onToggleStatusFilter(filter.id)}
              className={cn(
                "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
                statusFilters.has(filter.id)
                  ? "border-[#2563EB]/30 bg-[#E8F0FE] text-[#2563EB]"
                  : "border-[#DDE1E9] bg-white text-[#374151] hover:bg-[#F1F3F7]"
              )}
            >
              {filter.label}
            </button>
          ))}

        <button
          type="button"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((v) => !v)}
          className={cn(
            "ms-auto flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
            categoriesOpen || activeCategoryCount > 0
              ? "border-[#2563EB]/30 bg-[#E8F0FE] text-[#2563EB]"
              : "border-[#DDE1E9] bg-white text-[#374151] hover:bg-[#F1F3F7]"
          )}
          title={he.calendar.legendProjects}
        >
          <Tags className="size-3.5" />
          <span className="hidden sm:inline">{he.calendar.legendProjects}</span>
          {activeCategoryCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
              {activeCategoryCount}
            </span>
          )}
        </button>
      </div>

      <CalendarQuickActions
        backlogTasks={backlogTasks}
        onTaskClick={onTaskClick}
        onNewEvent={onNewEvent}
      />

      {/* Category picker — opens from tags button */}
      {categoriesOpen && hasCategoryLegend && (
        <div
          className="flex flex-wrap gap-1.5 border-b px-4 py-2"
          style={{ borderColor: CAL.border, backgroundColor: CAL.surface }}
        >
          {sortedProjects.map((project) => (
            <CategoryChip
              key={project.id}
              name={project.name}
              color={project.color}
              count={taskCounts.get(project.id) ?? 0}
              active={projectFilters.has(project.id)}
              onClick={() => onToggleProjectFilter(project.id)}
            />
          ))}
          <CategoryChip
            name={he.task.noProject}
            color="#94a3b8"
            count={taskCounts.get(NO_PROJECT_KEY) ?? 0}
            active={projectFilters.has(NO_PROJECT_KEY)}
            onClick={() => onToggleProjectFilter(NO_PROJECT_KEY)}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              name={category.name}
              color={category.color}
              count={eventCounts.get(category.id) ?? 0}
              active={categoryFilters.has(category.id)}
              onClick={() => onToggleCategoryFilter(category.id)}
            />
          ))}
          <CategoryChip
            name={he.events.noCategory}
            color={DEFAULT_EVENT_COLOR}
            count={eventCounts.get(UNCategorized_CATEGORY_KEY) ?? 0}
            active={categoryFilters.has(UNCategorized_CATEGORY_KEY)}
            onClick={() => onToggleCategoryFilter(UNCategorized_CATEGORY_KEY)}
          />
        </div>
      )}

      {categoriesOpen && !hasCategoryLegend && (
        <div
          className="border-b px-4 py-3 text-xs text-[#9CA3AF]"
          style={{ borderColor: CAL.border }}
        >
          {he.calendar.noProjectsHint}
        </div>
      )}

      {dateOpen && (
        <div className="border-b px-4 py-3" style={{ borderColor: CAL.border }}>
          <DateField
            value={anchorDate}
            onChange={(date) => {
              if (date) {
                onJumpToDate(date);
                setDateOpen(false);
              }
            }}
            placeholder={he.calendar.jumpToDate}
            className="max-w-xs"
          />
        </div>
      )}
        </>
      )}
    </div>
  );
}
