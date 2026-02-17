import { Router } from "express";
import { prisma } from "@aircraftspa/database";

export const airportRouter = Router();

// GET /api/airports/search?q=KTEB&limit=10
airportRouter.get("/search", async (req, res) => {
  const query = (req.query.q as string || "").trim();
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  if (query.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const airports = await prisma.airport.findMany({
    where: {
      OR: [
        { icaoCode: { startsWith: query.toUpperCase(), mode: "insensitive" } },
        { iataCode: { startsWith: query.toUpperCase(), mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: [
      { type: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      icaoCode: true,
      iataCode: true,
      name: true,
      city: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
      type: true,
    },
  });

  res.json({ success: true, data: airports });
});
