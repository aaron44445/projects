import { z } from 'zod';

// ============================================
// Client Schemas
// ============================================

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zip: z.string().max(10).optional().nullable(),
  birthday: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  preferredStaffId: z.string().uuid().optional().nullable(),
  communicationPreference: z.enum(['email', 'sms', 'both', 'none']).optional(),
});

export const updateClientSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  zip: z.string().max(10).optional().nullable(),
  birthday: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  preferredStaffId: z.string().uuid().optional().nullable(),
  communicationPreference: z.enum(['email', 'sms', 'both', 'none']).optional(),
  isActive: z.boolean().optional(),
  optedInMarketing: z.boolean().optional(),
  optedInReminders: z.boolean().optional(),
});

export const createClientNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(2000),
});

// ============================================
// Service Schemas
// ============================================

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  bufferMinutes: z.number().int().min(0).max(120).default(0),
  price: z.number().min(0, 'Price must be positive'),
  memberPrice: z.number().min(0).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#C7DCC8'),
  categoryId: z.string().uuid().optional().nullable(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  price: z.number().min(0).optional(),
  memberPrice: z.number().min(0).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const createServiceCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional().nullable(),
});

// ============================================
// Marketing Campaign Schemas
// ============================================

export const createMarketingCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  type: z.enum(['email', 'sms', 'both']),
  subjectLine: z.string().max(200).optional().nullable(),
  message: z.string().min(1, 'Message is required').max(5000),
  audienceFilter: z.string().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
});

export const updateMarketingCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['email', 'sms', 'both']).optional(),
  subjectLine: z.string().max(200).optional().nullable(),
  message: z.string().min(1).max(5000).optional(),
  audienceFilter: z.string().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  status: z.enum(['draft', 'scheduled', 'sent', 'cancelled']).optional(),
});

// ============================================
// Appointment Schemas
// ============================================

export const createAppointmentSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  staffId: z.string().uuid('Invalid staff ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  startTime: z.string().datetime('Invalid start time'),
  notes: z.string().max(1000).optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).default('confirmed'),
});

export const updateAppointmentSchema = z.object({
  clientId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no_show']).optional(),
  notes: z.string().max(1000).optional().nullable(),
  cancellationReason: z.string().max(500).optional().nullable(),
});

// ============================================
// Validation Helper Types
// ============================================

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateClientNoteInput = z.infer<typeof createClientNoteSchema>;

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;

export type CreateMarketingCampaignInput = z.infer<typeof createMarketingCampaignSchema>;
export type UpdateMarketingCampaignInput = z.infer<typeof updateMarketingCampaignSchema>;

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
