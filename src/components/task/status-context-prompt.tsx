"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { DateField } from "@/components/ui/date-field";
import { useTask, useUpdateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/store/ui-store";
import { he } from "@/lib/i18n/he";

export function StatusContextPrompt() {
  const statusPrompt = useUIStore((s) => s.statusPrompt);
  const closeStatusPrompt = useUIStore((s) => s.closeStatusPrompt);
  const { data: task } = useTask(statusPrompt?.taskId ?? null);
  const updateTask = useUpdateTask();

  const [waitingFor, setWaitingFor] = useState("");
  const [followUpDate, setFollowUpDate] = useState<Date | null>(null);
  const [blockedReason, setBlockedReason] = useState("");

  const status = statusPrompt?.status;
  const open = !!statusPrompt;

  useEffect(() => {
    if (!open || !task) return;
    setWaitingFor(task.waitingFor ?? "");
    setFollowUpDate(task.followUpDate ?? null);
    setBlockedReason(task.blockedReason ?? "");
  }, [open, task?.id, task?.waitingFor, task?.followUpDate, task?.blockedReason]);

  const handleClose = () => closeStatusPrompt();

  const handleSave = () => {
    if (!statusPrompt) return;

    if (status === "BLOCKED") {
      const value = blockedReason.trim();
      if (!value) {
        toast.error(he.task.statusPrompt.fieldRequired);
        return;
      }
      updateTask.mutate(
        { id: statusPrompt.taskId, data: { blockedReason: value } },
        { onSuccess: handleClose }
      );
      return;
    }

    if (status === "WAITING") {
      const value = waitingFor.trim();
      if (!value) {
        toast.error(he.task.statusPrompt.fieldRequired);
        return;
      }
      updateTask.mutate(
        {
          id: statusPrompt.taskId,
          data: {
            waitingFor: value,
            followUpDate: followUpDate ?? null,
          },
        },
        { onSuccess: handleClose }
      );
    }
  };

  const title =
    status === "BLOCKED"
      ? he.task.statusPrompt.blockedTitle
      : status === "WAITING"
        ? he.task.statusPrompt.waitingTitle
        : "";

  const description =
    status === "BLOCKED"
      ? he.task.statusPrompt.blockedDescription
      : status === "WAITING"
        ? he.task.statusPrompt.waitingDescription
        : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {status === "BLOCKED" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="status-blocked-reason">{he.task.blockedReason}</Label>
            <Input
              id="status-blocked-reason"
              value={blockedReason}
              onChange={(e) => setBlockedReason(e.target.value)}
              placeholder={he.task.blockedReasonPlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        )}

        {status === "WAITING" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status-waiting-for">{he.task.waitingFor}</Label>
              <Input
                id="status-waiting-for"
                value={waitingFor}
                onChange={(e) => setWaitingFor(e.target.value)}
                placeholder={he.task.waitingForWho}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{he.task.followUp}</Label>
              <DateField value={followUpDate} onChange={setFollowUpDate} />
            </div>
          </div>
        )}

        <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            {he.actions.notNow}
          </Button>
          <Button type="button" onClick={handleSave}>
            {he.actions.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
