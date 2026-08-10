"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { TaskPanel } from "@/components/task/task-panel";
import { TaskEditSheet } from "@/components/task/task-edit-sheet";
import { StatusContextPrompt } from "@/components/task/status-context-prompt";
import { SomedayStatusPrompt } from "@/components/task/someday-status-prompt";
import { QuickAddModal } from "@/components/quick-add/quick-add-modal";
import { CommandBar } from "@/components/command/command-bar";
import { NewCategoryModal } from "@/components/category/new-category-modal";
import { StickyNoteAlerts } from "@/components/sticky-notes/sticky-note-alerts";
import { EventReminders } from "@/components/calendar/event-reminders";
import { MotivationAlerts } from "@/components/motivation/motivation-alerts";
import { AreaBootstrap } from "@/components/areas/area-bootstrap";
import { FontScaleControl } from "@/components/accessibility/font-scale-control";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  useGlobalKeyboardShortcuts();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="page-main flex-1 overflow-y-auto overscroll-y-contain">{children}</main>
      </div>
      <MobileBottomNav />
      <MobileDrawer />
      <TaskPanel />
      <TaskEditSheet />
      <StatusContextPrompt />
      <SomedayStatusPrompt />
      <QuickAddModal />
      <NewCategoryModal />
      <CommandBar />
      <AreaBootstrap />
      <StickyNoteAlerts />
      <MotivationAlerts />
      <EventReminders />
      <FontScaleControl />
    </div>
  );
}
