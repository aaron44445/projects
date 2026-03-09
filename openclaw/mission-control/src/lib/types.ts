// Gateway connection
export interface GatewayConfig {
  url: string;
  token: string;
}

// Cron job (matches ~/.openclaw/cron/jobs.json structure)
export interface CronJob {
  id: string;
  agentId: string;
  name: string;
  enabled: boolean;
  createdAtMs?: number;
  updatedAtMs?: number;
  schedule: {
    kind: "cron" | "at" | "every";
    expr: string;
    tz?: string;
    staggerMs?: number;
  };
  sessionTarget: "isolated" | "main";
  wakeMode: "now" | "next-heartbeat";
  payload: {
    kind: "agentTurn" | "systemEvent";
    message?: string;
    text?: string;
    timeoutSeconds?: number;
  };
  delivery?: {
    mode: "announce" | "webhook" | "none";
    channel?: string;
    to?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: "ok" | "error" | "timeout";
    lastStatus?: "ok" | "error" | "timeout";
    lastDurationMs?: number;
    lastDelivered?: boolean;
    lastDeliveryStatus?: string;
    consecutiveErrors?: number;
    lastError?: string;
  };
}

// Agent
export interface Agent {
  id: string;
  workspace?: string;
  model?: {
    primary: string;
    fallbacks?: string[];
  };
}

// Pipeline lead
export interface Lead {
  id: string;
  business: string;
  city: string;
  website?: string;
  instagram?: string;
  ownerName?: string;
  ownerEmail?: string;
  emailConfidence?: string;
  googleRating?: number;
  reviewCount?: number;
  topService?: string;
  seoIssues?: string;
  competitor?: string;
  score?: number;
  stage: string;
  stageHistory?: Array<{
    stage: string;
    date: string;
    resendId?: string;
    subject?: string;
    angle?: string;
  }>;
  replied?: boolean;
  replyDate?: string;
  callBooked?: boolean;
  outcome?: string;
}

// Pipeline data
export interface PipelineData {
  version: number;
  lastUpdated: string;
  leads: Lead[];
  metrics: Record<string, number>;
  nextLeadId: number;
}

// Performance data
export interface PerformanceData {
  version: number;
  lastUpdated: string;
  startDate: string;
  currentDay: number;
  currentLimits: {
    emailDailyMax: number;
    dmDailyMax: number;
  };
  deliverability: {
    totalSent: number;
    totalBounced: number;
    bounceRate: number;
  };
  channelPerformance: {
    email: {
      totalSent: number;
      totalReplies: number;
      replyRate: number;
      callsBooked: number;
    };
    dm: {
      totalSent: number;
      totalReplies: number;
      successRate: number;
    };
  };
  dailyHistory: Record<
    string,
    {
      emailsSent: number;
      dmsSent: number;
      replies: number;
    }
  >;
}

// Project configuration
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "archived";
  workspace?: string;
  agents?: string[];
  cronJobs?: string[];
  dataFiles?: Record<string, string>;
  dashboard: DashboardConfig;
  createdAt: string;
  updatedAt: string;
}

// Widget configuration
export interface WidgetConfig {
  id: string;
  type:
    | "kpi-cards"
    | "pipeline-funnel"
    | "cron-grid"
    | "activity-feed"
    | "chart"
    | "file-viewer"
    | "markdown-viewer"
    | "quick-actions"
    | "table"
    | "progress-bar"
    | "health-monitor";
  row: number;
  col?: number;
  width?: number;
  title?: string;
  data?: string;
  config?: Record<string, unknown>;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  template?: string;
}

// Gateway health
export interface GatewayHealth {
  status: "online" | "offline" | "degraded";
  uptime?: number;
  agents: Array<{
    id: string;
    status: string;
    model: string;
  }>;
  timestamp: number;
}

// SSE event types
export type SSEEventType =
  | "health"
  | "cron"
  | "pipeline"
  | "performance"
  | "activity"
  | "agent-activity";

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: number;
}

// Agent activity for live war room tracking
export interface AgentActivity {
  agentId: string;
  agentLabel: string;
  action: "working" | "idle" | "completed" | "error";
  project?: string;
  description: string;
  timestamp: number;
  buildingId?: string;
  jobId?: string;
}
