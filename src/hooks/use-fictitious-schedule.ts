"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAreaStore } from "@/store/area-store";
import { ALL_AREAS_ID } from "@/lib/areas";
import {
  applyFictitiousSeedVersion,
  emptyFictitiousSchedule,
  takeLegacyLocalFictitiousSchedule,
  type FictitiousScheduleState,
} from "@/lib/fictitious-schedule";

export const fictitiousScheduleQueryKey = (areaId: string | null | undefined) =>
  ["fictitious-schedule", areaId ?? "none"] as const;

async function fetchSchedule(areaId: string): Promise<FictitiousScheduleState> {
  const res = await fetch(`/api/fictitious-schedule?areaId=${encodeURIComponent(areaId)}`);
  if (!res.ok) throw new Error("Failed to load fictitious schedule");
  return res.json();
}

async function saveSchedule(
  areaId: string,
  state: FictitiousScheduleState
): Promise<FictitiousScheduleState> {
  const res = await fetch("/api/fictitious-schedule", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ areaId, ...state }),
  });
  if (!res.ok) throw new Error("Failed to save fictitious schedule");
  return res.json();
}

function prepareLoadedState(
  areaId: string,
  remote: FictitiousScheduleState
): { state: FictitiousScheduleState; shouldPersist: boolean } {
  const hasRemote =
    remote.blocks.length > 0 ||
    remote.placements.length > 0 ||
    (remote.categories?.length ?? 0) > 0 ||
    !!remote.seedVersion;
  if (!hasRemote) {
    const legacy = takeLegacyLocalFictitiousSchedule(areaId);
    if (legacy) {
      const { state } = applyFictitiousSeedVersion(legacy);
      return { state, shouldPersist: true };
    }
  }

  const { state, changed } = applyFictitiousSeedVersion(remote);
  return { state, shouldPersist: changed || !hasRemote };
}

export function useFictitiousSchedule() {
  const selectedAreaId = useAreaStore((s) => s.selectedAreaId);
  const getCreateAreaId = useAreaStore((s) => s.getCreateAreaId);
  const storageAreaId = useMemo(() => {
    if (selectedAreaId && selectedAreaId !== ALL_AREAS_ID) return selectedAreaId;
    return getCreateAreaId();
  }, [selectedAreaId, getCreateAreaId]);

  const qc = useQueryClient();
  const [local, setLocal] = useState<FictitiousScheduleState>(emptyFictitiousSchedule);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<FictitiousScheduleState | null>(null);
  const bootstrappedArea = useRef<string | null>(null);

  const query = useQuery({
    queryKey: fictitiousScheduleQueryKey(storageAreaId),
    queryFn: () => fetchSchedule(storageAreaId!),
    enabled: !!storageAreaId,
    refetchOnWindowFocus: true,
  });

  const mutation = useMutation({
    mutationFn: (state: FictitiousScheduleState) => saveSchedule(storageAreaId!, state),
    onSuccess: (saved) => {
      qc.setQueryData(fictitiousScheduleQueryKey(storageAreaId), saved);
    },
  });

  const flushSave = useCallback(
    (state: FictitiousScheduleState) => {
      if (!storageAreaId) return;
      pendingRef.current = null;
      mutation.mutate(state);
    },
    [storageAreaId, mutation]
  );

  const scheduleSave = useCallback(
    (state: FictitiousScheduleState) => {
      pendingRef.current = state;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (pendingRef.current) flushSave(pendingRef.current);
      }, 400);
    },
    [flushSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (pendingRef.current && storageAreaId) {
        void saveSchedule(storageAreaId, pendingRef.current);
      }
    };
  }, [storageAreaId]);

  useEffect(() => {
    if (!storageAreaId || !query.data) return;
    if (bootstrappedArea.current === storageAreaId) return;
    bootstrappedArea.current = storageAreaId;

    const { state, shouldPersist } = prepareLoadedState(storageAreaId, query.data);
    setLocal(state);
    qc.setQueryData(fictitiousScheduleQueryKey(storageAreaId), state);
    if (shouldPersist) flushSave(state);
  }, [storageAreaId, query.data, qc, flushSave]);

  const commit = useCallback(
    (next: FictitiousScheduleState) => {
      const withVersion: FictitiousScheduleState = {
        ...next,
        seedVersion: next.seedVersion || local.seedVersion,
      };
      setLocal(withVersion);
      scheduleSave(withVersion);
    },
    [local.seedVersion, scheduleSave]
  );

  return {
    areaId: storageAreaId,
    state: local,
    commit,
    isLoading: !storageAreaId || query.isLoading,
    isSaving: mutation.isPending,
    isError: query.isError || mutation.isError,
  };
}
