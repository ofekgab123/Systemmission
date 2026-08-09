"use client";

import { format } from "date-fns";
import { he as dateHe } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DateField({
  value,
  onChange,
  placeholder = "בחר תאריך",
  className,
}: {
  value: Date | string | null | undefined;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const date = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 justify-start gap-1.5 text-xs font-normal",
              !date && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-3.5" />
        {date ? format(date, "d בMMM yyyy", { locale: dateHe }) : placeholder}
        {date && (
          <X
            className="ms-1 size-3.5 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange(null);
            }}
          />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ?? null)}
          autoFocus
          locale={dateHe}
        />
      </PopoverContent>
    </Popover>
  );
}
