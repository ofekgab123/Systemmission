"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateEventCategory,
  useDeleteEventCategory,
  useEventCategories,
  useUpdateEventCategory,
} from "@/hooks/use-event-categories";
import { AREA_COLOR_OPTIONS } from "@/lib/icons";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";
import type { EventCategoryRecord } from "@/types";

export function EventCategoriesManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: categories } = useEventCategories();
  const createCategory = useCreateEventCategory();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(AREA_COLOR_OPTIONS[0]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createCategory.mutate(
      { name, color: newColor },
      {
        onSuccess: () => {
          setNewName("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{he.events.categoriesTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={he.events.categoryNamePlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0 gap-1"
                onClick={handleCreate}
                disabled={!newName.trim() || createCategory.isPending}
              >
                <Plus className="size-3.5" />
                {he.events.addCategory}
              </Button>
            </div>
            <ColorRow value={newColor} onChange={setNewColor} />
          </div>

          <div className="flex flex-col gap-1">
            {(categories ?? []).map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
            {categories && categories.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {he.events.noCategory}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRow({ category }: { category: EventCategoryRecord }) {
  const updateCategory = useUpdateEventCategory();
  const deleteCategory = useDeleteEventCategory();
  const [editingColor, setEditingColor] = useState(false);
  const [name, setName] = useState(category.name);

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === category.name) {
      setName(category.name);
      return;
    }
    updateCategory.mutate({ id: category.id, data: { name: trimmed } });
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg px-2 py-1.5 hover:bg-muted/40">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="size-5 shrink-0 rounded-full ring-offset-background transition-transform hover:scale-110"
          style={{ backgroundColor: category.color }}
          aria-label={he.category.color}
          onClick={() => setEditingColor((v) => !v)}
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitName();
            }
          }}
          className="h-8 border-transparent bg-transparent px-1.5 text-sm shadow-none focus-visible:border-input"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={he.events.deleteCategory}
          onClick={() => deleteCategory.mutate(category.id)}
          disabled={deleteCategory.isPending}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {editingColor && (
        <ColorRow
          value={category.color}
          onChange={(color) => {
            updateCategory.mutate({ id: category.id, data: { color } });
            setEditingColor(false);
          }}
        />
      )}
    </div>
  );
}

function ColorRow({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {AREA_COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "size-6 rounded-full transition-transform active:scale-95",
            value === color && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
}
