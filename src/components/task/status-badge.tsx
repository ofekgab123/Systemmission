import { getTaskStatusMeta, STATUS_COLOR_CLASSES } from "@/lib/task-meta";
import type { TaskStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: TaskStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const meta = getTaskStatusMeta(status);
  const colors = STATUS_COLOR_CLASSES[meta.color];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      {showIcon && <Icon className="size-3" />}
      {meta.label}
    </span>
  );
}
