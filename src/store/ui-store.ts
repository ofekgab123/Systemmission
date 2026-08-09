import { create } from "zustand";

interface UIState {
  taskPanelId: string | null;
  taskPanelMode: "subtask" | "note" | null;
  openTaskPanel: (id: string, mode?: "subtask" | "note") => void;
  setTaskPanelMode: (mode: "subtask" | "note" | null) => void;
  closeTaskPanel: () => void;

  taskEditId: string | null;
  taskEditTab: "edit" | "notesSubtasks";
  openTaskEdit: (id: string, tab?: "edit" | "notesSubtasks") => void;
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
}

export const useUIStore = create<UIState>((set) => ({
  taskPanelId: null,
  taskPanelMode: null,
  openTaskPanel: (id, mode) => set({ taskPanelId: id, taskPanelMode: mode ?? null }),
  setTaskPanelMode: (mode) => set({ taskPanelMode: mode }),
  closeTaskPanel: () => set({ taskPanelId: null, taskPanelMode: null }),

  taskEditId: null,
  taskEditTab: "edit",
  openTaskEdit: (id, tab = "edit") => set({ taskEditId: id, taskEditTab: tab }),
  closeTaskEdit: () => set({ taskEditId: null, taskEditTab: "edit" }),

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
}));
