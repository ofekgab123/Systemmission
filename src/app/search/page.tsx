"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useSearch } from "@/hooks/use-search";
import { TaskRow } from "@/components/task/task-row";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { resolveIcon } from "@/lib/icons";
import { he } from "@/lib/i18n/he";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const { data: results, isLoading } = useSearch(q);

  return (
    <div>
      <PageHeader title={he.search.title} description={he.search.description} />
      <div className="page-content">
        <div className="relative mb-6 max-w-xl">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={he.search.placeholder}
            className="ps-9"
            autoFocus
          />
        </div>

        {q.trim() && isLoading && <p className="text-sm text-muted-foreground">{he.actions.loading}</p>}

        {results && q.trim() && (
          <div className="flex flex-col gap-8">
            {results.tasks.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">{he.command.tasks}</h2>
                <div className="rounded-xl border bg-card p-1.5">
                  {results.tasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              </section>
            )}

            {results.projects.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">{he.command.projects}</h2>
                <div className="flex flex-col gap-1">
                  {results.projects.map((project) => {
                    const Icon = resolveIcon(project.icon);
                    return (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
                      >
                        <Icon className="size-4" style={{ color: project.color }} />
                        {project.name}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {results.areas.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">{he.command.areas}</h2>
                <div className="flex flex-col gap-1">
                  {results.areas.map((area) => {
                    const Icon = resolveIcon(area.icon);
                    return (
                      <Link
                        key={area.id}
                        href={`/areas/${area.id}`}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent"
                      >
                        <Icon className="size-4" style={{ color: area.color }} />
                        {area.name}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {results.tasks.length === 0 &&
              results.projects.length === 0 &&
              results.areas.length === 0 && (
                <p className="text-sm text-muted-foreground">{he.empty.noResults}</p>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
