import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { prisma } from "@aircraftspa/database";
import { fromNodeHeaders } from "better-auth/node";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, businessId: true, role: true, name: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    (req as any).user = user;
    (req as any).businessId = user.businessId;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid session" });
  }
}
