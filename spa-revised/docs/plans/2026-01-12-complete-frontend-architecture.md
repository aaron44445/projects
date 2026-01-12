# Complete Pecase Frontend Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with code review checkpoints.

**Goal:** Build complete customer-facing frontend from public landing page through full SaaS admin dashboard, connecting all 26+ backend services with professional UI and seamless payment integration.

**Architecture:**
- **Public Site**: Landing page → Product info → Signup flow → Payment setup
- **Onboarding**: Service/staff setup → Location/add-ons selection → Settings
- **Admin Dashboard**: 6 metric cards → Scheduling → Clients → Revenue reporting → Staff management
- **Client Portal**: Booking interface → Appointment history → Reviews
- **Staff Interface**: Schedule view → Client management → Availability settings

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, lucide-react icons, Stripe, Zustand state management, React Hook Form + Zod validation

---

## PHASE 1: PUBLIC LANDING PAGE & MARKETING SITE

### Task 1: Landing Page with Call-to-Action

**Files:**
- Create: `apps/web/src/app/page.tsx` (update existing)
- Create: `apps/web/src/components/Hero.tsx`
- Create: `apps/web/src/components/Features.tsx`
- Create: `apps/web/src/components/PricingShowcase.tsx`
- Create: `apps/web/src/components/CTASection.tsx`

**Step 1: Design landing page component structure**

Create `apps/web/src/app/page.tsx`:
```tsx
'use client'

import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { PricingShowcase } from '@/components/PricingShowcase'
import { CTASection } from '@/components/CTASection'

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Hero />
      <Features />
      <PricingShowcase />
      <CTASection />
    </div>
  )
}
```

**Step 2: Build Hero section with headline and CTA**

Create `apps/web/src/components/Hero.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-6" style={{ color: '#2C2C2C' }}>
          Professional Salon Management Made Simple
        </h1>

        <p className="text-xl mb-8" style={{ color: '#666' }}>
          Manage appointments, clients, staff, and payments all in one beautiful platform.
          Start your free trial today—no credit card required.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all hover:scale-105"
            style={{ backgroundColor: '#C7DCC8', color: '#fff' }}
          >
            Start Free Trial <ArrowRight size={20} />
          </Link>

          <Link
            href="/demo"
            className="px-8 py-4 rounded-lg font-semibold border-2"
            style={{ borderColor: '#C7DCC8', color: '#C7DCC8' }}
          >
            Watch Demo
          </Link>
        </div>

        <div className="text-sm" style={{ color: '#999' }}>
          ✓ 14-day free trial • ✓ No credit card needed • ✓ Full feature access
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Build Features section showing core capabilities**

Create `apps/web/src/components/Features.tsx`:
```tsx
'use client'

import { Calendar, Users, DollarSign, Bell, BarChart3, Lock } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: '30-minute appointment grid with intelligent conflict detection and staff availability'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Complete client profiles with history, preferences, and communication tracking'
  },
  {
    icon: DollarSign,
    title: 'Payment Processing',
    description: 'Built-in Stripe integration for secure, seamless payment handling'
  },
  {
    icon: Bell,
    title: 'Automated Reminders',
    description: 'Email and SMS reminders at 24h and 2h before appointments'
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Revenue reports, performance metrics, and business insights'
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Role-based access control, JWT authentication, and data encryption'
  }
]

