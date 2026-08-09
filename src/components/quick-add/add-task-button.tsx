"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { he } from "@/lib/i18n/he";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type QuickAddTab = "quick" | "form";

type AddTaskButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  initialText?: string;
  tab?: QuickAddTab;
  label?: string;
};

export function AddTaskButton({
  initialText = "",
  tab = "quick",
  label = he.actions.addTask,
  variant = "default",
  size = "sm",
  className,
  children,
  ...props
}: AddTaskButtonProps) {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      onClick={() => openQuickAdd(initialText, tab)}
      {...props}
    >
      {children ?? (
        <>
          <Plus className={size === "sm" ? "size-3.5" : "size-4"} />
          {label}
        </>
      )}
    </Button>
  );
}

export function AddTaskCaptureBar({ className }: { className?: string }) {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);

  return (
    <button
      type="button"
      onClick={() => openQuickAdd()}
      className={className}
    >
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{he.inbox.captureHint}</span>
    </button>
  );
}
