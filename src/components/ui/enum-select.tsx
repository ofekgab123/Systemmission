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
  return (
    <Select value={value ?? undefined} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger size="sm" className={cn("h-8 text-xs", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {renderItem ? renderItem(opt) : opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
