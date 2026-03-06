"use client";

import { GatewayHealth } from "@/components/dashboard/gateway-health";
import { AgentCards } from "@/components/dashboard/agent-cards";
import { CronGrid } from "@/components/dashboard/cron-grid";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function CommandCenter() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">
          Command Center
        </h1>
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Live
          </span>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-[260px_1fr_300px] gap-4 items-start">
        {/* Left column: Gateway + Agents stacked */}
        <div className="space-y-3">
          <GatewayHealth />
          <AgentCards />
        </div>

        {/* Center column: Cron grid */}
        <div>
          <CronGrid />
        </div>

        {/* Right column: Activity feed */}
        <div className="max-h-[calc(100vh-140px)] sticky top-4">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
