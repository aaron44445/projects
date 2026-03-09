import { readFile as fsReadFile } from "fs/promises";
import type { CronJob, GatewayHealth, AgentActivity } from "./types";
import { getBuildingForJob, type BuildingId } from "./job-building-map";

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL!;
const GATEWAY_TOKEN = process.env.OPENCLAW_TOKEN!;

async function gatewayFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${GATEWAY_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GATEWAY_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// Read a file from the local filesystem (Mission Control runs co-located with OpenCLAW)
export async function readFile(filePath: string): Promise<string> {
  return fsReadFile(filePath, "utf-8");
}

// Read and parse a JSON file
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  return JSON.parse(content);
}

// Get gateway health status
export async function getHealth(): Promise<GatewayHealth> {
  try {
    const res = await gatewayFetch("/", { method: "GET" });
    return {
      status: res.ok ? "online" : "degraded",
      timestamp: Date.now(),
      agents: [],
    };
  } catch {
    return {
      status: "offline",
      timestamp: Date.now(),
      agents: [],
    };
  }
}

// Get cron jobs
export async function getCronJobs(): Promise<CronJob[]> {
  const data = await readJsonFile<{ jobs: CronJob[] }>(
    "C:/Users/aaron/.openclaw/cron/jobs.json"
  );
  return data.jobs;
}

// Trigger a cron job to run now (via chat completions as a command)
export async function runCronJob(jobId: string): Promise<string> {
  const res = await gatewayFetch("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "openclaw:main",
      messages: [
        { role: "user", content: `/cron run ${jobId}` },
      ],
      stream: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`Run cron job failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "Job triggered";
}

// Toggle a cron job enabled/disabled
export async function toggleCronJob(
  jobId: string,
  enabled: boolean
): Promise<string> {
  // Read current jobs, toggle, write back
  const jobsPath = "C:/Users/aaron/.openclaw/cron/jobs.json";
  const data = await readJsonFile<{ jobs: CronJob[] }>(jobsPath);
  const job = data.jobs.find((j) => j.id === jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  job.enabled = enabled;
  const { writeFile } = await import("fs/promises");
  await writeFile(jobsPath, JSON.stringify(data, null, 2), "utf-8");
  return `Job ${jobId} ${enabled ? "enabled" : "disabled"}`;
}

// Get OpenCLAW config (with sensitive fields masked)
export async function getConfig(): Promise<Record<string, unknown>> {
  return readJsonFile("C:/Users/aaron/.openclaw/openclaw.json");
}

// List files in a directory
export async function listFiles(dirPath: string): Promise<string[]> {
  const { readdir } = await import("fs/promises");
  return readdir(dirPath);
}

// Send a message to an agent via chat completions (with 120s timeout)
export async function chatWithAgent(
  agentId: string,
  message: string,
  sessionKey?: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await gatewayFetch("/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-openclaw-agent-id": agentId,
        ...(sessionKey ? { "x-openclaw-session-key": sessionKey } : {}),
      },
      body: JSON.stringify({
        model: `openclaw:${agentId}`,
        messages: [{ role: "user", content: message }],
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Chat failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Agent response timed out (120s). The model may be slow — try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Get agent activity — 3-source priority with 2-min window and building assignment
export async function getAgentActivity(): Promise<AgentActivity[]> {
  const agents = [
    { id: "main", label: "CLAW" },
    { id: "marketer", label: "BLOOM" },
    { id: "board-moderator", label: "THE BOARD" },
    { id: "builder", label: "FORGE" },
    { id: "enforcer", label: "SENTINEL" },
  ];

  const activities: AgentActivity[] = [];
  const agentsWithActivity = new Set<string>();
  const now = Date.now();
  const TWO_MINUTES = 2 * 60 * 1000;
  const FIVE_MINUTES = 5 * 60 * 1000;

  // Source 1: Cron jobs (highest priority)
  try {
    const jobs = await getCronJobs();
    for (const job of jobs) {
      if (!job.state) continue;
      const agent = agents.find((a) => a.id === job.agentId);
      if (!agent) continue;

      const lastRun = job.state.lastRunAtMs || 0;
      const timeSinceRun = now - lastRun;
      const isRunning = (job.state as Record<string, unknown>).runningAtMs != null;
      const buildingId = getBuildingForJob(job.id || job.name);

      // Currently running
      if (isRunning) {
        activities.push({
          agentId: agent.id,
          agentLabel: agent.label,
          action: "working",
          description: job.name,
          timestamp: now,
          buildingId,
          jobId: job.id || job.name,
        });
        agentsWithActivity.add(agent.id);
        continue;
      }

      // Completed or errored within 2 minutes
      if (timeSinceRun < TWO_MINUTES) {
        const action = job.state.lastRunStatus === "error" ? "error"
          : job.state.lastRunStatus === "ok" ? "completed"
          : "working";
        activities.push({
          agentId: agent.id,
          agentLabel: agent.label,
          action,
          description: job.name,
          timestamp: lastRun,
          buildingId: action === "error" ? buildingId : "barracks",
          jobId: job.id || job.name,
        });
        agentsWithActivity.add(agent.id);
      }
    }
  } catch (e) {
    console.error("Failed to read cron jobs:", e);
  }

  // Source 2: Enforcer dispatch state
  try {
    const stateFile = "C:/Users/aaron/.openclaw/workspace-enforcer/state.json";
    const state = await readJsonFile<{
      agentStates?: Record<string, { status?: string; lastDispatch?: { task?: string }; dispatchedAtMs?: number }>;
    }>(stateFile);
    if (state?.agentStates) {
      for (const [agentId, agentState] of Object.entries(state.agentStates)) {
        if (agentsWithActivity.has(agentId)) continue;
        if (!["DISPATCHED", "COOLDOWN", "WORKING"].includes(agentState?.status ?? "")) continue;

        const dispatchedAt = agentState.dispatchedAtMs || 0;
        if (now - dispatchedAt > FIVE_MINUTES) continue;

        const agent = agents.find((a) => a.id === agentId);
        if (!agent) continue;

        const taskDesc = agentState.lastDispatch?.task || "Enforcer dispatch";
        let buildingId: BuildingId = "outreach-hq";
        const t = taskDesc.toLowerCase();
        if (t.includes("email") || t.includes("outreach")) buildingId = "outreach-hq";
        else if (t.includes("content") || t.includes("blog")) buildingId = "content-lab";
        else if (t.includes("lead") || t.includes("enrich")) buildingId = "intel-room";
        else if (t.includes("reply") || t.includes("inbox")) buildingId = "comms-tower";

        activities.push({
          agentId: agent.id,
          agentLabel: agent.label,
          action: "working",
          description: taskDesc,
          timestamp: dispatchedAt,
          buildingId,
        });
        agentsWithActivity.add(agentId);
      }
    }
  } catch {
    // Enforcer state file may not exist
  }

  // Source 3: Fill idle agents — everyone without activity goes to barracks
  for (const agent of agents) {
    if (agentsWithActivity.has(agent.id)) continue;
    activities.push({
      agentId: agent.id,
      agentLabel: agent.label,
      action: "idle",
      description: agent.id === "board-moderator" ? "Next board: tonight" : "Standing by",
      timestamp: now,
      buildingId: "barracks",
    });
  }

  return activities;
}

export const gateway = {
  getHealth,
  getCronJobs,
  runCronJob,
  toggleCronJob,
  getConfig,
  readFile,
  readJsonFile,
  listFiles,
  chatWithAgent,
  getAgentActivity,
};
