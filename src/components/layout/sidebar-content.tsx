"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sun,
  StickyNote,
  ListTodo,
  Folder,
  CalendarDays,
  Clock,
  Ban,
  Search as SearchIcon,
  Settings,
  Command,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { useStickyNotes } from "@/hooks/use-sticky-notes";
import { useTasks } from "@/hooks/use-tasks";
import { he } from "@/lib/i18n/he";

const mainNav = [
  { href: "/", label: he.nav.home, icon: Home },
  { href: "/today", label: he.nav.today, icon: Sun },
  { href: "/dont-forget", label: he.nav.inbox, icon: StickyNote },
  { href: "/tasks", label: he.nav.myTasks, icon: ListTodo },
  { href: "/calendar", label: he.nav.calendar, icon: CalendarDays },
  { href: "/projects", label: he.nav.projects, icon: Folder },
  { href: "/waiting", label: he.nav.waiting, icon: Clock },
  { href: "/blocked", label: he.nav.blocked, icon: Ban },
  { href: "/search", label: he.nav.search, icon: SearchIcon },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: stickyNotes } = useStickyNotes({ active: true });
  const { data: waitingTasks } = useTasks({ view: "waiting" });
  const { data: blockedTasks } = useTasks({ view: "blocked" });
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);

  const counts: Record<string, number | undefined> = {
    "/dont-forget": stickyNotes?.length,
    "/waiting": waitingTasks?.length,
    "/blocked": blockedTasks?.length,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Command className="size-4" />
        </div>
        <span className="font-heading text-base font-semibold">{he.app.name}</span>
      </div>

      <div className="px-3">
        <Button
          onClick={() => {
            openQuickAdd();
            onNavigate?.();
          }}
          className="mb-2 h-11 w-full justify-start gap-2 rounded-xl"
          size="sm"
        >
          <Plus className="size-4" /> {he.nav.quickAdd}
        </Button>
        <button
          onClick={() => {
            setCommandOpen(true);
            onNavigate?.();
          }}
          className="mb-3 flex h-11 w-full items-center gap-2 rounded-xl border border-sidebar-border px-3 text-base text-muted-foreground transition-smooth hover:bg-sidebar-accent active:bg-sidebar-accent"
        >
          <SearchIcon className="size-4" />
          {he.nav.searchEverything}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
        <nav className="flex flex-col gap-0.5 px-3 pb-4">
          {mainNav.map((item) => {
            const active = pathname === item.href;
            const count = counts[item.href];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-base transition-smooth active:scale-[0.98]",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 active:bg-sidebar-accent/60"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
                {!!count && (
                  <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-sidebar-border px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-smooth hover:bg-sidebar-accent/60"
        >
          <Settings className="size-5" /> {he.nav.settings}
        </Link>
      </div>
    </div>
  );
}
