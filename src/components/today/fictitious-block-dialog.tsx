"use client";

import { useState } from "react";
import { endOfDay, startOfDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DateField } from "@/components/ui/date-field";
import { he } from "@/lib/i18n/he";
import type { FictitiousBlock } from "@/lib/fictitious-schedule";

export type FictitiousBlockTarget =
  | { mode: "create"; start: Date; end: Date; allDay?: boolean }
  | { mode: "edit"; block: FictitiousBlock };

function toTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date: Date, time: string): Date {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function initialFromTarget(target: FictitiousBlockTarget) {
  if (target.mode === "create") {
    return {
      title: "",
      allDay: !!target.allDay,
      startDate: target.start,
      startTime: toTimeString(target.start),
      endDate: target.end,
      endTime: toTimeString(target.end),
      location: "",
      description: "",
    };
  }
  const start = new Date(target.block.start);
  const end = new Date(target.block.end);
  return {
    title: target.block.title,
    allDay: !!target.block.allDay,
    startDate: start,
    startTime: toTimeString(start),
    endDate: end,
    endTime: toTimeString(end),
    location: target.block.location ?? "",
    description: target.block.description ?? "",
  };
}

export function FictitiousBlockDialog({
  open,
  target,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  target: FictitiousBlockTarget | null;
  onClose: () => void;
  onSave: (block: Omit<FictitiousBlock, "id"> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {open && target && (
        <FictitiousBlockForm
          key={target.mode === "edit" ? target.block.id : `${target.start.toISOString()}-${target.end.toISOString()}`}
          target={target}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Dialog>
  );
}

function FictitiousBlockForm({
  target,
  onClose,
  onSave,
  onDelete,
}: {
  target: FictitiousBlockTarget;
  onClose: () => void;
  onSave: (block: Omit<FictitiousBlock, "id"> & { id?: string }) => void;
  onDelete?: (id: string) => void;
}) {
  const initial = initialFromTarget(target);
  const isEditing = target.mode === "edit";
  const [title, setTitle] = useState(initial.title);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [location, setLocation] = useState(initial.location);
  const [description, setDescription] = useState(initial.description);

  const computedStart = allDay ? startOfDay(startDate) : combineDateTime(startDate, startTime);
  const computedEnd = allDay ? endOfDay(endDate) : combineDateTime(endDate, endTime);
  const canSave = title.trim().length > 0 && computedEnd > computedStart;

  const shiftEndBy = (newStart: Date) => {
    const duration = computedEnd.getTime() - computedStart.getTime();
    if (duration <= 0) return;
    const newEnd = new Date(newStart.getTime() + duration);
    setEndDate(newEnd);
    setEndTime(toTimeString(newEnd));
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: isEditing ? target.block.id : undefined,
      title: title.trim(),
      start: computedStart.toISOString(),
      end: computedEnd.toISOString(),
      allDay,
      location: location.trim() || null,
      description: description.trim() || null,
      color: isEditing ? target.block.color : undefined,
      variant: isEditing ? target.block.variant : undefined,
    });
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? he.events.editEvent : he.today.fictitiousNewBlock}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={he.today.fictitiousBlockPlaceholder}
          autoFocus
          className="text-base font-medium"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
          }}
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{he.events.allDay}</span>
          <Switch checked={allDay} onCheckedChange={setAllDay} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{he.events.start}</span>
            <div className="flex gap-1.5">
              <DateField
                value={startDate}
                onChange={(date) => {
                  if (!date) return;
                  setStartDate(date);
                  shiftEndBy(allDay ? startOfDay(date) : combineDateTime(date, startTime));
                }}
                className="flex-1"
              />
              {!allDay && (
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (e.target.value) shiftEndBy(combineDateTime(startDate, e.target.value));
                  }}
                  className="w-24 shrink-0 tabular-nums"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{he.events.end}</span>
            <div className="flex gap-1.5">
              <DateField value={endDate} onChange={(date) => date && setEndDate(date)} className="flex-1" />
              {!allDay && (
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-24 shrink-0 tabular-nums"
                />
              )}
            </div>
          </div>
        </div>

        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={he.events.locationPlaceholder}
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={he.events.descriptionPlaceholder}
          className="min-h-20"
        />
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {isEditing ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onDelete?.(target.block.id);
              onClose();
            }}
          >
            {he.events.delete}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {he.actions.cancel}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {isEditing ? he.events.save : he.events.create}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
