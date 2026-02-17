import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { requireAuth } from "../middleware/auth";
import { createConnectedAccount, createAccountLink } from "../services/stripe";
import { setupDefaultBusinessData } from "../services/business-setup";
import { z } from "zod";

export const onboardingRouter = Router();

const onboardingSchema = z.object({
  businessName: z.string().min(2),
  subdomain: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  ownerName: z.string().min(2),
  homeAirportId: z.string().optional(),
  serviceRadiusMiles: z.number().default(100),
});

// POST /api/onboarding — create a new business
onboardingRouter.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;
  const parsed = onboardingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { businessName, subdomain, email, phone, ownerName, homeAirportId, serviceRadiusMiles } = parsed.data;

  try {
    // Check subdomain availability
    const existing = await prisma.business.findUnique({ where: { subdomain } });
    if (existing) {
      return res.status(409).json({ success: false, error: "Subdomain already taken" });
    }

    // Create business + update user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create business
      const business = await tx.business.create({
        data: {
          name: businessName,
          subdomain,
          email,
          phone: phone || null,
          bookingSettings: {
            depositPercent: 25,
            cancellationHours: 24,
            reminderHours: 24,
            rushSameDayMultiplier: 1.5,
            rushNextDayMultiplier: 1.25,
          },
        },
      });

      // Update user as owner of this business
      await tx.user.update({
        where: { id: userId },
        data: {
          businessId: business.id,
          role: "owner",
          name: ownerName,
        },
      });

      // Set up service area if home airport provided
      if (homeAirportId) {
        await tx.serviceArea.create({
          data: {
            businessId: business.id,
            airportId: homeAirportId,
            radiusMiles: serviceRadiusMiles,
            travelFeePerMile: 2.5,
            minimumTravelFee: 50,
            maximumTravelFee: 500,
          },
        });
      }

      return business;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to create business" });
  }
});

// POST /api/onboarding/stripe — start Stripe Connect onboarding
onboardingRouter.post("/stripe", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user?.business) {
      return res.status(400).json({ success: false, error: "Create business first" });
    }

    let stripeAccountId = user.business.stripeAccountId;

    if (!stripeAccountId) {
      const account = await createConnectedAccount(
        user.business.email,
        user.business.name
      );
      stripeAccountId = account.id;
      await prisma.business.update({
        where: { id: user.business.id },
        data: { stripeAccountId },
      });
    }

    const returnUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/onboarding?step=stripe-complete`;
    const accountLink = await createAccountLink(stripeAccountId, returnUrl);

    res.json({ success: true, data: { url: accountLink.url } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to start Stripe onboarding" });
  }
});

// POST /api/onboarding/setup-defaults — create default services/pricing
onboardingRouter.post("/setup-defaults", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessId: true },
    });

    if (!user?.businessId) {
      return res.status(400).json({ success: false, error: "No business found" });
    }

    await setupDefaultBusinessData(user.businessId);

    res.json({ success: true, data: { message: "Default data created" } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Failed to set up defaults" });
  }
});

// GET /api/onboarding/check-subdomain — check if subdomain is available
onboardingRouter.get("/check-subdomain", async (req, res) => {
  const subdomain = (req.query.subdomain as string || "").toLowerCase().trim();

  if (!subdomain || subdomain.length < 3) {
    return res.json({ success: true, data: { available: false, reason: "Too short" } });
  }

  const reserved = ["www", "app", "admin", "api", "help", "support", "blog", "mail", "ftp", "staging", "dev"];
  if (reserved.includes(subdomain)) {
    return res.json({ success: true, data: { available: false, reason: "Reserved" } });
  }

  try {
    const existing = await prisma.business.findUnique({ where: { subdomain } });
    res.json({ success: true, data: { available: !existing } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to check subdomain" });
  }
});
