import { Request, Response, NextFunction } from "express";
import { prisma } from "@aircraftspa/database";

export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const subdomain = req.headers["x-business-subdomain"] as string;
  const user = (req as any).user;

  if (user?.businessId) {
    (req as any).businessId = user.businessId;
    return next();
  }

  if (subdomain) {
    const business = await prisma.business.findUnique({
      where: { subdomain },
      select: { id: true },
    });
    if (!business) {
      return res.status(404).json({ success: false, error: "Business not found" });
    }
    (req as any).businessId = business.id;
    return next();
  }

  return res.status(400).json({ success: false, error: "Business context required" });
}
