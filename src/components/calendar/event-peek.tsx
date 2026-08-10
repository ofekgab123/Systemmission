"use client";

import { useState } from "react";
import { format } from "date-fns";
import { he as dateHe } from "date-fns/locale";
import { toast } from "sonner";
import { AlarmClock, MapPin, Pencil, Repeat, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteEvent, type EventEditScope } from "@/hooks/use-events";
import { eventColor, formatEventTimeRange } from "@/lib/event-utils";
import { he } from "@/lib/i18n/he";
import type { EventOccurrence } from "@/types";
import type { EventRecurrencePattern } from "@/generated/prisma/enums";

const WEEKDAY_NAMES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

const PATTERN_LABEL: Record<EventRecurrencePattern, string> = {
  DAILY: he.events.recurrenceDaily,
  WEEKLY: he.events.recurrenceWeekly,
  MONTHLY: he.events.recurrenceMonthly,
  YEARLY: he.events.recurrenceYearly,
};

const INTERVAL_UNIT: Record<EventRecurrencePattern, string> = {
  DAILY: he.events.recurrenceIntervalDays,
  WEEKLY: he.events.recurrenceIntervalWeeks,
  MONTHLY: he.events.recurrenceIntervalMonths,
  YEARLY: he.events.recurrenceIntervalYears,
};

function recurrenceLabel(occ: EventOccurrence): string | null {
  if (!occ.recurrencePattern) return null;
  const parts = [PATTERN_LABEL[occ.recurrencePattern]];
  if (occ.recurrenceInterval > 1) {
    parts.push(
      `${he.events.recurrenceEvery} ${occ.recurrenceInterval} ${INTERVAL_UNIT[occ.recurrencePattern]}`
    );
  }
  if (occ.recurrencePattern === "WEEKLY" && occ.recurrenceWeekdays.length > 0) {
    parts.push(occ.recurrenceWeekdays.map((d) => WEEKDAY_NAMES[d]).join(", "));
  }
  return parts.join(" · ");
}

function reminderLabel(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes === 0) return he.events.reminderAtStart;
  if (minutes === 60) return he.events.reminderHour1;
  if (minutes === 1440) return he.events.reminderDay1;
  return he.events.reminderMin(minutes);
}

const SHOW_AS_LABEL = {
  FREE: he.events.showAsFree,
  TENTATIVE: he.events.showAsTentative,
  BUSY: he.events.showAsBusy,
  OUT_OF_OFFICE: he.events.showAsOof,
} as const;

export function EventPeekDialog({
  occurrence,
  onClose,
  onEdit,
}: {
  occurrence: EventOccurrence | null;
  onClose: () => void;
  onEdit: (occurrence: EventOccurrence, scope?: EventEditScope) => void;
}) {
  const deleteEvent = useDeleteEvent();
  const [pendingAction, setPendingAction] = useState<"edit" | "delete" | null>(null);
  // Reset the scope prompt whenever a different occurrence is shown, without an extra effect render.
  const [lastOccurrenceId, setLastOccurrenceId] = useState<string | null>(
    occurrence?.occurrenceId ?? null
  );
  if ((occurrence?.occurrenceId ?? null) !== lastOccurrenceId) {
    setLastOccurrenceId(occurrence?.occurrenceId ?? null);
    if (pendingAction !== null) setPendingAction(null);
  }

  if (!occurrence) return null;

  const color = eventColor(occurrence);
  const start = new Date(occurrence.start);
  const dayLabel = format(start, "EEEE, d בMMMM yyyy", { locale: dateHe });
  const recurrence = recurrenceLabel(occurrence);
  const reminder = reminderLabel(occurrence.reminderMinutes);

  const performDelete = (scope?: EventEditScope) => {
    deleteEvent.mutate(
      {
        id: occurrence.id,
        scope,
        occurrenceStart: scope === "occurrence" ? occurrence.occurrenceStart : undefined,
      },
      {
        onSuccess: () => {
          toast.success(he.events.eventDeleted);
          onClose();
        },
        onError: () => toast.error(he.events.saveFailed),
      }
    );
  };

  const handleEditClick = () => {
    if (occurrence.isRecurring) setPendingAction("edit");
    else onEdit(occurrence);
  };

  const handleDeleteClick = () => {
    if (occurrence.isRecurring) setPendingAction("delete");
    else performDelete();
  };

  const handleScope = (scope: EventEditScope) => {
    if (pendingAction === "edit") onEdit(occurrence, scope);
    else if (pendingAction === "delete") performDelete(scope);
    setPendingAction(null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-2.5 pe-8">
            <span
              className="mt-1.5 size-3.5 shrink-0 rounded"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-snug">
                {occurrence.title || he.events.noTitle}
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {dayLabel}
                <br />
                <span className="tabular-nums">{formatEventTimeRange(occurrence)}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-2 text-sm">
          {occurrence.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{occurrence.location}</span>
            </div>
          )}
          {recurrence && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Repeat className="size-4 shrink-0" />
              <span>{recurrence}</span>
            </div>
          )}
          {reminder && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlarmClock className="size-4 shrink-0" />
              <span>{reminder}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {occurrence.category && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: `${color}26`, color }}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                {occurrence.category.name}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {SHOW_AS_LABEL[occurrence.showAs]}
            </span>
          </div>
          {occurrence.description && (
            <p className="whitespace-pre-wrap border-t pt-2 text-sm text-foreground">
              {occurrence.description}
            </p>
          )}
        </div>

        {pendingAction ? (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">
              {pendingAction === "edit"
                ? he.events.editScopeQuestion
                : he.events.deleteScopeQuestion}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleScope("occurrence")}
              >
                {he.events.thisOccurrence}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleScope("series")}
              >
                {he.events.entireSeries}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPendingAction(null)}>
              {he.events.cancel}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDeleteClick}
              disabled={deleteEvent.isPending}
            >
              <Trash2 className="size-3.5" />
              {he.events.delete}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleEditClick}>
              <Pencil className="size-3.5" />
              {he.events.edit}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
