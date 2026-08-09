import { create } from "zustand";

interface UIState {
  taskPanelId: string | null;
  openTaskPanel: (id: string) => void;
  closeTaskPanel: () => void;

  quickAddOpen: boolean;
  quickAddInitialText: string;
  openQuickAdd: (initialText?: string) => void;
  closeQuickAdd: () => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  newProjectOpen: boolean;
  setNewProjectOpen: (open: boolean) => void;

  newAreaOpen: boolean;
  setNewAreaOpen: (open: boolean) => void;

  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  taskPanelId: null,
  openTaskPanel: (id) => set({ taskPanelId: id }),
  closeTaskPanel: () => set({ taskPanelId: null }),

  quickAddOpen: false,
  quickAddInitialText: "",
  openQuickAdd: (initialText = "") => set({ quickAddOpen: true, quickAddInitialText: initialText }),
  closeQuickAdd: () => set({ quickAddOpen: false, quickAddInitialText: "" }),

  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),

  newProjectOpen: false,
  setNewProjectOpen: (open) => set({ newProjectOpen: open }),

  newAreaOpen: false,
  setNewAreaOpen: (open) => set({ newAreaOpen: open }),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
