import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

export const servicesRouter = Router();

// GET /api/services — list services for a business (public, uses tenant context)
servicesRouter.get("/", async (req, res) => {
  const businessId = (req as any).businessId;
  const services = await prisma.service.findMany({
    where: { businessId, active: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json({ success: true, data: services });
});

// GET /api/services/:id/addons — list add-ons for a service type
servicesRouter.get("/:id/addons", async (req, res) => {
  const businessId = (req as any).businessId;
  const service = await prisma.service.findFirst({
    where: { id: req.params.id, businessId },
  });
  if (!service) return res.status(404).json({ success: false, error: "Service not found" });

  const addOns = await prisma.addOn.findMany({
    where: {
      businessId,
      active: true,
      applicableTo: { has: service.type },
    },
    orderBy: { sortOrder: "asc" },
  });
  res.json({ success: true, data: addOns });
});

// POST /api/services — create (admin+)
servicesRouter.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const businessId = (req as any).businessId;
  const service = await prisma.service.create({
    data: { ...req.body, businessId },
  });
  res.status(201).json({ success: true, data: service });
});

// PUT /api/services/:id — update (admin+)
servicesRouter.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const businessId = (req as any).businessId;
  const service = await prisma.service.updateMany({
    where: { id: req.params.id, businessId },
    data: req.body,
  });
  res.json({ success: true, data: service });
});
