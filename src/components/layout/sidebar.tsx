"use client";

import { SidebarContent } from "@/components/layout/sidebar-content";

export function Sidebar() {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-e bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-full min-h-0 flex-col">
        <SidebarContent />
      </div>
    </aside>
  );
}
