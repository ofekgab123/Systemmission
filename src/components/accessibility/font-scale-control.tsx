"use client";

import { useState } from "react";
import { Minus, Plus, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFontScale } from "@/hooks/use-font-scale";
import { fontScaleLabel } from "@/lib/font-scale";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

export function FontScaleControl() {
  const [open, setOpen] = useState(false);
  const { level, increase, decrease, reset, canIncrease, canDecrease } = useFontScale();

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col items-center gap-1",
        "end-2 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:end-3 md:top-1/2 md:bottom-auto md:-translate-y-1/2"
      )}
      dir="rtl"
    >
      {open && (
        <div
          className="flex flex-col items-stretch gap-1 rounded-2xl border bg-popover/95 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur-md"
          role="group"
          aria-label={he.a11y.fontSize}
        >
          <span className="px-2 py-1 text-center text-xs font-medium text-muted-foreground">
            {he.a11y.fontSize}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 rounded-xl"
            onClick={increase}
            disabled={!canIncrease}
            aria-label={he.a11y.increase}
          >
            <Plus className="size-5" />
          </Button>
          <span
            className="flex h-9 items-center justify-center rounded-lg bg-muted/60 text-sm font-semibold tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {fontScaleLabel(level)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11 rounded-xl"
            onClick={decrease}
            disabled={!canDecrease}
            aria-label={he.a11y.decrease}
          >
            <Minus className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 rounded-xl text-xs"
            onClick={reset}
            disabled={level === 0}
            aria-label={he.a11y.reset}
          >
            <RotateCcw className="size-3.5" />
            {he.a11y.reset}
          </Button>
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          "size-12 rounded-full shadow-lg ring-1 ring-foreground/10",
          open && "bg-primary text-primary-foreground"
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label={he.a11y.toggle}
        aria-expanded={open}
      >
        <Type className="size-5" />
      </Button>
    </div>
  );
}
