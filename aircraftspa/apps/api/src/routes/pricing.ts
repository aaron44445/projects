import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { calculatePrice } from "../services/pricing";
import { calculateDistanceMiles } from "../services/distance";
import { z } from "zod";

export const pricingRouter = Router();

const pricingRequestSchema = z.object({
  aircraftClassId: z.string(),
  serviceId: z.string(),
  addOnIds: z.array(z.string()).default([]),
  airportId: z.string(),
  scheduledDate: z.string().optional(),
});

// POST /api/pricing/calculate — calculate price for a booking configuration
pricingRouter.post("/calculate", async (req, res) => {
  const businessId = (req as any).businessId;
  const parsed = pricingRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { aircraftClassId, serviceId, addOnIds, airportId, scheduledDate } = parsed.data;

  const [aircraftClass, pricingRule, addOns, airport, serviceArea] = await Promise.all([
    prisma.aircraftClass.findUnique({ where: { id: aircraftClassId } }),
    prisma.pricingRule.findFirst({ where: { businessId, aircraftClassId, serviceId } }),
    prisma.addOn.findMany({ where: { id: { in: addOnIds }, businessId } }),
    prisma.airport.findUnique({ where: { id: airportId } }),
    prisma.serviceArea.findFirst({ where: { businessId }, include: { airport: true } }),
  ]);

  if (!aircraftClass || !pricingRule || !airport) {
    return res.status(400).json({ success: false, error: "Invalid configuration" });
  }

  let travelDistanceMiles = 0;
  if (serviceArea) {
    travelDistanceMiles = calculateDistanceMiles(
      serviceArea.airport.latitude, serviceArea.airport.longitude,
      airport.latitude, airport.longitude
    );
  }

  const now = new Date();
  const scheduledAt = scheduledDate ? new Date(scheduledDate) : null;
  const hoursUntil = scheduledAt ? (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity;
  const isRushSameDay = hoursUntil < 24;
  const isRushNextDay = !isRushSameDay && hoursUntil < 48;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { bookingSettings: true },
  });
  const settings = (business?.bookingSettings as any) || {};

  const result = calculatePrice({
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
    isRushSameDay,
    isRushNextDay,
    rushSameDayMultiplier: settings.rushSameDayMultiplier ?? 1.5,
    rushNextDayMultiplier: settings.rushNextDayMultiplier ?? 1.25,
    depositPercent: settings.depositPercent ?? 25,
  });

  res.json({ success: true, data: result });
});
