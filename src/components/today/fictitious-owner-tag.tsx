import { fictitiousOwnerColor } from "@/lib/fictitious-schedule";
import { cn } from "@/lib/utils";

export function FictitiousOwnerTag({
  owners,
  ghost = false,
  compact = false,
  className,
}: {
  owners?: string[] | null;
  ghost?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const names = (owners ?? []).map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return null;

  return (
    <span className={cn("inline-flex max-w-full shrink-0 flex-wrap justify-end gap-0.5", className)}>
      {names.map((name) => {
        const color = fictitiousOwnerColor(name);
        return (
          <span
            key={name}
            className={cn(
              "inline-flex max-w-full items-center truncate rounded-[3px] font-bold",
              compact ? "px-0.5 text-[7px] leading-3" : "px-1 py-px text-[8px] leading-3.5"
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
      })}
    </span>
  );
}
