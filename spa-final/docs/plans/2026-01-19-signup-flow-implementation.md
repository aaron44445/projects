# Signup Flow Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the broken signup flow with a streamlined flow that collects essentials upfront, skips email verification blocking, requires payment before dashboard access, and offers optional setup steps.

**Architecture:** Modify Prisma schema to add `businessType` and `onboardingComplete` fields to Salon. Rewrite signup page with 6 fields (no verification screen). Rebuild onboarding wizard with new step order: Business Info → Payment → Hours → Services → Optional Checklist → Complete. Add OnboardingGuard to prevent dashboard access before onboarding is complete.

**Tech Stack:** Next.js 14, React, TypeScript, Prisma, Express.js, Stripe, TailwindCSS

---

## Task 1: Update Prisma Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add new fields to Salon model**

Add after line 40 (after `isActive` field):

```prisma
  businessType        String?   @map("business_type")
  onboardingComplete  Boolean   @default(false) @map("onboarding_complete")
  onboardingStep      Int       @default(1) @map("onboarding_step")
```

**Step 2: Generate Prisma client**

Run: `pnpm --filter @peacase/database exec prisma generate`
Expected: "Generated Prisma Client"

**Step 3: Create and apply migration**

Run: `pnpm --filter @peacase/database exec prisma migrate dev --name add_onboarding_fields`
Expected: Migration created and applied successfully

**Step 4: Commit**

```bash
git add packages/database/prisma/schema.prisma packages/database/prisma/migrations
git commit -m "feat(db): add businessType and onboarding tracking fields to Salon"
```

---

## Task 2: Update Registration API Endpoint

**Files:**
- Modify: `apps/api/src/routes/auth.ts`

**Step 1: Update register schema to accept new fields**

Replace the `registerSchema` (lines 61-67) with:

```typescript
const registerSchema = z.object({
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(1),
  businessName: z.string().min(2),
  businessType: z.enum(['salon', 'spa', 'barbershop', 'med_spa', 'nail_salon', 'massage_studio', 'other']),
});
```

**Step 2: Update register handler to use new fields**

In the register handler (around line 119), update the salon creation:

```typescript
// Create salon first
const salon = await prisma.salon.create({
  data: {
    name: data.businessName,
    slug,
    email: data.email,
    phone: data.phone,
    businessType: data.businessType,
    onboardingComplete: false,
    onboardingStep: 1,
  },
});

// Parse owner name into first/last
const nameParts = data.ownerName.trim().split(' ');
const firstName = nameParts[0] || 'Owner';
const lastName = nameParts.slice(1).join(' ') || '';

// Create admin user
const user = await prisma.user.create({
  data: {
    salonId: salon.id,
    email: data.email,
    passwordHash,
    firstName,
    lastName,
    role: 'admin',
    emailVerified: false,
  },
});
```

**Step 3: Remove verification email sending from registration**

Comment out or remove the verification email block (lines 187-198). Registration should complete without sending email.

**Step 4: Update response to include businessType**

Update the response (around line 200) to include:

```typescript
salon: {
  id: salon.id,
  name: salon.name,
  slug: salon.slug,
  businessType: salon.businessType,
  onboardingComplete: salon.onboardingComplete,
  onboardingStep: salon.onboardingStep,
},
```

**Step 5: Test registration endpoint**

Run: `curl -X POST http://localhost:3001/api/v1/auth/register -H "Content-Type: application/json" -d '{"ownerName":"Test Owner","email":"test@example.com","password":"password123","phone":"5551234567","businessName":"Test Salon","businessType":"salon"}'`
Expected: 201 response with user, salon (including businessType), and tokens

**Step 6: Commit**

```bash
git add apps/api/src/routes/auth.ts
git commit -m "feat(api): update register endpoint with new signup fields"
```

---

## Task 3: Create Onboarding API Endpoints

**Files:**
- Create: `apps/api/src/routes/onboarding.ts`
- Modify: `apps/api/src/index.ts` (to register routes)

**Step 1: Create onboarding routes file**

