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
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";
import {
  FICTITIOUS_BLOCK_COLOR,
  FICTITIOUS_FONT_DEFAULT,
  FICTITIOUS_OWNER_POODI,
  fictitiousOwnerColor,
  fictitiousOwnersOf,
  listFictitiousOwners,
  OUTLOOK_COLORS,
  stepFictitiousFontSize,
  type FictitiousBlock,
  type FictitiousBlockVariant,
} from "@/lib/fictitious-schedule";

const SPECTRUM_SWATCHES = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#C4A035",
  "#92D050",
  "#22C55E",
  "#14B8A6",
  "#0EA5E9",
  "#3B82F6",
  "#1F4E79",
  "#6366F1",
  "#A855F7",
  "#EC4899",
  "#F3E6C4",
  "#FFFFFF",
  "#9A9A9A",
  "#64748B",
  "#111827",
] as const;

function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const hex = value.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(hex)) return null;
  return hex.toUpperCase();
}

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
      color: OUTLOOK_COLORS.navy,
      variant: "solid" as FictitiousBlockVariant,
      fontSize: FICTITIOUS_FONT_DEFAULT,
      owners: [FICTITIOUS_OWNER_POODI],
      showDescription: false,
    };
  }
  const start = new Date(target.block.start);
  const end = new Date(target.block.end);
  const variant = target.block.variant ?? "solid";
  return {
    title: target.block.title,
    allDay: !!target.block.allDay,
    startDate: start,
    startTime: toTimeString(start),
    endDate: end,
    endTime: toTimeString(end),
    location: target.block.location ?? "",
    description: target.block.description ?? "",
    color: variant === "ghost" ? null : (normalizeHex(target.block.color) ?? FICTITIOUS_BLOCK_COLOR),
    variant,
    fontSize: target.block.fontSize ?? FICTITIOUS_FONT_DEFAULT,
    owners: fictitiousOwnersOf(target.block),
    showDescription: !!target.block.showDescription,
  };
}

export function FictitiousBlockDialog({
  open,
  target,
  owners = [FICTITIOUS_OWNER_POODI],
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  target: FictitiousBlockTarget | null;
  owners?: string[];
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
          owners={owners}
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
  owners,
  onClose,
  onSave,
  onDelete,
}: {
  target: FictitiousBlockTarget;
  owners: string[];
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
  const [color, setColor] = useState<string | null>(initial.color);
  const [variant, setVariant] = useState<FictitiousBlockVariant>(initial.variant);
  const [fontSize, setFontSize] = useState(initial.fontSize);
  const [selectedOwners, setSelectedOwners] = useState<string[]>(initial.owners);
  const [ownerDraft, setOwnerDraft] = useState("");
  const [showDescription, setShowDescription] = useState(initial.showDescription);
  const ownerOptions = listFictitiousOwners([
    ...owners.map((name) => ({ owners: [name] })),
    { owners: selectedOwners },
  ]);

  const addOwnerName = (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    setSelectedOwners((current) => (current.includes(name) ? current : [...current, name]));
    setOwnerDraft("");
  };

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
      color: variant === "ghost" ? null : color,
      variant,
      fontSize,
      owners: fictitiousOwnersOf({ owners: selectedOwners }),
      owner: fictitiousOwnersOf({ owners: selectedOwners })[0] ?? FICTITIOUS_OWNER_POODI,
      showDescription,
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

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-muted-foreground">{he.today.fictitiousTextSize}</span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={he.today.fictitiousTextSmaller}
              onClick={() => setFontSize(stepFictitiousFontSize(fontSize, -1))}
            >
              −
            </Button>
            <span className="min-w-10 text-center text-sm tabular-nums" style={{ fontSize: `${fontSize}px` }}>
              {fontSize}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={he.today.fictitiousTextLarger}
              onClick={() => setFontSize(stepFictitiousFontSize(fontSize, 1))}
            >
              +
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{he.today.fictitiousOwner}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {ownerOptions.map((name) => {
              const selected = selectedOwners.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedOwners((current) => {
                      if (current.includes(name)) {
                        return current.length === 1 ? current : current.filter((item) => item !== name);
                      }
                      return [...current, name];
                    });
                  }}
                  className={cn(
                    "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-transparent text-white"
                      : "border-[#DDE1E9] bg-white text-[#374151] hover:bg-[#F1F3F7]"
                  )}
                  style={selected ? { backgroundColor: fictitiousOwnerColor(name) } : undefined}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            <Input
              value={ownerDraft}
              onChange={(e) => setOwnerDraft(e.target.value)}
              placeholder={he.today.fictitiousOwnerPlaceholder}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                addOwnerName(ownerDraft);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0"
              disabled={!ownerDraft.trim()}
              onClick={() => addOwnerName(ownerDraft)}
            >
              {he.today.fictitiousOwnerAdd}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">{he.today.fictitiousColor}</span>
          <ColorSpectrumPicker
            color={color}
            variant={variant}
            onSelect={(nextColor) => {
              setVariant("solid");
              setColor(nextColor);
            }}
            onClear={() => {
              setVariant("ghost");
              setColor(null);
            }}
          />
        </div>

        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={he.events.locationPlaceholder}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{he.today.fictitiousShowDescription}</span>
          <Switch checked={showDescription} onCheckedChange={setShowDescription} />
        </div>
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

function ColorSpectrumPicker({
  color,
  variant,
  onSelect,
  onClear,
}: {
  color: string | null;
  variant: FictitiousBlockVariant;
  onSelect: (color: string) => void;
  onClear: () => void;
}) {
  const selected = variant === "ghost" ? null : normalizeHex(color);
  const pickerValue = selected ?? FICTITIOUS_BLOCK_COLOR;
  const customSelected = !!selected && !SPECTRUM_SWATCHES.some((swatch) => swatch.toUpperCase() === selected);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "h-7 rounded-md border px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent",
            variant === "ghost" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          {he.today.fictitiousNoColor}
        </button>
        {SPECTRUM_SWATCHES.map((swatch) => {
          const hex = swatch.toUpperCase();
          const isWhite = hex === "#FFFFFF";
          return (
            <button
              key={swatch}
              type="button"
              onClick={() => onSelect(hex)}
              className={cn(
                "size-7 rounded-full border border-black/10 transition-transform active:scale-95",
                selected === hex && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              style={{ backgroundColor: swatch }}
              aria-label={swatch}
              title={swatch}
            >
              {isWhite ? <span className="sr-only">{swatch}</span> : null}
            </button>
          );
        })}
        <label
          className={cn(
            "relative size-7 cursor-pointer overflow-hidden rounded-full border border-black/10",
            customSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          title={he.today.fictitiousCustomColor}
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: customSelected
                ? pickerValue
                : "conic-gradient(#ef4444, #eab308, #22c55e, #0ea5e9, #6366f1, #ec4899, #ef4444)",
            }}
          />
          <input
            type="color"
            value={pickerValue}
            aria-label={he.today.fictitiousCustomColor}
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => {
              const next = normalizeHex(e.target.value);
              if (next) onSelect(next);
            }}
          />
        </label>
      </div>
    </div>
  );
}
