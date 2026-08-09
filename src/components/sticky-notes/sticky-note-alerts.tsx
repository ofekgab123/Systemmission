"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useStickyNotes, useUpdateStickyNote, type StickyNote } from "@/hooks/use-sticky-notes";
import { SNOOZE_OPTIONS } from "@/lib/sticky-note-utils";
import { he } from "@/lib/i18n/he";

export function StickyNoteAlerts() {
  const { data: dueNotes } = useStickyNotes({ active: true, due: true });
  const updateNote = useUpdateStickyNote();
  const [current, setCurrent] = useState<StickyNote | null>(null);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const handledIds = useRef(new Set<string>());

  const pickNext = useCallback(() => {
    const next = (dueNotes ?? []).find((n) => !handledIds.current.has(n.id));
    setCurrent(next ?? null);
    setSnoozeOpen(false);
  }, [dueNotes]);

  useEffect(() => {
    if (!current && dueNotes && dueNotes.length > 0) {
      pickNext();
    }
  }, [dueNotes, current, pickNext]);

  const finish = (id: string) => {
    handledIds.current.add(id);
    setCurrent(null);
    setSnoozeOpen(false);
    setTimeout(pickNext, 300);
  };

  const handleDismiss = () => {
    if (!current) return;
    updateNote.mutate({ id: current.id, action: "dismiss" }, { onSuccess: () => finish(current.id) });
  };

  const handleSnooze = (minutes: number) => {
    if (!current) return;
    updateNote.mutate(
      { id: current.id, action: "snooze", minutes },
      { onSuccess: () => finish(current.id) }
    );
  };

  const open = !!current;

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

        {snoozeOpen ? (
          <div className="grid grid-cols-2 gap-2">
            {SNOOZE_OPTIONS.map((opt) => (
              <Button
                key={opt.labelKey}
                type="button"
                variant="outline"
                className="h-10 rounded-xl text-sm"
                onClick={() => handleSnooze(opt.minutes)}
              >
                <Clock className="size-3.5" />
                {he.dontForget.snooze[opt.labelKey]}
              </Button>
            ))}
          </div>
        ) : (
          <AlertDialogFooter className="flex-row gap-2 sm:justify-start">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={handleDismiss}>
              {he.dontForget.forgot}
            </Button>
            <Button type="button" className="flex-1 rounded-xl" onClick={() => setSnoozeOpen(true)}>
              {he.dontForget.schedule}
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
