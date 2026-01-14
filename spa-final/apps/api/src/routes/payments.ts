import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation schema
const createPaymentSchema = z.object({
  appointmentId: z.string(),
  clientId: z.string(),
  amount: z.number().positive(),
  tipAmount: z.number().min(0).default(0),
  method: z.string().optional(),
  status: z.string().default('completed'),
});

// ============================================
// POST /api/v1/payments
// Create payment and commission record
// ============================================
router.post('/', authenticate, async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = createPaymentSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payment data',
        details: validationResult.error.errors,
      },
    });
  }

  const { appointmentId, clientId, amount, tipAmount, method, status } = validationResult.data;

  // Get appointment details including staff
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      salonId: req.user!.salonId,
    },
    include: {
      staff: {
        select: { id: true, commissionRate: true },
      },
    },
  });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Appointment not found',
      },
    });
  }

  // Calculate total amount
  const totalAmount = amount + tipAmount;

  try {
    // Create payment and commission record in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          salonId: req.user!.salonId,
          appointmentId,
          clientId,
          amount,
          tipAmount,
          totalAmount,
          method,
          status,
        },
      });

      // Create commission record if staff has commission rate
      let commission = null;
      if (appointment.staff.commissionRate) {
        const commissionRate = appointment.staff.commissionRate;
        const commissionAmount = (amount * commissionRate) + tipAmount;

        commission = await tx.commissionRecord.create({
          data: {
            salonId: req.user!.salonId,
            staffId: appointment.staffId,
            appointmentId,
            paymentId: payment.id,
            serviceAmount: amount,
            tipAmount,
            commissionRate,
            commissionAmount,
          },
        });
      }

      return { payment, commission };
    });

    res.status(201).json({
      success: true,
      data: {
        payment: result.payment,
        commission: result.commission,
      },
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_ERROR',
        message: 'Failed to create payment',
      },
    });
  }
});

// ============================================
// GET /api/v1/payments
// List payments with filters
// ============================================
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { dateFrom, dateTo, status, page = '1', pageSize = '50' } = req.query;

  const where = {
    salonId: req.user!.salonId,
    ...(dateFrom && { createdAt: { gte: new Date(dateFrom as string) } }),
    ...(dateTo && { createdAt: { lte: new Date(dateTo as string) } }),
    ...(status && { status: status as string }),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        appointment: {
          include: {
            service: { select: { name: true } },
            staff: { select: { firstName: true, lastName: true } },
          },
        },
        client: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: payments,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      totalPages: Math.ceil(total / parseInt(pageSize as string)),
    },
  });
});

// ============================================
// GET /api/v1/payments/:id
// Get payment details
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const payment = await prisma.payment.findFirst({
    where: {
      id: req.params.id,
      salonId: req.user!.salonId,
    },
    include: {
      appointment: {
        include: {
          service: true,
          staff: { select: { firstName: true, lastName: true } },
        },
      },
      client: true,
      commissionRecords: true,
    },
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Payment not found',
      },
    });
  }

  res.json({
    success: true,
    data: payment,
  });
});

export { router as paymentsRouter };
