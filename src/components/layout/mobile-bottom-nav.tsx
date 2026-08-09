"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Inbox as InboxIcon, Folder, Search as SearchIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { useTasks } from "@/hooks/use-tasks";
import { he } from "@/lib/i18n/he";

const tabs = [
  { href: "/today", label: he.nav.today, icon: Sun },
  { href: "/inbox", label: he.nav.inbox, icon: InboxIcon, countKey: "/inbox" as const },
  { href: "/projects", label: he.nav.projects, icon: Folder },
  { href: "/search", label: he.nav.search, icon: SearchIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const { data: inboxTasks } = useTasks({ view: "inbox" });

  const counts: Record<string, number | undefined> = {
    "/inbox": inboxTasks?.length,
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80 md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="ניווט ראשי"
    >
      <div className="relative mx-auto grid h-[4.5rem] max-w-lg grid-cols-5 items-end px-2">
        {tabs.slice(0, 2).map((tab) => (
          <NavItem
            key={tab.href}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            active={pathname === tab.href}
            count={tab.countKey ? counts[tab.countKey] : undefined}
          />
        ))}

        <div className="flex justify-center pb-1">
          <button
            type="button"
            onClick={() => openQuickAdd()}
            className="flex size-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
            aria-label={he.nav.quickAdd}
          >
            <Plus className="size-7" strokeWidth={2.5} />
          </button>
        </div>

        {tabs.slice(2).map((tab) => (
          <NavItem
            key={tab.href}
            href={tab.href}
            label={tab.label}
            icon={tab.icon}
            active={pathname === tab.href || pathname.startsWith(`${tab.href}/`)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  count,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-xs font-medium transition-colors active:scale-95 sm:text-sm",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <span className="relative">
        <Icon className={cn("size-6", active && "stroke-[2.5px]")} />
        {!!count && count > 0 && (
          <span className="absolute -end-1.5 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}
