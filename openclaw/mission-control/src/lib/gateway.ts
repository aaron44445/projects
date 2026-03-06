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

// Invoke a tool via the gateway
async function invokeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const res = await gatewayFetch("/tools/invoke", {
    method: "POST",
    body: JSON.stringify({ tool: toolName, arguments: args }),
  });
  if (!res.ok) {
    throw new Error(
      `Gateway tool invoke failed: ${res.status} ${res.statusText}`
    );
  }
  const json = await res.json();
  // Response envelope: result.content[0].text
  return json?.result?.content?.[0]?.text ?? JSON.stringify(json);
}

// Read a file from the gateway host filesystem
export async function readFile(filePath: string): Promise<string> {
  return invokeTool("exec", {
    command: `cat "${filePath.replace(/\\/g, "/")}"`,
  });
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

// Trigger a cron job to run now
export async function runCronJob(jobId: string): Promise<string> {
  return invokeTool("exec", {
    command: `openclaw cron run ${jobId}`,
  });
}

// Toggle a cron job enabled/disabled
export async function toggleCronJob(
  jobId: string,
  enabled: boolean
): Promise<string> {
  return invokeTool("exec", {
    command: `openclaw cron edit ${jobId} --enabled ${enabled}`,
  });
}

// Get OpenCLAW config
export async function getConfig(): Promise<Record<string, unknown>> {
  return readJsonFile("C:/Users/aaron/.openclaw/openclaw.json");
}

// List files in a directory
export async function listFiles(dirPath: string): Promise<string[]> {
  const output = await invokeTool("exec", {
    command: `ls "${dirPath.replace(/\\/g, "/")}"`,
  });
  return output.split("\n").filter(Boolean);
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
