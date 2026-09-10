import { fictitiousOwnerColor } from "@/lib/fictitious-schedule";
import { cn } from "@/lib/utils";

export function FictitiousOwnerTag({
  owner,
  ghost = false,
  compact = false,
  className,
}: {
  owner?: string | null;
  ghost?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const name = owner?.trim();
  if (!name) return null;
  const color = fictitiousOwnerColor(name);

  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center truncate rounded-[3px] font-bold",
        compact ? "px-0.5 text-[7px] leading-3" : "px-1 py-px text-[8px] leading-3.5",
        className
      )}
      style={
        ghost
          ? { backgroundColor: color, color: "#fff" }
          : { backgroundColor: "rgba(0,0,0,0.22)", color: "inherit" }
      }
    >
      {name}
    </span>
  );
}
