"use client";

import { useMemo, useState } from "react";
import { endOfDay, set, startOfDay } from "date-fns";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DateField } from "@/components/ui/date-field";
import { EnumSelect } from "@/components/ui/enum-select";
import { useCreateEvent, useUpdateEvent, type EventEditScope } from "@/hooks/use-events";
import { useEventCategories } from "@/hooks/use-event-categories";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";
import type { EventOccurrence } from "@/types";
import type { EventRecurrencePattern, EventShowAs } from "@/generated/prisma/enums";

export interface EventFormTarget {
  /** Occurrence being edited; null/undefined when creating. */
  occurrence?: EventOccurrence | null;
  /** Scope decided by the caller when editing a recurring event. */
  scope?: EventEditScope;
  /** Prefill for new events (from a clicked/dragged slot). */
  defaults?: { start: Date; end: Date; allDay?: boolean };
}

const WEEKDAY_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

const SHOW_AS_OPTIONS: { value: EventShowAs; label: string }[] = [
  { value: "FREE", label: he.events.showAsFree },
  { value: "TENTATIVE", label: he.events.showAsTentative },
  { value: "BUSY", label: he.events.showAsBusy },
  { value: "OUT_OF_OFFICE", label: he.events.showAsOof },
];

const RECURRENCE_OPTIONS: { value: "NONE" | EventRecurrencePattern; label: string }[] = [
  { value: "NONE", label: he.events.recurrenceNone },
  { value: "DAILY", label: he.events.recurrenceDaily },
  { value: "WEEKLY", label: he.events.recurrenceWeekly },
  { value: "MONTHLY", label: he.events.recurrenceMonthly },
  { value: "YEARLY", label: he.events.recurrenceYearly },
];

const RECURRENCE_END_OPTIONS: { value: "never" | "until" | "count"; label: string }[] = [
  { value: "never", label: he.events.recurrenceEndsNever },
  { value: "until", label: he.events.recurrenceEndsUntil },
  { value: "count", label: he.events.recurrenceEndsCount },
];

const INTERVAL_UNIT: Record<EventRecurrencePattern, string> = {
  DAILY: he.events.recurrenceIntervalDays,
  WEEKLY: he.events.recurrenceIntervalWeeks,
  MONTHLY: he.events.recurrenceIntervalMonths,
  YEARLY: he.events.recurrenceIntervalYears,
};

const REMINDER_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: he.events.reminderNone },
  { value: "0", label: he.events.reminderAtStart },
  { value: "5", label: he.events.reminderMin(5) },
  { value: "15", label: he.events.reminderMin(15) },
  { value: "30", label: he.events.reminderMin(30) },
  { value: "60", label: he.events.reminderHour1 },
  { value: "1440", label: he.events.reminderDay1 },
];

function toTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date: Date, time: string): Date {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
}

interface InitialFormState {
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  startDate: Date;
  startTime: string;
  endDate: Date;
  endTime: string;
  categoryId: string | null;
  showAs: EventShowAs;
  reminder: string;
  pattern: "NONE" | EventRecurrencePattern;
  interval: number;
  weekdays: number[];
  endsMode: "never" | "until" | "count";
  until: Date | null;
  count: number;
}

function computeInitialState(target: EventFormTarget | null): InitialFormState {
  const occurrence = target?.occurrence ?? null;
  const scope = target?.scope;

  if (occurrence) {
    const useSeriesTimes = scope === "series" && occurrence.isRecurring;
    const start = new Date(useSeriesTimes ? occurrence.seriesStart : occurrence.start);
    const end = new Date(useSeriesTimes ? occurrence.seriesEnd : occurrence.end);
    return {
      title: occurrence.title,
      description: occurrence.description ?? "",
      location: occurrence.location ?? "",
      allDay: occurrence.allDay,
      startDate: start,
      startTime: toTimeString(start),
      endDate: end,
      endTime: toTimeString(end),
      categoryId: occurrence.categoryId,
      showAs: occurrence.showAs,
      reminder: occurrence.reminderMinutes === null ? "none" : String(occurrence.reminderMinutes),
      pattern: occurrence.recurrencePattern ?? "NONE",
      interval: occurrence.recurrenceInterval || 1,
      weekdays: occurrence.recurrenceWeekdays ?? [],
      endsMode: occurrence.recurrenceUntil ? "until" : occurrence.recurrenceCount ? "count" : "never",
      until: occurrence.recurrenceUntil ? new Date(occurrence.recurrenceUntil) : null,
      count: occurrence.recurrenceCount ?? 10,
    };
  }

  const defaults = target?.defaults;
  const start = defaults?.start ?? set(new Date(), { minutes: 0, seconds: 0, milliseconds: 0 });
  const end = defaults?.end ?? new Date(start.getTime() + 30 * 60 * 1000);
  return {
    title: "",
    description: "",
    location: "",
    allDay: defaults?.allDay ?? false,
    startDate: start,
    startTime: toTimeString(start),
    endDate: end,
    endTime: toTimeString(end),
    categoryId: null,
    showAs: "BUSY",
    reminder: "15",
    pattern: "NONE",
    interval: 1,
    weekdays: [],
    endsMode: "never",
    until: null,
    count: 10,
  };
}

