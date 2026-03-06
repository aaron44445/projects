"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Clock, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";

const statusConfig: Record<
  Project["status"],
  { label: string; className: string }
> = {
  active: {
    label: "ACTIVE",
    className:
      "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/20",
  },
  paused: {
    label: "PAUSED",
    className:
      "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
  },
  archived: {
    label: "ARCHIVED",
    className:
      "bg-gray-500/15 text-gray-400 border-gray-500/30 hover:bg-gray-500/20",
  },
};

export function ProjectCard({ project }: { project: Project }) {
  const status = statusConfig[project.status];
  const agentCount = project.agents?.length ?? 0;
  const cronCount = project.cronJobs?.length ?? 0;

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="border-border/50 bg-card hover:border-border/80 transition-colors duration-150 h-full">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold truncate">
              {project.name}
            </CardTitle>
            <Badge
              variant="outline"
              className={`font-mono text-[9px] px-1.5 py-0 h-5 shrink-0 ${status.className}`}
            >
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 flex flex-col gap-3">
          {project.description ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {project.description}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/50 italic">
              No description
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Bot className="h-3 w-3" />
                <span className="font-mono">{agentCount}</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{cronCount}</span>
              </span>
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
