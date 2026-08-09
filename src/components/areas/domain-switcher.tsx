"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Layers, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useAreas } from "@/hooks/use-areas";
import { resolveIcon } from "@/lib/icons";
import {
  ALL_AREAS_ID,
  sortAreasForDisplay,
} from "@/lib/areas";
import { useAreaStore } from "@/store/area-store";
import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

export function DomainSwitcher({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const { data: areas = [], isLoading, isError, refetch } = useAreas();
  const selectedAreaId = useAreaStore((s) => s.selectedAreaId);
  const setSelectedAreaId = useAreaStore((s) => s.setSelectedAreaId);

  const sorted = sortAreasForDisplay(areas);
  const selectedArea =
    selectedAreaId === ALL_AREAS_ID
      ? null
      : sorted.find((area) => area.id === selectedAreaId);

  const handleSelect = (id: string) => {
    setSelectedAreaId(id);
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["sticky-notes"] });
    queryClient.invalidateQueries({ queryKey: ["search"] });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-10 shrink-0 rounded-full", className)}
            aria-label={he.areas.switchArea}
          />
        }
      >
        <UserCircle
          className="size-5"
          style={selectedArea ? { color: selectedArea.color } : undefined}
        />
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-64 p-2" dir="rtl">
        <PopoverHeader className="px-2 pb-2">
          <PopoverTitle className="text-sm">{he.areas.title}</PopoverTitle>
          {selectedArea ? (
            <p className="text-xs text-muted-foreground">{selectedArea.name}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{he.areas.all}</p>
          )}
        </PopoverHeader>

        <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
          {isLoading ? (
            <p className="px-2.5 py-3 text-xs text-muted-foreground">{he.areas.loading}</p>
          ) : isError ? (
            <div className="px-2.5 py-3">
              <p className="text-xs text-destructive">{he.areas.loadFailed}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                {he.actions.retry}
              </button>
            </div>
          ) : (
            <>
              <AreaOption
                active={selectedAreaId === ALL_AREAS_ID}
                label={he.areas.all}
                icon={Layers}
                color="#6366f1"
                onClick={() => handleSelect(ALL_AREAS_ID)}
              />
              {sorted.map((area) => (
                <AreaOption
                  key={area.id}
                  active={selectedAreaId === area.id}
                  label={area.name}
                  icon={resolveIcon(area.icon)}
                  color={area.color}
                  onClick={() => handleSelect(area.id)}
                />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AreaOption({
  active,
  label,
  icon: Icon,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm transition-colors",
        active ? "bg-accent font-medium" : "hover:bg-accent/60"
      )}
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}22`, color }}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && <Check className="size-4 shrink-0 text-primary" />}
    </button>
  );
}
