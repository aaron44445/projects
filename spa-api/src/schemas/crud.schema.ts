import { z } from 'zod';

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ============================================
// SERVICE SCHEMAS
// ============================================

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
  price: z.number().min(0, 'Price must be positive'),
  isActive: z.boolean().optional().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ============================================
// STAFF SCHEMAS
// ============================================

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  title: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  userId: z.string().optional().nullable(),
  serviceIds: z.array(z.string()).optional().default([]),
});

export const updateStaffSchema = createStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ============================================
// APPOINTMENT SCHEMAS
// ============================================

export const createAppointmentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  staffId: z.string().min(1, 'Staff is required'),
  serviceId: z.string().min(1, 'Service is required'),
  startTime: z.string().datetime('Invalid start time'),
  notes: z.string().optional().nullable(),
});

export const updateAppointmentSchema = z.object({
  clientId: z.string().optional(),
  staffId: z.string().optional(),
  serviceId: z.string().optional(),
  startTime: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0).optional().nullable(),
  quantity: z.number().int().min(0).optional().default(0),
  reorderLevel: z.number().int().min(0).optional().default(10),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ============================================
// TRANSACTION SCHEMAS
// ============================================

const transactionItemSchema = z.object({
  type: z.enum(['service', 'product']),
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

export const createTransactionSchema = z.object({
  clientId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  type: z.enum(['SERVICE', 'PRODUCT', 'REFUND']),
  items: z.array(transactionItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'OTHER']),
  status: z.enum(['PENDING', 'COMPLETED', 'REFUNDED']).optional().default('COMPLETED'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

// ============================================
// COMMON SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});
