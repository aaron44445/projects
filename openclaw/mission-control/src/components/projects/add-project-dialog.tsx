"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import type { Project, WidgetConfig } from "@/lib/types";

type Template = "sales-pipeline" | "content-project" | "client-work" | "blank";

const templateLabels: Record<Template, string> = {
  "sales-pipeline": "Sales Pipeline",
  "content-project": "Content Project",
  "client-work": "Client Work",
  blank: "Blank",
};

const templateDescriptions: Record<Template, string> = {
  "sales-pipeline": "KPIs, pipeline funnel, cron grid, progress bar",
  "content-project": "KPIs, data table, cron grid",
  "client-work": "KPIs, data table, progress bar",
  blank: "Empty dashboard - add widgets later",
};

function buildWidgets(template: Template): WidgetConfig[] {
  const widgetDefs: Record<string, Omit<WidgetConfig, "id">> = {
    "kpi-cards": { type: "kpi-cards", row: 0, title: "KPI Cards" },
    "pipeline-funnel": {
      type: "pipeline-funnel",
      row: 1,
      title: "Pipeline Funnel",
    },
    "cron-grid": { type: "cron-grid", row: 1, title: "Cron Jobs" },
    table: { type: "table", row: 1, title: "Data Table" },
    "progress-bar": { type: "progress-bar", row: 2, title: "Progress" },
  };

  const templateWidgets: Record<Template, string[]> = {
    "sales-pipeline": ["kpi-cards", "pipeline-funnel", "cron-grid", "progress-bar"],
    "content-project": ["kpi-cards", "table", "cron-grid"],
    "client-work": ["kpi-cards", "table", "progress-bar"],
    blank: [],
  };

  return templateWidgets[template].map((key, i) => ({
    ...widgetDefs[key],
    id: `widget-${key}-${i}`,
  })) as WidgetConfig[];
}

interface AddProjectDialogProps {
  onProjectCreated: (project: Project) => void;
}

export function AddProjectDialog({ onProjectCreated }: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [template, setTemplate] = useState<Template>("blank");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setDescription("");
    setWorkspace("");
    setTemplate("blank");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        status: "active" as const,
        workspace: workspace.trim() || undefined,
        agents: [],
        cronJobs: [],
        dashboard: {
          widgets: buildWidgets(template),
          template,
        },
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create project");

      const project: Project = await res.json();
      onProjectCreated(project);
      resetForm();
      setOpen(false);
    } catch (err) {
      console.error("Create project failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            New Project
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Create a new project with a dashboard template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="h-8 text-sm bg-background/50"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="min-h-[60px] text-sm bg-background/50 resize-none"
              rows={2}
            />
          </div>

          {/* Workspace */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Workspace Path
            </label>
            <Input
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="C:\Users\...\.openclaw\workspace (optional)"
              className="h-8 text-sm font-mono bg-background/50"
            />
          </div>

          {/* Template */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Template
            </label>
            <Select
              value={template}
              onValueChange={(v) => setTemplate(v as Template)}
            >
              <SelectTrigger className="h-8 w-full text-sm bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                {(Object.keys(templateLabels) as Template[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-sm">
                    <div className="flex flex-col">
                      <span>{templateLabels[key]}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {templateDescriptions[key]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting || !name.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