```typescript
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/onboarding/status
router.get('/status', async (req: Request, res: Response) => {
  const salon = await prisma.salon.findUnique({
    where: { id: req.salonId },
    select: {
      onboardingComplete: true,
      onboardingStep: true,
      businessType: true,
      name: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      phone: true,
      email: true,
      website: true,
    },
  });

  res.json({
    success: true,
    data: salon,
  });
});

// POST /api/v1/onboarding/business-info
const businessInfoSchema = z.object({
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

router.post('/business-info', async (req: Request, res: Response) => {
  try {
    const data = businessInfoSchema.parse(req.body);

    const salon = await prisma.salon.update({
      where: { id: req.salonId },
      data: {
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        website: data.website || null,
        onboardingStep: 2,
      },
    });

    res.json({ success: true, data: { step: 2 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() },
      });
    }
    throw error;
  }
});

// POST /api/v1/onboarding/working-hours
const workingHoursSchema = z.object({
  hours: z.array(z.object({
    day: z.string(),
    isOpen: z.boolean(),
    open: z.string(),
    close: z.string(),
  })),
});

router.post('/working-hours', async (req: Request, res: Response) => {
  try {
    const data = workingHoursSchema.parse(req.body);

    // Get the admin user for this salon to store availability
    const adminUser = await prisma.user.findFirst({
      where: { salonId: req.salonId, role: 'admin' },
    });

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'Admin user not found' },
      });
    }

    // Delete existing availability and create new
    await prisma.staffAvailability.deleteMany({
      where: { staffId: adminUser.id },
    });

    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6,
    };

    for (const hour of data.hours) {
      await prisma.staffAvailability.create({
        data: {
          staffId: adminUser.id,
          dayOfWeek: dayMap[hour.day] ?? 0,
          startTime: hour.open,
          endTime: hour.close,
          isAvailable: hour.isOpen,
        },
      });
    }

    await prisma.salon.update({
      where: { id: req.salonId },
      data: { onboardingStep: 4 },
    });

    res.json({ success: true, data: { step: 4 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() },
      });
    }
    throw error;
  }
});

// POST /api/v1/onboarding/services
const servicesSchema = z.object({
  services: z.array(z.object({
    name: z.string().min(1),
    duration: z.number().min(15),
    price: z.number().min(0),
    category: z.string().optional(),
  })).min(1),
});

router.post('/services', async (req: Request, res: Response) => {
  try {
    const data = servicesSchema.parse(req.body);

    // Create services
    for (const service of data.services) {
      await prisma.service.create({
        data: {
          salonId: req.salonId!,
          name: service.name,
          durationMinutes: service.duration,
          price: service.price,
        },
      });
    }

    await prisma.salon.update({
      where: { id: req.salonId },
      data: { onboardingStep: 5 },
    });

    res.json({ success: true, data: { step: 5 } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.flatten() },
      });
    }
    throw error;
  }
});

// POST /api/v1/onboarding/complete
router.post('/complete', async (req: Request, res: Response) => {
  await prisma.salon.update({
    where: { id: req.salonId },
    data: {
      onboardingComplete: true,
      onboardingStep: 6,
    },
  });

  res.json({
    success: true,
    data: { message: 'Onboarding complete', onboardingComplete: true },
  });
});

export { router as onboardingRouter };
```

**Step 2: Register onboarding routes in main API**

In `apps/api/src/index.ts`, add import and route registration:

```typescript
import { onboardingRouter } from './routes/onboarding.js';

// Add after other route registrations
app.use('/api/v1/onboarding', onboardingRouter);
```

**Step 3: Test onboarding status endpoint**

Run: `curl -X GET http://localhost:3001/api/v1/onboarding/status -H "Authorization: Bearer <token>"`
Expected: 200 response with salon onboarding data

**Step 4: Commit**

```bash
git add apps/api/src/routes/onboarding.ts apps/api/src/index.ts
git commit -m "feat(api): add onboarding API endpoints"
```

---

## Task 4: Update AuthContext for New Flow

**Files:**
- Modify: `apps/web/src/contexts/AuthContext.tsx`

**Step 1: Update Salon interface to include onboarding fields**

Update the `Salon` interface (around line 19) to add:

```typescript
export interface Salon {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  timezone: string;
  currency: string;
  logo?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  businessType?: string;
  onboardingComplete?: boolean;
  onboardingStep?: number;
}
```

**Step 2: Update register function signature and call**

Update the register function (around line 214) to accept new parameters:

```typescript
const register = async (
  ownerName: string,
  email: string,
  password: string,
  phone: string,
  businessName: string,
  businessType: string
): Promise<{ requiresVerification: boolean }> => {
  const response = await api.post<RegisterResponse>('/auth/register', {
    ownerName,
    email,
    password,
    phone,
    businessName,
    businessType,
  });

  if (response.success && response.data) {
    const { user: userData, salon: salonData, tokens } = response.data;

    storeTokens(tokens);
    setUser(userData);
    setSalon(salonData);

    return { requiresVerification: false }; // No longer blocking on verification
  } else {
    throw new ApiError('REGISTER_FAILED', 'Registration failed. Please try again.');
  }
};
```

