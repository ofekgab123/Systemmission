import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDueLabel, isOverdue, isToday, isTomorrow, isThisWeek } from "@/lib/date-utils";

function dueDateSlugClasses(date: Date | string) {
  if (isOverdue(date)) {
    return "border-status-red/20 bg-status-red/10 text-status-red";
  }
  if (isToday(date)) {
    return "border-status-orange/20 bg-status-orange/10 text-status-orange";
  }
  if (isTomorrow(date)) {
    return "border-status-blue/20 bg-status-blue/10 text-status-blue";
  }
  if (isThisWeek(date)) {
    return "border-status-green/20 bg-status-green/10 text-status-green";
  }
  return "border-border/60 bg-muted/60 text-muted-foreground";
}

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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        dueDateSlugClasses(date),
        overdue && "font-semibold",
        className
      )}
    >
      {showTime ? <Clock className="size-3 shrink-0" /> : <CalendarDays className="size-3 shrink-0" />}
      {formatDueLabel(date)}
    </span>
  );
}
