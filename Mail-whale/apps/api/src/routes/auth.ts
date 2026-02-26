import { Hono } from "hono";
import { db } from "../lib/db.js";
import { signToken } from "../lib/auth.js";

export const authRoutes = new Hono();

/**
 * POST /auth/register
 * Called by the extension after OAuth.
 * Creates or finds user, returns JWT.
 */
authRoutes.post("/auth/register", async (c) => {
  const { email, provider } = await c.req.json<{
    email: string;
    provider: "gmail" | "outlook";
  }>();

  if (!email || !provider) {
    return c.json({ error: "email and provider are required" }, 400);
  }

  const user = await db.user.upsert({
    where: { email },
    update: { provider },
    create: { email, provider },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return c.json({ token, user: { id: user.id, email: user.email } });
});
