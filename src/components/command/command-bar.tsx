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
  Inbox as InboxIcon,
  Folder,
  Clock,
  Ban,
  Plus,
  Search as SearchIcon,
  ListTodo,
  CalendarDays,
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
  const { data: results } = useSearch(query);

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
    >
      <CommandInput placeholder={he.command.placeholder} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{he.empty.noResults}</CommandEmpty>

        {query.trim() && (
          <CommandGroup heading={he.command.quickAdd}>
            <CommandItem
              onSelect={() => {
                openQuickAdd(query);
                setOpen(false);
              }}
            >
              <Plus className="size-4" /> {he.command.createTask} &quot;{query}&quot;
            </CommandItem>
          </CommandGroup>
        )}

        {!query.trim() && (
          <CommandGroup heading={he.command.quickAdd}>
            <CommandItem
              onSelect={() => {
                openQuickAdd();
                setOpen(false);
              }}
            >
              <Plus className="size-4" /> {he.command.addTaskQuick}
            </CommandItem>
            <CommandItem
              onSelect={() => {
                openQuickAdd("", "form");
                setOpen(false);
              }}
            >
              <ListTodo className="size-4" /> {he.command.addTaskForm}
            </CommandItem>
          </CommandGroup>
        )}

        {!query.trim() && (
          <CommandGroup heading={he.command.navigate}>
            <CommandItem onSelect={() => go("/")}>
              <Home className="size-4" /> {he.nav.home}
            </CommandItem>
            <CommandItem onSelect={() => go("/today")}>
              <Sun className="size-4" /> {he.nav.today}
            </CommandItem>
            <CommandItem onSelect={() => go("/inbox")}>
              <InboxIcon className="size-4" /> {he.nav.inbox}
            </CommandItem>
            <CommandItem onSelect={() => go("/tasks")}>
              <ListTodo className="size-4" /> {he.nav.myTasks}
            </CommandItem>
            <CommandItem onSelect={() => go("/calendar")}>
              <CalendarDays className="size-4" /> {he.nav.calendar}
            </CommandItem>
            <CommandItem onSelect={() => go("/projects")}>
              <Folder className="size-4" /> {he.nav.projects}
            </CommandItem>
            <CommandItem onSelect={() => go("/waiting")}>
              <Clock className="size-4" /> {he.nav.waiting}
            </CommandItem>
            <CommandItem onSelect={() => go("/blocked")}>
              <Ban className="size-4" /> {he.nav.blocked}
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setNewProjectOpen(true);
                setOpen(false);
              }}
            >
              <Plus className="size-4" /> {he.category.create}
            </CommandItem>
            <CommandItem onSelect={() => go("/search")}>
              <SearchIcon className="size-4" /> {he.command.fullSearch}
            </CommandItem>
          </CommandGroup>
        )}

        {results && results.tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={he.command.tasks}>
              {results.tasks.slice(0, 6).map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => {
                    openTaskPanel(task.id);
                    setOpen(false);
                  }}
                >
                  <ListTodo className="size-4" /> {task.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results && results.projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={he.command.projects}>
              {results.projects.slice(0, 6).map((project) => {
                const Icon = resolveIcon(project.icon);
                return (
                  <CommandItem key={project.id} onSelect={() => go(`/projects/${project.id}`)}>
                    <Icon className="size-4" /> {project.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

      </CommandList>
    </CommandDialog>
  );
}
