import { create } from "zustand";

interface UIState {
  taskPanelId: string | null;
  openTaskPanel: (id: string) => void;
  closeTaskPanel: () => void;

  taskEditId: string | null;
  openTaskEdit: (id: string) => void;
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
  openTaskPanel: (id) => set({ taskPanelId: id }),
  closeTaskPanel: () => set({ taskPanelId: null }),

  taskEditId: null,
  openTaskEdit: (id) => set({ taskEditId: id }),
  closeTaskEdit: () => set({ taskEditId: null }),

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