/** Stable identity for a form target, used as a React `key` to reset form state on open. */
function targetKey(target: EventFormTarget | null): string {
  if (!target) return "empty";
  if (target.occurrence) return `${target.occurrence.id}:${target.scope ?? ""}`;
  return `new:${target.defaults?.start?.getTime() ?? "now"}`;
}

export function EventFormDialog({
  open,
  target,
  onClose,
  onManageCategories,
}: {
  open: boolean;
  target: EventFormTarget | null;
  onClose: () => void;
  onManageCategories: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && (
        <EventFormBody
          key={targetKey(target)}
          target={target}
          onClose={onClose}
          onManageCategories={onManageCategories}
        />
      )}
    </Dialog>
  );
}

function EventFormBody({
  target,
  onClose,
  onManageCategories,
}: {
  target: EventFormTarget | null;
  onClose: () => void;
  onManageCategories: () => void;
}) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: categories } = useEventCategories();

  const occurrence = target?.occurrence ?? null;
  const scope = target?.scope;
  const isEditing = !!occurrence;
  // Recurrence rule is editable when creating, or when editing the whole series
  const showRecurrenceEditor = !isEditing || scope === "series" || !occurrence?.isRecurring;

  const [initial] = useState(() => computeInitialState(target));
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [location, setLocation] = useState(initial.location);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startDate, setStartDate] = useState<Date>(initial.startDate);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endDate, setEndDate] = useState<Date>(initial.endDate);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId);
  const [showAs, setShowAs] = useState<EventShowAs>(initial.showAs);
  const [reminder, setReminder] = useState<string>(initial.reminder);
  const [pattern, setPattern] = useState<"NONE" | EventRecurrencePattern>(initial.pattern);
  const [interval, setInterval] = useState(initial.interval);
  const [weekdays, setWeekdays] = useState<number[]>(initial.weekdays);
  const [endsMode, setEndsMode] = useState<"never" | "until" | "count">(initial.endsMode);
  const [until, setUntil] = useState<Date | null>(initial.until);
  const [count, setCount] = useState(initial.count);

  const categoryOptions = useMemo(
    () => [
      { value: "__none__", label: he.events.noCategory },
      ...(categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories]
  );

  const computedStart = allDay ? startOfDay(startDate) : combineDateTime(startDate, startTime);
  const computedEnd = allDay ? endOfDay(endDate) : combineDateTime(endDate, endTime);
  const timesValid = computedEnd > computedStart;
  const canSave = title.trim().length > 0 && timesValid && !createEvent.isPending && !updateEvent.isPending;

  // Moving the start shifts the end to preserve duration, like Outlook
  const shiftEndBy = (newStart: Date) => {
    const duration = computedEnd.getTime() - computedStart.getTime();
    if (duration <= 0) return;
    const newEnd = new Date(newStart.getTime() + duration);
    setEndDate(newEnd);
    setEndTime(toTimeString(newEnd));
  };

  const handleStartDateChange = (date: Date | null) => {
    if (!date) return;
    setStartDate(date);
    shiftEndBy(allDay ? startOfDay(date) : combineDateTime(date, startTime));
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (time) shiftEndBy(combineDateTime(startDate, time));
  };

  const toggleWeekday = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSave = () => {
    if (!canSave) return;

    const recurring = showRecurrenceEditor && pattern !== "NONE";
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      start: computedStart.toISOString(),
      end: computedEnd.toISOString(),
      allDay,
      showAs,
      reminderMinutes: reminder === "none" ? null : Number(reminder),
      categoryId: categoryId === "__none__" ? null : categoryId,
      ...(showRecurrenceEditor
        ? {
            recurrencePattern: recurring ? (pattern as EventRecurrencePattern) : null,
            recurrenceInterval: recurring ? Math.max(1, interval) : 1,
            recurrenceWeekdays:
              recurring && pattern === "WEEKLY"
                ? weekdays.length > 0
                  ? weekdays
                  : [computedStart.getDay()]
                : [],
            recurrenceUntil: recurring && endsMode === "until" && until ? until.toISOString() : null,
            recurrenceCount: recurring && endsMode === "count" ? Math.max(1, count) : null,
          }
        : {}),
    };

    const onError = () => toast.error(he.events.saveFailed);

    if (!occurrence) {
      createEvent.mutate(payload, {
        onSuccess: () => {
          toast.success(he.events.eventCreated);
          onClose();
        },
        onError,
      });
      return;
    }

    updateEvent.mutate(
      {
        id: occurrence.id,
        data: payload,
        scope: occurrence.isRecurring ? scope : undefined,
        occurrenceStart: occurrence.isRecurring ? occurrence.occurrenceStart : undefined,
      },
      {
        onSuccess: () => {
          toast.success(he.events.eventUpdated);
          onClose();
        },
        onError,
      }
    );
  };

  return (
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? he.events.editEvent : he.events.newEvent}
            {isEditing && occurrence?.isRecurring && (
              <span className="ms-2 text-xs font-normal text-muted-foreground">
                ({scope === "series" ? he.events.entireSeries : he.events.thisOccurrence})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={he.events.titlePlaceholder}
            autoFocus
            className="text-base font-medium"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
          />

          <div className="flex items-center justify-between gap-2">
            <Field label={he.events.category} className="flex-1">
              <div className="flex items-center gap-1.5">
                <EnumSelect
                  value={categoryId ?? "__none__"}
                  onChange={(v) => setCategoryId(v === "__none__" ? null : v)}
                  options={categoryOptions}
                  className="flex-1"
                  renderItem={(opt) => (
                    <span className="flex items-center gap-2">
                      {opt.value !== "__none__" && (
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              categories?.find((c) => c.id === opt.value)?.color ?? "#94a3b8",
                          }}
                        />
                      )}
                      {opt.label}
                    </span>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={he.events.manageCategories}
                  title={he.events.manageCategories}
                  onClick={onManageCategories}
                >
                  <Settings2 className="size-4" />
                </Button>
              </div>
            </Field>

            <Field label={he.events.allDay}>
              <div className="flex h-8 items-center">
                <Switch checked={allDay} onCheckedChange={setAllDay} />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={he.events.start}>
              <div className="flex gap-1.5">
                <DateField value={startDate} onChange={handleStartDateChange} className="flex-1" />
                {!allDay && (
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-24 shrink-0 tabular-nums"
                  />
                )}
              </div>
            </Field>
            <Field label={he.events.end}>
              <div className="flex gap-1.5">
                <DateField
                  value={endDate}
                  onChange={(d) => d && setEndDate(d)}
                  className="flex-1"
                />
                {!allDay && (
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={cn("w-24 shrink-0 tabular-nums", !timesValid && "border-destructive")}
                  />
                )}
              </div>
            </Field>
          </div>

          {showRecurrenceEditor && (
            <Field label={he.events.recurrence}>
              <div className="flex flex-col gap-2 rounded-lg border p-2.5">
                <EnumSelect
                  value={pattern}
                  onChange={setPattern}
                  options={RECURRENCE_OPTIONS}
                />

                {pattern !== "NONE" && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{he.events.recurrenceEvery}</span>
                      <Input
                        type="number"
                        min={1}
                        value={interval}
                        onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                        className="h-8 w-16 text-center tabular-nums"
                      />
                      <span className="text-muted-foreground">
                        {INTERVAL_UNIT[pattern as EventRecurrencePattern]}
                      </span>
                    </div>

                    {pattern === "WEEKLY" && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-muted-foreground">
                          {he.events.recurrenceOnDays}
                        </span>
                        <div className="flex gap-1">
                          {WEEKDAY_LETTERS.map((letter, day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleWeekday(day)}
                              className={cn(
                                "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                                weekdays.includes(day)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                              )}
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{he.events.recurrenceEnds}</span>
                      <EnumSelect
                        value={endsMode}
                        onChange={setEndsMode}
                        options={RECURRENCE_END_OPTIONS}
                        className="w-32 flex-none"
                      />
                      {endsMode === "until" && (
                        <DateField value={until} onChange={setUntil} className="w-40 flex-none" />
                      )}
                      {endsMode === "count" && (
                        <span className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={1}
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                            className="h-8 w-16 text-center tabular-nums"
                          />
                          <span className="text-muted-foreground">
                            {he.events.recurrenceOccurrences}
                          </span>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Field>
          )}

          <Field label={he.events.location}>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={he.events.locationPlaceholder}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={he.events.reminder}>
              <EnumSelect value={reminder} onChange={setReminder} options={REMINDER_SELECT_OPTIONS} />
            </Field>
            <Field label={he.events.showAs}>
              <EnumSelect value={showAs} onChange={setShowAs} options={SHOW_AS_OPTIONS} />
            </Field>
          </div>

          <Field label={he.events.description}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={he.events.descriptionPlaceholder}
              className="min-h-20 resize-none text-sm"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>
              {he.events.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {isEditing ? he.events.save : he.events.create}
            </Button>
          </div>
        </div>
      </DialogContent>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
