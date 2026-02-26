import { createMiddleware } from "hono/factory";
import { verifyToken } from "../lib/auth.js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing authorization header" }, 401);
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    c.set("userId", payload.userId);
    c.set("email", payload.email);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});
