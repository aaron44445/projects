"use client";

import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/projects/project-card";
import { AddProjectDialog } from "@/components/projects/add-project-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban } from "lucide-react";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data: Project[]) => setProjects(data))
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => setLoading(false));
  }, []);

  function handleProjectCreated(project: Project) {
    setProjects((prev) => [...prev, project]);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Projects</h1>
            <p className="text-[11px] text-muted-foreground">
              {loading
                ? "Loading..."
                : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <AddProjectDialog onProjectCreated={handleProjectCreated} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[120px] rounded-xl" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/5 mb-4">
            <FolderKanban className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">No projects yet</p>
          <p className="text-[11px] text-muted-foreground/60">
            Create a project to get started with a custom dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
