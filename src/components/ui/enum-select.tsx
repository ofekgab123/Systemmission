"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = "בחר…",
  className,
  renderItem,
}: {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  className?: string;
  renderItem?: (opt: { value: T; label: string }) => React.ReactNode;
}) {
  const hasValue = value != null && options.some((opt) => opt.value === value);

  return (
    <Select
      value={hasValue ? value : null}
      onValueChange={(v) => onChange(v as T)}
      items={options.map((opt) => ({ value: opt.value, label: opt.label }))}
    >
      <SelectTrigger size="sm" className={cn("h-11 w-full min-h-11 text-start text-base sm:h-8 sm:min-h-8 sm:text-sm", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className="z-[100] max-h-[min(16rem,50dvh)] w-[var(--anchor-width)]">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="min-h-11 text-start text-base sm:min-h-8 sm:text-sm">
            {renderItem ? renderItem(opt) : opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
