import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import {
  CreateProductInput,
  UpdateProductInput,
  paginationSchema,
} from '../schemas/crud.schema.js';

/**
 * List all products for the organization
 */
export async function listProducts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const activeOnly = req.query.active === 'true';
    const lowStock = req.query.lowStock === 'true';

    const where: any = {
      organizationId: req.user.organizationId,
    };

    if (activeOnly) where.isActive = true;
    if (lowStock) {
      where.quantity = { lte: prisma.product.fields.reorderLevel };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate low stock manually since Prisma doesn't support field comparisons
    const productsWithLowStock = products.map((p) => ({
      ...p,
      isLowStock: p.quantity <= p.reorderLevel,
    }));

    res.json({
      data: productsWithLowStock,
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
 * Get a single product by ID
 */
export async function getProduct(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!product) {
      throw new NotFoundError('Product');
    }

    res.json({
      data: {
        ...product,
        isLowStock: product.quantity <= product.reorderLevel,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new product
 */
export async function createProduct(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as CreateProductInput;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        price: data.price,
        cost: data.cost,
        quantity: data.quantity ?? 0,
        reorderLevel: data.reorderLevel ?? 10,
        isActive: data.isActive ?? true,
        organizationId: req.user.organizationId,
      },
    });

    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = req.body as UpdateProductInput;

    // Check if product exists and belongs to org
    const existing = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Product');
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check if product exists and belongs to org
    const existing = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Product');
    }

    await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({ data: { message: 'Product deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

/**
 * Adjust product quantity
 */
export async function adjustQuantity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { adjustment, reason } = req.body as { adjustment: number; reason?: string };

    // Check if product exists and belongs to org
    const existing = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Product');
    }

    const newQuantity = existing.quantity + adjustment;
    if (newQuantity < 0) {
      throw new Error('Cannot reduce quantity below zero');
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { quantity: newQuantity },
    });

    res.json({
      data: {
        ...product,
        previousQuantity: existing.quantity,
        adjustment,
        reason,
      },
    });
  } catch (error) {
    next(error);
  }
}
