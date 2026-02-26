import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "chrome-extension://*",
      "https://mail.google.com",
      "https://outlook.live.com",
      "https://outlook.office.com",
    ],
  })
);

app.route("/", healthRoutes);
app.route("/", authRoutes);

const port = Number(process.env.PORT) || 3001;
console.log(`Mail Whale API running on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
