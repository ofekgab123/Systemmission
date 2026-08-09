"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { StickyNoteCard } from "@/components/sticky-notes/sticky-note-card";
import { useStickyNotes, useCreateStickyNote } from "@/hooks/use-sticky-notes";
import { Button } from "@/components/ui/button";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";

export function StickyNoteCapture({ className }: { className?: string }) {
  const [value, setValue] = useState("");
  const createNote = useCreateStickyNote();

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    createNote.mutate(trimmed, {
      onSuccess: () => {
        setValue("");
        toast.success(he.dontForget.added);
      },
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={he.dontForget.placeholder}
        className="min-w-0 flex-1 rounded-xl border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        aria-label={he.dontForget.addNote}
      />
      <Button type="button" size="sm" className="h-11 shrink-0 gap-1.5 rounded-xl px-4" onClick={submit}>
        <Plus className="size-4" />
        {he.actions.add}
      </Button>
    </div>
  );
}

export function StickyNotesGrid({
  compact = false,
  limit,
}: {
  compact?: boolean;
  limit?: number;
}) {
  const { data: notes, isLoading } = useStickyNotes({ active: true });
  const visible = limit ? (notes ?? []).slice(0, limit) : (notes ?? []);

  if (isLoading) {
    return (
      <div className={cn("grid gap-3", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
        {Array.from({ length: compact ? 3 : 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm font-medium">{he.empty.noStickyNotes}</p>
        <p className="mt-1 text-xs text-muted-foreground">{he.empty.noStickyNotesDesc}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}
    >
      {visible.map((note) => (
        <StickyNoteCard key={note.id} note={note} compact={compact} />
      ))}
    </div>
  );
}
