import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CalendarEventWithRelations, EventOccurrence } from "@/types";
import type { EventRecurrencePattern, EventShowAs } from "@/generated/prisma/enums";
import { areaFilterForApi } from "@/lib/areas";
import { useAreaStore } from "@/store/area-store";

export interface EventInput {
  title?: string;
  description?: string | null;
  location?: string | null;
  start?: string;
  end?: string;
  allDay?: boolean;
  showAs?: EventShowAs;
  reminderMinutes?: number | null;
  recurrencePattern?: EventRecurrencePattern | null;
  recurrenceInterval?: number;
  recurrenceWeekdays?: number[];
  recurrenceUntil?: string | null;
  recurrenceCount?: number | null;
  categoryId?: string | null;
  areaId?: string | null;
}

export type EventEditScope = "occurrence" | "series";

export function useEvents(range: { from: string; to: string } | null) {
  const selectedAreaId = useAreaStore((s) => s.selectedAreaId);
  const areaFilter = areaFilterForApi(selectedAreaId);

  return useQuery({
    queryKey: ["events", range, areaFilter],
    queryFn: async (): Promise<EventOccurrence[]> => {
      const params = new URLSearchParams({ from: range!.from, to: range!.to });
      if (areaFilter.areaId) params.set("areaId", areaFilter.areaId);
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
    enabled: !!range,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const getCreateAreaId = useAreaStore((s) => s.getCreateAreaId);

  return useMutation({
    mutationFn: async (data: EventInput) => {
      const areaId = data.areaId ?? getCreateAreaId() ?? undefined;
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, areaId }),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json() as Promise<CalendarEventWithRelations>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      scope,
      occurrenceStart,
    }: {
      id: string;
      data: EventInput;
      scope?: EventEditScope;
      occurrenceStart?: string;
    }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, scope, occurrenceStart }),
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json() as Promise<CalendarEventWithRelations>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      scope,
      occurrenceStart,
    }: {
      id: string;
      scope?: EventEditScope;
      occurrenceStart?: string;
    }) => {
      const params = new URLSearchParams();
      if (scope) params.set("scope", scope);
      if (occurrenceStart) params.set("occurrenceStart", occurrenceStart);
      const query = params.size > 0 ? `?${params}` : "";
      const res = await fetch(`/api/events/${id}${query}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
