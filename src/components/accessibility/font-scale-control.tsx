"use client";

import { useEffect, useState } from "react";
import { Accessibility, Minus, Moon, Plus, RotateCcw, Sun, Type } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useFontScale } from "@/hooks/use-font-scale";
import { fontScaleLabel } from "@/lib/font-scale";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

export function FontScaleControl() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { level, increase, decrease, reset, canIncrease, canDecrease } = useFontScale();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const activeTheme = mounted ? (theme === "system" ? resolvedTheme : theme) : "light";

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
          className="flex w-44 flex-col items-stretch gap-2 rounded-2xl border bg-popover/95 p-2 shadow-lg ring-1 ring-foreground/10 backdrop-blur-md"
          role="group"
          aria-label={he.a11y.panel}
        >
          <div>
            <span className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
              <Sun className="size-3.5" />
              {he.a11y.theme}
            </span>
            <div className="grid grid-cols-2 gap-1">
              <Button
                type="button"
                variant={activeTheme === "light" ? "default" : "outline"}
                size="sm"
                className="h-10 gap-1.5 rounded-xl text-xs"
                onClick={() => setTheme("light")}
                aria-pressed={activeTheme === "light"}
              >
                <Sun className="size-3.5" />
                {he.a11y.light}
              </Button>
              <Button
                type="button"
                variant={activeTheme === "dark" ? "default" : "outline"}
                size="sm"
                className="h-10 gap-1.5 rounded-xl text-xs"
                onClick={() => setTheme("dark")}
                aria-pressed={activeTheme === "dark"}
              >
                <Moon className="size-3.5" />
                {he.a11y.dark}
              </Button>
            </div>
          </div>

          <div className="border-t pt-2">
            <span className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
              <Type className="size-3.5" />
              {he.a11y.fontSize}
            </span>
            <div className="flex flex-col gap-1">
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
          </div>
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
        <Accessibility className="size-5" />
      </Button>
    </div>
  );
}