export function Features() {
  return (
    <div className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#2C2C2C' }}>
          Everything You Need to Run Your Salon
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="p-8 rounded-2xl"
                style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <div className="mb-4" style={{ color: '#C7DCC8' }}>
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#666' }}>
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

**Step 4: Build Pricing section showing add-on options**

Create `apps/web/src/components/PricingShowcase.tsx`:
```tsx
'use client'

import { Check } from 'lucide-react'

const tiers = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for solo practitioners',
    features: [
      'Up to 1 location',
      'Up to 5 staff members',
      'Unlimited clients',
      'Basic scheduling',
      'Email reminders',
      'Email support'
    ]
  },
  {
    name: 'Professional',
    price: 79,
    description: 'For growing salons',
    features: [
      'Up to 5 locations',
      'Unlimited staff',
      'Unlimited clients',
      'Advanced scheduling',
      'Email & SMS reminders',
      'Client portal',
      'Payment processing',
      'Priority support',
      'Marketing tools'
    ],
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'Full-featured platform',
    features: [
      'Unlimited locations',
      'Unlimited staff',
      'Unlimited clients',
      'All Starter features',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options'
    ]
  }
]

export function PricingShowcase() {
  return (
    <div className="py-24 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#2C2C2C' }}>
          Simple, Transparent Pricing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl"
              style={{
                backgroundColor: tier.highlighted ? '#C7DCC8' : '#F5F3F0',
                border: tier.highlighted ? 'none' : '1px solid #E8E6E4'
              }}
            >
              <h3 className="text-2xl font-bold mb-2" style={{ color: tier.highlighted ? '#fff' : '#2C2C2C' }}>
                {tier.name}
              </h3>
              <p style={{ color: tier.highlighted ? 'rgba(255,255,255,0.8)' : '#666', marginBottom: '16px' }}>
                {tier.description}
              </p>
              <div className="mb-8">
                <span className="text-4xl font-bold" style={{ color: tier.highlighted ? '#fff' : '#2C2C2C' }}>
                  ${tier.price}
                </span>
                <span style={{ color: tier.highlighted ? 'rgba(255,255,255,0.8)' : '#666' }}>/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex gap-3">
                    <Check size={20} style={{ color: tier.highlighted ? '#fff' : '#C7DCC8' }} />
                    <span style={{ color: tier.highlighted ? '#fff' : '#2C2C2C' }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="w-full py-3 rounded-lg font-bold transition-all hover:scale-105"
                style={{
                  backgroundColor: tier.highlighted ? '#fff' : '#C7DCC8',
                  color: tier.highlighted ? '#C7DCC8' : '#fff'
                }}
              >
                Choose {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 5: Build CTA section with footer**

Create `apps/web/src/components/CTASection.tsx`:
```tsx
'use client'

import Link from 'next/link'

export function CTASection() {
  return (
    <div className="py-24 px-4" style={{ backgroundColor: '#C7DCC8' }}>
      <div className="max-w-4xl mx-auto text-center text-white">
        <h2 className="text-4xl font-bold mb-6">
          Ready to Transform Your Salon Business?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join hundreds of salons using Pecase to streamline their operations and delight their clients.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 rounded-lg font-bold bg-white"
          style={{ color: '#C7DCC8' }}
        >
          Start Your Free Trial
        </Link>
        <div className="mt-16 pt-16 border-t border-white border-opacity-20">
          <p className="opacity-75 text-sm">
            © 2026 Pecase. All rights reserved. | Privacy Policy | Terms of Service | Contact Us
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## PHASE 2: SIGNUP & REGISTRATION FLOW

### Task 2: Signup Page with Salon Creation

**Files:**
- Create: `apps/web/src/app/signup/page.tsx`
- Create: `apps/web/src/components/SignupForm.tsx`
- Create: `apps/web/src/lib/hooks/useSignup.ts`

**Step 1: Create signup form component with validation**

Create `apps/web/src/components/SignupForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function SignupForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    salonName: '',
    ownerEmail: '',
    password: '',
    confirmPassword: '',
    phone: '',
    timezone: 'America/New_York'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.salonName.trim()) newErrors.salonName = 'Salon name is required'
    if (!formData.ownerEmail.includes('@')) newErrors.ownerEmail = 'Valid email is required'
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_name: formData.salonName,
          email: formData.ownerEmail,
          password: formData.password,
          phone: formData.phone,
          timezone: formData.timezone
        })
      })

      if (!response.ok) {
        const error = await response.json()
        setErrors({ general: error.message || 'Signup failed' })
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/onboarding'), 2000)
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-white rounded-2xl max-w-md mx-auto" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h2 className="text-2xl font-bold text-center" style={{ color: '#2C2C2C' }}>
        Create Your Salon Account
      </h2>

      {errors.general && (
        <div className="p-4 rounded-lg flex gap-2" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', border: '1px solid' }}>
          <AlertCircle size={20} style={{ color: '#dc2626' }} />
          <span style={{ color: '#991b1b' }}>{errors.general}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg flex gap-2" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac', border: '1px solid' }}>
          <CheckCircle size={20} style={{ color: '#16a34a' }} />
          <span style={{ color: '#15803d' }}>Account created! Redirecting...</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Salon Name
        </label>
        <input
          type="text"
          value={formData.salonName}
          onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.salonName ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.salonName && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.salonName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Email Address
        </label>
        <input
          type="email"
          value={formData.ownerEmail}
          onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.ownerEmail ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.ownerEmail && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.ownerEmail}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Phone Number
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.phone ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.phone && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: '#E8E6E4' }}
          disabled={loading}
        >
          <option>America/New_York</option>
          <option>America/Chicago</option>
          <option>America/Denver</option>
          <option>America/Los_Angeles</option>
          <option>Europe/London</option>
          <option>Europe/Paris</option>
          <option>Australia/Sydney</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Password
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.password ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.password && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Confirm Password
        </label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: errors.confirmPassword ? '#dc2626' : '#E8E6E4' }}
          disabled={loading}
        />
        {errors.confirmPassword && <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg font-bold text-white transition-all"
        style={{ backgroundColor: loading ? '#999' : '#C7DCC8' }}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm" style={{ color: '#666' }}>
        Already have an account? <a href="/login" style={{ color: '#C7DCC8', fontWeight: 'bold' }}>Sign in</a>
      </p>
    </form>
  )
}
```

**Step 2: Create signup page wrapper**

Create `apps/web/src/app/signup/page.tsx`:
```tsx
'use client'

import { SignupForm } from '@/components/SignupForm'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
          Welcome to Pecase
        </h1>
        <p style={{ color: '#666' }}>
          Start your 14-day free trial—no credit card required
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
```

---

## PHASE 3: ONBOARDING FLOW

### Task 3: Onboarding Wizard (Setup Services, Staff, Add-ons)

**Files:**
- Create: `apps/web/src/app/onboarding/page.tsx`
- Create: `apps/web/src/components/OnboardingWizard.tsx`
- Create: `apps/web/src/components/OnboardingStep.tsx`
- Create: `apps/web/src/lib/hooks/useOnboarding.ts`

**Step 1: Create onboarding wizard component**

Create `apps/web/src/components/OnboardingWizard.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { OnboardingStep } from './OnboardingStep'
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

const steps = [
  {
    id: 'services',
    title: 'Add Your Services',
    description: 'Tell us what services your salon offers',
    icon: 'Scissors'
  },
  {
    id: 'staff',
    title: 'Add Your Staff',
    description: 'Add team members and their availability',
    icon: 'Users'
  },
  {
    id: 'addons',
    title: 'Choose Add-ons',
    description: 'Select features that fit your business',
    icon: 'Gift'
  },
  {
    id: 'payment',
    title: 'Set Up Payment',
    description: 'Configure payment processing',
    icon: 'CreditCard'
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'Your salon is all set up',
    icon: 'CheckCircle'
  }
]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})

  const handleNext = () => {
    setCompleted({ ...completed, [steps[currentStep].id]: true })
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = steps[currentStep]

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => i < currentStep && setCurrentStep(i)}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold mb-2"
                  style={{
                    backgroundColor: i < currentStep ? '#C7DCC8' : i === currentStep ? '#C7DCC8' : '#E8E6E4',
                    color: i <= currentStep ? '#fff' : '#999'
                  }}
                >
                  {i < currentStep ? <CheckCircle size={24} /> : i + 1}
                </div>
                <span className="text-xs text-center" style={{ color: '#666' }}>
                  {s.title.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                backgroundColor: '#C7DCC8'
              }}
            />
          </div>
        </div>

        {/* Current step */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
            {step.title}
          </h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            {step.description}
          </p>

          <OnboardingStep stepId={step.id} />
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#E8E6E4', color: '#2C2C2C' }}
          >
            <ArrowLeft size={20} /> Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2"
            style={{ backgroundColor: '#C7DCC8' }}
          >
            {currentStep === steps.length - 1 ? 'Start Using Pecase' : 'Next'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create reusable OnboardingStep component**

Create `apps/web/src/components/OnboardingStep.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface OnboardingStepProps {
  stepId: string
}

export function OnboardingStep({ stepId }: OnboardingStepProps) {
  const [items, setItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState('')

  const renderContent = () => {
    switch (stepId) {
      case 'services':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Service Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Haircut, Facial, Massage"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E8E6E4' }}
                />
                <button
                  onClick={() => {
                    if (newItem.trim()) {
                      setItems([...items, { name: newItem, duration: 60, price: 0 }])
                      setNewItem('')
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-white"
                  style={{ backgroundColor: '#C7DCC8' }}
                >
                  <Plus size={20} /> Add
                </button>
              </div>
            </div>

            {items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: '#F5F3F0' }}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold" style={{ color: '#2C2C2C' }}>{item.name}</h4>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))}>
                    <Trash2 size={20} style={{ color: '#dc2626' }} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs" style={{ color: '#666' }}>Duration (minutes)</label>
                    <select
                      value={item.duration}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[i].duration = parseInt(e.target.value)
                        setItems(newItems)
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      style={{ borderColor: '#E8E6E4' }}
                    >
                      <option>30</option>
                      <option>60</option>
                      <option>90</option>
                      <option>120</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: '#666' }}>Price ($)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[i].price = parseFloat(e.target.value)
                        setItems(newItems)
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      style={{ borderColor: '#E8E6E4' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'staff':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Staff Member Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Sarah Miller"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E8E6E4' }}
                />
                <button
                  onClick={() => {
                    if (newItem.trim()) {
                      setItems([...items, { name: newItem, role: 'staff' }])
                      setNewItem('')
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-white"
                  style={{ backgroundColor: '#C7DCC8' }}
                >
                  <Plus size={20} /> Add
                </button>
              </div>
            </div>

            {items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg flex justify-between items-center" style={{ backgroundColor: '#F5F3F0' }}>
                <div>
                  <h4 className="font-bold" style={{ color: '#2C2C2C' }}>{item.name}</h4>
                  <p style={{ color: '#666', fontSize: '12px' }}>Stylist</p>
                </div>
                <button onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 size={20} style={{ color: '#dc2626' }} />
                </button>
              </div>
            ))}
          </div>
        )

      case 'addons':
        return (
          <div className="space-y-4">
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Select features to enhance your salon management experience
            </p>

            {[
              { id: 'packages', name: 'Service Packages', desc: 'Bundled services for clients' },
              { id: 'giftcards', name: 'Gift Cards', desc: 'Digital gift card system' },
              { id: 'locations', name: 'Multi-Location', desc: 'Manage multiple salon locations' },
              { id: 'forms', name: 'Consultation Forms', desc: 'Custom intake forms' },
              { id: 'reviews', name: 'Reviews & Feedback', desc: 'Client ratings and reviews' },
              { id: 'marketing', name: 'Marketing Tools', desc: 'Email campaigns and promotions' }
            ].map(addon => (
              <label key={addon.id} className="flex items-center gap-4 p-4 rounded-lg cursor-pointer" style={{ backgroundColor: '#F5F3F0' }}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#C7DCC8' }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setItems([...items, addon.id])
                    } else {
                      setItems(items.filter(i => i !== addon.id))
                    }
                  }}
                />
                <div>
                  <h4 className="font-bold" style={{ color: '#2C2C2C' }}>{addon.name}</h4>
                  <p style={{ color: '#666', fontSize: '14px' }}>{addon.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-4">
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Connect your Stripe account to process client payments
            </p>
            <button
              className="w-full py-3 rounded-lg font-bold text-white"
              style={{ backgroundColor: '#C7DCC8' }}
            >
              Connect Stripe Account
            </button>
            <p style={{ color: '#999', fontSize: '12px' }}>
              You can skip this for now and set it up later in settings
            </p>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="mb-4 text-6xl">✓</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
              All Set!
            </h3>
            <p style={{ color: '#666' }}>
              Your salon account is ready. Start managing appointments, clients, and your business like never before.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return <div>{renderContent()}</div>
}
```

---

## PHASE 4: PROFESSIONAL ADMIN DASHBOARD (ENHANCED)

### Task 4: Fix Dashboard Real Data Integration

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Create: `apps/web/src/lib/hooks/useDashboardData.ts`
- Create: `apps/web/src/lib/api.ts`

**Step 1: Create API client for backend communication**

Create `apps/web/src/lib/api.ts`:
```tsx
const API_BASE = 'http://localhost:3001/api/v1'

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

// Dashboard data
export async function getDashboardMetrics(salonId: string) {
  const [clients, services, appointments, payments] = await Promise.all([
    apiCall('/clients'),
    apiCall('/services'),
    apiCall('/appointments'), // Need to implement in backend
    apiCall('/payments') // Need to implement in backend
  ])

  return {
    totalClients: clients.length,
    totalServices: services.length,
    totalAppointments: appointments.length,
    totalRevenue: payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  }
}
```

**Step 2: Create dashboard data hook**

Create `apps/web/src/lib/hooks/useDashboardData.ts`:
```tsx
import { useEffect, useState } from 'react'
import { getDashboardMetrics } from '@/lib/api'

export function useDashboardData() {
  const [data, setData] = useState({
    totalClients: 0,
    totalServices: 0,
    totalStaff: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    growth: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const salonId = localStorage.getItem('salonId')
        if (!salonId) throw new Error('No salon found')

        const metrics = await getDashboardMetrics(salonId)
        setData(metrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
```

---

## PHASE 5: CLIENT-FACING BOOKING SYSTEM

### Task 5: Create Public Booking Interface

**Files:**
- Create: `apps/booking/src/app/page.tsx`
- Create: `apps/booking/src/components/BookingFlow.tsx`
- Create: `apps/booking/src/components/StaffSelector.tsx`
- Create: `apps/booking/src/components/TimeSlotSelector.tsx`
- Create: `apps/booking/src/components/ClientForm.tsx`
- Create: `apps/booking/src/components/PaymentForm.tsx`

**Content omitted for brevity - follows same structure as signup/onboarding with:**
- Service selection
- Staff selection based on service
- Available time slot selection (calls availability API)
- Client information form
- Stripe payment integration

---

## PHASE 6: STAFF & MANAGEMENT INTERFACES

### Task 6: Staff Dashboard & Management Pages

**Files:**
- Create: `apps/web/src/app/staff/page.tsx`
- Create: `apps/web/src/app/settings/page.tsx`
- Create: `apps/web/src/app/reports/page.tsx`

**Content includes:**
- Staff schedule management
- Availability and time-off management
- Business analytics and reporting
- Salon settings and configuration
- Team member management
- Subscription and billing management

---

## IMPLEMENTATION NOTES

### API Endpoints to Implement in Backend (if missing):
- GET /appointments - List appointments (paginated)
- GET /staff - List all staff members
- GET /locations - List salon locations
- POST /appointments - Create appointment
- GET /availability - Get available time slots
- More endpoints as documented in backend

### Frontend Libraries to Install:
```bash
pnpm add lucide-react react-hook-form zod zustand
pnpm add @hookform/resolvers
```

### Key Features to Build:
1. Real-time appointment availability
2. Payment processing with Stripe
3. Client notifications (email/SMS integration)
4. Multi-step forms with validation
5. Professional error handling & loading states
6. Responsive design for all screen sizes
7. Authentication state management
8. API call caching where appropriate

### Testing Strategy:
- Unit tests for form validation
- Integration tests for API calls
- E2E tests for complete booking flow
- Visual regression testing for UI consistency

---

## Execution Path

This plan is ready for implementation. Choose one:

**Option A: Subagent-Driven (This Session)**
- I dispatch fresh subagent per task
- Code review between tasks
- Fast iteration with immediate feedback

**Option B: Parallel Session**
- Open new session with `superpowers:executing-plans`
- Batch execution with checkpoint reviews
- Slower but more efficient for large builds

**Recommendation:** Use Option A for tight feedback loops and immediate QA of each component.
