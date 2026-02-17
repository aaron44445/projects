import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { resolveTenant } from "../middleware/tenant";
import { calculatePrice } from "../services/pricing";
import { calculateDistanceMiles } from "../services/distance";
import { z } from "zod";
import { generateBookingCalendarInvite } from "../services/calendar";

export const bookingsRouter = Router();

const createBookingSchema = z.object({
  aircraftClassId: z.string(),
  tailNumber: z.string().optional(),
  serviceId: z.string(),
  addOnIds: z.array(z.string()).default([]),
  airportId: z.string(),
  locationType: z.enum(["hangar", "ramp"]).default("hangar"),
  locationNotes: z.string().optional(),
  scheduledAt: z.string(), // ISO datetime
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerNotes: z.string().optional(),
});

// POST /api/bookings — create a new booking
bookingsRouter.post("/", resolveTenant, async (req, res) => {
  const businessId = (req as any).businessId;
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const data = parsed.data;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Find or create customer
      let customer = await tx.customer.findFirst({
        where: { businessId, email: data.customerEmail },
      });
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            businessId,
            email: data.customerEmail,
            name: data.customerName,
            phone: data.customerPhone || null,
          },
        });
      }

      // 2. Get pricing data
      const [aircraftClass, pricingRule, addOns, airport, serviceArea, service] = await Promise.all([
        tx.aircraftClass.findUnique({ where: { id: data.aircraftClassId } }),
        tx.pricingRule.findFirst({ where: { businessId, aircraftClassId: data.aircraftClassId, serviceId: data.serviceId } }),
        tx.addOn.findMany({ where: { id: { in: data.addOnIds }, businessId } }),
        tx.airport.findUnique({ where: { id: data.airportId } }),
        tx.serviceArea.findFirst({ where: { businessId }, include: { airport: true } }),
        tx.service.findFirst({ where: { id: data.serviceId, businessId } }),
      ]);

      if (!aircraftClass || !pricingRule || !airport || !service) {
        throw new Error("Invalid booking configuration");
      }

      // 3. Calculate pricing
      let travelDistanceMiles = 0;
      if (serviceArea) {
        travelDistanceMiles = calculateDistanceMiles(
          serviceArea.airport.latitude, serviceArea.airport.longitude,
          airport.latitude, airport.longitude
        );
      }

      const scheduledDate = new Date(data.scheduledAt);
      const now = new Date();
      const hoursUntil = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      const business = await tx.business.findUnique({
        where: { id: businessId },
        select: { bookingSettings: true },
      });
      const settings = (business?.bookingSettings as any) || {};

      const pricing = calculatePrice({
        basePrice: pricingRule.basePrice,
        aircraftSizeMultiplier: aircraftClass.sizeMultiplier,
        addOns: addOns.map((a) => ({
          name: a.name,
          price: a.price,
          useAircraftMultiplier: a.useAircraftMultiplier,
        })),
        travelDistanceMiles,
        travelFeePerMile: serviceArea?.travelFeePerMile ?? 0,
        minimumTravelFee: serviceArea?.minimumTravelFee ?? 0,
        maximumTravelFee: serviceArea?.maximumTravelFee ?? null,
        isRushSameDay: hoursUntil < 24,
        isRushNextDay: hoursUntil >= 24 && hoursUntil < 48,
        rushSameDayMultiplier: settings.rushSameDayMultiplier ?? 1.5,
        rushNextDayMultiplier: settings.rushNextDayMultiplier ?? 1.25,
        depositPercent: settings.depositPercent ?? 25,
      });

      // 4. Calculate duration
      const totalDuration = service.baseDurationMinutes + addOns.reduce((sum, a) => sum + a.durationMinutes, 0);

      // 5. Create booking
      const newBooking = await tx.booking.create({
        data: {
          businessId,
          customerId: customer.id,
          aircraftClassId: data.aircraftClassId,
          tailNumber: data.tailNumber || null,
          serviceId: data.serviceId,
          scheduledAt: scheduledDate,
          durationMinutes: totalDuration,
          status: "pending",
          totalPrice: pricing.totalPrice,
          depositAmount: pricing.depositAmount,
          rushSurcharge: pricing.rushSurcharge,
          customerNotes: data.customerNotes || null,
          location: {
            create: {
              airportId: data.airportId,
              locationType: data.locationType,
              locationNotes: data.locationNotes || null,
              travelDistanceMiles,
              travelFee: pricing.travelFee,
            },
          },
          pricingBreakdown: {
            create: {
              basePrice: pricing.basePrice,
              addOnsTotal: pricing.addOnsTotal,
              travelFee: pricing.travelFee,
              rushSurcharge: pricing.rushSurcharge,
              subtotal: pricing.subtotal,
              depositPercent: pricing.depositPercent,
              depositAmount: pricing.depositAmount,
              totalPrice: pricing.totalPrice,
              details: {
                aircraftMultiplier: aircraftClass.sizeMultiplier,
                addOnItems: pricing.addOnItems,
              },
            },
          },
          addOns: {
            create: addOns.map((a) => ({
              addOnId: a.id,
              price: a.useAircraftMultiplier ? a.price * aircraftClass.sizeMultiplier : a.price,
            })),
          },
        },
        include: {
          customer: true,
          aircraftClass: true,
          service: true,
          location: { include: { airport: true } },
          pricingBreakdown: true,
          addOns: { include: { addOn: true } },
        },
      });

      return newBooking;
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/bookings — list bookings (admin+)
bookingsRouter.get("/", requireAuth, requireRole("manager"), async (req, res) => {
  const businessId = (req as any).businessId;
  const status = req.query.status as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const where: any = { businessId };
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: true,
        aircraftClass: true,
        service: true,
        location: { include: { airport: true } },
        technician: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({ success: true, data: { bookings, total, page, limit } });
});

