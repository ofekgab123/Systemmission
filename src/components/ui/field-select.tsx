"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function FieldSelect({
  value,
  onChange,
  options,
  placeholder,
  invalid,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}) {
  const hasValue = value.length > 0 && options.some((opt) => opt.value === value);

  return (
    <Select
      value={hasValue ? value : null}
      onValueChange={(v) => onChange(v ?? "")}
      items={options.map((opt) => ({ value: opt.value, label: opt.label }))}
    >
      <SelectTrigger
        className={cn(
          "h-11 w-full min-h-11 text-start text-base sm:h-10 sm:text-sm",
          invalid && "border-destructive",
          className
        )}
        aria-invalid={invalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className="z-[100] max-h-[min(16rem,50dvh)] w-[var(--anchor-width)]">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="min-h-11 text-start text-base sm:min-h-8 sm:text-sm"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
