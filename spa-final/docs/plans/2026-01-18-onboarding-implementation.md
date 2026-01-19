# Onboarding Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace 10-step onboarding with minimal 4-step flow (Business Basics → Add-ons → Payment → Success) and add contextual just-in-time setup flows.

**Architecture:** Minimal onboarding collects only essential info, then redirects to dashboard with empty states. Each empty state triggers a focused setup modal when clicked.

**Tech Stack:** Next.js 14, React, TailwindCSS, Prisma, PostgreSQL, Stripe

---

## Phase 1: Database Schema Updates

### Task 1.1: Add SetupProgress Model

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add SetupProgress model to schema**

Add at end of schema.prisma:

```prisma
// ============================================
// SETUP PROGRESS TRACKING
// ============================================

model SetupProgress {
  id              String    @id @default(uuid())
  salonId         String    @unique @map("salon_id")
  businessHours   Boolean   @default(false) @map("business_hours")
  firstService    Boolean   @default(false) @map("first_service")
  firstStaff      Boolean   @default(false) @map("first_staff")
  bookingPage     Boolean   @default(false) @map("booking_page")
  paymentMethod   Boolean   @default(false) @map("payment_method")
  completedAt     DateTime? @map("completed_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  salon Salon @relation(fields: [salonId], references: [id], onDelete: Cascade)

  @@map("setup_progress")
}
```

**Step 2: Add relation to Salon model**

Find Salon model and add relation:

```prisma
  setupProgress    SetupProgress?
```

**Step 3: Generate Prisma client**

Run: `cd packages/database && pnpm exec prisma generate`
Expected: Prisma Client generated successfully

**Step 4: Commit**

```bash
git add packages/database/prisma/schema.prisma
git commit -m "feat(db): add SetupProgress model for tracking onboarding completion"
```

---

### Task 1.2: Add ServiceVariant Model

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add ServiceVariant model**

Add after Service model:

```prisma
model ServiceVariant {
  id          String   @id @default(uuid())
  serviceId   String   @map("service_id")
  name        String
  duration    Int
  price       Float
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@map("service_variants")
}
```

**Step 2: Add relation to Service model**

Find Service model, add:

```prisma
  variants        ServiceVariant[]
```

**Step 3: Generate and commit**

```bash
cd packages/database && pnpm exec prisma generate
git add packages/database/prisma/schema.prisma
git commit -m "feat(db): add ServiceVariant model for pricing variants"
```

---

### Task 1.3: Add Resource Model (for room/equipment booking)

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add Resource model**

```prisma
model Resource {
  id          String   @id @default(uuid())
  salonId     String   @map("salon_id")
  name        String
  type        String   @default("room")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  salon Salon @relation(fields: [salonId], references: [id], onDelete: Cascade)

  @@map("resources")
}
```

**Step 2: Add relation to Salon model**

```prisma
  resources        Resource[]
```

**Step 3: Generate and commit**

```bash
cd packages/database && pnpm exec prisma generate
git add packages/database/prisma/schema.prisma
git commit -m "feat(db): add Resource model for room/equipment booking"
```

---

### Task 1.4: Add IntakeForm Models

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

**Step 1: Add IntakeForm, IntakeFormField, IntakeFormResponse models**

