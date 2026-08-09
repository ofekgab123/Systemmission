"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useProjects } from "@/hooks/use-projects";
import { ProjectCard } from "@/components/project/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/task/task-list";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { he } from "@/lib/i18n/he";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const setNewProjectOpen = useUIStore((s) => s.setNewProjectOpen);

  return (
    <div>
      <PageHeader
        title={he.nav.projects}
        description={he.category.pageDescription}
        actions={
          <Button onClick={() => setNewProjectOpen(true)} className="gap-2">
            <Plus className="size-4" />
            {he.category.addNew}
          </Button>
        }
      />
      <div className="page-content">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} className="w-full" />
            ))}
          </div>
        ) : (
          <EmptyState
            title={he.empty.noProjects}
            description={he.empty.noProjectsDesc}
            action={
              <Button onClick={() => setNewProjectOpen(true)} className="gap-2">
                <Plus className="size-4" />
                {he.category.create}
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
