"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/store/ui-store";
import { useSearch } from "@/hooks/use-search";
import {
  Home,
  Sun,
  StickyNote,
  Folder,
  Clock,
  Ban,
  CircleDot,
  Plus,
  Search as SearchIcon,
  ListTodo,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { resolveIcon } from "@/lib/icons";
import { he } from "@/lib/i18n/he";

export function CommandBar() {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);
  const openQuickAdd = useUIStore((s) => s.openQuickAdd);
  const openTaskPanel = useUIStore((s) => s.openTaskPanel);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: results, isLoading, isFetching } = useSearch(query);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length > 0;
  const showEmpty =
    searching && !isLoading && !isFetching && results && results.tasks.length === 0 && results.projects.length === 0;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={he.command.title}
      description={he.command.description}
      shouldFilter={false}
    >
      <CommandInput placeholder={he.command.placeholder} value={query} onValueChange={setQuery} />
      <CommandList>
        {showEmpty ? <CommandEmpty>{he.empty.noResults}</CommandEmpty> : null}

        {searching && (isLoading || isFetching) && (
          <CommandGroup heading={he.command.tasks}>
            <CommandItem disabled value="search-loading">
              <Loader2 className="size-4 animate-spin" /> {he.actions.loading}
            </CommandItem>
          </CommandGroup>
        )}

        {results && results.tasks.length > 0 && (
          <CommandGroup heading={he.command.tasks}>
            {results.tasks.slice(0, 10).map((task) => (
              <CommandItem
                key={task.id}
                value={`task-${task.id}`}
                keywords={[task.title]}
                onSelect={() => {
                  openTaskPanel(task.id);
                  setOpen(false);
                }}
              >
                <ListTodo className="size-4 shrink-0" />
                <span className="min-w-0 truncate">{task.title}</span>
              </CommandItem>
            ))}
            {results.tasks.length > 10 && (
              <CommandItem value="search-more-tasks" onSelect={() => go(`/search?q=${encodeURIComponent(trimmedQuery)}`)}>
                <SearchIcon className="size-4" /> {he.command.fullSearch} ({results.tasks.length})
              </CommandItem>
            )}
          </CommandGroup>
        )}

        {results && results.projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={he.command.projects}>
              {results.projects.slice(0, 6).map((project) => {
                const Icon = resolveIcon(project.icon);
                return (
                  <CommandItem
                    key={project.id}
                    value={`project-${project.id}`}
                    keywords={[project.name]}
                    onSelect={() => go(`/projects/${project.id}`)}
                  >
                    <Icon className="size-4" /> {project.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {searching && (
          <>
            <CommandSeparator />
            <CommandGroup heading={he.command.quickAdd}>
              <CommandItem
                value={`create-${trimmedQuery}`}
                onSelect={() => {
                  openQuickAdd(query);
                  setOpen(false);
                }}
              >
                <Plus className="size-4" /> {he.command.createTask} &quot;{trimmedQuery}&quot;
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {!searching && (
          <>
            <CommandGroup heading={he.command.quickAdd}>
              <CommandItem value="quick-add" onSelect={() => { openQuickAdd(); setOpen(false); }}>
                <Plus className="size-4" /> {he.command.addTaskQuick}
              </CommandItem>
              <CommandItem value="quick-add-form" onSelect={() => { openQuickAdd("", "form"); setOpen(false); }}>
                <ListTodo className="size-4" /> {he.command.addTaskForm}
              </CommandItem>
            </CommandGroup>

            <CommandGroup heading={he.command.navigate}>
              <CommandItem value="nav-home" onSelect={() => go("/")}>
                <Home className="size-4" /> {he.nav.home}
              </CommandItem>
              <CommandItem value="nav-today" onSelect={() => go("/today")}>
                <Sun className="size-4" /> {he.nav.today}
              </CommandItem>
              <CommandItem value="nav-inbox" onSelect={() => go("/dont-forget")}>
                <StickyNote className="size-4" /> {he.nav.inbox}
              </CommandItem>
              <CommandItem value="nav-tasks" onSelect={() => go("/tasks")}>
                <ListTodo className="size-4" /> {he.nav.myTasks}
              </CommandItem>
              <CommandItem value="nav-calendar" onSelect={() => go("/calendar")}>
                <CalendarDays className="size-4" /> {he.nav.calendar}
              </CommandItem>
              <CommandItem value="nav-projects" onSelect={() => go("/projects")}>
                <Folder className="size-4" /> {he.nav.projects}
              </CommandItem>
              <CommandItem value="nav-ready" onSelect={() => go("/ready")}>
                <CircleDot className="size-4" /> {he.nav.ready}
              </CommandItem>
              <CommandItem value="nav-waiting" onSelect={() => go("/waiting")}>
                <Clock className="size-4" /> {he.nav.waiting}
              </CommandItem>
              <CommandItem value="nav-blocked" onSelect={() => go("/blocked")}>
                <Ban className="size-4" /> {he.nav.blocked}
              </CommandItem>
              <CommandItem
                value="nav-new-project"
                onSelect={() => {
                  setNewProjectOpen(true);
                  setOpen(false);
                }}
              >
                <Plus className="size-4" /> {he.category.create}
              </CommandItem>
              <CommandItem value="nav-search" onSelect={() => go("/search")}>
                <SearchIcon className="size-4" /> {he.command.fullSearch}
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
