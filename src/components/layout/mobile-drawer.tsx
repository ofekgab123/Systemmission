"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar-content";
import { useUIStore } from "@/store/ui-store";

export function MobileDrawer() {
  const open = useUIStore((s) => s.mobileMenuOpen);
  const setOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex h-full w-[min(100vw,320px)] flex-col gap-0 overflow-hidden p-0 bg-sidebar text-sidebar-foreground border-e"
        showCloseButton
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
