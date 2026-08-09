"use client";

import { useEffect, useState } from "react";
import { addDays, isSameDay } from "date-fns";
import { DateField } from "@/components/ui/date-field";
import { Button } from "@/components/ui/button";
import { startOfToday } from "@/lib/date-utils";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

type DueDateMode = "" | "today" | "tomorrow" | "custom" | "noDeadline";

const MODES = [
  { id: "today" as const, label: he.quickAdd.dateToday },
  { id: "tomorrow" as const, label: he.quickAdd.dateTomorrow },
  { id: "custom" as const, label: he.quickAdd.datePick },
  { id: "noDeadline" as const, label: he.quickAdd.dateNoDeadline },
];

function resolveMode(date: Date | null, noDeadline: boolean): DueDateMode {
  if (noDeadline) return "noDeadline";
  if (!date) return "";
  const today = startOfToday();
  if (isSameDay(date, today)) return "today";
  if (isSameDay(date, addDays(today, 1))) return "tomorrow";
  return "custom";
}

export function DueDateSelect({
  value,
  onChange,
  noDeadline = false,
  onNoDeadlineChange,
  createdDate = null,
  onCreatedDateChange,
  allowNoDeadline = false,
  invalid,
  className,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  noDeadline?: boolean;
  onNoDeadlineChange?: (value: boolean) => void;
  createdDate?: Date | null;
  onCreatedDateChange?: (date: Date | null) => void;
  allowNoDeadline?: boolean;
  invalid?: boolean;
  className?: string;
}) {
  const [mode, setMode] = useState<DueDateMode>(() => resolveMode(value, noDeadline));

  useEffect(() => {
    setMode(resolveMode(value, noDeadline));
  }, [value, noDeadline]);

  const modes = allowNoDeadline ? MODES : MODES.filter((m) => m.id !== "noDeadline");

  const handleModeChange = (next: DueDateMode) => {
    setMode(next);
    if (next === "noDeadline") {
      onNoDeadlineChange?.(true);
      onChange(null);
      onCreatedDateChange?.(createdDate ?? startOfToday());
      return;
    }
    onNoDeadlineChange?.(false);
    onCreatedDateChange?.(null);
    if (next === "today") onChange(startOfToday());
    else if (next === "tomorrow") onChange(addDays(startOfToday(), 1));
    else if (next === "custom") onChange(null);
    else onChange(null);
  };

  const showInvalid = invalid && !noDeadline && !value;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          allowNoDeadline ? "grid grid-cols-2 gap-2 sm:grid-cols-4" : "grid grid-cols-3 gap-2",
          showInvalid && mode !== "custom" && "rounded-lg p-0.5 ring-1 ring-destructive/40"
        )}
        role="group"
        aria-label={noDeadline ? he.quickAdd.formDateNoDeadline : he.quickAdd.formDate}
      >
        {modes.map((opt) => (
          <Button
            key={opt.id}
            type="button"
            variant={mode === opt.id ? "secondary" : "outline"}
            className={cn(
              "h-11 min-h-11 px-2 text-xs leading-tight sm:h-10 sm:text-sm",
              showInvalid && mode !== opt.id && mode === "" && "border-destructive/40"
            )}
            onClick={() => handleModeChange(opt.id)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {mode === "custom" && !noDeadline && (
        <DateField
          value={value}
          onChange={onChange}
          placeholder={he.task.setDate}
          className={cn("h-11 w-full text-sm sm:h-10", showInvalid && "border-destructive")}
        />
      )}

      {noDeadline && onCreatedDateChange && (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">{he.quickAdd.noDeadlineHint}</p>
          <DateField
            value={createdDate}
            onChange={onCreatedDateChange}
            placeholder={he.quickAdd.formCreatedDatePlaceholder}
            className="h-11 w-full text-sm sm:h-10"
          />
        </div>
      )}

      {showInvalid && mode === "" && (
        <p className="text-xs text-destructive">{he.quickAdd.formDatePlaceholder}</p>
      )}
    </div>
  );
}
