import { ENERGY_META } from "@/lib/task-meta";
import type { EnergyLevel } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export function EnergyBadge({
  energy,
  className,
}: {
  energy: EnergyLevel;
  className?: string;
}) {
  const meta = ENERGY_META[energy];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground",
        className
      )}
    >
      <span>{meta.symbol}</span>
      {meta.label}
    </span>
  );
}
