"use client";

import { Menu, Search } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { he } from "@/lib/i18n/he";
import { Button } from "@/components/ui/button";

export function MobileHeader() {
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/80 md:hidden"
      style={{ paddingTop: "max(0px, env(safe-area-inset-top))" }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-10 shrink-0"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="תפריט"
      >
        <Menu className="size-5" />
      </Button>

      <div className="flex flex-col items-center">
        <span className="font-heading text-base font-semibold">{he.app.name}</span>
        <span className="text-xs text-muted-foreground">{he.app.tagline}</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-10 shrink-0"
        onClick={() => setCommandOpen(true)}
        aria-label={he.nav.search}
      >
        <Search className="size-5" />
      </Button>
    </header>
  );
}