// GET /api/bookings/:id — get booking detail
bookingsRouter.get("/:id", async (req, res) => {
  const businessId = (req as any).businessId;
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, businessId },
    include: {
      customer: true,
      aircraftClass: true,
      service: true,
      location: { include: { airport: true } },
      technician: { select: { id: true, name: true, phone: true } },
      pricingBreakdown: true,
      addOns: { include: { addOn: true } },
      photos: true,
      checklistItems: { orderBy: { sortOrder: "asc" } },
      payments: true,
    },
  });

  if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });
  res.json({ success: true, data: booking });
});

// PATCH /api/bookings/:id/status — update status
bookingsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const businessId = (req as any).businessId;
  const { status } = req.body;
  const validTransitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["in_progress", "cancelled"],
    in_progress: ["completed"],
  };

  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, businessId },
  });

  if (!booking) return res.status(404).json({ success: false, error: "Booking not found" });

  const allowed = validTransitions[booking.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, error: `Cannot transition from ${booking.status} to ${status}` });
  }

  const updateData: any = { status };
  if (status === "completed") updateData.completedAt = new Date();
  if (status === "cancelled") updateData.cancelledAt = new Date();

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: updateData,
    include: { customer: true, service: true, aircraftClass: true },
  });

  res.json({ success: true, data: updated });
});

// PATCH /api/bookings/:id/assign — assign technician
bookingsRouter.patch("/:id/assign", requireAuth, requireRole("manager"), async (req, res) => {
  const businessId = (req as any).businessId;
  const { technicianId } = req.body;

  const tech = await prisma.user.findFirst({
    where: { id: technicianId, businessId, role: "technician", active: true },
  });
  if (!tech) return res.status(400).json({ success: false, error: "Technician not found" });

  const updated = await prisma.booking.updateMany({
    where: { id: req.params.id, businessId },
    data: { technicianId },
  });

  res.json({ success: true, data: updated });
});

// GET /api/bookings/:id/calendar — download .ics file
bookingsRouter.get("/:id/calendar", async (req, res) => {
  const businessId = (req as any).businessId;
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, businessId },
    include: {
      service: true,
      aircraftClass: true,
      customer: true,
      location: { include: { airport: true } },
      technician: true,
    },
  });

  if (!booking)
    return res
      .status(404)
      .json({ success: false, error: "Booking not found" });

  // Get business name
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true },
  });

  const icsContent = generateBookingCalendarInvite({
    ...booking,
    technician: booking.technician
      ? { name: booking.technician.name, email: booking.technician.email }
      : null,
    businessName: business?.name,
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="booking-${booking.id}.ics"`
  );
  res.send(icsContent);
});
