import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

export async function seedAirports(prisma: PrismaClient) {
  const csvPath = path.join(__dirname, "airports.csv");

  if (!fs.existsSync(csvPath)) {
    console.log("Downloading airport data from OurAirports...");
    const response = await fetch("https://davidmegginson.github.io/ourairports-data/airports.csv");
    const text = await response.text();
    fs.writeFileSync(csvPath, text);
  }

  const csv = fs.readFileSync(csvPath, "utf-8");
  const lines = csv.split("\n").slice(1);

  const airports = lines
    .map((line) => {
      const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());
      return {
        icaoCode: cols[1] || null,
        iataCode: cols[13] || null,
        name: cols[3],
        type: cols[2],
        latitude: parseFloat(cols[4]),
        longitude: parseFloat(cols[5]),
        elevation: cols[6] ? parseFloat(cols[6]) : null,
        country: cols[8],
        city: cols[10],
        state: cols[9],
      };
    })
    .filter((a) =>
      a.icaoCode &&
      a.name &&
      !isNaN(a.latitude) &&
      !isNaN(a.longitude) &&
      ["large_airport", "medium_airport", "small_airport", "heliport"].includes(a.type || "")
    );

  console.log(`Seeding ${airports.length} airports...`);

  const chunkSize = 500;
  for (let i = 0; i < airports.length; i += chunkSize) {
    const chunk = airports.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((a) =>
        prisma.airport.upsert({
          where: { icaoCode: a.icaoCode! },
          update: {},
          create: {
            icaoCode: a.icaoCode,
            iataCode: a.iataCode || null,
            name: a.name,
            type: a.type,
            latitude: a.latitude,
            longitude: a.longitude,
            elevation: a.elevation,
            country: a.country,
            city: a.city || null,
            state: a.state || null,
          },
        })
      )
    );
    console.log(`  Seeded ${Math.min(i + chunkSize, airports.length)}/${airports.length}`);
  }
}
