"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateStickyNote, useDeleteStickyNote, type StickyNote } from "@/hooks/use-sticky-notes";
import { Button } from "@/components/ui/button";
import { he } from "@/lib/i18n/he";
import { formatDistanceToNow } from "@/lib/date-utils";

export function StickyNoteCard({
  note,
  compact = false,
}: {
  note: StickyNote;
  compact?: boolean;
}) {
  const [content, setContent] = useState(note.content);
  const updateNote = useUpdateStickyNote();
  const deleteNote = useDeleteStickyNote();
  const savedContent = useRef(note.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    setContent(note.content);
    savedContent.current = note.content;
  }, [note.content]);

  useEffect(() => {
    syncTextareaHeight();
  }, [content, compact]);

  const saveIfChanged = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setContent(savedContent.current);
      return;
    }
    if (trimmed !== savedContent.current) {
      savedContent.current = trimmed;
      updateNote.mutate({ id: note.id, content: trimmed });
    }
  };

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-black/5 px-3 pt-3 shadow-sm transition-smooth hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: note.color }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          syncTextareaHeight();
        }}
        onBlur={saveIfChanged}
        rows={1}
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent pb-2 text-sm leading-relaxed text-foreground/90 outline-none placeholder:text-foreground/40",
          compact ? "min-h-[2.25rem]" : "min-h-[2.5rem]"
        )}
        placeholder={he.dontForget.placeholder}
        aria-label={he.dontForget.noteLabel}
      />

      <div className="flex items-center justify-between gap-2 pb-2.5">
        <span className="text-[11px] text-foreground/50">
          {he.dontForget.nextReminder}: {formatDistanceToNow(new Date(note.nextAlertAt))}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 rounded-lg text-foreground/50 opacity-100 hover:bg-black/5 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
          aria-label={he.actions.delete}
          onClick={() => deleteNote.mutate(note.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