**Step 3: Update AuthContextType interface**

Update the register type in the interface:

```typescript
register: (ownerName: string, email: string, password: string, phone: string, businessName: string, businessType: string) => Promise<{ requiresVerification: boolean }>;
```

**Step 4: Commit**

```bash
git add apps/web/src/contexts/AuthContext.tsx
git commit -m "feat(web): update AuthContext for new signup flow"
```

---

## Task 5: Rewrite Signup Page

**Files:**
- Modify: `apps/web/src/app/signup/page.tsx`

**Step 1: Replace entire signup page**

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  Phone,
  User,
  Check,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const businessTypes = [
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'massage_studio', label: 'Massage Studio' },
  { value: 'other', label: 'Other' },
];

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ownerName.trim() || formData.ownerName.trim().length < 2) {
      newErrors.ownerName = 'Owner name is required (at least 2 characters)';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.businessName.trim() || formData.businessName.trim().length < 2) {
      newErrors.businessName = 'Business name is required (at least 2 characters)';
    }

    if (!formData.businessType) {
      newErrors.businessType = 'Please select a business type';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await register(
        formData.ownerName,
        formData.email,
        formData.password,
        formData.phone,
        formData.businessName,
        formData.businessType
      );

      // Go directly to onboarding - no verification screen
      router.push('/onboarding');
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ submit: err.message });
      } else {
        setErrors({ submit: 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFieldValid = (field: string) => {
    const value = formData[field as keyof typeof formData];
    if (!value) return false;

    switch (field) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'password':
        return value.length >= 8;
      case 'ownerName':
      case 'businessName':
        return value.trim().length >= 2;
      default:
        return value.trim().length > 0;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-soft-peach/30 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-soft-lavender/20 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-display font-bold text-charcoal">Peacase</span>
      </Link>

      {/* Signup Card */}
      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-card-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-xl bg-sage/10 text-sage mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
              Create your account
            </h1>
            <p className="text-charcoal/60">
              Get started with Peacase in minutes
            </p>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {errors.submit}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Owner Name */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-charcoal mb-2">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="text"
                  id="ownerName"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Jane Smith"
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.ownerName ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                {isFieldValid('ownerName') && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {errors.ownerName && <p className="mt-1.5 text-sm text-error">{errors.ownerName}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.email ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                {isFieldValid('email') && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {errors.email && <p className="mt-1.5 text-sm text-error">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.phone ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                {isFieldValid('phone') && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {errors.phone && <p className="mt-1.5 text-sm text-error">{errors.phone}</p>}
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-charcoal mb-2">
                Business Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="text"
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Serenity Spa & Salon"
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.businessName ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                {isFieldValid('businessName') && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {errors.businessName && <p className="mt-1.5 text-sm text-error">{errors.businessName}</p>}
            </div>

            {/* Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-charcoal mb-2">
                Business Type
              </label>
              <select
                id="businessType"
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className={`w-full px-4 py-3 rounded-lg border bg-white/50 text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                  errors.businessType ? 'border-error' : 'border-charcoal/10'
                }`}
              >
                <option value="">Select your business type</option>
                {businessTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.businessType && <p className="mt-1.5 text-sm text-error">{errors.businessType}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.password ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-sm text-error">{errors.password}</p>}
              {formData.password.length >= 8 && (
                <p className="mt-1.5 text-sm text-success flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Password strength: Good
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-sage text-white font-semibold hover:bg-sage-dark hover:shadow-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Trust Indicator */}
          <div className="mt-6 pt-6 border-t border-charcoal/10">
            <div className="flex items-center justify-center gap-2 text-xs text-charcoal/50">
              <Shield className="w-4 h-4" />
              <span>Secure & encrypted</span>
            </div>
          </div>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-charcoal/60">
            Already have an account?{' '}
            <Link href="/login" className="text-sage font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Back to Home */}
      <Link
        href="/"
        className="mt-8 text-sm text-charcoal/50 hover:text-charcoal transition-colors relative z-10"
      >
        Back to home
      </Link>
    </div>
  );
}
```

**Step 2: Verify signup page renders**

Run: `pnpm --filter @peacase/web dev`
Navigate to http://localhost:3000/signup
Expected: New signup form with 6 fields, no verification message

**Step 3: Commit**

```bash
git add apps/web/src/app/signup/page.tsx
git commit -m "feat(web): rewrite signup page with streamlined 6-field form"
```

---

## Task 6: Create OnboardingGuard Component

**Files:**
- Create: `apps/web/src/components/OnboardingGuard.tsx`

**Step 1: Create the guard component**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { isAuthenticated, isLoading, salon } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (salon && !salon.onboardingComplete) {
        router.push('/onboarding');
      }
    }
  }, [isAuthenticated, isLoading, salon, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-sage" />
      </div>
    );
  }

  if (!isAuthenticated || (salon && !salon.onboardingComplete)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-sage" />
      </div>
    );
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/OnboardingGuard.tsx
git commit -m "feat(web): add OnboardingGuard component"
```

---

## Task 7: Rebuild Onboarding Wizard

**Files:**
- Modify: `apps/web/src/app/onboarding/page.tsx`

This is a large file. The key changes are:

1. Reorder steps: Business Info → Subscription/Payment → Working Hours → Services → Optional Checklist → Complete
2. Remove email verification dependency
3. Add optional setup checklist screen
4. Connect to new API endpoints

**Step 1: Replace the onboarding page with the new implementation**

Due to the size of this file, the implementation should:
- Use the existing step structure as a base
- Reorder steps array to: business, subscription, hours, services, optional, complete
- Add an "optional" step with checklist UI for Staff, Branding, Client Payments, Notifications
- On completion, call `POST /api/v1/onboarding/complete`
- Replace hardcoded "14-day free trial" with appropriate messaging since there's no free trial

**Step 2: Test the complete flow**

1. Go to /signup
2. Fill form and submit
3. Should redirect to /onboarding
4. Complete each step
5. Should reach dashboard after completion

**Step 3: Commit**

```bash
git add apps/web/src/app/onboarding/page.tsx
git commit -m "feat(web): rebuild onboarding wizard with new step order and optional checklist"
```

---

## Task 8: Add OnboardingGuard to Dashboard

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

**Step 1: Wrap dashboard with OnboardingGuard**

Import and wrap the dashboard content:

```typescript
import { OnboardingGuard } from '@/components/OnboardingGuard';

export default function DashboardPage() {
  return (
    <OnboardingGuard>
      {/* existing dashboard content */}
    </OnboardingGuard>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat(web): add OnboardingGuard to dashboard"
```

---

## Task 9: End-to-End Testing

**Step 1: Start all services**

Run: `pnpm dev`
Expected: API on 3001, Web on 3000

**Step 2: Test complete signup flow**

1. Navigate to http://localhost:3000/signup
2. Fill in all 6 fields
3. Submit form
4. Verify redirect to /onboarding
5. Complete Business Info step
6. Complete Subscription step (mock or skip for now)
7. Complete Working Hours step
8. Add at least one service
9. Skip or complete optional steps
10. Verify redirect to dashboard

**Step 3: Test OnboardingGuard**

1. Try to access /dashboard directly without completing onboarding
2. Should redirect to /onboarding

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete signup flow redesign implementation"
```

---

## Summary of Changes

| Component | Change |
|-----------|--------|
| `schema.prisma` | Added `businessType`, `onboardingComplete`, `onboardingStep` to Salon |
| `auth.ts` (API) | Updated register to accept new fields, removed verification email |
| `onboarding.ts` (API) | New file with onboarding endpoints |
| `AuthContext.tsx` | Updated register function and Salon interface |
| `signup/page.tsx` | Complete rewrite with 6-field form |
| `OnboardingGuard.tsx` | New component to enforce onboarding completion |
| `onboarding/page.tsx` | Rebuilt wizard with new step order |
| `dashboard/page.tsx` | Wrapped with OnboardingGuard |

---

## Verification Checklist

- [ ] User can sign up with 6 fields
- [ ] No email verification screen appears
- [ ] User goes directly to onboarding after signup
- [ ] Business Info step saves to database
- [ ] Working Hours step saves to database
- [ ] Services step requires at least 1 service
- [ ] Optional steps can be skipped
- [ ] Completion marks `onboardingComplete = true`
- [ ] Dashboard is only accessible after onboarding
- [ ] Existing users with incomplete onboarding are redirected
