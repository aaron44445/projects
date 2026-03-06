"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCards } from "./kpi-cards";
import { PipelineFunnel } from "./pipeline-funnel";
import { CronGridWidget } from "./cron-grid-widget";
import { ProgressBarWidget } from "./progress-bar-widget";
import { TableWidget } from "./table-widget";
import { MarkdownViewer } from "./markdown-viewer";
import { QuickActions } from "./quick-actions";
import type { WidgetConfig } from "@/lib/types";

const widgetMap: Record<string, React.ComponentType<{ config: WidgetConfig }>> = {
  "kpi-cards": KpiCards,
  "pipeline-funnel": PipelineFunnel,
  "cron-grid": CronGridWidget,
  "progress-bar": ProgressBarWidget,
  table: TableWidget,
  "markdown-viewer": MarkdownViewer,
  "quick-actions": QuickActions,
};

export function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const Component = widgetMap[widget.type];

  if (!Component) {
    return (
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            Unknown widget: {widget.type}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card/60">
      {widget.title && (
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            {widget.title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="px-4 pb-4">
        <Component config={widget} />
      </CardContent>
    </Card>
  );
}
