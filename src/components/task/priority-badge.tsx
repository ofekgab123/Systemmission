import { cn } from "@/lib/utils";
import { PRIORITY_META, STATUS_COLOR_CLASSES } from "@/lib/task-meta";
import type { Priority } from "@/generated/prisma/enums";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PriorityBadge({
  priority,
  className,
  showLabel = true,
}: {
  priority: Priority;
  className?: string;
  showLabel?: boolean;
}) {
  const meta = PRIORITY_META[priority];
  const colors = STATUS_COLOR_CLASSES[meta.color];
  const label = meta.label.split(" · ")[1] ?? meta.short;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
            colors.bg,
            colors.border,
            colors.text,
            className
          )}
        >
          <span
            className={cn("size-2 shrink-0 rounded-full ring-2 ring-background", colors.dot)}
            aria-hidden
          />
          {showLabel ? (
            <>
              <span className="font-semibold tabular-nums">{meta.short}</span>
              <span className="opacity-90">{label}</span>
            </>
          ) : (
            <span className="sr-only">{meta.label}</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{hePriorityTooltip(priority)}</TooltipContent>
    </Tooltip>
  );
}

function hePriorityTooltip(priority: Priority): string {
  return PRIORITY_META[priority].label;
}

/** נקודה קטנה — לכרטיסי קטגוריה וכד'. */
export function PriorityDot({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  const colors = STATUS_COLOR_CLASSES[meta.color];
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <span
          className={cn(
            "inline-block size-2.5 shrink-0 rounded-full ring-2 ring-background",
            colors.dot,
            className
          )}
        />
      </TooltipTrigger>
      <TooltipContent>{meta.label}</TooltipContent>
    </Tooltip>
  );
}
