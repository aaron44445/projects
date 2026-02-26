import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { db } from "../lib/db.js";
import type { StyleProfile } from "@mail-whale/types";

export const profileRoutes = new Hono();

profileRoutes.put("/profile", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const styleProfile = await c.req.json<StyleProfile>();

  await db.user.update({
    where: { id: userId },
    data: { styleProfile: styleProfile as any },
  });

  return c.json({ ok: true });
});

profileRoutes.get("/profile", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await db.user.findUnique({ where: { id: userId } });
  return c.json({ styleProfile: user?.styleProfile || null });
});
