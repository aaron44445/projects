import { prisma } from "@aircraftspa/database";

export async function setupDefaultBusinessData(businessId: string): Promise<void> {
  // 1. Create default services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        businessId,
        name: "Interior Detail",
        type: "interior",
        description: "Complete interior cleaning including vacuum, wipe-down, leather conditioning, and window cleaning.",
        baseDurationMinutes: 120,
        active: true,
        sortOrder: 1,
      },
    }),
    prisma.service.create({
      data: {
        businessId,
        name: "Exterior Wash",
        type: "exterior",
        description: "Full exterior wash including fuselage, wings, belly, and wheel wells.",
        baseDurationMinutes: 180,
        active: true,
        sortOrder: 2,
      },
    }),
    prisma.service.create({
      data: {
        businessId,
        name: "Full Detail",
        type: "full_detail",
        description: "Complete interior and exterior service for a showroom-ready aircraft.",
        baseDurationMinutes: 300,
        active: true,
        sortOrder: 3,
      },
    }),
  ]);

  // 2. Create default add-ons
  await Promise.all([
    prisma.addOn.create({
      data: {
        businessId,
        name: "Carpet Shampoo",
        description: "Deep carpet cleaning and stain removal",
        price: 150,
        durationMinutes: 45,
        useAircraftMultiplier: true,
        applicableTo: ["interior", "full_detail"],
        active: true,
        sortOrder: 1,
      },
    }),
    prisma.addOn.create({
      data: {
        businessId,
        name: "Leather Conditioning",
        description: "Premium leather treatment and conditioning",
        price: 200,
        durationMinutes: 30,
        useAircraftMultiplier: true,
        applicableTo: ["interior", "full_detail"],
        active: true,
        sortOrder: 2,
      },
    }),
    prisma.addOn.create({
      data: {
        businessId,
        name: "Brightwork Polish",
        description: "Metal and chrome polishing for exterior trim",
        price: 250,
        durationMinutes: 60,
        useAircraftMultiplier: true,
        applicableTo: ["exterior", "full_detail"],
        active: true,
        sortOrder: 3,
      },
    }),
    prisma.addOn.create({
      data: {
        businessId,
        name: "Ceramic Coating",
        description: "Long-lasting ceramic protection for the exterior",
        price: 500,
        durationMinutes: 120,
        useAircraftMultiplier: true,
        applicableTo: ["exterior", "full_detail"],
        active: true,
        sortOrder: 4,
      },
    }),
    prisma.addOn.create({
      data: {
        businessId,
        name: "Engine Wash",
        description: "Careful engine compartment cleaning and degreasing",
        price: 300,
        durationMinutes: 60,
        useAircraftMultiplier: false,
        applicableTo: ["exterior", "full_detail"],
        active: true,
        sortOrder: 5,
      },
    }),
    prisma.addOn.create({
      data: {
        businessId,
        name: "Odor Removal",
        description: "Professional deodorizing and air quality treatment",
        price: 100,
        durationMinutes: 30,
        useAircraftMultiplier: false,
        applicableTo: ["interior", "full_detail"],
        active: true,
        sortOrder: 6,
      },
    }),
  ]);

  // 3. Create default pricing rules for each aircraft class x service
  const aircraftClasses = await prisma.aircraftClass.findMany();

  // Base prices per service type
  const basePrices: Record<string, number> = {
    interior: 350,
    exterior: 500,
    full_detail: 750,
  };

  for (const service of services) {
    const basePrice = basePrices[service.type] || 500;

    for (const ac of aircraftClasses) {
      await prisma.pricingRule.create({
        data: {
          businessId,
          serviceId: service.id,
          aircraftClassId: ac.id,
          basePrice,
        },
      });
    }
  }

  // 4. Create default checklist templates
  await Promise.all([
    prisma.checklistTemplate.create({
      data: {
        businessId,
        serviceId: services[0].id, // Interior
        name: "Interior Detail Checklist",
        items: [
          { order: 1, text: "Remove all trash and personal items", required: true },
          { order: 2, text: "Vacuum all carpet and upholstery", required: true },
          { order: 3, text: "Clean and condition leather seats", required: true },
          { order: 4, text: "Wipe down all hard surfaces", required: true },
          { order: 5, text: "Clean all windows (interior)", required: true },
          { order: 6, text: "Clean lavatory (if applicable)", required: false },
          { order: 7, text: "Clean galley area (if applicable)", required: false },
          { order: 8, text: "Deodorize cabin", required: true },
          { order: 9, text: "Final inspection", required: true },
        ],
      },
    }),
    prisma.checklistTemplate.create({
      data: {
        businessId,
        serviceId: services[1].id, // Exterior
        name: "Exterior Wash Checklist",
        items: [
          { order: 1, text: "Pre-rinse fuselage", required: true },
          { order: 2, text: "Apply soap and scrub fuselage", required: true },
          { order: 3, text: "Clean wings (top and bottom)", required: true },
          { order: 4, text: "Clean tail section", required: true },
          { order: 5, text: "Clean belly", required: true },
          { order: 6, text: "Clean wheel wells and landing gear", required: true },
          { order: 7, text: "Clean windows (exterior)", required: true },
          { order: 8, text: "Rinse and dry", required: true },
          { order: 9, text: "Apply protectant/wax", required: false },
          { order: 10, text: "Final inspection", required: true },
        ],
      },
    }),
    prisma.checklistTemplate.create({
      data: {
        businessId,
        serviceId: services[2].id, // Full Detail
        name: "Full Detail Checklist",
        items: [
          { order: 1, text: "Complete interior checklist", required: true },
          { order: 2, text: "Complete exterior checklist", required: true },
          { order: 3, text: "Polish all brightwork", required: true },
          { order: 4, text: "Detail engine cowlings", required: false },
          { order: 5, text: "Take before/after photos", required: true },
          { order: 6, text: "Final walkthrough with client (if present)", required: false },
        ],
      },
    }),
  ]);

  console.log(`[BusinessSetup] Default data created for business ${businessId}`);
}
