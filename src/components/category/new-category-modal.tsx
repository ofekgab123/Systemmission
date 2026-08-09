"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useCreateProject } from "@/hooks/use-projects";
import { useAreas } from "@/hooks/use-areas";
import { AREA_COLOR_OPTIONS, ICON_OPTIONS } from "@/lib/icons";
import { FieldSelect } from "@/components/ui/field-select";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

export function NewCategoryModal() {
  const open = useUIStore((s) => s.newProjectOpen);
  const setOpen = useUIStore((s) => s.setNewProjectOpen);
  const createProject = useCreateProject();
  const { data: areas } = useAreas();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(AREA_COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState("Folder");
  const [areaId, setAreaId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setColor(AREA_COLOR_OPTIONS[0]);
      setIcon("Folder");
      setAreaId("");
    }
  }, [open]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    createProject.mutate(
      {
        name: trimmed,
        description: description.trim() || null,
        color,
        icon,
        status: "ACTIVE",
        areaId: areaId || null,
      },
      {
        onSuccess: () => {
          toast.success(he.category.created);
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{he.category.new}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Field label={he.category.name}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={he.category.namePlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </Field>

          <Field label={he.category.color}>
            <div className="flex flex-wrap gap-2">
              {AREA_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-8 rounded-full transition-transform active:scale-95",
                    color === c && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>

          <Field label={he.category.icon}>
            <div className="grid max-h-32 grid-cols-6 gap-1 overflow-y-auto rounded-lg border p-2">
              {ICON_OPTIONS.map(({ name: iconName, icon: Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-md transition-colors hover:bg-accent",
                    icon === iconName && "bg-primary/10 text-primary ring-1 ring-primary"
                  )}
                  title={iconName}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </Field>

          {areas && areas.length > 0 && (
            <Field label={he.task.area}>
              <FieldSelect
                value={areaId}
                onChange={setAreaId}
                options={areas.map((a) => ({ value: a.id, label: a.name }))}
                placeholder={he.task.noArea}
              />
            </Field>
          )}

          <Field label={he.category.description}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={he.category.descriptionPlaceholder}
              className="min-h-16 resize-none text-sm"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {he.actions.cancel}
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || createProject.isPending}>
              {createProject.isPending ? he.actions.loading : he.category.create}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
