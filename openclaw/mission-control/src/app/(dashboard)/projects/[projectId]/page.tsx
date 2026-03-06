"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetRenderer } from "@/components/widgets/widget-renderer";
import { ArrowLeft, Bot, Clock, LayoutGrid } from "lucide-react";
import type { Project } from "@/lib/types";

const statusConfig: Record<
  Project["status"],
  { label: string; className: string }
> = {
  active: {
    label: "ACTIVE",
    className:
      "bg-green-500/15 text-green-400 border-green-500/30",
  },
  paused: {
    label: "PAUSED",
    className:
      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  archived: {
    label: "ARCHIVED",
    className:
      "bg-gray-500/15 text-gray-400 border-gray-500/30",
  },
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Project not found");
        return res.json();
      })
      .then((data: Project) => setProject(data))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/projects")}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Projects
        </Button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted-foreground">Project not found</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            The project may have been deleted or the ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  const status = statusConfig[project.status];
  const agentCount = project.agents?.length ?? 0;
  const cronCount = project.cronJobs?.length ?? 0;
  const widgetCount = project.dashboard?.widgets?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/projects")}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Projects
      </Button>

      {/* Project header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <Badge
              variant="outline"
              className={`font-mono text-[9px] px-1.5 py-0 h-5 ${status.className}`}
            >
              {status.label}
            </Badge>
          </div>
          {project.description && (
            <p className="text-[12px] text-muted-foreground max-w-xl">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta bar */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Bot className="h-3.5 w-3.5" />
          <span className="font-mono">{agentCount}</span> agent{agentCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">{cronCount}</span> cron job{cronCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <LayoutGrid className="h-3.5 w-3.5" />
          <span className="font-mono">{widgetCount}</span> widget{widgetCount !== 1 ? "s" : ""}
        </span>
        {project.workspace && (
          <span className="text-[10px] font-mono text-muted-foreground/60 truncate max-w-[300px]">
            {project.workspace}
          </span>
        )}
      </div>

      {/* Widget Dashboard */}
      {widgetCount > 0 ? (
        <div className="space-y-4">
          {/* Group widgets by row */}
          {Object.entries(
            project.dashboard.widgets.reduce<Record<number, typeof project.dashboard.widgets>>((acc, w) => {
              const row = w.row ?? 1;
              if (!acc[row]) acc[row] = [];
              acc[row].push(w);
              return acc;
            }, {})
          )
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([row, widgets]) => (
              <div
                key={row}
                className={`grid gap-4 ${
                  widgets.length === 1
                    ? "grid-cols-1"
                    : widgets.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3"
                }`}
              >
                {widgets.map((widget) => (
                  <WidgetRenderer key={widget.id} widget={widget} />
                ))}
              </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-border/30 rounded-lg bg-card/40">
          <LayoutGrid className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No widgets configured</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            Add widgets to this project&apos;s dashboard to see data here.
          </p>
        </div>
      )}
    </div>
  );
}
