"use client";
import { createContext, useContext } from "react";
import { useSSE } from "@/hooks/use-sse";
import type { CronJob, GatewayHealth, AgentActivity } from "@/lib/types";

interface SSEContextValue {
  health: GatewayHealth | null;
  cronJobs: CronJob[];
  agentActivities: AgentActivity[];
  connected: boolean;
  lastUpdate: number | null;
}

const SSEContext = createContext<SSEContextValue>({
  health: null,
  cronJobs: [],
  agentActivities: [],
  connected: false,
  lastUpdate: null,
});

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const sse = useSSE();
  return <SSEContext.Provider value={sse}>{children}</SSEContext.Provider>;
}

export function useSSEContext() {
  return useContext(SSEContext);
}