```prisma
model IntakeForm {
  id                String   @id @default(uuid())
  salonId           String   @map("salon_id")
  name              String
  description       String?
  isActive          Boolean  @default(true) @map("is_active")
  requiresSignature Boolean  @default(false) @map("requires_signature")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  salon     Salon              @relation(fields: [salonId], references: [id], onDelete: Cascade)
  fields    IntakeFormField[]
  responses IntakeFormResponse[]

  @@map("intake_forms")
}

model IntakeFormField {
  id         String   @id @default(uuid())
  formId     String   @map("form_id")
  label      String
  type       String   @default("text")
  options    String?
  isRequired Boolean  @default(false) @map("is_required")
  sortOrder  Int      @default(0) @map("sort_order")
  createdAt  DateTime @default(now()) @map("created_at")

  form IntakeForm @relation(fields: [formId], references: [id], onDelete: Cascade)

  @@map("intake_form_fields")
}

model IntakeFormResponse {
  id            String   @id @default(uuid())
  formId        String   @map("form_id")
  clientId      String   @map("client_id")
  appointmentId String?  @map("appointment_id")
  responses     String
  signatureUrl  String?  @map("signature_url")
  submittedAt   DateTime @default(now()) @map("submitted_at")

  form        IntakeForm   @relation(fields: [formId], references: [id], onDelete: Cascade)
  client      Client       @relation(fields: [clientId], references: [id])
  appointment Appointment? @relation(fields: [appointmentId], references: [id])

  @@map("intake_form_responses")
}
```

**Step 2: Add relations to Salon, Client, Appointment**

In Salon:
```prisma
  intakeForms      IntakeForm[]
```

In Client:
```prisma
  intakeFormResponses IntakeFormResponse[]
```

In Appointment:
```prisma
  intakeFormResponses IntakeFormResponse[]
```

**Step 3: Generate and commit**

```bash
cd packages/database && pnpm exec prisma generate
git add packages/database/prisma/schema.prisma
git commit -m "feat(db): add IntakeForm models for configurable intake forms"
```

---

### Task 1.5: Run Migration

**Step 1: Create migration**

Run: `cd packages/database && pnpm exec prisma migrate dev --name add_onboarding_models`

Expected: Migration created and applied

**Step 2: Verify migration**

Run: `cd packages/database && pnpm exec prisma studio`

Check that new tables exist: setup_progress, service_variants, resources, intake_forms, intake_form_fields, intake_form_responses

**Step 3: Commit migration files**

```bash
git add packages/database/prisma/migrations/
git commit -m "feat(db): migration for onboarding models"
```

---

## Phase 2: New 4-Step Onboarding Flow

### Task 2.1: Create OnboardingWizard Component

**Files:**
- Create: `apps/web/src/components/onboarding/OnboardingWizard.tsx`

**Step 1: Create component file**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Sparkles,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

type OnboardingStep = 'business' | 'addons' | 'payment' | 'success';

const steps: { id: OnboardingStep; title: string; icon: typeof Building2 }[] = [
  { id: 'business', title: 'Business Basics', icon: Building2 },
  { id: 'addons', title: 'Choose Add-ons', icon: Sparkles },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'success', title: 'Success', icon: CheckCircle2 },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('business');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    type: '',
    timezone: 'America/Chicago',
    email: '',
  });

  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Submit to API
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Progress bar */}
      <div className="bg-white border-b border-charcoal/10 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? 'bg-sage text-white'
                      : 'bg-charcoal/10 text-charcoal/40'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded ${
                      index < currentStepIndex ? 'bg-sage' : 'bg-charcoal/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-charcoal/60">
            Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].title}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {currentStep === 'business' && (
          <BusinessBasicsStep
            data={businessInfo}
            onChange={setBusinessInfo}
            onNext={nextStep}
          />
        )}
        {currentStep === 'addons' && (
          <AddOnsStep
            selected={selectedAddOns}
            onChange={setSelectedAddOns}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 'payment' && (
          <PaymentStep
            businessInfo={businessInfo}
            selectedAddOns={selectedAddOns}
            onComplete={handleComplete}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        )}
        {currentStep === 'success' && <SuccessStep />}
      </div>
    </div>
  );
}

// Sub-components will be in separate files
function BusinessBasicsStep({ data, onChange, onNext }: {
  data: { name: string; type: string; timezone: string; email: string };
  onChange: (data: { name: string; type: string; timezone: string; email: string }) => void;
  onNext: () => void;
}) {
  // Implementation in next task
  return <div>Business Basics</div>;
}

