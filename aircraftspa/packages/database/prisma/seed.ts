import { PrismaClient } from "@prisma/client";
import { aircraftClasses } from "./data/aircraft-classes";
import { seedAirports } from "./data/seed-airports";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding aircraft classes...");
  for (const ac of aircraftClasses) {
    await prisma.aircraftClass.upsert({
      where: { name: ac.name },
      update: { displayName: ac.displayName, sizeMultiplier: ac.sizeMultiplier, sortOrder: ac.sortOrder, icon: ac.icon },
      create: ac,
    });
  }
  console.log(`Seeded ${aircraftClasses.length} aircraft classes`);

  await seedAirports(prisma);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
