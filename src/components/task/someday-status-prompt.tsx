"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import { he } from "@/lib/i18n/he";

export function SomedayStatusPrompt() {
  const somedayPrompt = useUIStore((s) => s.somedayPrompt);
  const closeSomedayPrompt = useUIStore((s) => s.closeSomedayPrompt);
  const updateTask = useUpdateTask();
  const [step, setStep] = useState<"ask" | "reason">("ask");
  const [reason, setReason] = useState("");

  const open = !!somedayPrompt;

  useEffect(() => {
    if (open) {
      setStep("ask");
      setReason("");
    }
  }, [open, somedayPrompt?.taskId]);

  const handleClose = () => {
    closeSomedayPrompt();
    setStep("ask");
    setReason("");
  };

  const applySomeday = (somedayReason: string | null) => {
    if (!somedayPrompt) return;
    updateTask.mutate(
      {
        id: somedayPrompt.taskId,
        data: {
          status: "SOMEDAY",
          somedayReason,
        },
      },
      { onSuccess: handleClose }
    );
  };

  const handleNoReason = () => applySomeday(null);

  const handleYes = () => setStep("reason");

  const handleSaveReason = () => {
    const value = reason.trim();
    if (!value) return;
    applySomeday(value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else setStep("ask");
      }}
    >
      <DialogContent className="sm:max-w-md">
        {step === "ask" ? (
          <>
            <DialogHeader>
              <DialogTitle>{he.task.statusPrompt.somedayTitle}</DialogTitle>
              <DialogDescription>{he.task.statusPrompt.somedayDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2 border-0 bg-transparent p-0 sm:justify-end">
              <Button type="button" variant="outline" onClick={handleNoReason}>
                {he.actions.no}
              </Button>
              <Button type="button" onClick={handleYes}>
                {he.actions.yes}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{he.task.statusPrompt.somedayReasonTitle}</DialogTitle>
              <DialogDescription>{he.task.statusPrompt.somedayReasonDescription}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="someday-reason">{he.task.somedayReason}</Label>
              <Input
                id="someday-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={he.task.somedayReasonPlaceholder}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveReason();
                  }
                }}
              />
            </div>
            <DialogFooter className="flex-row gap-2 border-0 bg-transparent p-0 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setStep("ask")}>
                {he.actions.back}
              </Button>
              <Button type="button" onClick={handleSaveReason} disabled={!reason.trim()}>
                {he.actions.save}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