function AddOnsStep({ selected, onChange, onNext, onBack }: {
  selected: string[];
  onChange: (selected: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Implementation in next task
  return <div>Add-ons</div>;
}

function PaymentStep({ businessInfo, selectedAddOns, onComplete, onBack, isSubmitting }: {
  businessInfo: { name: string; type: string; timezone: string; email: string };
  selectedAddOns: string[];
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  // Implementation in next task
  return <div>Payment</div>;
}

function SuccessStep() {
  // Implementation in next task
  return <div>Success</div>;
}
```

**Step 2: Create index export**

Create `apps/web/src/components/onboarding/index.ts`:

```ts
export { OnboardingWizard } from './OnboardingWizard';
```

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/
git commit -m "feat(web): add OnboardingWizard component skeleton"
```

---

### Task 2.2: Implement BusinessBasicsStep

**Files:**
- Create: `apps/web/src/components/onboarding/BusinessBasicsStep.tsx`

**Step 1: Create component**

```tsx
'use client';

import { ArrowRight } from 'lucide-react';

const businessTypes = [
  { value: 'hair_salon', label: 'Hair Salon' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'day_spa', label: 'Day Spa' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'beauty_studio', label: 'Beauty Studio' },
  { value: 'massage', label: 'Massage Therapy' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'wellness', label: 'Wellness Center' },
  { value: 'tattoo', label: 'Tattoo Studio' },
  { value: 'tanning', label: 'Tanning Salon' },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
];

interface BusinessBasicsStepProps {
  data: {
    name: string;
    type: string;
    timezone: string;
    email: string;
  };
  onChange: (data: { name: string; type: string; timezone: string; email: string }) => void;
  onNext: () => void;
}

export function BusinessBasicsStep({ data, onChange, onNext }: BusinessBasicsStepProps) {
  const isValid = data.name.trim() && data.type && data.timezone;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Tell us about your business</h1>
        <p className="text-charcoal/60">We just need a few basics to get you started.</p>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-charcoal/10 shadow-soft space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Business Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Serenity Spa & Salon"
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
          />
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Business Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={data.type}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
          >
            <option value="">Select your business type</option>
            {businessTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Timezone <span className="text-rose-500">*</span>
          </label>
          <select
            value={data.timezone}
            onChange={(e) => onChange({ ...data, timezone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
```

**Step 2: Update OnboardingWizard to import**

Update `OnboardingWizard.tsx` to import from file:

```tsx
import { BusinessBasicsStep } from './BusinessBasicsStep';
```

Remove the inline placeholder function.

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/
git commit -m "feat(web): implement BusinessBasicsStep component"
```

---

### Task 2.3: Implement AddOnsStep

**Files:**
- Create: `apps/web/src/components/onboarding/AddOnsStep.tsx`

**Step 1: Create component**

```tsx
'use client';

import { ArrowRight, ArrowLeft, Check, Globe, CreditCard, MessageSquare, BarChart3, Star, Layers, Gift, Sparkles } from 'lucide-react';

const addOns = [
  { id: 'online_booking', name: 'Online Booking', price: 25, icon: Globe, description: 'Let clients book 24/7 from your website' },
  { id: 'payment_processing', name: 'Payment Processing', price: 25, icon: CreditCard, description: 'Accept cards, Apple Pay, Google Pay' },
  { id: 'reminders', name: 'SMS/Email Reminders', price: 25, icon: MessageSquare, description: 'Reduce no-shows with automated reminders' },
  { id: 'reports', name: 'Reports & Analytics', price: 25, icon: BarChart3, description: 'Revenue dashboards, staff performance' },
  { id: 'reviews', name: 'Reviews & Ratings', price: 25, icon: Star, description: 'Collect and display client reviews' },
  { id: 'memberships', name: 'Packages & Memberships', price: 25, icon: Layers, description: 'Sell packages and recurring memberships' },
  { id: 'gift_cards', name: 'Gift Cards', price: 25, icon: Gift, description: 'Sell and redeem digital gift cards' },
  { id: 'marketing', name: 'Marketing Automation', price: 25, icon: Sparkles, description: 'Automated campaigns and promotions' },
];

const BASE_PRICE = 50;

interface AddOnsStepProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AddOnsStep({ selected, onChange, onNext, onBack }: AddOnsStepProps) {
  const toggleAddOn = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const monthlyTotal = BASE_PRICE + selected.length * 25;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Choose your add-ons</h1>
        <p className="text-charcoal/60">
          Start with the Essentials plan at $50/month, then add features as needed.
        </p>
      </div>

      {/* Base Plan */}
      <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl p-6 border-2 border-sage/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-charcoal">Essentials</h3>
            <p className="text-charcoal/60 text-sm">Calendar, clients, services, staff management</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-charcoal">$50</p>
            <p className="text-sm text-charcoal/60">/month</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sage">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Included in all plans</span>
        </div>
      </div>

      {/* Add-ons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addOns.map((addOn) => {
          const Icon = addOn.icon;
          const isSelected = selected.includes(addOn.id);
          return (
            <button
              key={addOn.id}
              onClick={() => toggleAddOn(addOn.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-sage bg-sage/5'
                  : 'border-charcoal/10 hover:border-sage/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-sage text-white' : 'bg-charcoal/5 text-charcoal/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-charcoal">{addOn.name}</h4>
                    <span className="text-sm font-semibold text-charcoal">+${addOn.price}</span>
                  </div>
                  <p className="text-sm text-charcoal/60">{addOn.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Total */}
      <div className="bg-charcoal rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="text-white/80">Monthly total</span>
          <div className="text-right">
            <p className="text-3xl font-bold">${monthlyTotal}</p>
            <p className="text-sm text-white/60">/month after trial</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mt-2">
          You can change add-ons anytime from settings.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-charcoal hover:bg-charcoal/5 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
        >
          Continue to Payment
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Update imports in OnboardingWizard**

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/
git commit -m "feat(web): implement AddOnsStep component"
```

---

### Task 2.4: Implement PaymentStep with Stripe

**Files:**
- Create: `apps/web/src/components/onboarding/PaymentStep.tsx`

**Step 1: Create component**

```tsx
'use client';

import { useState } from 'react';
import { ArrowLeft, Shield, Loader2, Calendar } from 'lucide-react';

const BASE_PRICE = 50;

interface PaymentStepProps {
  businessInfo: {
    name: string;
    type: string;
    timezone: string;
    email: string;
  };
  selectedAddOns: string[];
  onComplete: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function PaymentStep({
  businessInfo,
  selectedAddOns,
  onComplete,
  onBack,
  isSubmitting,
}: PaymentStepProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const monthlyTotal = BASE_PRICE + selectedAddOns.length * 25;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const cardDigits = cardNumber.replace(/\s/g, '');
    if (!cardDigits || cardDigits.length !== 16) {
      newErrors.cardNumber = 'Enter a valid 16-digit card number';
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = 'Use MM/YY format';
    }

    if (!/^\d{3,4}$/.test(cvc)) {
      newErrors.cvc = 'Enter valid CVC';
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete();
    }
  };

  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-charcoal mb-2">Start your free trial</h1>
        <p className="text-charcoal/60">
          Add a payment method to begin. You won&apos;t be charged until the trial ends.
        </p>
      </div>

      {/* Plan Summary */}
      <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20">
        <h3 className="font-semibold text-charcoal mb-4">Plan Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-charcoal/70">Essentials</span>
            <span className="font-medium">$50/mo</span>
          </div>
          {selectedAddOns.length > 0 && (
            <div className="flex justify-between">
              <span className="text-charcoal/70">{selectedAddOns.length} add-ons</span>
              <span className="font-medium">${selectedAddOns.length * 25}/mo</span>
            </div>
          )}
          <div className="pt-2 border-t border-charcoal/10 flex justify-between">
            <span className="font-semibold">Total after trial</span>
            <span className="text-xl font-bold">${monthlyTotal}/mo</span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-sage/20 rounded-lg flex items-center gap-2 text-sage-dark">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-medium">
            14-day free trial - first charge {trialEndDate.toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-2xl p-6 border border-charcoal/10 shadow-soft space-y-4">
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
              setCardNumber(value.slice(0, 19));
            }}
            placeholder="1234 5678 9012 3456"
            className={`w-full px-4 py-3 rounded-xl border ${errors.cardNumber ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none`}
          />
          {errors.cardNumber && <p className="text-sm text-rose-500 mt-1">{errors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Expiry</label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                setExpiry(value);
              }}
              placeholder="MM/YY"
              maxLength={5}
              className={`w-full px-4 py-3 rounded-xl border ${errors.expiry ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none`}
            />
            {errors.expiry && <p className="text-sm text-rose-500 mt-1">{errors.expiry}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">CVC</label>
            <input
              type="text"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              maxLength={4}
              className={`w-full px-4 py-3 rounded-xl border ${errors.cvc ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none`}
            />
            {errors.cvc && <p className="text-sm text-rose-500 mt-1">{errors.cvc}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">Name on Card</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            className={`w-full px-4 py-3 rounded-xl border ${errors.name ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none`}
          />
          {errors.name && <p className="text-sm text-rose-500 mt-1">{errors.name}</p>}
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-charcoal/5 rounded-xl">
        <Shield className="w-5 h-5 text-sage mt-0.5" />
        <div className="text-sm text-charcoal/70">
          <p className="font-medium text-charcoal">Secure Payment</p>
          <p>Your payment info is encrypted and processed securely by Stripe.</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 text-charcoal hover:bg-charcoal/5 rounded-xl transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Start Free Trial'
          )}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Update imports and commit**

```bash
git add apps/web/src/components/onboarding/
git commit -m "feat(web): implement PaymentStep with card form"
```

---

### Task 2.5: Implement SuccessStep

**Files:**
- Create: `apps/web/src/components/onboarding/SuccessStep.tsx`

**Step 1: Create component**

```tsx
'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, Calendar, Sparkles } from 'lucide-react';

export function SuccessStep() {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  return (
    <div className="text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-2">You&apos;re all set!</h1>
        <p className="text-lg text-charcoal/60">
          Your 14-day free trial has started. Let&apos;s set up your business.
        </p>
      </div>

      <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-sage" />
          <div className="text-left">
            <p className="font-semibold text-charcoal">14-Day Free Trial Active</p>
            <p className="text-sm text-charcoal/60">
              Trial ends {trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-charcoal/5 rounded-2xl p-6 max-w-md mx-auto text-left">
        <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sage" />
          Quick Start Guide
        </h3>
        <ul className="space-y-3 text-sm text-charcoal/70">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sage/20 text-sage text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            Set your business hours
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sage/20 text-sage text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            Add your services and pricing
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sage/20 text-sage text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
            Invite your team members
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-sage/20 text-sage text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
            Start booking appointments
          </li>
        </ul>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/onboarding/
git commit -m "feat(web): implement SuccessStep component"
```

---

### Task 2.6: Update Onboarding Page to Use New Wizard

**Files:**
- Modify: `apps/web/src/app/onboarding/page.tsx`

**Step 1: Replace entire file with new implementation**

```tsx
'use client';

import { OnboardingWizard } from '@/components/onboarding';

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
```

**Step 2: Verify the page works**

Run: `cd apps/web && pnpm run dev`
Navigate to: http://localhost:3000/onboarding
Expected: 4-step wizard with progress bar

**Step 3: Commit**

```bash
git add apps/web/src/app/onboarding/page.tsx
git commit -m "feat(web): replace old 10-step onboarding with new 4-step wizard"
```

---

## Phase 3: Dashboard Redesign with Empty States

### Task 3.1: Create EmptyState Component

**Files:**
- Create: `apps/web/src/components/EmptyState.tsx`

**Step 1: Create component**

```tsx
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-sage" />
      </div>
      <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-charcoal/60 mb-6 max-w-sm mx-auto">{description}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
      >
        {actionLabel}
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/EmptyState.tsx
git commit -m "feat(web): add reusable EmptyState component"
```

---

### Task 3.2: Create SetupProgress Hook

**Files:**
- Create: `apps/web/src/hooks/useSetupProgress.ts`

**Step 1: Create hook**

```ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface SetupProgress {
  businessHours: boolean;
  firstService: boolean;
  firstStaff: boolean;
  bookingPage: boolean;
  paymentMethod: boolean;
  completedAt: string | null;
}

export function useSetupProgress() {
  const [progress, setProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get<{ setupProgress: SetupProgress }>('/salon/setup-progress');
      if (response.success && response.data) {
        setProgress(response.data.setupProgress);
      }
    } catch {
      // If not set up yet, use defaults
      setProgress({
        businessHours: false,
        firstService: false,
        firstStaff: false,
        bookingPage: false,
        paymentMethod: false,
        completedAt: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (field: keyof Omit<SetupProgress, 'completedAt'>) => {
    try {
      await api.patch('/salon/setup-progress', { [field]: true });
      setProgress((prev) => prev ? { ...prev, [field]: true } : null);
    } catch (error) {
      console.error('Failed to update setup progress:', error);
    }
  };

  const completedCount = progress
    ? Object.entries(progress)
        .filter(([key, value]) => key !== 'completedAt' && value === true)
        .length
    : 0;

  const totalSteps = 5;
  const percentComplete = Math.round((completedCount / totalSteps) * 100);

  return {
    progress,
    loading,
    markComplete,
    refetch: fetchProgress,
    completedCount,
    totalSteps,
    percentComplete,
    isComplete: completedCount === totalSteps,
  };
}
```

**Step 2: Export from hooks index**

Update `apps/web/src/hooks/index.ts`:

```ts
export { useSetupProgress } from './useSetupProgress';
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/
git commit -m "feat(web): add useSetupProgress hook for tracking setup completion"
```

---

### Task 3.3: Add Welcome Banner to Dashboard

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

**Step 1: Import useSetupProgress and add WelcomeBanner**

Add after error state section:

```tsx
{/* Welcome Banner - Show until setup complete */}
{!progress?.completedAt && (
  <div className="mb-6 bg-gradient-to-r from-sage/10 via-lavender/10 to-peach/10 rounded-2xl p-6 border border-sage/20">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-sage flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-charcoal mb-1">
          Welcome to Peacase! Complete your setup to start accepting bookings.
        </h2>
        <p className="text-charcoal/60 text-sm mb-4">
          {completedCount} of {totalSteps} steps complete
        </p>
        <div className="w-full bg-charcoal/10 rounded-full h-2 mb-4">
          <div
            className="bg-sage h-2 rounded-full transition-all"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {!progress?.businessHours && (
            <button
              onClick={() => setShowHoursSetup(true)}
              className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark"
            >
              Set Business Hours
            </button>
          )}
          {!progress?.firstService && progress?.businessHours && (
            <button
              onClick={() => setShowServiceSetup(true)}
              className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark"
            >
              Add First Service
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
```

**Step 2: Add setup modal state**

```tsx
const [showHoursSetup, setShowHoursSetup] = useState(false);
const [showServiceSetup, setShowServiceSetup] = useState(false);
```

**Step 3: Import and use hook**

```tsx
const { progress, completedCount, totalSteps, percentComplete } = useSetupProgress();
```

**Step 4: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat(web): add welcome banner with setup progress to dashboard"
```

---

## Phase 4: Contextual Setup Flows

### Task 4.1: Create ServiceSetupModal

**Files:**
- Create: `apps/web/src/components/setup/ServiceSetupModal.tsx`

**Step 1: Create component**

```tsx
'use client';

import { useState } from 'react';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ServiceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ServiceSetupModal({ isOpen, onClose, onComplete }: ServiceSetupModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [service, setService] = useState({
    name: '',
    duration: 30,
    price: 0,
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/services', service);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to create service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-charcoal/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-auto">
        <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">Add Your First Service</h2>
            <p className="text-sm text-charcoal/60">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 text-charcoal/40 hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => setService({ ...service, name: e.target.value })}
                  placeholder="e.g., Haircut, Massage, Manicure"
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={service.description}
                  onChange={(e) => setService({ ...service, description: e.target.value })}
                  placeholder="Brief description of this service"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none resize-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!service.name.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Duration <span className="text-rose-500">*</span>
                </label>
                <select
                  value={service.duration}
                  onChange={(e) => setService({ ...service, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                >
                  {[15, 30, 45, 60, 75, 90, 120, 150, 180].map((min) => (
                    <option key={min} value={min}>
                      {min} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40">$</span>
                  <input
                    type="number"
                    value={service.price}
                    onChange={(e) => setService({ ...service, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-charcoal hover:bg-charcoal/5 rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || service.price <= 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Service'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
```

**Step 2: Create index export**

Create `apps/web/src/components/setup/index.ts`:

```ts
export { ServiceSetupModal } from './ServiceSetupModal';
```

**Step 3: Commit**

```bash
git add apps/web/src/components/setup/
git commit -m "feat(web): add ServiceSetupModal for contextual service creation"
```

---

### Task 4.2: Create HoursSetupModal

**Files:**
- Create: `apps/web/src/components/setup/HoursSetupModal.tsx`

**Step 1: Create component**

```tsx
'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const defaultHours = [
  { day: 'Monday', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Tuesday', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Wednesday', dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Thursday', dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Friday', dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Saturday', dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isOpen: true },
  { day: 'Sunday', dayOfWeek: 0, startTime: '10:00', endTime: '16:00', isOpen: false },
];

interface HoursSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function HoursSetupModal({ isOpen, onClose, onComplete }: HoursSetupModalProps) {
  const [hours, setHours] = useState(defaultHours);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/salon/hours', { hours: hours.filter((h) => h.isOpen) });
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to save hours:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateHours = (index: number, field: string, value: string | boolean) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  return (
    <>
      <div className="fixed inset-0 bg-charcoal/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-auto">
        <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">Set Business Hours</h2>
            <p className="text-sm text-charcoal/60">When are you open for business?</p>
          </div>
          <button onClick={onClose} className="p-2 text-charcoal/40 hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {hours.map((day, index) => (
            <div
              key={day.day}
              className={`p-4 rounded-xl border transition-all ${
                day.isOpen ? 'border-sage/30 bg-sage/5' : 'border-charcoal/10 bg-charcoal/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-24 flex-shrink-0">
                  <span className="font-medium text-charcoal">{day.day}</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(e) => updateHours(index, 'isOpen', e.target.checked)}
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <span className="text-sm text-charcoal/60">Open</span>
                </label>

                {day.isOpen && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateHours(index, 'startTime', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    />
                    <span className="text-charcoal/40">to</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => updateHours(index, 'endTime', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    />
                  </div>
                )}

                {!day.isOpen && <span className="ml-auto text-sm text-charcoal/40">Closed</span>}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark disabled:opacity-50 mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Hours'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Export and commit**

```bash
git add apps/web/src/components/setup/
git commit -m "feat(web): add HoursSetupModal for contextual hours setup"
```

---

### Task 4.3: Integrate Setup Modals into Dashboard

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

**Step 1: Import setup modals**

```tsx
import { ServiceSetupModal, HoursSetupModal } from '@/components/setup';
```

**Step 2: Add modal state and render**

Add state:
```tsx
const [showHoursSetup, setShowHoursSetup] = useState(false);
const [showServiceSetup, setShowServiceSetup] = useState(false);
```

Add at end of component before closing `</div>`:
```tsx
<HoursSetupModal
  isOpen={showHoursSetup}
  onClose={() => setShowHoursSetup(false)}
  onComplete={() => markComplete('businessHours')}
/>
<ServiceSetupModal
  isOpen={showServiceSetup}
  onClose={() => setShowServiceSetup(false)}
  onComplete={() => markComplete('firstService')}
/>
```

**Step 3: Commit**

```bash
git add apps/web/src/app/dashboard/page.tsx
git commit -m "feat(web): integrate setup modals into dashboard"
```

---

## Phase 5: API Endpoints

### Task 5.1: Add Setup Progress API Routes

**Files:**
- Create: `apps/api/src/routes/setup-progress.ts`

**Step 1: Create route file**

```ts
import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get setup progress
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    let progress = await prisma.setupProgress.findUnique({
      where: { salonId: user.salonId },
    });

    if (!progress) {
      progress = await prisma.setupProgress.create({
        data: { salonId: user.salonId },
      });
    }

    res.json({ success: true, data: { setupProgress: progress } });
  } catch (error) {
    console.error('Get setup progress error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to get setup progress' } });
  }
});

// Update setup progress
router.patch('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const updates = req.body;

    const progress = await prisma.setupProgress.upsert({
      where: { salonId: user.salonId },
      update: updates,
      create: { salonId: user.salonId, ...updates },
    });

    // Check if all complete
    if (progress.businessHours && progress.firstService && progress.firstStaff && progress.bookingPage && progress.paymentMethod && !progress.completedAt) {
      await prisma.setupProgress.update({
        where: { salonId: user.salonId },
        data: { completedAt: new Date() },
      });
    }

    res.json({ success: true, data: { setupProgress: progress } });
  } catch (error) {
    console.error('Update setup progress error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update setup progress' } });
  }
});

export default router;
```

**Step 2: Register route in app**

Update `apps/api/src/app.ts`:

```ts
import setupProgressRoutes from './routes/setup-progress';
// ...
app.use('/api/salon/setup-progress', setupProgressRoutes);
```

**Step 3: Commit**

```bash
git add apps/api/src/routes/setup-progress.ts apps/api/src/app.ts
git commit -m "feat(api): add setup progress API endpoints"
```

---

## Final Tasks

### Task 6.1: Run Full Build and Test

**Step 1: Build database package**

Run: `cd packages/database && pnpm run build`
Expected: Build successful

**Step 2: Build API**

Run: `cd apps/api && pnpm run build`
Expected: Build successful

**Step 3: Build web**

Run: `cd apps/web && pnpm run build`
Expected: Build successful

**Step 4: Typecheck all**

Run: `pnpm run typecheck`
Expected: No errors

**Step 5: Commit all changes**

```bash
git add -A
git commit -m "feat: complete onboarding redesign implementation

- Replace 10-step onboarding with minimal 4-step flow
- Add contextual setup modals for just-in-time configuration
- Add setup progress tracking
- Add welcome banner with progress indicator
- Add empty state components
"
```

---

### Task 6.2: Create Pull Request

**Step 1: Push branch**

Run: `git push -u origin feature/onboarding-redesign`

**Step 2: Create PR**

Run:
```bash
gh pr create --title "Onboarding Redesign" --body "$(cat <<'EOF'
## Summary
- Replace 10-step onboarding with minimal 4-step flow (Business Basics → Add-ons → Payment → Success)
- Add contextual setup modals for just-in-time configuration
- Add setup progress tracking with dashboard welcome banner
- Add empty state components for unconfigured features

## Test plan
- [ ] Complete new onboarding flow as new user
- [ ] Verify dashboard shows welcome banner
- [ ] Click setup actions and complete contextual flows
- [ ] Verify progress updates correctly
- [ ] Test on mobile viewport

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

Plan complete and saved to `docs/plans/2026-01-18-onboarding-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
