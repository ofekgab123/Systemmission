"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  MOTIVATION_ALERT_DISPLAY_MS,
  MOTIVATION_ALERT_INTERVAL_MS,
  MOTIVATION_QUOTES,
  shuffleQuotes,
} from "@/lib/motivation-quotes";
import { useMotivationAlertsEnabled } from "@/hooks/use-motivation-alerts-enabled";
import { he } from "@/lib/i18n/he";

export function MotivationAlerts() {
  const { enabled } = useMotivationAlertsEnabled();
  const [quote, setQuote] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);

  const enabledRef = useRef(enabled);
  const quotesRef = useRef<string[]>([]);
  const quoteIndexRef = useRef(0);
  const timersRef = useRef<{
    show?: ReturnType<typeof setTimeout>;
    hide?: ReturnType<typeof setTimeout>;
    progress?: ReturnType<typeof setInterval>;
  }>({});

  enabledRef.current = enabled;

  const clearTimers = useCallback(() => {
    const { show, hide, progress } = timersRef.current;
    if (show) clearTimeout(show);
    if (hide) clearTimeout(hide);
    if (progress) clearInterval(progress);
    timersRef.current = {};
  }, []);

  const pickQuote = useCallback(() => {
    if (!quotesRef.current.length || quoteIndexRef.current >= quotesRef.current.length) {
      quotesRef.current = shuffleQuotes(MOTIVATION_QUOTES);
      quoteIndexRef.current = 0;
    }
    const next = quotesRef.current[quoteIndexRef.current];
    quoteIndexRef.current += 1;
    return next;
  }, []);

  const scheduleNext = useCallback(() => {
    if (!enabledRef.current) return;
    timersRef.current.show = setTimeout(() => {
      if (!enabledRef.current) return;

      setQuote(pickQuote());
      setProgress(100);

      const startedAt = Date.now();
      timersRef.current.progress = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, 100 - (elapsed / MOTIVATION_ALERT_DISPLAY_MS) * 100);
        setProgress(remaining);
      }, 200);

      timersRef.current.hide = setTimeout(() => {
        clearTimers();
        setQuote(null);
        setProgress(100);
        scheduleNext();
      }, MOTIVATION_ALERT_DISPLAY_MS);
    }, MOTIVATION_ALERT_INTERVAL_MS);
  }, [clearTimers, pickQuote]);

  const dismiss = useCallback(() => {
    clearTimers();
    setQuote(null);
    setProgress(100);
    scheduleNext();
  }, [clearTimers, scheduleNext]);

  useEffect(() => {
    clearTimers();
    setQuote(null);
    setProgress(100);

    if (!enabled) return;

    scheduleNext();
    return clearTimers;
  }, [enabled, clearTimers, scheduleNext]);

  return (
    <AlertDialog open={!!quote} onOpenChange={(open) => !open && quote && dismiss()}>
      <AlertDialogContent className="max-w-sm overflow-hidden p-0" dir="rtl">
        <div
          className="h-1 bg-primary transition-[width] duration-200 ease-linear"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
        <div className="p-6">
          <AlertDialogHeader className="text-start">
            <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <AlertDialogTitle>{he.motivation.alertTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-start text-base leading-relaxed whitespace-pre-wrap text-foreground">
              {quote}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 sm:justify-start">
            <Button type="button" variant="outline" className="w-full rounded-xl" onClick={dismiss}>
              {he.actions.close}
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
