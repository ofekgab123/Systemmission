import { cn } from "@/lib/utils";
import { PRIORITY_META, STATUS_COLOR_CLASSES } from "@/lib/task-meta";
import type { Priority } from "@/generated/prisma/enums";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PriorityDot({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  const meta = PRIORITY_META[priority];
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <span
          className={cn(
            "inline-block size-1.5 shrink-0 rounded-full",
            STATUS_COLOR_CLASSES[meta.color].dot,
            className
          )}
        />
      </TooltipTrigger>
      <TooltipContent>{meta.label}</TooltipContent>
    </Tooltip>
  );
}
