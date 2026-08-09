"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

export function QuickAddHelp() {
  const { help } = he.quickAdd;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={help.title}
          >
            <CircleHelp className="size-4" />
          </Button>
        }
      />
      <PopoverContent className="w-[min(calc(100vw-2rem),22rem)] gap-3 p-3" align="end">
        <PopoverHeader>
          <PopoverTitle className="text-sm">{help.title}</PopoverTitle>
        </PopoverHeader>

        <div className="rounded-lg border bg-muted/30 p-2.5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{help.exampleLabel}</p>
          <p className="flex flex-wrap gap-1 text-start leading-relaxed" dir="rtl">
            {help.parts.map((part) => (
              <span
                key={part.text}
                className={cn("rounded px-1.5 py-0.5 text-xs font-medium", part.color)}
              >
                {part.text}
              </span>
            ))}
          </p>
        </div>

        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto text-start">
          {help.parts.map((part) => (
            <li key={part.text} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold", part.color)}>
                  {part.text}
                </span>
                <span className="text-sm font-medium">{part.label}</span>
              </div>
              <p className="text-xs leading-snug text-muted-foreground">{part.description}</p>
            </li>
          ))}
        </ul>

        <p className="border-t pt-2 text-xs text-muted-foreground">{help.enter}</p>
      </PopoverContent>
    </Popover>
  );
}
