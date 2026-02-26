import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import { authMiddleware } from "../middleware/auth.js";
import { buildPrompt } from "../lib/prompt-builder.js";
import { db } from "../lib/db.js";
import type { GenerateRequest } from "@mail-whale/types";

export const generateRoutes = new Hono();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

generateRoutes.post("/generate", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<GenerateRequest>();

  const { system, user } = buildPrompt(body);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });

  const draft =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Save generation for analytics
  const generation = await db.generation.create({
    data: {
      userId,
      mode: body.mode,
      prompt: body.newEmailPrompt,
      draft,
    },
  });

  return c.json({ draft, generationId: generation.id });
});
