import { create } from "zustand";
import type { StatusContextType } from "@/lib/task-status-prompt";

interface UIState {
  taskPanelId: string | null;
  taskPanelMode: "subtask" | "note" | null;
  openTaskPanel: (id: string, mode?: "subtask" | "note") => void;
  setTaskPanelMode: (mode: "subtask" | "note" | null) => void;
  closeTaskPanel: () => void;

  taskEditId: string | null;
  taskEditTab: "edit" | "notes" | "subtasks";
  taskEditShowEditTab: boolean;
  openTaskEdit: (id: string, tab?: "edit" | "notes" | "subtasks") => void;
  setTaskEditTab: (tab: "edit" | "notes" | "subtasks") => void;
  closeTaskEdit: () => void;

  quickAddOpen: boolean;
  quickAddInitialText: string;
  quickAddInitialTab: "quick" | "form";
  openQuickAdd: (initialText?: string, tab?: "quick" | "form") => void;
  closeQuickAdd: () => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  newProjectOpen: boolean;
  setNewProjectOpen: (open: boolean) => void;

  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  statusPrompt: { taskId: string; status: StatusContextType } | null;
  openStatusPrompt: (taskId: string, status: StatusContextType) => void;
  closeStatusPrompt: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  taskPanelId: null,
  taskPanelMode: null,
  openTaskPanel: (id, mode) => set({ taskPanelId: id, taskPanelMode: mode ?? null }),
  setTaskPanelMode: (mode) => set({ taskPanelMode: mode }),
  closeTaskPanel: () => set({ taskPanelId: null, taskPanelMode: null }),

  taskEditId: null,
  taskEditTab: "edit",
  taskEditShowEditTab: true,
  openTaskEdit: (id, tab = "edit") =>
    set({
      taskEditId: id,
      taskEditTab: tab,
      taskEditShowEditTab: tab === "edit",
    }),
  setTaskEditTab: (tab) => set({ taskEditTab: tab }),
  closeTaskEdit: () => set({ taskEditId: null, taskEditTab: "edit", taskEditShowEditTab: true }),

  quickAddOpen: false,
  quickAddInitialText: "",
  quickAddInitialTab: "quick",
  openQuickAdd: (initialText = "", tab = "quick") =>
    set({ quickAddOpen: true, quickAddInitialText: initialText, quickAddInitialTab: tab }),
  closeQuickAdd: () =>
    set({ quickAddOpen: false, quickAddInitialText: "", quickAddInitialTab: "quick" }),

  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),

  newProjectOpen: false,
  setNewProjectOpen: (open) => set({ newProjectOpen: open }),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  statusPrompt: null,
  openStatusPrompt: (taskId, status) => set({ statusPrompt: { taskId, status } }),
  closeStatusPrompt: () => set({ statusPrompt: null }),
}));
