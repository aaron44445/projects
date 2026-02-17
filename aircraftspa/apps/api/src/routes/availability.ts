import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { getAvailableSlots } from "../services/scheduling";
import { z } from "zod";

export const availabilityRouter = Router();

const availabilitySchema = z.object({
  date: z.string(),
  serviceId: z.string(),
  aircraftClassId: z.string(),
  addOnIds: z.array(z.string()).default([]),
});

// POST /api/availability — get available slots for a date
availabilityRouter.post("/", async (req, res) => {
  const businessId = (req as any).businessId;
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { date, serviceId, aircraftClassId, addOnIds } = parsed.data;
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  const [service, addOns] = await Promise.all([
    prisma.service.findFirst({ where: { id: serviceId, businessId } }),
    prisma.addOn.findMany({ where: { id: { in: addOnIds }, businessId } }),
  ]);

  if (!service) {
    return res.status(400).json({ success: false, error: "Service not found" });
  }

  const totalDuration = service.baseDurationMinutes + addOns.reduce((sum, a) => sum + a.durationMinutes, 0);

  const crewSchedules = await prisma.crewSchedule.findMany({
    where: {
      businessId,
      available: true,
      OR: [
        { dayOfWeek, date: null },
        { date: targetDate },
      ],
    },
  });

  const startOfDay = new Date(date + "T00:00:00");
  const endOfDay = new Date(date + "T23:59:59");
  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { in: ["pending", "confirmed", "in_progress"] },
    },
    select: {
      technicianId: true,
      scheduledAt: true,
      durationMinutes: true,
    },
  });

  const slots = getAvailableSlots({
    date: targetDate,
    durationMinutes: totalDuration,
    travelBufferMinutes: 30,
    crewSchedules: crewSchedules.map((cs) => ({
      userId: cs.userId,
      startTime: cs.startTime,
      endTime: cs.endTime,
    })),
    existingBookings: existingBookings.map((b) => {
      const start = b.scheduledAt;
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = startMinutes + b.durationMinutes;
      return {
        technicianId: b.technicianId || "",
        startTime: `${Math.floor(startMinutes / 60).toString().padStart(2, "0")}:${(startMinutes % 60).toString().padStart(2, "0")}`,
        endTime: `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`,
        bufferMinutes: 30,
      };
    }),
  });

  res.json({ success: true, data: slots });
});
