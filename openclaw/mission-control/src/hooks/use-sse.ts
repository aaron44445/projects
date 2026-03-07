"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { CronJob, GatewayHealth, AgentActivity } from "@/lib/types";

interface SSEState {
  health: GatewayHealth | null;
  cronJobs: CronJob[];
  agentActivities: AgentActivity[];
  connected: boolean;
  lastUpdate: number | null;
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    health: null,
    cronJobs: [],
    agentActivities: [],
    connected: false,
    lastUpdate: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, connected: true }));
    };

    es.addEventListener("health", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({ ...prev, health: data, lastUpdate: Date.now() }));
    });

    es.addEventListener("cron", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        cronJobs: data.jobs,
        lastUpdate: Date.now(),
      }));
    });

    es.addEventListener("agent-activity", (e) => {
      const data = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        agentActivities: [
          ...prev.agentActivities,
          ...data.activities,
        ].slice(-50), // keep last 50
        lastUpdate: Date.now(),
      }));
    });

    es.addEventListener("heartbeat", () => {
      setState((prev) => ({ ...prev, lastUpdate: Date.now() }));
    });

    es.onerror = () => {
      setState((prev) => ({ ...prev, connected: false }));
      // Auto-reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return state;
}
