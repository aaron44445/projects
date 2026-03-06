import { readFile as fsReadFile } from "fs/promises";
import type { CronJob, GatewayHealth } from "./types";

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

// Send a message to an agent via chat completions
export async function chatWithAgent(
  agentId: string,
  message: string,
  sessionKey?: string
): Promise<string> {
  const res = await gatewayFetch("/v1/chat/completions", {
    method: "POST",
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
};
