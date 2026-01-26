// ============================================
// PEACASE - Shared TypeScript Types
// ============================================

// User & Auth Types
export type UserRole = 'admin' | 'manager' | 'staff' | 'receptionist';

export interface User {
  id: string;
  salonId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  certifications?: string;
  commissionRate?: number;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  salonName: string;
  email: string;
  password: string;
  phone?: string;
  timezone?: string;
}

// Salon Types
export type SubscriptionPlan = 'essentials' | 'pro' | 'enterprise';

export type FeatureAddon =
  | 'online_booking'
  | 'payments'
  | 'reminders'
  | 'marketing'
  | 'reports'
  | 'packages'
  | 'gift_cards'
  | 'forms'
  | 'multi_location'
  | 'reviews'
  | 'ai_assistant'
  | 'marketplace'
  | 'payroll';

export interface Salon {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country: string;
  timezone: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  subscriptionPlan: SubscriptionPlan;
  featuresEnabled: FeatureAddon[];
  stripeAccountId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Client Types
export type CommunicationPreference = 'email' | 'sms' | 'both' | 'none';

export interface Client {
  id: string;
  salonId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  birthday?: Date;
  notes?: string;
  preferredStaffId?: string;
  communicationPreference: CommunicationPreference;
  optedInReminders: boolean;
  optedInMarketing: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientNote {
  id: string;
  clientId: string;
  staffId: string;
  content: string;
  createdAt: Date;
}

// Service Types
export interface ServiceCategory {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Service {
  id: string;
  salonId: string;
  categoryId?: string;
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  memberPrice?: number;
  color: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Staff Availability Types
export interface StaffAvailability {
  id: string;
  staffId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:MM format
  endTime: string;
  isAvailable: boolean;
}

export interface TimeOff {
  id: string;
  staffId: string;
  startDate: Date;
  endDate: Date;
  reason?: 'vacation' | 'sick' | 'personal' | 'other';
  notes?: string;
  createdAt: Date;
}

// Appointment Types
export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'no_show' | 'cancelled';
export type AppointmentSource = 'manual' | 'online' | 'widget';

export interface Appointment {
  id: string;
  salonId: string;
  locationId?: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  price: number;
  priceOverride?: number;
  status: AppointmentStatus;
  cancellationReason?: string;
  notes?: string;
  source: AppointmentSource;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
}

export interface AppointmentWithDetails extends Appointment {
  client: Client;
  staff: User;
  service: Service;
}

// Payment Types
export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  salonId: string;
  appointmentId?: string;
  clientId: string;
  amount: number;
  tipAmount: number;
  totalAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentId?: string;
  stripeRefundId?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  refundedAt?: Date;
}

// Location Types (Multi-location add-on)
export interface Location {
  id: string;
  salonId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  timezone?: string;
  hours?: Record<string, string>; // { "mon": "9:00-17:00", ... }
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
}

// Package Types
export type PackageType = 'one_time' | 'recurring';

export interface Package {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  price: number;
  type: PackageType;
  durationDays?: number;
  renewalPrice?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ClientPackage {
  id: string;
  clientId: string;
  packageId: string;
  purchaseDate: Date;
  expirationDate?: Date;
  servicesRemaining: number;
  totalServices: number;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  isActive: boolean;
  createdAt: Date;
}

// Gift Card Types
export type GiftCardStatus = 'active' | 'redeemed' | 'expired' | 'cancelled';

export interface GiftCard {
  id: string;
  salonId: string;
  code: string;
  initialAmount: number;
  balance: number;
  status: GiftCardStatus;
  expiresAt?: Date;
  purchasedAt: Date;
  redeemedAt?: Date;
  purchaserEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
}

// Review Types
export interface Review {
  id: string;
  salonId: string;
  appointmentId: string;
  clientId: string;
  staffId?: string;
  rating: number; // 1-5
  comment?: string;
  isApproved: boolean;
  submittedAt: Date;
  approvedAt?: Date;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  responseText: string;
  respondedById: string;
  respondedAt: Date;
}

// Marketing Types
export type CampaignType = 'email' | 'sms';
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';

export interface MarketingCampaign {
  id: string;
  salonId: string;
  name: string;
  type: CampaignType;
  subjectLine?: string;
  message: string;
  audienceFilter?: Record<string, unknown>;
  status: CampaignStatus;
  scheduledFor?: Date;
  sentAt?: Date;
  recipientsCount?: number;
  openedCount: number;
  clickedCount: number;
  createdAt: Date;
}

// Form Types
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'file'
  | 'signature';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  options?: string[]; // For select, checkbox, radio
}

export interface ConsultationForm {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  createdAt: Date;
}

export interface FormResponse {
  id: string;
  formId: string;
  clientId: string;
  appointmentId?: string;
  responseData: Record<string, unknown>;
  signatureUrl?: string;
  submittedAt: Date;
}

// Commission Types
export interface CommissionRecord {
  id: string;
  salonId: string;
  staffId: string;
  appointmentId: string;
  paymentId: string;
  serviceAmount: number;
  tipAmount: number;
  commissionRate: number;
  commissionAmount: number;
  periodStart?: Date;
  periodEnd?: Date;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard Types
export interface DashboardStats {
  totalClients: number;
  totalAppointments: number;
  revenueThisMonth: number;
  noShowRate: number;
  clientGrowth: number;
  avgRating: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  appointments: number;
}

// Availability Types
export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  staffId?: string;
}

export interface AvailabilityRequest {
  salonId: string;
  serviceId: string;
  staffId?: string;
  date: string; // YYYY-MM-DD
}
