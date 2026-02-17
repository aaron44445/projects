import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { requireAuth } from "../middleware/auth";

export const techJobsRouter = Router();

// GET /api/tech/jobs/today — today's assigned jobs for authenticated technician
techJobsRouter.get("/today", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      technicianId: userId,
      scheduledAt: { gte: today, lt: tomorrow },
      status: { in: ["confirmed", "in_progress"] },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      aircraftClass: { select: { displayName: true, icon: true } },
      service: { select: { name: true } },
      location: { include: { airport: { select: { icaoCode: true, name: true } } } },
      checklistItems: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  res.json({ success: true, data: bookings });
});

// GET /api/tech/jobs/:id — full job detail
techJobsRouter.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, technicianId: userId },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      aircraftClass: true,
      service: true,
      location: { include: { airport: true } },
      addOns: { include: { addOn: true } },
      checklistItems: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking) return res.status(404).json({ success: false, error: "Job not found" });
  res.json({ success: true, data: booking });
});

// PATCH /api/tech/jobs/:id/status — update job status
techJobsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;
  const { status } = req.body;

  const validTransitions: Record<string, string[]> = {
    confirmed: ["in_progress"],
    in_progress: ["completed"],
  };

  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, technicianId: userId },
  });

  if (!booking) return res.status(404).json({ success: false, error: "Job not found" });

  if (!validTransitions[booking.status]?.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Cannot transition from ${booking.status} to ${status}`,
    });
  }

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      status,
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    },
  });

  res.json({ success: true, data: updated });
});

// PATCH /api/tech/jobs/:id/checklist/:itemId — toggle checklist item
techJobsRouter.patch("/:id/checklist/:itemId", requireAuth, async (req, res) => {
  const { completed } = req.body;
  const item = await prisma.bookingChecklistItem.update({
    where: { id: req.params.itemId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });
  res.json({ success: true, data: item });
});

// PATCH /api/tech/jobs/:id/notes — update tech notes
techJobsRouter.patch("/:id/notes", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;
  const { techNotes } = req.body;
  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { techNotes },
  });
  res.json({ success: true, data: booking });
});
