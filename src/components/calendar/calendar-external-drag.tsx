"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TaskWithRelations } from "@/types";

export type CalendarExternalDragState = {
  task: TaskWithRelations;
  x: number;
  y: number;
} | null;

type DropHandler = (task: TaskWithRelations, clientX: number, clientY: number) => boolean;

type CalendarExternalDragContextValue = {
  drag: CalendarExternalDragState;
  startDrag: (task: TaskWithRelations, x: number, y: number) => void;
  moveDrag: (x: number, y: number) => void;
  endDrag: () => void;
  registerDropHandler: (id: string, handler: DropHandler) => void;
  unregisterDropHandler: (id: string) => void;
};

const CalendarExternalDragContext = createContext<CalendarExternalDragContextValue | null>(
  null
);

export function CalendarExternalDragProvider({ children }: { children: ReactNode }) {
  const [drag, setDrag] = useState<CalendarExternalDragState>(null);
  const dragRef = useRef<CalendarExternalDragState>(null);
  const handlersRef = useRef<Map<string, DropHandler>>(new Map());

  const startDrag = useCallback((task: TaskWithRelations, x: number, y: number) => {
    const next = { task, x, y };
    dragRef.current = next;
    setDrag(next);
  }, []);

  const moveDrag = useCallback((x: number, y: number) => {
    setDrag((prev) => {
      if (!prev) return null;
      const next = { ...prev, x, y };
      dragRef.current = next;
      return next;
    });
  }, []);

  const endDrag = useCallback(() => {
    const current = dragRef.current;
    if (current) {
      for (const handler of handlersRef.current.values()) {
        if (handler(current.task, current.x, current.y)) break;
      }
    }
    dragRef.current = null;
    setDrag(null);
  }, []);

  const registerDropHandler = useCallback((id: string, handler: DropHandler) => {
    handlersRef.current.set(id, handler);
  }, []);

  const unregisterDropHandler = useCallback((id: string) => {
    handlersRef.current.delete(id);
  }, []);

  const value = useMemo(
    () => ({
      drag,
      startDrag,
      moveDrag,
      endDrag,
      registerDropHandler,
      unregisterDropHandler,
    }),
    [drag, startDrag, moveDrag, endDrag, registerDropHandler, unregisterDropHandler]
  );

  return (
    <CalendarExternalDragContext.Provider value={value}>
      {children}
      {drag && (
        <div
          className="pointer-events-none fixed z-[100] max-w-[14rem] truncate rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold shadow-lg"
          style={{
            left: drag.x + 10,
            top: drag.y + 10,
            borderColor: "#DDE1E9",
          }}
        >
          {drag.task.title}
        </div>
      )}
    </CalendarExternalDragContext.Provider>
  );
}

export function useCalendarExternalDrag() {
  const ctx = useContext(CalendarExternalDragContext);
  if (!ctx) {
    throw new Error("useCalendarExternalDrag must be used within CalendarExternalDragProvider");
  }
  return ctx;
}

export function useCalendarExternalDragOptional() {
  return useContext(CalendarExternalDragContext);
}
