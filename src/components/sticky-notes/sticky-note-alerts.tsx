"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStickyNotes, useUpdateStickyNote, type StickyNote } from "@/hooks/use-sticky-notes";
import { he } from "@/lib/i18n/he";

export function StickyNoteAlerts() {
  const { data: dueNotes } = useStickyNotes({ active: true, due: true });
  const updateNote = useUpdateStickyNote();
  const [current, setCurrent] = useState<StickyNote | null>(null);
  const [minutes, setMinutes] = useState("");
  const handledIds = useRef(new Set<string>());

  const pickNext = useCallback(() => {
    const next = (dueNotes ?? []).find((n) => !handledIds.current.has(n.id));
    setCurrent(next ?? null);
    setMinutes("");
  }, [dueNotes]);

  useEffect(() => {
    if (!current && dueNotes && dueNotes.length > 0) {
      pickNext();
    }
  }, [dueNotes, current, pickNext]);

  const finish = (id: string) => {
    handledIds.current.add(id);
    setCurrent(null);
    setMinutes("");
    setTimeout(pickNext, 300);
  };

  const handleDismiss = () => {
    if (!current) return;
    updateNote.mutate({ id: current.id, action: "dismiss" }, { onSuccess: () => finish(current.id) });
  };

  const handleSnooze = (value: number) => {
    if (!current) return;
    updateNote.mutate(
      { id: current.id, action: "snooze", minutes: value },
      { onSuccess: () => finish(current.id) }
    );
  };

  const handleCustomMinutes = () => {
    const parsed = Number.parseInt(minutes, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return;
    handleSnooze(parsed);
  };

  const open = !!current;
  const customMinutesValid = Number.parseInt(minutes, 10) >= 1;

  return (
    <AlertDialog open={open} onOpenChange={() => {}}>
      <AlertDialogContent className="max-w-sm" dir="rtl">
        <AlertDialogHeader className="text-start">
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-status-yellow/15 text-status-yellow">
            <Bell className="size-5" />
          </div>
          <AlertDialogTitle>{he.dontForget.alertTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-start whitespace-pre-wrap text-base text-foreground">
            {current?.content}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="snooze-minutes" className="text-sm font-medium text-foreground">
              {he.dontForget.remindInMinutes}
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="snooze-minutes"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="30"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCustomMinutes();
                  }
                }}
                className="h-10 rounded-xl text-center tabular-nums"
              />
              <span className="shrink-0 text-sm text-muted-foreground">{he.dontForget.minutesUnit}</span>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-xl px-3"
                disabled={!customMinutesValid}
                onClick={handleCustomMinutes}
              >
                <Clock className="size-3.5" />
                {he.dontForget.remind}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl text-sm"
              onClick={() => handleSnooze(-1)}
            >
              <Clock className="size-3.5" />
              {he.dontForget.snooze.tomorrow}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl text-sm"
              onClick={handleDismiss}
            >
              {he.dontForget.dontRemind}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
