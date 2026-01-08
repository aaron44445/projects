import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import { CreateTransactionInput, paginationSchema } from '../schemas/crud.schema.js';

/**
 * List transactions for the organization
 */
export async function listTransactions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;

    // Optional filters
    const { clientId, type, status, startDate, endDate } = req.query;

    const where: any = {
      organizationId: req.user.organizationId,
    };

    if (clientId) where.clientId = clientId;
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          client: {
            select: { id: true, name: true, email: true },
          },
          appointment: {
            select: { id: true, startTime: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
      include: {
        client: true,
        appointment: {
          include: {
            service: true,
            staff: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    res.json({ data: transaction });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as CreateTransactionInput;

    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          type: data.type,
          items: data.items,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          paymentMethod: data.paymentMethod,
          status: data.status ?? 'COMPLETED',
          clientId: data.clientId,
          appointmentId: data.appointmentId,
          organizationId: req.user.organizationId,
        },
      });

      // Update product quantities for product sales
      if (data.type === 'PRODUCT' && data.status !== 'REFUNDED') {
        for (const item of data.items) {
          if (item.type === 'product') {
            await tx.product.update({
              where: { id: item.id },
              data: {
                quantity: { decrement: item.quantity },
              },
            });
          }
        }
      }

      // Handle refunds - restore product quantities
      if (data.type === 'REFUND') {
        for (const item of data.items) {
          if (item.type === 'product') {
            await tx.product.update({
              where: { id: item.id },
              data: {
                quantity: { increment: item.quantity },
              },
            });
          }
        }
      }

      return newTransaction;
    });

    // Fetch with relations
    const transactionWithRelations = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        client: true,
        appointment: true,
      },
    });

    res.status(201).json({ data: transactionWithRelations });
  } catch (error) {
    next(error);
  }
}

/**
 * Get daily summary
 */
export async function getDailySummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const date = req.query.date
      ? new Date(req.query.date as string)
      : new Date();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: req.user.organizationId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
    });

    const summary = {
      date: date.toISOString().split('T')[0],
      transactionCount: transactions.length,
      totalRevenue: transactions.reduce((sum, t) => sum + Number(t.total), 0),
      totalTax: transactions.reduce((sum, t) => sum + Number(t.tax), 0),
      byType: {
        SERVICE: { count: 0, total: 0 },
        PRODUCT: { count: 0, total: 0 },
        REFUND: { count: 0, total: 0 },
      },
      byPaymentMethod: {
        CASH: { count: 0, total: 0 },
        CARD: { count: 0, total: 0 },
        OTHER: { count: 0, total: 0 },
      },
    };

    for (const t of transactions) {
      summary.byType[t.type].count++;
      summary.byType[t.type].total += Number(t.total);
      summary.byPaymentMethod[t.paymentMethod].count++;
      summary.byPaymentMethod[t.paymentMethod].total += Number(t.total);
    }

    res.json({ data: summary });
  } catch (error) {
    next(error);
  }
}
