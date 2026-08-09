"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAreas, useCreateArea, useDeleteArea } from "@/hooks/use-areas";
import { ALL_AREAS_ID, isSystemAreaSlug, sortAreasForDisplay } from "@/lib/areas";
import { useAreaStore } from "@/store/area-store";
import { resolveIcon } from "@/lib/icons";
import { he } from "@/lib/i18n/he";

export function AreasSetting() {
  const { data: areas = [] } = useAreas();
  const createArea = useCreateArea();
  const deleteArea = useDeleteArea();
  const selectedAreaId = useAreaStore((s) => s.selectedAreaId);
  const setSelectedAreaId = useAreaStore((s) => s.setSelectedAreaId);
  const baseAreaId = useAreaStore((s) => s.baseAreaId);
  const [name, setName] = useState("");

  const sorted = sortAreasForDisplay(areas);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    createArea.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          toast.success(he.areas.created);
          setName("");
        },
        onError: () => toast.error(he.areas.createFailed),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteArea.mutate(id, {
      onSuccess: () => {
        if (selectedAreaId === id) {
          setSelectedAreaId(baseAreaId ?? ALL_AREAS_ID);
        }
        toast.success(he.areas.deleted);
      },
      onError: () => toast.error(he.areas.deleteFailed),
    });
  };

  return (
    <div className="max-w-md rounded-xl border bg-card p-5">
      <Label className="text-sm font-medium">{he.areas.manageTitle}</Label>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">{he.areas.manageDesc}</p>

      <div className="mb-4 flex flex-col gap-2">
        {sorted.map((area) => {
          const Icon = resolveIcon(area.icon);
          const system = isSystemAreaSlug(area.slug);
          return (
            <div
              key={area.id}
              className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2"
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${area.color}22`, color: area.color }}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{area.name}</p>
                {system && (
                  <p className="text-xs text-muted-foreground">{he.areas.systemArea}</p>
                )}
              </div>
              {!system && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
                  aria-label={he.actions.delete}
                  onClick={() => handleDelete(area.id)}
                  disabled={deleteArea.isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={he.areas.newPlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" onClick={handleAdd} disabled={!name.trim() || createArea.isPending}>
          {he.actions.add}
        </Button>
      </div>
    </div>
  );
}
