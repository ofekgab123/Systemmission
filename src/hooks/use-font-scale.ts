"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FONT_SCALE_LEVELS,
  type FontScaleLevel,
  persistFontScale,
  readStoredFontScale,
} from "@/lib/font-scale";

export function useFontScale() {
  const [level, setLevel] = useState<FontScaleLevel>(0);

  useEffect(() => {
    const stored = readStoredFontScale();
    setLevel(stored);
    persistFontScale(stored);
  }, []);

  const setScale = useCallback((next: FontScaleLevel) => {
    setLevel(next);
    persistFontScale(next);
  }, []);

  const increase = useCallback(() => {
    setLevel((current) => {
      const idx = FONT_SCALE_LEVELS.indexOf(current);
      const next = FONT_SCALE_LEVELS[Math.min(idx + 1, FONT_SCALE_LEVELS.length - 1)];
      persistFontScale(next);
      return next;
    });
  }, []);

  const decrease = useCallback(() => {
    setLevel((current) => {
      const idx = FONT_SCALE_LEVELS.indexOf(current);
      const next = FONT_SCALE_LEVELS[Math.max(idx - 1, 0)];
      persistFontScale(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => setScale(0), [setScale]);

  const canIncrease = level < FONT_SCALE_LEVELS[FONT_SCALE_LEVELS.length - 1];
  const canDecrease = level > FONT_SCALE_LEVELS[0];

  return { level, increase, decrease, reset, canIncrease, canDecrease };
}
