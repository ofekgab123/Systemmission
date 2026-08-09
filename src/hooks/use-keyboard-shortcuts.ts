"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui-store";

const ROUTE_SHORTCUTS: Record<string, string> = {
  t: "/today",
  i: "/inbox",
  p: "/projects",
};

export function useGlobalKeyboardShortcuts() {
  const router = useRouter();
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null) {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        el.isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        openQuickAdd();
        return;
      }
      if (key === "f") {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      const route = ROUTE_SHORTCUTS[key];
      if (route) {
        e.preventDefault();
        router.push(route);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router, openQuickAdd, setCommandOpen]);
}
