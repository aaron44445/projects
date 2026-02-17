import { Request, Response, NextFunction } from "express";

export const ROLE_HIERARCHY: Record<string, number> = {
  technician: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export function canAccess(userRole: string, requiredRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
}

export function requireRole(minimumRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    if (!canAccess(user.role, minimumRole)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }
    next();
  };
}
