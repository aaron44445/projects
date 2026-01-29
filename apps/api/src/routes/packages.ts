import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireAddon } from '../middleware/subscription.js';
import { createPackageCheckoutSession } from '../services/payments.js';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';

const router = Router();

// All packages routes require the memberships add-on
router.use(authenticate, requireAddon('memberships'));

// GET /api/v1/packages
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.PackageWhereInput = {
    ...withSalonId(req.user!.salonId),
    isActive: true,
  };

  const packages = await prisma.package.findMany({
    where,
    include: { packageServices: { include: { service: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: packages });
}));

// POST /api/v1/packages
router.post('/', authenticate, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const { name, description, price, type, durationDays, renewalPrice, serviceIds } = req.body;

  const pkg = await prisma.package.create({
    data: {
      salonId: req.user!.salonId,
      name,
      description,
      price,
      type: type || 'one_time',
      durationDays,
      renewalPrice,
      packageServices: serviceIds ? {
        create: serviceIds.map((serviceId: string) => ({
          serviceId,
          quantity: 1,
        })),
      } : undefined,
    },
    include: { packageServices: { include: { service: true } } },
  });

  res.status(201).json({ success: true, data: pkg });
}));

// GET /api/v1/packages/members
router.get('/members', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.ClientPackageWhereInput = {
    package: withSalonId(req.user!.salonId),
    isActive: true,
  };

  const members = await prisma.clientPackage.findMany({
    where,
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      package: { select: { name: true, type: true, price: true } },
    },
    orderBy: { purchaseDate: 'desc' },
  });

  res.json({ success: true, data: members });
}));

// POST /api/v1/packages/:id/checkout - Create Stripe checkout session
router.post('/:id/checkout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.body;

  const where: Prisma.PackageWhereInput = {
    id: req.params.id,
    ...withSalonId(req.user!.salonId),
  };

  const pkg = await prisma.package.findFirst({ where });

  if (!pkg) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } });
  }

  const session = await createPackageCheckoutSession({
    packageId: pkg.id,
    packageName: pkg.name,
    price: pkg.price,
    clientId,
    salonId: req.user!.salonId,
    successUrl: `${env.CORS_ORIGIN}/packages/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${env.CORS_ORIGIN}/packages`,
  });

  res.json({ success: true, data: { checkoutUrl: session.url, sessionId: session.id } });
}));

// POST /api/v1/packages/:id/purchase - Direct purchase (admin assigns)
router.post('/:id/purchase', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { clientId } = req.body;

  const where: Prisma.PackageWhereInput = {
    id: req.params.id,
    ...withSalonId(req.user!.salonId),
  };

  const pkg = await prisma.package.findFirst({
    where,
    include: { packageServices: true },
  });

  if (!pkg) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } });
  }

  const totalServices = pkg.packageServices.reduce((sum, ps) => sum + ps.quantity, 0);

  const clientPackage = await prisma.clientPackage.create({
    data: {
      clientId,
      packageId: pkg.id,
      purchaseDate: new Date(),
      expirationDate: pkg.durationDays ? new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000) : null,
      servicesRemaining: totalServices,
      totalServices,
    },
    include: { client: true, package: true },
  });

  res.status(201).json({ success: true, data: clientPackage });
}));

// DELETE /api/v1/packages/:id
router.delete('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.PackageWhereInput = {
    id: req.params.id,
    ...withSalonId(req.user!.salonId),
  };

  const pkg = await prisma.package.findFirst({ where });

  if (!pkg) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Package not found' } });
  }

  await prisma.package.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, data: { deleted: true } });
}));

export { router as packagesRouter };
