import { gateway } from "@/lib/gateway";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const poll = async () => {
        try {
          const [health, cron] = await Promise.allSettled([
            gateway.getHealth(),
            gateway.getCronJobs(),
          ]);

          if (health.status === "fulfilled") send("health", health.value);
          if (cron.status === "fulfilled") send("cron", { jobs: cron.value });

          send("heartbeat", { timestamp: Date.now() });
        } catch {
          send("error", { message: "Poll failed", timestamp: Date.now() });
        }
      };

      // Initial send
      await poll();

      // Poll every 5 seconds
      const interval = setInterval(poll, 5000);

      // Store cleanup ref
      (controller as unknown as Record<string, unknown>).__cleanup = () =>
        clearInterval(interval);
    },
    cancel() {
      // Client disconnected
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
