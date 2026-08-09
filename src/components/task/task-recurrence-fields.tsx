"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EnumSelect } from "@/components/ui/enum-select";
import type { RecurrencePattern } from "@/generated/prisma/enums";
import {
  RECURRENCE_PATTERN_OPTIONS,
  RECURRENCE_WEEKDAY_OPTIONS,
  recurrenceNeedsWeekday,
} from "@/lib/task-recurrence";
import { he } from "@/lib/i18n/he";

export function TaskRecurrenceFields({
  enabled,
  onEnabledChange,
  pattern,
  onPatternChange,
  weekday,
  onWeekdayChange,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  pattern: RecurrencePattern | null;
  onPatternChange: (pattern: RecurrencePattern | null) => void;
  weekday: number | null;
  onWeekdayChange: (weekday: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center gap-2.5">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => {
            const next = checked === true;
            onEnabledChange(next);
            if (next && !pattern) {
              onPatternChange("WEEKLY");
            }
            if (!next) {
              onPatternChange(null);
              onWeekdayChange(null);
            }
          }}
          aria-label={he.recurrence.enabled}
        />
        <span className="text-sm font-medium">{he.recurrence.enabled}</span>
      </label>

      {enabled && (
        <div className="flex flex-col gap-2 ps-6">
          <Label className="text-xs text-muted-foreground">{he.recurrence.frequency}</Label>
          <EnumSelect
            value={pattern as never}
            onChange={(value) => {
              onPatternChange(value as RecurrencePattern);
              if (value !== "WEEKDAY") onWeekdayChange(null);
              else if (weekday == null) onWeekdayChange(0);
            }}
            options={RECURRENCE_PATTERN_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            placeholder={he.recurrence.selectFrequency}
            className="w-full"
          />

          {recurrenceNeedsWeekday(pattern) && (
            <EnumSelect
              value={weekday != null ? String(weekday) : null}
              onChange={(value) => onWeekdayChange(value != null ? Number(value) : null)}
              options={RECURRENCE_WEEKDAY_OPTIONS.map((option) => ({
                value: String(option.value),
                label: option.label,
              }))}
              placeholder={he.recurrence.selectWeekday}
              className="w-full"
            />
          )}
        </div>
      )}
    </div>
  );
}
