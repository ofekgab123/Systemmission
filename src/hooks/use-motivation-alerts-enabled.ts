"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MOTIVATION_ALERTS_CHANGE_EVENT,
  persistMotivationAlertsEnabled,
  readMotivationAlertsEnabled,
} from "@/lib/motivation-quotes";

export function useMotivationAlertsEnabled() {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setEnabledState(readMotivationAlertsEnabled());

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") setEnabledState(detail);
      else setEnabledState(readMotivationAlertsEnabled());
    };

    window.addEventListener(MOTIVATION_ALERTS_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(MOTIVATION_ALERTS_CHANGE_EVENT, onChange);
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    persistMotivationAlertsEnabled(value);
    setEnabledState(value);
  }, []);

  return { enabled, setEnabled };
}
