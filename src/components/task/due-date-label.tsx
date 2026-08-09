import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDueLabel, isOverdue } from "@/lib/date-utils";

export function DueDateLabel({
  date,
  className,
  showTime = false,
}: {
  date: Date | string | null | undefined;
  className?: string;
  showTime?: boolean;
}) {
  if (!date) return null;
  const overdue = isOverdue(date);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        overdue ? "text-status-red font-medium" : "text-muted-foreground",
        className
      )}
    >
      {showTime ? <Clock className="size-3" /> : <CalendarDays className="size-3" />}
      {formatDueLabel(date)}
    </span>
  );
}
