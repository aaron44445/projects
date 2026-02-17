import { Router } from "express";
import { prisma } from "@aircraftspa/database";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";

export const customersRouter = Router();

// GET /api/customers — list with search/filter (admin)
customersRouter.get("/", requireAuth, requireRole("manager"), async (req, res) => {
  const businessId = (req as any).businessId;
  const search = req.query.search as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const where: any = { businessId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { bookings: true } },
        bookings: {
          select: { totalPrice: true, scheduledAt: true },
          orderBy: { scheduledAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  const data = customers.map((c) => ({
    ...c,
    totalBookings: c._count.bookings,
    lastBooking: c.bookings[0]?.scheduledAt || null,
    lifetimeValue: 0, // will be calculated
  }));

  res.json({ success: true, data: { customers: data, total, page, limit } });
});

// GET /api/customers/:id — detail with booking history
customersRouter.get("/:id", requireAuth, requireRole("manager"), async (req, res) => {
  const businessId = (req as any).businessId;
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, businessId },
    include: {
      bookings: {
        include: {
          aircraftClass: true,
          service: true,
          location: { include: { airport: true } },
        },
        orderBy: { scheduledAt: "desc" },
      },
    },
  });

  if (!customer) return res.status(404).json({ success: false, error: "Customer not found" });

  const lifetimeValue = customer.bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  res.json({ success: true, data: { ...customer, lifetimeValue } });
});

// POST /api/customers — create
customersRouter.post("/", async (req, res) => {
  const businessId = (req as any).businessId;
  const { email, name, phone } = req.body;

  let customer = await prisma.customer.findFirst({
    where: { businessId, email },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: { businessId, email, name, phone: phone || null },
    });
  }

  res.status(201).json({ success: true, data: customer });
});

// PUT /api/customers/:id — update notes/tags
customersRouter.put("/:id", requireAuth, requireRole("manager"), async (req, res) => {
  const businessId = (req as any).businessId;
  const { notes, tags } = req.body;

  const updated = await prisma.customer.updateMany({
    where: { id: req.params.id, businessId },
    data: { notes, tags },
  });

  res.json({ success: true, data: updated });
});
