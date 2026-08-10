"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, startOfDay } from "date-fns";
import { toast } from "sonner";
import { he } from "@/lib/i18n/he";
import { formatEventTime } from "@/lib/event-utils";
import type { EventOccurrence } from "@/types";

const STORAGE_KEY = "mission-event-reminders-shown";
const SNOOZE_MS = 5 * 60 * 1000;
/** Don't remind about events that started more than this long ago. */
const GRACE_MS = 15 * 60 * 1000;

function loadShown(): Map<string, number> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const entries = Object.entries(JSON.parse(raw) as Record<string, number>);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Map(entries.filter(([, ts]) => ts > weekAgo));
  } catch {
    return new Map();
  }
}

function persistShown(shown: Map<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(shown)));
  } catch {
    /* ignore */
  }
}

export function EventReminders() {
  const [now, setNow] = useState(() => Date.now());
  const [todayStart, setTodayStart] = useState(() => startOfDay(new Date()).getTime());
  const shownRef = useRef<Map<string, number> | null>(null);
  if (shownRef.current === null) shownRef.current = loadShown();

  // A fixed window of the next two days is refetched every minute; only
  // recomputed when the calendar day actually rolls over.
  const range = useMemo(() => {
    const today = new Date(todayStart);
    return {
      from: today.toISOString(),
      to: addDays(today, 2).toISOString(),
    };
  }, [todayStart]);

  const { data: occurrences } = useQuery({
    queryKey: ["event-reminders", range],
    queryFn: async (): Promise<EventOccurrence[]> => {
      const params = new URLSearchParams(range);
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      setTodayStart((prev) => {
        const currentDayStart = startOfDay(new Date(current)).getTime();
        return currentDayStart !== prev ? currentDayStart : prev;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!occurrences) return;
    const shown = shownRef.current!;

    const notify = (occ: EventOccurrence) => {
      const start = new Date(occ.start);
      const startsIn = start.getTime() - Date.now();
      const description =
        startsIn <= 0
          ? he.events.reminderStartsNow
          : he.events.reminderStartsAt(formatEventTime(start));

      toast(occ.title || he.events.noTitle, {
        description: `${he.events.reminderToastTitle} · ${description}`,
        duration: 60_000,
        action: {
          label: he.events.snooze5,
          onClick: () => {
            window.setTimeout(() => notify(occ), SNOOZE_MS);
          },
        },
      });

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(occ.title || he.events.noTitle, {
            body: description,
            tag: occ.occurrenceId,
          });
        } catch {
          /* Notification API unavailable (e.g. iOS without PWA) */
        }
      }
    };

    for (const occ of occurrences) {
      if (occ.reminderMinutes === null || occ.reminderMinutes === undefined) continue;
      const start = new Date(occ.start).getTime();
      const reminderAt = start - occ.reminderMinutes * 60 * 1000;
      if (now < reminderAt) continue;
      if (now > start + GRACE_MS) continue;
      if (shown.has(occ.occurrenceId)) continue;

      shown.set(occ.occurrenceId, Date.now());
      notify(occ);
    }

    persistShown(shown);
  }, [occurrences, now]);

  return null;
}
